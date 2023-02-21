FROM python:alpine3.16

WORKDIR /app

COPY requirements.txt /app

RUN pip3 install -r requirements.txt

RUN mkdir /app/code

COPY . /app

ENV WORK_DIR=/app

ENV PYTHON_CEE_INTERPRETER_IMAGE=python:alpine3.16

ENV NODEJS_CEE_INTERPRETER_IMAGE=node:lts-alpine3.17

CMD ["python3", "main.py"]
