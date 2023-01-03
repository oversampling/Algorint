#!/usr/bin/env python
import pika
import sys
import os
import json
from flask import Flask
from dotenv import load_dotenv
from flask import abort, redirect, url_for, request
from redis.sentinel import Sentinel
import time
import redis
import uuid

sentinels = []


redis_sentinels = "sentinel.redis.svc.cluster.local"
redis_master_name = os.environ.get('REDIS_MASTER_NAME')
redis_password = os.environ.get('REDIS_PASSWORD')


redis_sentinel = Sentinel([(redis_sentinels, 5000)], socket_timeout=5)
redis_master = redis_sentinel.master_for(
    redis_master_name.strip(), password=redis_password.strip(), socket_timeout=5)


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


@app.route('/check_redis', methods=['GET'])
def check_redis():
    print(execute_command(redis_master.set, 'key', 'route'))
    return execute_command(redis_master.get, 'key')


@app.route('/make_submission', methods=['POST'])
def make_submission():
    # Retrieve submission data
    language = request.form.get('language')
    code = request.form.get('code')
    test_cases = request.form.get('test_cases')
    input = request.form.get('input')
    # Save to submission database
    submission_id = str(uuid.uuid4())
    submission = {
        "status": "pending",
    }
    execute_command(redis_master.set, submission_id, json.dumps(submission))
    # Add submission to queue
    if (request.form.get('language') is None):
        abort(400)
    if (request.form.get("language") in ["python", "javascript"]):
        cee_intrepreter_submission(
            language, code, input, submission_id)
    # TODO: make judgement once the submission is done execute
    return redirect(url_for('main'))


def cee_intrepreter_submission(language, code, input, submission_id):
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host=os.getenv("CEE_INTERPRETER_QUEUE")))
    channel = connection.channel()
    channel.queue_declare(queue=os.getenv(
        "CEE_INTERPRETER_QUEUE_NAME"), durable=True)
    message = {"language": language, "code": code,
               "input": input, "submission_id": submission_id}
    channel.basic_publish(
        exchange='',
        routing_key=os.getenv("CEE_INTERPRETER_QUEUE_NAME"),
        body=json.dumps(message))
    connection.close()


@app.route('/')
def main():
    return """
    <h1>This is main page of Algorint</h1>
    """


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=os.getenv("PORT"), debug=True)
