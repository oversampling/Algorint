#!/usr/bin/env python
import pika
import os
import json
from flask import Flask
from dotenv import load_dotenv
from flask import jsonify, request
from redis.sentinel import Sentinel
import time
from flask_cors import CORS
import redis
import uuid


def initialize_submission_database():
    redis_master = None
    if (os.getenv("ENVIRONMENT") == "development"):
        redis_sentinels = os.getenv("REDIS_SENTINELS").strip()
        redis_master_name = os.environ.get('REDIS_MASTER_NAME').strip()
        redis_password = os.environ.get('REDIS_PASSWORD').strip()
        redis_sentinel = Sentinel([(redis_sentinels, 5000)], socket_timeout=5)
        redis_master = redis_sentinel.master_for(
            redis_master_name, password=redis_password, socket_timeout=5)

    elif (os.getenv("ENVIRONMENT") == "production"):
        redis_master = redis.Redis(
            host=os.getenv("REDIS_HOST").strip(), port=6379)

    return redis_master


def inject_username_password_to_rabbitmq_url(rabbitmq_url):
    username = os.getenv("RABBITMQ_USERNAME").strip()
    password = os.getenv("RABBITMQ_PASSWORD").strip()
    rabbitmq_url = rabbitmq_url.replace(
        "amqps://", "amqps://{}:{}@".format(username, password))
    return rabbitmq_url


def enqueue_submission(data, queue_name):
    if (os.getenv("ENVIRONMENT") == "development"):
        rabbitmq_url = os.getenv("SUBMISSION_QUEUE").strip()
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=rabbitmq_url))
        queue_channel = connection.channel()
        queue_channel.queue_declare(queue=queue_name, durable=True)
        queue_channel.basic_publish(exchange='',
                                    routing_key=queue_name,
                                    body=json.dumps(data))
        connection.close()
    elif (os.getenv("ENVIRONMENT") == "production"):
        rabbitmq_url = inject_username_password_to_rabbitmq_url(
            os.getenv("SUBMISSION_QUEUE").strip())
        parameters = pika.URLParameters(rabbitmq_url)
        connection = pika.BlockingConnection(parameters)
        queue_channel = connection.channel()
        queue_channel.queue_declare(queue=queue_name, durable=True)
        queue_channel.basic_publish(exchange='',
                                    routing_key=queue_name,
                                    properties=pika.BasicProperties(
                                        expiration='600000'),
                                    body=json.dumps(data))
        connection.close()
    pass


def execute_command(command, *args):
    max_retries = 2
    count = 0
    backoffSeconds = 2
    while True:
        try:
            return command(*args)
        except (redis.exceptions.ConnectionError, redis.exceptions.TimeoutError):
            count += 1
            if count > max_retries:
                raise
        print('Retrying in {} seconds'.format(backoffSeconds))
        time.sleep(backoffSeconds)


load_dotenv()
app = Flask(__name__)
cors = CORS(app)
redis_master = initialize_submission_database()


@app.route('/check_redis', methods=['GET'])
def check_redis():
    print(execute_command(redis_master.set, 'key', 'route', 10))
    return execute_command(redis_master.get, 'key')


@app.route("/retrieve_submission/<submission_id>", methods=['GET'])
def retrieve_submission(submission_id):
    submission = execute_command(redis_master.get, submission_id)
    if (submission is None):
        return jsonify({"error": "submission not found"}), 200
    return json.loads(submission), 200


@app.route('/make_submission', methods=['POST'])
def make_submission():
    """
    request body schema
    {
        "language": <str>,
        "code": <str>,
        "input": <str>[],
        "test_cases" <str>[],
        "replace": {"from": <str>, "to": <str>}[][],
        "configuration: {"memory_limit": <int>, "time_limit": <int>}[]
    }
    """
    # Retrieve submission data from request body
    data = request.get_json()
    language = data["language"]
    code = data["code"]
    input = data["input"]
    test_cases = data["test_cases"]
    replace = data["replace"]
    memory_limit = [configuration["memory_limit"] for configuration in data["configuration"]] or [100 for _ in range(len(test_cases))]
    time_limit = [configuration["time_limit"] for configuration in data["configuration"]] or [2 for _ in range(len(test_cases))]
    # Save to submission database
    submission_id = str(uuid.uuid4())
    submission = {
        "status": "pending",
        "language": language,
        "code": code,
        "input": input,
        "test_cases": test_cases,
        "replace": replace,
        "submission_id": submission_id,
        "memory_limit": memory_limit,
        "time_limit": time_limit
    }
    # Save submission to redis
    execute_command(redis_master.set, submission_id,
                    json.dumps(submission), 600)
    # Add submission to queue
    if (language is None):
        return jsonify({"error": "language is required"}), 400
    if (language in ["python", "nodejs"]):
        cee_intrepreter_submission(submission_id)
    elif (language in ["c", "cpp", "rust"]):
        cee_compiler_submission(submission_id)
    else:
        return jsonify({"error": "language not supported"}), 400
    return submission_id


def cee_intrepreter_submission(submission_id):
    """
    language: str
    code: str
    input: ["test case input stream"]
    submission_id: "id that store in submission database"
    """
    cee_interpreter_queue_name = os.getenv(
        "CEE_INTERPRETER_QUEUE_NAME").strip()
    message = {"submission_id": submission_id}
    enqueue_submission(message, cee_interpreter_queue_name)


def cee_compiler_submission(submission_id):
    """
    language: str
    code: str
    input: ["test case input stream"]
    submission_id: "id that store in submission database"
    """
    cee_compiler_queue_name = os.getenv("CEE_COMPILER_QUEUE_NAME").strip()
    message = {"submission_id": submission_id}
    enqueue_submission(message, cee_compiler_queue_name)


@app.route('/')
def main():
    return """
    <h1>This is main page of Algorint</h1>
    """


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=os.getenv("PORT"), debug=True)
