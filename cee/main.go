package main

import (
	"archive/tar"
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
	"github.com/docker/go-units"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/redis/go-redis/v9"
	"github.com/shirou/gopsutil/cpu"
	"github.com/shirou/gopsutil/v3/mem"
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
		d.Ack(true)
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
		execution_channel := make(chan Execution_Result, len(submission.Stdin))
		threading_ctx, cancel := context.WithCancel(context.Background())
		for index, code_input := range submission.Stdin {
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
			v, _ := mem.VirtualMemory()
			log.Printf("Total: %v, Free:%v, UsedPercent:%f%%\n", v.Total, v.Free, v.UsedPercent)
			cpu, _ := cpu.Percent(time.Second, false)
			log.Printf("CPU: %v\n", cpu)
			log.Printf("Code Input: %v", string(code_input_decoded))
			go RunCode(threading_ctx, cli, code, string(code_input_decoded), submission.Language, time_limit, mem_limit, index, execution_channel)
		}
		submission_results := []Execution_Result{}
		for i := 0; i < len(submission.Stdin); i++ {
			submission_result := <-execution_channel
			submission_results = append(submission_results, submission_result)
			log.Printf("Submission result %v: %v", i, submission_result)
		}
		cancel()
		log.Printf("Running in main thread..")
		reordered_submission_results := make([]Execution_Result, len(submission_results))
		for _, result := range submission_results {
			log.Printf("Submission Result: %v", result)
			reordered_submission_results[result.Submission_Index] = result
		}
		for _, result := range reordered_submission_results {
			base64_stdout := base64.StdEncoding.EncodeToString([]byte(result.Stdout))
			base64_stderr := base64.StdEncoding.EncodeToString([]byte(result.Stderr))
			log.Print("base64_stdout: " + base64_stdout)
			log.Print("base64_stderr: " + base64_stderr)
			submission.Stdout = append(submission.Stdout, base64_stdout)
			submission.Stderr = append(submission.Stderr, base64_stderr)
		}
		if err = Save_Submission_To_Redis(submission); err != nil {
			log.Printf("Failed to save submission to redis\n" + err.Error())
		}
		statusCode, err := Judge_Submission(submission.SubmissionID)
		if err != nil {
			log.Printf("Failed to judge submission\n" + err.Error())
		}
		if statusCode == 200 {
			submission_after_judge, err := Get_Submission_From_Redis(submission.SubmissionID)
			if err != nil {
				log.Printf("Failed to get submission after judge from redis\n" + err.Error())
			}
			submission_after_judge_parsed, err := Parse_Submission_From_Redis(submission_after_judge)
			if err != nil {
				log.Printf("Failed to parse submission after judge from redis\n" + err.Error())
			}
			submission_after_judge_parsed.Status = "done execution"
			if err = Save_Submission_To_Redis(submission_after_judge_parsed); err != nil {
				log.Printf("Failed to save judged submission to redis\n" + err.Error())
			}
		} else {
			log.Printf("Failed to judge submission\n" + err.Error())
		}
		log.Printf("Done processing submission: %s", submission_id)
	}
}

