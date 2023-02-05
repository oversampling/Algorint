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
    for code_input in data["input"]:
        save_input(code_input)
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
    cleanup_executable()
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


def cleanup_executable():
    if os.path.exists("code"):
        os.remove("code")


def clean_up(langauge):
    cleanup_stdout()
    cleanup_stdout()
    os.remove("input.txt")
    if (langauge == "c"):
        os.remove("code.c")
    elif (langauge == "cpp"):
        os.remove("code.cpp")
    elif (langauge == "rust"):
        os.remove("code.rs")
    else:
        print("Language not supported")


def save_code(code, language):
    if (language == "cpp"):
        with open("code.cpp", "w") as f:
            f.write(code)
    elif (language == "c"):
        with open("code.c", "w") as f:
            f.write(code)
    elif (language == "rust"):
        with open("code.rs", "w") as f:
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


def compile_code(language):
    if (language == "cpp"):
        compiler = "g++"
        extension = ".cpp"
    elif (language == "c"):
        compiler = "gcc"
        extension = ".c"
    elif (language == "rust"):
        compiler = "rustc"
        extension = ".rs"
    subprocess.run([compiler, f"code{extension}", "-o", "code"],
                   stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                   timeout=2, check=True, text=True)


def run_executable():
    return subprocess.run(
        ['./code'], stderr=subprocess.PIPE,
        stdout=subprocess.PIPE,
        check=True, timeout=2, text=True,
        input=read_file("input.txt"))


def execute(language):
    """
    params: language: [c, cpps, rust]
    If return non-zero mean something wrong
    """
    # Compile
    try:
        compile_code(language)
    except subprocess.CalledProcessError as e:
        save_stderr(e.stderr)
        save_stdout("")
    except subprocess.TimeoutExpired:
        save_stderr("Compile Time Exceeded")
        save_stdout("")
    else:
        # Execute executable
        try:
            result = run_executable()
        except subprocess.CalledProcessError as e:
            save_stderr(e.stderr)
            save_stdout("")
        except subprocess.TimeoutExpired:
            save_stderr("Run Time Exceeded")
            save_stdout("")
        else:
            save_stderr("")
            save_stdout(result.stdout)


queue_channel.basic_qos(prefetch_count=1)
queue_channel.queue_declare(queue=os.getenv(
    "CEE_COMPILER_QUEUE_NAME").strip(), durable=True)
print(' [*] Waiting for messages. To exit press CTRL+C')
queue_channel.basic_consume(queue=os.getenv("CEE_COMPILER_QUEUE_NAME").strip(),
                            on_message_callback=callback)
queue_channel.start_consuming()
