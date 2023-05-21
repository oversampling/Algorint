#!/usr/bin/env python
import base64
import io
import tarfile
from typing import Literal
import pika
import time
import json
import os
from dotenv import load_dotenv
from redis.sentinel import Sentinel
import time
import redis
import requests
import docker

class ApplicationError(Exception):
    def __init__(self, process: Literal["Compile Time", "Run Time"], msg) -> None:
        self.process = process
        self.msg = f"{self.process} Error:\n\t{msg}"
        super().__init__(msg)

class Sandbox:
    def __init__(self, image: str, dind:docker.DockerClient, command: str, timeout: float,workdir = "/app", cpu_period: int = 1000000, mem_limit: str = "100m", pids_limit: int = 500):
        self.image = image
        self.dind = dind
        self.timeout = timeout
        self.mem_limit = mem_limit
        self.cpu_period = cpu_period
        self.pids_limit = pids_limit
        self.container = self.dind.containers.create(
            self.image,
            command,
            working_dir=workdir,
            stdin_open=True,
            tty=False,
            detach=True,
            cpu_period=cpu_period,
            pids_limit=pids_limit,
            mem_limit=mem_limit,
            volumes={f'{workdir}/code': {'bind': workdir, 'mode': 'ro'}})
        self.container.start()
        self.stdin = self.container.attach_socket(params={'stdin': 1, 'stdout': 0, 'stderr': 0, 'stream': 1})
        self.stdin._sock.setblocking(0)
        self.stdin._writing = True

    def write(self, data: str):
        self.stdin.write(data.encode("utf-8"))

    def wait(self, timeout: int = 2):
        try:
            self.container.wait(timeout=timeout)
        except Exception:
            raise

    def output(self):
        return self.container.logs(stdout=True, stderr=False).decode(), self.container.logs(stdout=False, stderr=True).decode()

    @staticmethod
    def _make_archive(filename: str, data: bytes):
        tarstream = io.BytesIO()
        tar = tarfile.open(fileobj=tarstream, mode='w')
        tarinfo = tarfile.TarInfo(name=filename)
        tarinfo.size = len(data)
        tarinfo.mtime = int(time.time())
        tar.addfile(tarinfo=tarinfo, fileobj=io.BytesIO(data))
        tar.close()
        tarstream.seek(0)
        return tarstream

    def add_file(self, filename: str, data: str) -> None:
        tarstream = self._make_archive(filename, data.encode('utf-8'))
        self.dind.api.put_archive(self.container.id, WORK_DIR, tarstream)

    def status(self) -> dict[Literal["Status", "Running", "Paused", "Restarting",
                                     "OOMKilled", "Dead", "Pid", "ExitCode", "Error", "StartedAt", "FinishedAt"]]:
        self.container.reload()
        return self.container.attrs['State']

    def __del__(self):
        self.container.remove(force=True)
        self.stdin.close()


