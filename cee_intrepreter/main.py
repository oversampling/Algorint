#!/usr/bin/env python
import pika
import time
import json
import subprocess
import os
from dotenv import load_dotenv

load_dotenv()


def callback(ch, method, properties, body):
    print(" [x] Received %r" % body.decode())
    data = json.loads(body.decode())
    # Save the code, input to a file
    save_code(data["code"], data["language"])
    # TODO: handle multiple input file
    save_input(data["input"])
    # Execute the code
    return_code = execute(data["language"])
    # TODO: Save the result to submission database
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


def read_input(filename):
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
            [intrepreter, f"code{extension}"], capture_output=True, text=True, timeout=5, input=read_input("input.txt"))
    except subprocess.TimeoutExpired:
        result.returncode = 1
        save_stderr("Time limit exceeded")
        save_stdout("")
    else:
        save_stderr(result.stderr)
        save_stdout(result.stdout)
    return result.returncode


connection = pika.BlockingConnection(
    pika.ConnectionParameters(host=os.getenv("CEE_INTERPRETER_QUEUE")))
channel = connection.channel()
channel.basic_qos(prefetch_count=1)
channel.queue_declare(queue=os.getenv(
    "CEE_INTERPRETER_QUEUE_NAME"), durable=True)
print(' [*] Waiting for messages. To exit press CTRL+C')
channel.basic_consume(queue='cee-intrepreter-queue',
                      on_message_callback=callback)
channel.start_consuming()
