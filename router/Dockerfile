FROM python:alpine3.17

WORKDIR /app

COPY requirements.txt /app

RUN pip install -r requirements.txt

COPY . /app

EXPOSE 8080

ENV PORT=8080

ENTRYPOINT [ "python" ]

CMD [ "main.py" ]
