package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
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

func injectUsernamePasswordToRabbitMQURL(rabbitMQURL string, rabbitMQUsername string, rabbitMQPassword string) string {
	username := strings.TrimSpace(rabbitMQUsername)
	password := strings.TrimSpace(rabbitMQPassword)
	rabbitMQURL = strings.Replace(rabbitMQURL, "amqps://", fmt.Sprintf("amqps://%s:%s@", username, password), 1)
	return rabbitMQURL
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

func Publish(ch *amqp.Channel, queue_name string, data []byte) error {
	context := context.Background()
	err := ch.PublishWithContext(
		context,
		"",
		queue_name,
		false,
		false,
		amqp.Publishing{
			ContentType: "application/json",
			Body:        data,
		},
	)
	return err
}

func main() {
	app := fiber.New()
	mq_conn, err := Initiate_MQ_Client()
	if err != nil {
		log.Fatal("Failed to connect to RabbitMQ", err)
	}
	defer mq_conn.Close()
	ch, err := Initiate_MQ_Channel(mq_conn)
	if err != nil {
		log.Fatal("Failed to open a channel", err)
	}
	err = Declare_MQ_Queue(ch, queue_name)
	if err != nil {
		log.Fatal("Failed to declare a queue", err)
	}
	app.Post("/make_submission", func(c *fiber.Ctx) error {
		submission := new(Submission)

		if err := c.BodyParser(submission); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		log.Printf("Submission: %v", submission)

		updated_submission := UpdateSubmission(submission)
		updated_submission_json, err := json.Marshal(updated_submission)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		if err := Set_Data_To_Redis(updated_submission.SubmissionID, string(updated_submission_json)); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		if err := Publish(ch, queue_name, updated_submission_json); err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		return c.SendString(updated_submission.SubmissionID)
	})

	app.Get("/retrieve_submission/:submission_id", func(c *fiber.Ctx) error {
		submission_id := c.Params("submission_id")
		submission, err := Get_Data_From_Redis(submission_id)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		return c.SendString(submission)
	})

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Hello, World!")
	})

	app.Listen(":" + os.Getenv("PORT"))
}

func UpdateSubmission(submission *Submission) Submission {
	var memory_limits []int
	var time_limits []int
	for _, configuration := range submission.Configuration {
		memory_limits = append(memory_limits, configuration.MemoryLimit)
		time_limits = append(time_limits, configuration.TimeLimit)
	}
	newSubmission := Submission{
		SubmissionID: uuid.New().String(),
		Status:       "pending",
		Language:     submission.Language,
		Stdin:        submission.Input,
		TestCases:    submission.TestCases,
		Code:         submission.Code,
		Replace:      submission.Replace,
		MemoryLimit:  memory_limits,
		TimeLimit:    time_limits,
	}
	return newSubmission
}
