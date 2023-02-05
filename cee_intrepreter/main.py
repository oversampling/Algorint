#!/usr/bin/env python
import pika
import time
import json
import subprocess
import os
from dotenv import load_dotenv
from redis.sentinel import Sentinel
import time
import redis
import requests


def inject_username_password_to_rabbitmq_url(rabbitmq_url):
    username = os.getenv("RABBITMQ_USERNAME").strip()
    password = os.getenv("RABBITMQ_PASSWORD").strip()
    rabbitmq_url = rabbitmq_url.replace(
        "amqps://", "amqps://{}:{}@".format(username, password))
    return rabbitmq_url


def initialize():
    redis_master, channel, connection = None, None, None
    if (os.getenv("ENVIRONMENT") == "development"):
        redis_sentinels = os.getenv("REDIS_SENTINELS").strip()
        redis_master_name = os.environ.get('REDIS_MASTER_NAME').strip()
        redis_password = os.environ.get('REDIS_PASSWORD').strip()
        submission_queue = os.getenv("SUBMISSION_QUEUE").strip()
        redis_sentinel = Sentinel([(redis_sentinels, 5000)], socket_timeout=5)
        redis_master = redis_sentinel.master_for(
            redis_master_name, password=redis_password, socket_timeout=5)
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=submission_queue))
        channel = connection.channel()

    elif (os.getenv("ENVIRONMENT") == "production"):
        rabbitmq_url = inject_username_password_to_rabbitmq_url(
            os.getenv("SUBMISSION_QUEUE").strip())
        parameters = pika.URLParameters(rabbitmq_url)
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()
        redis_master = redis.Redis(
            host=os.getenv("REDIS_HOST").strip(), port=6379)

    return redis_master, channel, connection


load_dotenv()
redis_master, queue_channel, rabbitmq_connection = initialize()


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


def callback(ch, method, properties, body):
    """
    body attribute is JSON object with schema shown below
    {
        "langauage": <programming language: str>,
        "code": <user code: str>,
        "input": [<stdin stream: str>]
        "test_cases": [expected output: str]
    }
    """
    print(" [x] Received %r" % body.decode())
    data = json.loads(body.decode())
    # Save the code, input to a file
    save_code(data["code"], data["language"])
    # handle multiple input file
    submission = {
        "stdout": [],
        "stderr": [],
        "test_cases": data["test_cases"]
    }
    for code_jnput in data["input"]:
        save_input(code_jnput)
        # Execute the code
        execute(data["language"])
        submission["stderr"].append(
            read_file("stderr.txt"))
        submission["stdout"].append(
            read_file("stdout.txt"))
        # Clean Up stderr and stdout file
        cleanup_stdout()
        cleanup_stderr()
    submission["status"] = "done execution"
    # Save the result to submission database
    execute_command(redis_master.set,
                    data["submission_id"], json.dumps(submission), 600)
    # Send the output to judge
    judge(data["submission_id"])
    # Clean up
    clean_up(data["language"])
    ch.basic_ack(delivery_tag=method.delivery_tag)


def judge(submission_id: int):
    result = requests.post(
        "http://judge.judge.svc.cluster.local/judge", json={"submission_id": submission_id})
    return result.status_code


def cleanup_stdout():
    if os.path.exists("stdout.txt"):
        os.remove("stdout.txt")


def cleanup_stderr():
    if os.path.exists("stderr.txt"):
        os.remove("stderr.txt")


def clean_up(langauge):
    cleanup_stdout()
    cleanup_stdout()
    os.remove("input.txt")
    if (langauge == "nodejs"):
        os.remove("code.js")
    elif (langauge == "python"):
        os.remove("code.py")
    else:
        print("Language not supported")


def save_code(code, language):
    if (language == "python"):
        with open("code.py", "w") as f:
            f.write(code)
    elif (language == "nodejs"):
        with open("code.js", "w") as f:
            f.write(code)
    else:
        print("Language not supported")


def save_stderr(stderr):
    with open("stderr.txt", "w") as f:
        f.write(stderr)


def save_stdout(stdout):
    with open("stdout.txt", "w") as f:
        f.write(stdout)


def save_input(input):
    with open("input.txt", "w") as f:
        f.write(input)


def read_file(filename):
    with open(filename, "r") as f:
        return f.read()


def execute(language):
    """
    If return non-zero mean something wrong
    """
    try:
        if (language == "nodejs"):
            intrepreter = "node"
            extension = ".js"
        elif (language == "python"):
            intrepreter = "python3"
            extension = ".py"
        result = subprocess.run(
            [intrepreter, f"code{extension}"], capture_output=True, text=True, timeout=5, input=read_file("input.txt"))
    except subprocess.TimeoutExpired:
        result.returncode = 1
        save_stderr("Time limit exceeded")
        save_stdout("")
    else:
        save_stderr(result.stderr)
        save_stdout(result.stdout)
    return result.returncode


queue_channel.basic_qos(prefetch_count=1)
queue_channel.queue_declare(queue=os.getenv(
    "CEE_INTERPRETER_QUEUE_NAME").strip(), durable=True)
print(' [*] Waiting for messages. To exit press CTRL+C')
queue_channel.basic_consume(queue='cee-intrepreter-queue',
                            on_message_callback=callback)
queue_channel.start_consuming()
