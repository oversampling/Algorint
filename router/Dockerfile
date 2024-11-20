FROM golang:1.20-alpine as build

WORKDIR /usr/src/app

# pre-copy/cache go.mod for pre-downloading dependencies and only redownloading them in subsequent builds if they change
COPY go.mod go.sum ./

RUN go mod download && go mod verify

COPY . .

# build all the packages in the current directory and its subdirectories
RUN go build -o /usr/local/bin/app ./...

FROM alpine:latest as runtime

ENV PORT=8080

EXPOSE 8080

COPY --from=build /usr/local/bin/app /app

CMD [ "/app" ]
