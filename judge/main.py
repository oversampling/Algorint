#!/usr/bin/env python
import base64
import os
from flask import Flask
from dotenv import load_dotenv
from flask import request
from redis.sentinel import Sentinel
import time
import redis
import json


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
redis_master = initialize_submission_database()


@app.route('/judge', methods=['POST'])
def make_judge():
    """
    request body schema
    {
        "submission_id": "id that store in submission database",
    }
    """
    # Retrieve body data
    data = request.get_json()
    submission_id = data.get("submission_id")
    submission = execute_command(redis_master.get, submission_id)
    submission = json.loads(submission)
    stdouts = submission["stdout"]
    stderr = submission["stderr"]
    test_cases: list = submission["test_cases"].copy()
    # Get result of each judgement based on stdout and test case
    results = []
    for index, stdout in enumerate(stdouts):
        # Decode stdout and test case from base64 to string
        stdout = base64.b64decode(stdout).decode()
        test_cases[index] = base64.b64decode(test_cases[index]).decode()
        if (stderr[index] == ""):
            result = judge(stdout, test_cases[index])
        else:
            result = False
        results.append(result)
    # Update submission database
    submission["result"] = results
    execute_command(redis_master.set, submission_id,
                    json.dumps(submission), 600)
    return "OK", 200


def judge(code_output: str, test_case: str):
    # compare output with test case output
    if (code_output.strip() == test_case.strip()):
        return True
    return False


@app.route('/health', methods=['GET'])
def health():
    return "OK", 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=os.getenv("PORT"), debug=True)
