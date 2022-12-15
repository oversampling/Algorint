#!/usr/bin/env python
import pika
import sys
import os
import json
from flask import Flask
from dotenv import load_dotenv
from flask import abort, redirect, url_for, request

load_dotenv()
app = Flask(__name__)


@app.route('/make_submission', methods=['POST'])
def make_submission():
    language = request.form.get('language')
    code = request.form.get('code')
    test_cases = request.form.get('test_cases')
    input = request.form.get('input')
    # Save to submission database

    # Add submission to queue
    if (request.form.get('language') is None):
        abort(400)
    if (request.form.get("language") in ["python", "javascript"]):
        cee_intrepreter_submission(language, code, test_cases, input)
    return redirect(url_for('app'))


def cee_intrepreter_submission(language, code, test_cases, input):
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host=os.getenv("CEE_INTERPRETER_QUEUE")))
    channel = connection.channel()
    channel.queue_declare(queue=os.getenv(
        "CEE_INTERPRETER_QUEUE_NAME"), durable=True)
    message = {"language": language, "code": code,
               "test_cases": test_cases, "input": input}
    channel.basic_publish(
        exchange='',
        routing_key=os.getenv("CEE_INTERPRETER_QUEUE_NAME"),
        body=json.dumps(message))
    connection.close()


@app.route('/')
def app():
    return """
    <h1>This is main page of Algorint</h1>
    """


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=os.getenv("PORT"), debug=True)
