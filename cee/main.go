package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/docker/docker/client"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/redis/go-redis/v9"
)

var submission_queue string = strings.TrimSpace(os.Getenv("SUBMISSION_QUEUE"))
var rabbit_password string = strings.TrimSpace(os.Getenv("RABBITMQ_PASSWORD"))
var rabbitmq_username string = strings.TrimSpace(os.Getenv("RABBMITMQ_USERNAME"))

// var redis_host string = os.Getenv("REDIS_HOST")
var redis_password string = strings.TrimSpace(os.Getenv("REDIS_PASSWORD"))
var redis_sentinel_address string = strings.TrimSpace(os.Getenv("REDIS_SENTINELS"))

// TODO: remember to change this to the correct queue name
var queue_name string = strings.TrimSpace(os.Getenv("CEE_INTERPRETER_QUEUE_NAME"))

var redis_client = redis.NewFailoverClient(&redis.FailoverOptions{
	MasterName:    "mymaster",
	SentinelAddrs: []string{redis_sentinel_address + ":5000"},
	Password:      redis_password,
})

func main() {
	consume()
}

func injectUsernamePasswordToRabbitMQURL(rabbitMQURL string, rabbitMQUsername string, rabbitMQPassword string) string {
	username := strings.TrimSpace(rabbitMQUsername)
	password := strings.TrimSpace(rabbitMQPassword)
	rabbitMQURL = strings.Replace(rabbitMQURL, "amqps://", fmt.Sprintf("amqps://%s:%s@", username, password), 1)
	return rabbitMQURL
}

func consume() {
	conn, err := Initiate_MQ_Client()
	if err != nil {
		log.Fatal("Failed to connect to RabbitMQ", err)
	}
	defer conn.Close()
	ch, err := Initiate_MQ_Channel(conn)
	if err != nil {
		log.Fatal("Failed to open a channel", err)
	}
	defer ch.Close()
	err = Declare_MQ_Queue(ch, queue_name)
	if err != nil {
		log.Fatal("Failed to declare a queue", err)
	}
	msgs, err := ch.Consume(
		queue_name,
		"",
		false,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatal("Failed to register a consumer", err)
	}
	forever := make(chan bool)
	go OnMessageReceived(msgs)
	fmt.Println("Running...")
	<-forever
}

func OnMessageReceived(msgs <-chan amqp.Delivery) {
	for d := range msgs {
		log.Printf("Received a message: %s", d.Body)
		submission_id, err := Get_Submission_Token_From_MQ(d.Body)
		if err != nil {
			log.Printf("Error getting submission id from MQ\n" + err.Error())
		}
		result, err := Get_Submission_From_Redis(submission_id)
		if err != nil {
			log.Printf("Failed to get submission from redis\n" + err.Error())
		}
		_, err = Parse_Submission_From_Redis(result)
		if err != nil {
			log.Printf("Failed to parse submission from redis\n" + err.Error())
		}
		// log.Printf("Submission: %v", submission)
		// Sleep 3 seconds in golang
		time.Sleep(3 * time.Second)
		log.Printf("Done processing submission: %s", submission_id)
		d.Ack(true)
	}
}

func Get_Submission_Token_From_MQ(body []byte) (string, error) {
	var submission_token Submission_Token
	err := json.Unmarshal(body, &submission_token)
	if err != nil {
		return "", err
	}
	return submission_token.Submission_Id, nil
}

func Get_Submission_From_Redis(submission_token string) (string, error) {
	ctx := context.Background()
	val, err := redis_client.Get(ctx, submission_token).Result()
	if err != nil {
		return "", err
	}
	return val, nil
}

func Parse_Submission_From_Redis(submission string) (Submission, error) {
	var submission_struct Submission
	err := json.Unmarshal([]byte(submission), &submission_struct)
	if err != nil {
		return Submission{}, err
	}
	return submission_struct, nil
}

func Initiate_Docker_Client() (*client.Client, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		return nil, err
	}
	return cli, nil
}

func Initiate_MQ_Client() (*amqp.Connection, error) {
	var rabbitmq_url string = injectUsernamePasswordToRabbitMQURL(submission_queue, rabbitmq_username, rabbit_password)
	conn, err := amqp.Dial(rabbitmq_url)
	if err != nil {
		return nil, err
	}
	return conn, nil
}

func Declare_MQ_Queue(ch *amqp.Channel, queue_name string) error {
	_, err := ch.QueueDeclare(
		queue_name,
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return err
	}
	return nil
}

func Initiate_MQ_Channel(conn *amqp.Connection) (*amqp.Channel, error) {
	ch, err := conn.Channel()
	if err != nil {
		return nil, err
	}
	return ch, nil
}

func Set_Data_To_Redis(key string, value string) error {
	ctx := context.Background()
	err := redis_client.Set(ctx, key, value, 0).Err()
	if err != nil {
		return err
	}
	return nil
}

func Get_Data_From_Redis(key string) (string, error) {
	ctx := context.Background()
	val, err := redis_client.Get(ctx, key).Result()
	if err != nil {
		return "", err
	}
	return val, nil
}

func Initiate_Redis_Client() (*redis.Client, error) {
	context := context.Background()
	client := redis.NewClient(&redis.Options{
		Addr:     redis_sentinel_address + ":5000",
		Password: redis_password,
		DB:       0,
	})
	_, err := client.Ping(context).Result()
	if err != nil {
		return nil, err
	}
	return client, nil
}
