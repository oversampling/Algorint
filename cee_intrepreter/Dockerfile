FROM alpine:3.16

WORKDIR /app

RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python

RUN apk add --update nodejs

RUN python3 -m ensurepip

RUN pip3 install --no-cache --upgrade pip setuptools

COPY requirements.txt /app

RUN pip3 install -r requirements.txt

COPY . /app

CMD ["python3", "main.py"]
