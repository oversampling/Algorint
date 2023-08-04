package main

import (
	"archive/tar"
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/redis/go-redis/v9"
)

var supported_languages []string = strings.Split(os.Getenv("SUPPORTED_LANGUAGES"), ",")
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

// language_details[language_name]["image"/"cmd"]
var languages_details map[string]map[string]string = map[string]map[string]string{}

func main() {
	cli, err := Initialize_Docker_Client()
	if err != nil {
		log.Fatal("Failed to initialize docker client\n" + err.Error())
	}
	Initialize_Language_Executor(cli)
	consume(cli)
}

func Initialize_Language_Executor(cli *client.Client) {
	for _, language := range supported_languages {
		language_details := strings.Split(language, "@")
		log.Printf("Lanugage details: %s\n", language_details)
		language_name := language_details[0]
		language_image := language_details[1]
		language_cmd := language_details[2]
		language_extension := language_details[3]
		languages_details[language_name] = map[string]string{
			"image":     language_image,
			"cmd":       language_cmd,
			"extension": language_extension,
		}
		_, err := cli.ImagePull(context.Background(), language_image, types.ImagePullOptions{})
		if err != nil {
			log.Fatal("Failed to pull image\n" + err.Error())
		}
	}
}

func Initialize_Docker_Client() (*client.Client, error) {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		log.Printf("Failed to initialize docker client\n" + err.Error())
		return nil, err
	}
	_, err = cli.Ping(ctx)
	if err != nil {
		log.Printf("Failed to ping docker client\n" + err.Error())
		return nil, err
	}
	return cli, nil
}

func injectUsernamePasswordToRabbitMQURL(rabbitMQURL string, rabbitMQUsername string, rabbitMQPassword string) string {
	username := strings.TrimSpace(rabbitMQUsername)
	password := strings.TrimSpace(rabbitMQPassword)
	rabbitMQURL = strings.Replace(rabbitMQURL, "amqps://", fmt.Sprintf("amqps://%s:%s@", username, password), 1)
	return rabbitMQURL
}

func consume(cli *client.Client) {
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
	go OnMessageReceived(msgs, cli)
	fmt.Println("Running...")
	<-forever
}

func OnMessageReceived(msgs <-chan amqp.Delivery, cli *client.Client) {
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
		submission, err := Parse_Submission_From_Redis(result)
		if err != nil {
			log.Printf("Failed to parse submission from redis\n" + err.Error())
		}
		log.Printf("Submission: %v", submission)
		for index, code_input := range submission.Input {
			log.Printf("%v Processing input: %v", index, code_input)
			// base64 decode code_input
			code_input_decoded, err := base64.StdEncoding.DecodeString(code_input)
			if err != nil {
				log.Printf("Failed to decode input\n" + err.Error())
			}
			code, err := base64.StdEncoding.DecodeString(submission.Code)
			if err != nil {
				log.Printf("Failed to decode code\n" + err.Error())
			}
			for _, replaces := range submission.Replace[index] {
				from, err := base64.StdEncoding.DecodeString(replaces.From)
				if err != nil {
					log.Printf("Failed to decode replace from\n" + err.Error())
				}
				to, err := base64.StdEncoding.DecodeString(replaces.To)
				if err != nil {
					log.Printf("Failed to decode replace to\n" + err.Error())
				}
				code = bytes.Replace(code, from, to, -1)
			}
			time_limit := submission.TimeLimit[index]
			mem_limit := submission.MemoryLimit[index]
			log.Printf("Code: %v", string(code))
			log.Printf("Time Limit: %v", time_limit)
			log.Printf("Memory Limit: %v", mem_limit)
			log.Printf("Code Input: %v", string(code_input_decoded))
			stdout, stderr, err := RunCode(*cli, code, code_input, submission.Language, time_limit, mem_limit)
			if err != nil {
				log.Printf("Failed to run code\n" + err.Error())
			}
			log.Printf("Stdout: %v", stdout)
			log.Printf("Stderr: %v", stderr)

		}
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

func RunCode(cli client.Client, code []byte, input string, language string, time_limit int, mem_limit_mb int) (string, string, error) {
	ctx := context.Background()
	// Create a container
	resp, err := cli.ContainerCreate(ctx, &container.Config{
		Image:     languages_details[language]["image"],
		Tty:       false, // False
		OpenStdin: true,
		// AttachStdin:  true,
		// AttachStdout: true,
		// AttachStderr: true,
		WorkingDir: "/app",
		// Cmd:        []string{"ls", "-la"},
		Cmd:         []string{"python", "code.py"},
		StopTimeout: &time_limit,
	}, &container.HostConfig{
		Resources: container.Resources{
			Memory: int64(mem_limit_mb * 1024 * 1024),
		},
	}, nil, nil, "")
	if err != nil {
		log.Println("Error in creating container\n " + err.Error())
		return "", "", err
	}
	// Copy code to container
	content, err := Make_Archieve(fmt.Sprintf("code%s", languages_details[language]["extension"]), code)
	if err != nil {
		return "", "Error in making archieve", err
	}
	err = cli.CopyToContainer(ctx, resp.ID, "/app", content, types.CopyToContainerOptions{
		AllowOverwriteDirWithFile: true,
	})
	if err != nil {
		return "", "Error in copying file to container\n" + err.Error() + "\n", err
	}
	// Start container
	err = cli.ContainerStart(ctx, resp.ID, types.ContainerStartOptions{})
	if err != nil {
		return "", "Error in Starting container\n" + err.Error() + "\n", err
	}
	// Write input to container
	waiter, err := cli.ContainerAttach(ctx, resp.ID, types.ContainerAttachOptions{
		Stream: true,
		Stdin:  true,
		Stdout: true,
		Stderr: true,
	})
	if err != nil {
		return "", "Error in Attach stream from container", err
	}
	waiter.Conn.SetDeadline(time.Now().Add(time.Duration(time_limit) * time.Second))
	_, err = waiter.Conn.Write([]byte(input))
	if err != nil {
		log.Println("Error in writing input to container\n " + err.Error())
		return "", "", err
	}
	// Wait for container to finish
	statusCh, errCh := cli.ContainerWait(ctx, resp.ID, container.WaitConditionNotRunning)
	select {
	case err := <-errCh:
		if err != nil {
			return "", "", err
		}
	case <-statusCh:
	}
	// Get container logs
	out, err := cli.ContainerLogs(ctx, resp.ID, types.ContainerLogsOptions{ShowStdout: true, ShowStderr: true})
	if err != nil {
		return "", "", err
	}
	defer out.Close()
	stdoutput := new(bytes.Buffer)
	stderror := new(bytes.Buffer)
	_, err = stdcopy.StdCopy(stdoutput, stderror, out)
	if err != nil {
		return "", "", err
	}
	return stdoutput.String(), stderror.String(), nil
}

func Make_Archieve(filename string, data []byte) (*bytes.Reader, error) {
	var buf bytes.Buffer
	tarWriter := tar.NewWriter(&buf)
	tarHeader := &tar.Header{
		Name: filename,
		Mode: 0777,
		Size: int64(len(data)),
	}
	err := tarWriter.WriteHeader(tarHeader)
	if err != nil {
		log.Printf("Error in writing tar header\n")
		return nil, err
	}
	_, err = tarWriter.Write(data)
	if err != nil {
		log.Printf("Error in writing tar data\n")
		return nil, err
	}
	err = tarWriter.Close()
	if err != nil {
		log.Printf("Error in closing tar writer\n")
		return nil, err
	}
	content := bytes.NewReader(buf.Bytes())
	return content, nil
}
