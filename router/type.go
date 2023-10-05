package main

type Submission struct {
	Status    string   `json:"status,omitempty"`
	Language  string   `json:"language"`
	Code      string   `json:"code"`
	Stdin     []string `json:"stdin,omitempty"`
	Input     []string `json:"input,omitempty"`
	TestCases []string `json:"test_cases"`
	Replace   [][]struct {
		From string `json:"from"`
		To   string `json:"to"`
		ID   string `json:"_id,omitempty"`
	} `json:"replace"`
	SubmissionID  string   `json:"submission_id"`
	MemoryLimit   []int    `json:"memory_limit"`
	TimeLimit     []int    `json:"time_limit"`
	Stdout        []string `json:"stdout,omitempty"`
	Stderr        []string `json:"stderr,omitempty"`
	Result        []bool   `json:"result,omitempty"`
	Configuration []struct {
		MemoryLimit int `json:"memory_limit"`
		TimeLimit   int `json:"time_limit"`
	} `json:"configuration,omitempty"`
}
