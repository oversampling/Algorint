#!/usr/bin/env python
import os
from flask import Flask
from dotenv import load_dotenv
from flask import abort, redirect, url_for, request
from redis.sentinel import Sentinel
import time
import redis
import json


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
    test_cases = submission["test_cases"]
    # Get result of each judgement based on stdout and test case
    results = []
    for index, stdout in enumerate(stdouts):
        result = judge(stdout, test_cases[index])
        results.append(result)
    # Update submission database
    submission["result"] = results
    execute_command(redis_master.set, submission_id, json.dumps(submission))
    return "OK", 200


def judge(code_output: str, test_case: str):
    # compare output with test case output
    if (code_output.strip() == test_case.strip()):
        return True
    return False


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=os.getenv("PORT"), debug=True)
