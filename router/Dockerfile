FROM python:alpine3.17

WORKDIR /app

COPY . /app

RUN pip install -r requirements.txt

EXPOSE 8080

ENTRYPOINT [ "python" ]

CMD [ "main.py" ]