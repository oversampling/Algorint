package main

type Submission_Token struct {
	Submission_Id string `json:"submission_id"`
}

type Submission struct {
	Status    string   `json:"status"`
	Language  string   `json:"language"`
	Code      string   `json:"code"`
	Input     []string `json:"input"`
	TestCases []string `json:"test_cases"`
	Replace   [][]struct {
		From string `json:"from"`
		To   string `json:"to"`
		ID   string `json:"_id,omitempty"`
	} `json:"replace"`
	SubmissionID string `json:"submission_id"`
	MemoryLimit  []int  `json:"memory_limit"`
	TimeLimit    []int  `json:"time_limit"`
}
