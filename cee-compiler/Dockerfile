FROM python:alpine3.16

WORKDIR /app

COPY requirements.txt /app

RUN pip3 install -r requirements.txt

RUN mkdir /app/code

COPY . /app

ENV WORK_DIR=/app

ENV CPP_CEE_COMPILER_IMAGE=frolvlad/alpine-gxx

ENV C_CEE_COMPILER_IMAGE=frolvlad/alpine-gxx

ENV RUST_CEE_COMPILER_IMAGE=frolvlad/alpine-rust

CMD ["python3", "main.py"]
