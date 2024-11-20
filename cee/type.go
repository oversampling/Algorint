package main

type Submission_Token struct {
	Submission_Id string `json:"submission_id"`
}

type Submission struct {
	Status    string   `json:"status"`
	Language  string   `json:"language"`
	Code      string   `json:"code"`
	Stdin     []string `json:"stdin"`
	TestCases []string `json:"test_cases"`
	Replace   [][]struct {
		From string `json:"from"`
		To   string `json:"to"`
		ID   string `json:"_id,omitempty"`
	} `json:"replace"`
	SubmissionID string   `json:"submission_id"`
	MemoryLimit  []int    `json:"memory_limit"`
	TimeLimit    []int    `json:"time_limit"`
	Stdout       []string `json:"stdout,omitempty"`
	Stderr       []string `json:"stderr,omitempty"`
	Result       []bool   `json:"result,omitempty"`
}

type Execution_Result struct {
	Submission_Index int
	Stdout           string
	Stderr           string
}
