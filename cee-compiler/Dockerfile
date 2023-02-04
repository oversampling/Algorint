FROM alpine:3.16

RUN apk add --no-cache \
    build-base \
    gcc \
    g++ \
    rust \
    musl-dev

RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python

RUN python3 -m ensurepip

RUN pip3 install --no-cache --upgrade pip setuptools

WORKDIR /app

COPY requirements.txt /app

RUN pip3 install -r requirements.txt

COPY . /app

CMD ["python3", "main.py"]

