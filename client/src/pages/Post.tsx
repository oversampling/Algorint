import { useEffect, useState } from "react";
import { Button, Card, FloatingLabel, Form, Stack } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import Code from "../component/Editor/Code";
import Header from "../component/Header";
import MarkdownPreview from "../component/MarkdownPreview";
import {
    useExecuteCodeMutation,
    useFetchExecutionResultMutation,
    useViewPostQuery,
} from "../features/posts/postsApiSlice";
import {
    IAssignment_Code_Execution,
    ICode_Execution_Body,
    Post,
} from "../interface";

export default function Posts() {
    const { id } = useParams<{ id: string }>();
    const { data, isLoading }: { data?: Post; isLoading: boolean } =
        useViewPostQuery(id || "");
    const [assignmentCode, setassignmentCode] = useState<
        IAssignment_Code_Execution[] | undefined
    >();
    const [executeCode, { isLoading: execution_status }] =
        useExecuteCodeMutation();
    const [fetchExecutionResult, { isLoading: execution_result }] =
        useFetchExecutionResultMutation();
    useEffect(() => {
        if (data) {
            if (data.assignments.length > 0) {
                const newCode: IAssignment_Code_Execution[] = [];
                for (let i = 0; i < data.assignments.length; i++) {
                    const newCodeItem: IAssignment_Code_Execution = {
                        code: data.assignments[i].code_template,
                        language: data.assignments[i].language,
                        index: i,
                    };
                    newCode.push(newCodeItem);
                }
                setassignmentCode(newCode);
            }
        }
    }, [data]);
    function onCodeChange(data: string, language: string, index?: number) {
        if (index != undefined) {
            setassignmentCode((prev) => {
                if (prev) {
                    const newCode = [...prev];
                    newCode[index].code = data;
                    newCode[index].language = language;
                    return newCode;
                }
                return prev;
            });
        }
    }
    function timeout(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async function fetchExecutionResultWithSleep(
        submission_token: string,
        ms: number
    ) {
        await timeout(ms);
        return await fetchExecutionResult(submission_token).unwrap();
    }
    async function fetchExecutionResultLoop(
        max_retries: number,
        submission_token: string,
        ms: number,
        index: number
    ) {
        for (let i = 0; i < max_retries; i++) {
            const response = await fetchExecutionResultWithSleep(
                submission_token,
                ms
            );
            if (response.status === "done execution") {
                const textarea = document.getElementById(
                    `execution-result-${index}`
                ) as HTMLInputElement;
                if (textarea != null) {
                    if (response.stdout[0] != "") {
                        textarea.value = response.stdout[0];
                    } else {
                        textarea.value = response.stderr[0];
                    }
                }
                break;
            }
        }
    }
    async function handle_execution(assignmentIndex: number) {
        if (assignmentCode) {
            const { code, language, index }: IAssignment_Code_Execution =
                assignmentCode[assignmentIndex];
            const submit_button = document.getElementById(
                `btn-execute-${index}`
            ) as HTMLInputElement;
            const execution_button = document.getElementById(
                `btn-submit-${index}`
            ) as HTMLInputElement;
            const execution_result = document.getElementById(
                `execution-result-${index}`
            ) as HTMLInputElement;
            execution_result && (execution_result.value = "");
            execution_result && (execution_result.disabled = true);
            execution_button && (execution_button.disabled = true);
            submit_button && (submit_button.disabled = true);
            const body: ICode_Execution_Body = {
                code,
                language,
            };
            const data = await executeCode(body).unwrap();
            const submission_token = data.submission_token;
            await fetchExecutionResultLoop(3, submission_token, 2000, index);
            execution_button && (execution_button.disabled = false);
            execution_result && (execution_result.disabled = false);
            submit_button && (submit_button.disabled = false);
        }
    }
    return (
        <div>
            <Header />
            <div style={{ margin: 15 }}>
                <Stack direction="horizontal" gap={3} className="mb-3">
                    <div className="fw-light fs-4">Post</div>
                    <Link to={"/posts/new"} className="btn btn-primary ms-auto">
                        New
                    </Link>
                </Stack>
                {isLoading ? (
                    <Card
                        style={{ height: "70vh" }}
                        className="position-relative"
                    >
                        <Card.Body>
                            <div
                                className="spinner-border text-primary position-absolute top-50 start-50"
                                role="status"
                            >
                                <span className="visually-hidden">
                                    Loading...
                                </span>
                            </div>
                        </Card.Body>
                    </Card>
                ) : (
                    data && (
                        <Card>
                            <Card.Header>
                                <Stack direction="horizontal" gap={3}>
                                    <div>{data["title"]}</div>
                                    <Form.Check
                                        disabled
                                        checked={data["isPublic"]}
                                        className="ms-auto"
                                        type="switch"
                                        id="isPublic"
                                        name="isPublic"
                                        label={
                                            data["isPublic"]
                                                ? "Public"
                                                : "Private"
                                        }
                                    />
                                </Stack>
                            </Card.Header>
                            <Card.Body>
                                <MarkdownPreview value={data["description"]} />
                            </Card.Body>
                            {data["assignments"].map(
                                (assignment, index: number) => (
                                    <Form key={index}>
                                        <Card style={{ margin: 15 }}>
                                            <Card.Header>
                                                Assignment {index + 1}
                                            </Card.Header>
                                            <Card.Body>
                                                <div className="mb-3">
                                                    <Form.Label>
                                                        Assignment Question
                                                    </Form.Label>
                                                    <MarkdownPreview
                                                        value={
                                                            assignment[
                                                                "question"
                                                            ]
                                                        }
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <Form.Label>
                                                        Your Answer
                                                    </Form.Label>
                                                    <Card>
                                                        <Card.Header>
                                                            <Form.Select
                                                                aria-label="Default select example"
                                                                className="w-25"
                                                            >
                                                                <option>
                                                                    {
                                                                        assignment[
                                                                            "language"
                                                                        ]
                                                                    }
                                                                </option>
                                                            </Form.Select>
                                                        </Card.Header>
                                                        <Card.Body>
                                                            <Code
                                                                onCode={(
                                                                    data,
                                                                    langauge,
                                                                    index
                                                                ) => {
                                                                    onCodeChange(
                                                                        data,
                                                                        langauge,
                                                                        index
                                                                    );
                                                                }}
                                                                language={
                                                                    assignment[
                                                                        "language"
                                                                    ]
                                                                }
                                                                index={index}
                                                                value={
                                                                    assignmentCode &&
                                                                    assignmentCode[
                                                                        index
                                                                    ].code
                                                                }
                                                            />
                                                        </Card.Body>
                                                    </Card>
                                                </div>
                                                <FloatingLabel
                                                    controlId={`execution-result-${index}`}
                                                    label="Execution Result"
                                                    className="mb-3"
                                                >
                                                    <Form.Control
                                                        as="textarea"
                                                        placeholder="Leave a comment here"
                                                        style={{
                                                            height: "100px",
                                                        }}
                                                    />
                                                </FloatingLabel>
                                                <Stack
                                                    direction="horizontal"
                                                    gap={1}
                                                >
                                                    <Stack
                                                        direction="horizontal"
                                                        gap={2}
                                                        className="ms-auto"
                                                    >
                                                        <Button
                                                            variant="primary"
                                                            id={`btn-execute-${index}`}
                                                            onClick={() => {
                                                                handle_execution(
                                                                    index
                                                                );
                                                            }}
                                                        >
                                                            Execute
                                                        </Button>
                                                        <Button
                                                            variant="primary"
                                                            type="submit"
                                                            id={`btn-submit-${index}`}
                                                        >
                                                            Submit
                                                        </Button>
                                                    </Stack>
                                                </Stack>
                                            </Card.Body>
                                        </Card>
                                    </Form>
                                )
                            )}
                        </Card>
                    )
                )}
            </div>
        </div>
    );
}