class Worker():
    def __init__(self, envrionment ,**languages):
        self.languages = languages
        self.redis = self.__init_redis(envrionment)
        self.queue = self.__init_rabbitmq(envrionment)
        self.dind = self.__dind()
        self.workdir = os.getenv("WORK_DIR").strip()
        self.__load_interpreter(self.dind, self.languages)

    def run(self, queue_name: str):
        self.queue.basic_qos(prefetch_count=1)
        self.queue.queue_declare(queue=queue_name.strip(), durable=True)
        print(' [*] Waiting for messages. To exit press CTRL+C')
        self.queue.basic_consume(queue=queue_name, on_message_callback=self.__callback)
        self.queue.start_consuming()

    def save_code(self, code: str, language: str):
        """
        Save the code to a file

        Args:
            code:
                The code to be saved
            language:
                The language of the code
        Returns:
            None
        Raises:
            None
        """
        if (language == "python"):
            with open("code/code.py", "w") as f:
                f.write(code)
        elif (language == "nodejs"):
            with open("code/code.js", "w") as f:
                f.write(code)
        else:
            raise Exception("Language not supported")

    def read_file(self, filename):
        with open(filename, "r") as f:
            return f.read()

    def transform_code(self, code: str, _from: str, _to:str):
        return code.replace(_from, _to)

    def identify_error(self, sandbox: Sandbox, process: Literal["Compile Time", "Run Time"]):
        try:
            sandbox.wait(timeout=sandbox.timeout)
            status = sandbox.status()
        except requests.exceptions.ConnectionError as e:
            raise ApplicationError(process, f"{process} Limit Exceeded\n\t{process} Limit = {sandbox.timeout}s")
        except Exception:
            raise
        else:
            if (status["ExitCode"] != 0):
                if (status["OOMKilled"] == True):
                    raise ApplicationError(process, f"Memory Limit Exceeded\n\tMemory Limit: {sandbox.mem_limit}")
                else:
                    time.sleep(0.1) # Wait for the output to be written to the container
                    raise ApplicationError(process, sandbox.output()[1])
            else:
                return None

    def __execute(self, language: Literal["python", "nodejs"], timeout: int = 2, mem_limit: str = "100m", pids_limit: int = 500) -> tuple[str, str]:
        if (language == "python"):
            sandbox = Sandbox(self.languages[language], self.dind, command="python code.py", timeout=timeout, mem_limit=mem_limit, pids_limit=pids_limit)
        elif (language == "nodejs"):
            sandbox = Sandbox(self.languages[language], self.dind, command="node code.js", timeout=timeout, mem_limit=mem_limit, pids_limit=pids_limit)
        else:
            raise Exception("Language not supported")
        data = self.read_file(f'{self.workdir}/code/input.txt')
        try:
            if data is not None:
                sandbox.write(data + "\n")
            self.identify_error(sandbox, "Run Time")
        except ApplicationError as e:
            return "", f"Run Time Error\n{str(e)}"
        except Exception as e:
            return "", f"Run Time Error\n{str(e)}"
        stdout, stderr = sandbox.output()
        del sandbox
        return stdout, stderr

    def __save_input(self, input: str):
        """
        Save the input to a file

        Args:
            input:
                The input to be saved
        Returns:
            None
        Raises:
            None
        """
        with open("code/input.txt", "w") as f:
            f.write(input)

    def __clean_up(self, langauge):
        if (os.path.exists("code/input.txt")):
            os.remove("code/input.txt")
        if (langauge == "nodejs"):
            os.remove("code/code.js")
        elif (langauge == "python"):
            os.remove("code/code.py")
        else:
            print("Language not supported")

    def __callback(self, ch, method, properties, body):
        """
        Execute after receiving a message from the queue

        Args:
            body:
                The message body. It is a JSON string that contains the following fields:
                    - code: The code to be executed
                    - language: The language of the code
                    - input: The input to the code
                    - test_cases: The test cases to be executed
                    - submission_id: The id of the submission
        Returns:
            None
        Raises:
            None
        """
        data = json.loads(body.decode())
        # --------------------------------------------------------------------------
        # Get Details from submission database
        submission_id = data["submission_id"]
        data = self.redis_command(self.redis.get, submission_id)
        submission_data = json.loads(data.decode())
        # --------------------------------------------------------------------------
        # handle multiple input file
        submission: dict[Literal["stdout", "stderr", "test_cases", "submission_id", "result", "replace", "stdin"]] = {
            "stdout": [],
            "stderr": [],
            "test_cases": submission_data["test_cases"],
            "replace": submission_data["replace"], # replace: [[{"from": "from", "to": "to"}, {"from": "from", "to": "to"}], [{"from": "from", "to": "to"}], ...]
            "submission_id": submission_id,
            "stdin": submission_data["input"],
        }
        for index, code_input in enumerate(submission_data["input"]):
            try:
                # --------------------------------------------------------------------------
                # Decode submission_data["code"] from base64 to string
                code = base64.b64decode(submission_data["code"]).decode()
                # Decode stdin from base64 to string
                code_input = base64.b64decode(code_input).decode()
                # --------------------------------------------------------------------------
                # Decode submission_data["replace"][index]["from"] and submission_data["replace"][index]["to"] from base64 to string and transform the code
                for replaces in submission_data["replace"][index]:
                    _from = base64.b64decode(replaces["from"]).decode()
                    _to = base64.b64decode(replaces["to"]).decode()
                    code = self.transform_code(code, _from, _to)
                # --------------------------------------------------------------------------
                # Save the code, input to a file
                self.save_code(code, submission_data["language"])
                # Save the stdin to a file
                self.__save_input(code_input)
                stdout, stderr = self.__execute(submission_data["language"])
                # --------------------------------------------------------------------------
                # Encode the output to base64
                stdout = base64.b64encode(stdout.encode('utf-8')).decode()
                stderr = base64.b64encode(stderr.encode('utf-8')).decode()
                # --------------------------------------------------------------------------
                # Append the output to the submission
                submission["stderr"].append(stderr)
                submission["stdout"].append(stdout)
            except Exception as e:
                stderr = base64.b64encode(e.__str__().encode('utf-8')).decode()
                submission["stderr"].append(stderr)
                submission["stdout"].append("")
                break
        submission["status"] = "done execution"
        # Save the result to submission database
        self.redis_command(self.redis.set,
                        submission_id, json.dumps(submission), 600)
        # Send the output to judge
        if (self.__judge(submission_id) != 200):
            submission["result"] = "Judge Error"
            self.redis_command(self.redis.set,
                        submission_id, json.dumps(submission), 600)
        # Clean up
        self.__clean_up(submission_data["language"])
        ch.basic_ack(delivery_tag=method.delivery_tag)

    def __judge(self, submission_id: str) -> int:
        result = requests.post(
            "http://judge.judge.svc.cluster.local/judge", json={"submission_id": submission_id})
        return result.status_code

    def __init_redis(self, environment):
        if (environment == "development"):
            redis_sentinels = os.getenv("REDIS_SENTINELS").strip()
            redis_master_name = os.environ.get('REDIS_MASTER_NAME').strip()
            redis_password = os.environ.get('REDIS_PASSWORD').strip()
            redis_sentinel = Sentinel([(redis_sentinels, 5000)], socket_timeout=5)
            redis_master = redis_sentinel.master_for(
                redis_master_name, password=redis_password, socket_timeout=5)
            return redis_master
        elif (environment == "production"):
            redis_master = redis.Redis(
                host=os.getenv("REDIS_HOST").strip(), port=6379)
            return redis_master

    def __dind(self) -> docker.DockerClient:
        max_retries = 4
        count = 0
        backoffSeconds = 10
        while True:
            try:
                dind = docker.from_env()
                # self.__load_interpreter(dind=dind, languages=self.languages)
                return dind
            except Exception as e:
                count += 1
                if count > max_retries:
                    raise
            time.sleep(backoffSeconds)

    def redis_command(self, command, *args):
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

    def __init_rabbitmq(self, environment):
        if (environment == "development"):
            submission_queue = os.getenv("SUBMISSION_QUEUE").strip()
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(host=submission_queue))
            channel = connection.channel()
            return channel
        elif (environment == "production"):
            rabbitmq_url = self.__inject_username_password_to_rabbitmq_url(
                os.getenv("SUBMISSION_QUEUE").strip(), os.getenv("RABBITMQ_USERNAME").strip(), os.getenv("RABBITMQ_PASSWORD").strip())
            parameters = pika.URLParameters(rabbitmq_url)
            connection = pika.BlockingConnection(parameters)
            channel = connection.channel()
            return channel

    def __inject_username_password_to_rabbitmq_url(self, rabbitmq_url: str, rabbitmq_username:str, rabbitmq_password:str):
        username = rabbitmq_username.strip()
        password = rabbitmq_password.strip()
        rabbitmq_url = rabbitmq_url.replace(
            "amqps://", "amqps://{}:{}@".format(username, password))
        return rabbitmq_url

    def __load_interpreter(self, dind: docker.DockerClient, languages: dict[str, str]):
        images = [image.tags[0] for image in dind.images.list()]
        try:
            for language in languages:
                if languages[language] not in images:
                    dind.images.pull(languages[language])
        except Exception as e:
            raise e
        return

    def environment(callback):
        def wrapper(*args, **kwargs):
            try:

                callback(*args, **kwargs)
            except Exception as e:
                raise e
        return wrapper


if __name__ == "__main__":
    WORK_DIR = os.getenv("WORK_DIR")
    NODEJS_CEE_INTERPRETER_IMAGE = os.getenv(
        "NODEJS_CEE_INTERPRETER_IMAGE") or "node:16.13.0-alpine3.14"
    PYTHON_CEE_INTERPRETER_IMAGE = os.getenv(
        "PYTHON_CEE_INTERPRETER_IMAGE") or "python:alpine3.16"
    worker = Worker(
        envrionment=os.getenv("ENVIRONMENT"),
        python=PYTHON_CEE_INTERPRETER_IMAGE,
        nodejs=NODEJS_CEE_INTERPRETER_IMAGE)
    worker.run(os.getenv("CEE_INTERPRETER_QUEUE_NAME").strip())
