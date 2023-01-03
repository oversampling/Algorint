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

load_dotenv()

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


def callback(ch, method, properties, body):
    print(" [x] Received %r" % body.decode())
    data = json.loads(body.decode())
    # Save the code, input to a file
    save_code(data["code"], data["language"])
    # TODO: handle multiple input file
    save_input(data["input"])
    # Execute the code
    return_code = execute(data["language"])
    # Save the result to submission database
    submission = {
        "status": "done",
        "stdout": read_file("stdout.txt"),
        "stderr": read_file("stderr.txt"),
        "return_code": return_code
    }
    execute_command(redis_master.set,
                    data["submission_id"], json.dumps(submission))
    # Clean up
    clean_up(data["language"])
    ch.basic_ack(delivery_tag=method.delivery_tag)


def clean_up(langauge):
    os.remove("stderr.txt")
    os.remove("stdout.txt")
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


connection = pika.BlockingConnection(
    pika.ConnectionParameters(host=os.getenv("CEE_INTERPRETER_QUEUE").strip()))
channel = connection.channel()
channel.basic_qos(prefetch_count=1)
channel.queue_declare(queue=os.getenv(
    "CEE_INTERPRETER_QUEUE_NAME").strip(), durable=True)
print(' [*] Waiting for messages. To exit press CTRL+C')
channel.basic_consume(queue='cee-intrepreter-queue',
                      on_message_callback=callback)
channel.start_consuming()