func Save_Submission_To_Redis(submission Submission) error {
	ctx := context.Background()
	submission_json, err := json.Marshal(submission)
	if err != nil {
		return err
	}
	err = redis_client.Set(ctx, submission.SubmissionID, submission_json, 10*time.Minute).Err()
	if err != nil {
		return err
	}
	return nil
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

func RunCode(threading_ctx context.Context, cli *client.Client, code []byte, input string, language string, time_limit int, mem_limit_mb int, submission_index int, execution_channel chan Execution_Result) {
	ctx := context.Background()
	// Create a container
	resp, err := cli.ContainerCreate(ctx, &container.Config{
		Image:      languages_details[language]["image"],
		Tty:        false,
		OpenStdin:  true,
		WorkingDir: "/app",
		Cmd:        strings.Split(languages_details[language]["cmd"], "-"),
	}, &container.HostConfig{
		Resources: container.Resources{
			Ulimits: []*units.Ulimit{
				{
					Name: "nproc",
					Soft: 100,
					Hard: 1024,
				},
			},
			Memory: int64(mem_limit_mb * 1024 * 1024),
		},
	}, nil, nil, "")
	if err != nil {
		log.Println("Error in creating container\n " + err.Error())
	}
	// Copy code to container
	content, err := Make_Archieve(fmt.Sprintf("code%s", languages_details[language]["extension"]), code)
	if err != nil {
		log.Println("Error in creating container\n " + err.Error())
	}
	err = cli.CopyToContainer(ctx, resp.ID, "/app", content, types.CopyToContainerOptions{
		AllowOverwriteDirWithFile: true,
	})
	if err != nil {
		log.Println("Error in creating container\n " + err.Error())
	}
	// Start container
	err = cli.ContainerStart(ctx, resp.ID, types.ContainerStartOptions{})
	if err != nil {
		log.Println("Error in creating container\n " + err.Error())
	}
	// Write input to container
	hijackedResponse, err := cli.ContainerAttach(ctx, resp.ID, types.ContainerAttachOptions{
		Stream: true,
		Stdin:  true,
		Stdout: false,
		Stderr: false,
	})
	if err != nil {
		log.Println("Error in creating container\n " + err.Error())
	}
	_, err = hijackedResponse.Conn.Write([]byte(input + "\n"))
	if err != nil {
		log.Println("Error in writing input to container\n " + err.Error())
	}
	// Context with timeout
	time_limit_ctx, cancel := context.WithTimeout(context.Background(), time.Duration(time_limit)*time.Second)
	defer cancel()
	// Wait for container to finish
	statusCh, errCh := cli.ContainerWait(time_limit_ctx, resp.ID, container.WaitConditionNotRunning)
	select {
	case err := <-errCh:
		if err != nil {
			Put_Execution_Result_To_Channel(execution_channel, Execution_Result{
				Submission_Index: submission_index,
				Stdout:           "",
				Stderr:           "Sandbox error, try to run again",
			})
		}
	case <-time_limit_ctx.Done():
		cli.ContainerStop(ctx, resp.ID, container.StopOptions{})
		Put_Execution_Result_To_Channel(execution_channel, Execution_Result{
			Submission_Index: submission_index,
			Stdout:           "",
			Stderr:           "Time Limit Exceeded",
		})
	case statusCode := <-statusCh:
		log.Printf("Status Code: %d\n", statusCode.StatusCode)
		if statusCode.StatusCode == 137 {
			Put_Execution_Result_To_Channel(execution_channel, Execution_Result{
				Submission_Index: submission_index,
				Stdout:           "",
				Stderr:           "Memory Limit Exceeded",
			})
		}
		out, err := cli.ContainerLogs(ctx, resp.ID, types.ContainerLogsOptions{ShowStdout: true, ShowStderr: true})
		if err != nil {
			Put_Execution_Result_To_Channel(execution_channel, Execution_Result{
				Submission_Index: submission_index,
				Stdout:           "",
				Stderr:           "Something wrong",
			})
		}
		defer out.Close()
		stdoutput := new(bytes.Buffer)
		stderror := new(bytes.Buffer)
		_, err = stdcopy.StdCopy(stdoutput, stderror, out)
		if err != nil {
			log.Println("Error in copying container logs\n " + err.Error())
		}
		log.Printf("Stdout: %s\nStderr: %s\n", stdoutput.String(), stderror.String())
		Put_Execution_Result_To_Channel(execution_channel, Execution_Result{
			Submission_Index: submission_index,
			Stdout:           stdoutput.String(),
			Stderr:           stderror.String(),
		})
	case <-threading_ctx.Done():
		return
	}
}

func Put_Execution_Result_To_Channel(execution_channel chan Execution_Result, execution_result Execution_Result) {
	execution_channel <- execution_result
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

func Judge_Submission(submission_id string) (int, error) {
	if submission_id == "" {
		return -1, fmt.Errorf("submission_id is empty")
	}
	jsonBody := []byte(fmt.Sprintf(`{"submission_id": "%s"}`, submission_id))
	bodyReader := bytes.NewReader(jsonBody)
	req, err := http.NewRequest("POST", "http://judge.judge.svc.cluster.local/judge", bodyReader)
	if err != nil {
		req.Body.Close()
		return -1, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return -1, err
	}
	defer resp.Body.Close()
	return resp.StatusCode, nil
}
