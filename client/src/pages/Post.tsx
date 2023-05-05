import { useEffect, useState } from "react";
import {
    Badge,
    Button,
    Card,
    Form,
    Modal,
    Spinner,
    Stack,
} from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import Code from "../component/Editor/Code";
import Header from "../component/Header";
import MarkdownPreview from "../component/MarkdownPreview";
import {
    useExecuteCodeMutation,
    useFetchExecutionResultMutation,
    useSubmitCodeMutation,
    useViewPostMutation,
} from "../features/posts/postsApiSlice";
import {
    IAssignment_Code_Execution,
    IAssignment_Code_Submission,
    ISubmission_Result,
    Post,
} from "../interface";

export default function Posts() {
    const { id } = useParams<{ id: string }>();
    const [postData, setPostData] = useState<Post | undefined>();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [viewPost] = useViewPostMutation();
    const [assignmentCode, setassignmentCode] = useState<
        IAssignment_Code_Execution[] | undefined
    >();
    const [showModal, setShowModal] = useState<boolean>(false);
    const [modalDetails, setModalDetails] = useState<
        ISubmission_Result | undefined
    >(undefined);
    const [submissionResult, setSubmissionResult] = useState<
        ISubmission_Result[][]
    >([]);
    const [showRefreshSpinner, setShowRefreshSpinner] = useState<boolean[]>([]);
    const [submissionToken, setSubmissionToken] = useState<string[]>([]);
    const [showRefreshBtn, setShowRefreshBtn] = useState<boolean[]>([]);
    const [showNoSampleTestCases, setShowNoSampleTestCases] = useState<
        boolean[]
    >([]);
    const [executeCode, { isLoading: execution_status }] =
        useExecuteCodeMutation();
    const [fetchExecutionResult, { isLoading: execution_result }] =
        useFetchExecutionResultMutation();
    const [submitCode, { isLoading: submission_reuslt }] =
        useSubmitCodeMutation();
    useEffect(() => {
        async function viewPostData() {
            setIsLoading(true);
            const payload: Post = await viewPost(id || "").unwrap();
            setSubmissionResult([]);
            setShowRefreshSpinner([]);
            setShowRefreshBtn([]);
            setShowNoSampleTestCases([]);
            if (payload) {
                if (payload.assignments.length > 0) {
                    setSubmissionResult((prev) => {
                        const newSubmissionResult = [...prev];
                        for (let i = 0; i < payload.assignments.length; i++) {
                            newSubmissionResult.push([]);
                        }
                        return newSubmissionResult;
                    });
                    setShowRefreshSpinner((prev) => {
                        const newShowRefreshSpinner = [...prev];
                        for (let i = 0; i < payload.assignments.length; i++) {
                            newShowRefreshSpinner.push(false);
                        }
                        return newShowRefreshSpinner;
                    });
                    setShowRefreshBtn((prev) => {
                        const newShowRefreshBtn = [...prev];
                        for (let i = 0; i < payload.assignments.length; i++) {
                            newShowRefreshBtn.push(false);
                        }
                        return newShowRefreshBtn;
                    });
                    setShowNoSampleTestCases((prev) => {
                        const newShowNoSampleTestCases = [...prev];
                        for (let i = 0; i < payload.assignments.length; i++) {
                            newShowNoSampleTestCases.push(false);
                        }
                        return newShowNoSampleTestCases;
                    });
                    const newCode: IAssignment_Code_Execution[] = [];
                    for (let i = 0; i < payload.assignments.length; i++) {
                        const newCodeItem: IAssignment_Code_Execution = {
                            code: payload.assignments[i].code_template,
                            language: payload.assignments[i].language,
                            assingment_index: i,
                        };
                        newCode.push(newCodeItem);
                    }
                    // Decode from base64 to string
                    for (let i = 0; i < newCode.length; i++) {
                        newCode[i].code = atob(newCode[i].code);
                    }
                    setassignmentCode(newCode);
                }
                setPostData(payload);
            }
            setIsLoading(false);
        }
        viewPostData();
    }, []);
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
    async function fetchSubmissionResultLoop(
        max_retries: number,
        submission_token: string,
        ms: number,
        assignment_index: number
    ): Promise<number> {
        setShowRefreshBtn((prev) => {
            const newShowRefreshBtn = [...prev];
            newShowRefreshBtn[assignment_index] = false;
            return newShowRefreshBtn;
        });
        setSubmissionToken((prev) => {
            const newSubmissionToken = [...prev];
            newSubmissionToken[assignment_index] = submission_token;
            return newSubmissionToken;
        });
        setSubmissionResult((prev) => {
            const newSubmissionResult = [...prev];
            newSubmissionResult[assignment_index] = [];
            return newSubmissionResult;
        });
        for (let i = 0; i < max_retries; i++) {
            const response = await fetchExecutionResultWithSleep(
                submission_token,
                ms
            );
            if (response.status === "done execution") {
                const textarea = document.getElementById(
                    `execution-result-${assignment_index}`
                ) as HTMLInputElement;
                const subResultArray: ISubmission_Result[] = [];
                if (textarea != null) {
                    for (let i = 0; i < response.stdout.length; i++) {
                        const subResult: ISubmission_Result = {
                            stderr: atob(response.stderr[i]),
                            stdout: atob(response.stdout[i]),
                            result: response.result[i],
                            replace: response.replace[i],
                            test_case_input: response.stdin[i],
                            test_case_output: response.test_cases[i],
                            assignment_index: assignment_index,
                        };
                        subResultArray.push(subResult);
                    }
                    setSubmissionResult((prev) => {
                        const newSubmissionResult = [...prev];
                        newSubmissionResult[assignment_index] = subResultArray;
                        return newSubmissionResult;
                    });
                    setSubmissionToken((prev) => {
                        const newSubmissionToken = [...prev];
                        newSubmissionToken[assignment_index] = "";
                        return newSubmissionToken;
                    });
                }
                return 0;
            }
        }
        setShowRefreshBtn((prev) => {
            const newShowRefreshBtn = [...prev];
            newShowRefreshBtn[assignment_index] = true;
            return newShowRefreshBtn;
        });
        return -1;
    }
    async function refreshSubmissionResultClick(assingment_index: number) {
        setShowRefreshSpinner((prev) => {
            const newShowRefreshSpinner = [...prev];
            newShowRefreshSpinner[assingment_index] = true;
            return newShowRefreshSpinner;
        });
        // TODO: wrap fetchExecutionResult with try catch
        const response = await fetchExecutionResultWithSleep(
            submissionToken[assingment_index],
            0
        );
        await timeout(1000);
        setShowRefreshSpinner((prev) => {
            const newShowRefreshSpinner = [...prev];
            newShowRefreshSpinner[assingment_index] = false;
            return newShowRefreshSpinner;
        });
        if (response.status === "done execution") {
            setShowRefreshBtn((prev) => {
                const newShowRefreshBtn = [...prev];
                newShowRefreshBtn[assingment_index] = false;
                return newShowRefreshBtn;
            });
            const subResultArray: ISubmission_Result[] = [];
            for (let i = 0; i < response.stdout.length; i++) {
                const subResult: ISubmission_Result = {
                    stderr: atob(response.stderr[i]),
                    stdout: atob(response.stdout[i]),
                    result: response.result[i],
                    replace: response.replace[i],
                    test_case_input: response.stdin[i],
                    test_case_output: response.test_cases[i],
                    assignment_index: assingment_index,
                };
                subResultArray.push(subResult);
            }
            setSubmissionResult((prev) => {
                const newSubmissionResult = [...prev];
                newSubmissionResult[assingment_index] = subResultArray;
                return newSubmissionResult;
            });
        }
    }
    async function handle_execution(assignmentIndex: number) {
        setShowNoSampleTestCases((prev) => {
            const newShowNoSampleTestCases = [...prev];
            newShowNoSampleTestCases[assignmentIndex] = false;
            return newShowNoSampleTestCases;
        });
        if (assignmentCode) {
            const {
                code,
                language,
                assingment_index,
            }: IAssignment_Code_Execution = assignmentCode[assignmentIndex];
            const submit_button = document.getElementById(
                `btn-execute-${assingment_index}`
            ) as HTMLInputElement;
            const execution_button = document.getElementById(
                `btn-submit-${assingment_index}`
            ) as HTMLInputElement;
            const execution_result = document.getElementById(
                `execution-result-${assingment_index}`
            ) as HTMLInputElement;
            execution_result && (execution_result.value = "");
            execution_result && (execution_result.disabled = true);
            execution_button && (execution_button.disabled = true);
            submit_button && (submit_button.disabled = true);
            const body: IAssignment_Code_Submission = {
                code: btoa(code),
                language,
                assignment_id:
                    postData?.assignments[assingment_index]._id || "",
                assingment_index,
            };
            try {
                const data = await executeCode(body).unwrap();
                const submission_token = data.submission_token;
                await fetchSubmissionResultLoop(
                    5,
                    submission_token,
                    2000,
                    assingment_index
                );
                execution_button && (execution_button.disabled = false);
                execution_result && (execution_result.disabled = false);
                submit_button && (submit_button.disabled = false);
            } catch (error) {
                setShowNoSampleTestCases((prev) => {
                    const newShowNoSampleTestCases = [...prev];
                    newShowNoSampleTestCases[assignmentIndex] = true;
                    return newShowNoSampleTestCases;
                });
                execution_button && (execution_button.disabled = false);
                execution_result && (execution_result.disabled = false);
                submit_button && (submit_button.disabled = false);
            }
        }
    }
    async function handle_submit(assignmentIndex: number) {
        setShowNoSampleTestCases((prev) => {
            const newShowNoSampleTestCases = [...prev];
            newShowNoSampleTestCases[assignmentIndex] = false;
            return newShowNoSampleTestCases;
        });
        if (assignmentCode) {
            const {
                code,
                language,
                assingment_index,
            }: IAssignment_Code_Execution = assignmentCode[assignmentIndex];
            if (postData?.assignments[assingment_index]) {
                if (postData.assignments[assingment_index]._id) {
                    const submit_button = document.getElementById(
                        `btn-execute-${assingment_index}`
                    ) as HTMLInputElement;
                    const execution_button = document.getElementById(
                        `btn-submit-${assingment_index}`
                    ) as HTMLInputElement;
                    const execution_result = document.getElementById(
                        `execution-result-${assingment_index}`
                    ) as HTMLInputElement;
                    execution_result && (execution_result.value = "");
                    execution_result && (execution_result.disabled = true);
                    execution_button && (execution_button.disabled = true);
                    submit_button && (submit_button.disabled = true);
                    const submission: IAssignment_Code_Submission = {
                        code: btoa(code),
                        language,
                        assignment_id:
                            postData.assignments[assingment_index]._id || "",
                        assingment_index,
                    };
                    const response = await submitCode(submission).unwrap();
                    const submission_token: string = response.submission_token;
                    await fetchSubmissionResultLoop(
                        5,
                        submission_token,
                        2000,
                        assingment_index
                    );
                    execution_button && (execution_button.disabled = false);
                    execution_result && (execution_result.disabled = false);
                    submit_button && (submit_button.disabled = false);
                }
            }
        }
    }
    function handle_show_modal(
        test_case_index: number,
        result: boolean,
        stdout: string,
        stderr: string,
        test_case_output: string,
        test_case_input: string,
        replace: { from: string; to: string }[]
    ) {
        setShowModal(true);
        const submission_result: ISubmission_Result = {
            result,
            stdout,
            stderr,
            test_case_output,
            test_case_input,
            replace: replace,
            test_case_index,
        };
        setModalDetails(submission_result);
    }
    function handle_close_modal() {
        setModalDetails(undefined);
        setShowModal(false);
    }
    return (
        <div>
            <Header />
            <div className="container mt-3">
                <div className="row justify-content-center">
                    <div className="col-8">
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
                            postData && (
                                <Card className="shadow-sm bg-body rounded border-0">
                                    <Card.Header>
                                        <Stack direction="horizontal" gap={3}>
                                            <div>{postData["title"]}</div>
                                            <div className="ms-auto">
                                                {postData["stars"]}
                                                <span className="mx-1">
                                                    <i
                                                        className="fa-duotone fa-caret-up fa-xl"
                                                        style={{
                                                            cursor: "pointer",
                                                        }}
                                                    ></i>
                                                </span>
                                            </div>
                                        </Stack>
                                    </Card.Header>
                                    <Card.Body>
                                        <MarkdownPreview
                                            value={atob(
                                                postData["description"]
                                            )}
                                        />
                                    </Card.Body>
                                    <hr
                                        style={{
                                            width: "95%",
                                            margin: "auto",
                                        }}
                                    />
                                    {postData["assignments"].map(
                                        (assignment, index: number) => (
                                            <Form key={index}>
                                                <Card
                                                    style={{ margin: 15 }}
                                                    className="shadow-sm bg-body rounded border-0"
                                                >
                                                    <Card.Header>
                                                        Assignment {index + 1}
                                                    </Card.Header>
                                                    <Card.Body>
                                                        <div className="mb-3">
                                                            <Form.Label>
                                                                <strong>
                                                                    {" "}
                                                                    Assignment
                                                                    Question
                                                                </strong>
                                                            </Form.Label>
                                                            <MarkdownPreview
                                                                value={atob(
                                                                    assignment[
                                                                        "question"
                                                                    ]
                                                                )}
                                                            />
                                                        </div>
                                                        <div className="mb-3">
                                                            <Form.Label>
                                                                <strong>
                                                                    Your Answer
                                                                </strong>
                                                            </Form.Label>
                                                            <Card className="shadow-sm bg-body rounded border-0">
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
                                                                        index={
                                                                            index
                                                                        }
                                                                        value={
                                                                            assignmentCode &&
                                                                            assignmentCode[
                                                                                index
                                                                            ]
                                                                                .code
                                                                        }
                                                                    />
                                                                </Card.Body>
                                                            </Card>
                                                        </div>
                                                        <p>Result</p>
                                                        <div
                                                            className="shadow-none p-3 mb-5 bg-light rounded"
                                                            style={{
                                                                minHeight:
                                                                    "20px",
                                                                maxHeight:
                                                                    "100px",
                                                                overflowY:
                                                                    "auto",
                                                            }}
                                                            id={`execution-result-${index}`}
                                                        >
                                                            {showNoSampleTestCases[
                                                                index
                                                            ] && (
                                                                <p>
                                                                    No Sample
                                                                    Test Case
                                                                    Being Set
                                                                    For Test Run
                                                                </p>
                                                            )}
                                                            {showRefreshBtn[
                                                                index
                                                            ] && (
                                                                <div>
                                                                    <p>
                                                                        <i>
                                                                            Sorry!
                                                                            Your
                                                                            program
                                                                            take
                                                                            too
                                                                            long
                                                                            to
                                                                            execute,
                                                                            refresh
                                                                            your
                                                                            result
                                                                            in a
                                                                            while
                                                                        </i>
                                                                    </p>
                                                                    <div>
                                                                        <Button
                                                                            variant="primary"
                                                                            onClick={() => {
                                                                                refreshSubmissionResultClick(
                                                                                    index
                                                                                );
                                                                            }}
                                                                        >
                                                                            Refresh
                                                                        </Button>
                                                                        {showRefreshSpinner[
                                                                            index
                                                                        ] && (
                                                                            <Spinner
                                                                                animation="border"
                                                                                variant="info"
                                                                                className="mx-2"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {submissionResult[
                                                                index
                                                            ].length !== 0
                                                                ? submissionResult[
                                                                      index
                                                                  ].map(
                                                                      (
                                                                          result,
                                                                          test_case_index
                                                                      ) => {
                                                                          return (
                                                                              <div
                                                                                  key={
                                                                                      test_case_index
                                                                                  }
                                                                                  className="mb-1"
                                                                              >
                                                                                  <span className="mx-2">
                                                                                      Test
                                                                                      Case{" "}
                                                                                      {test_case_index +
                                                                                          1}

                                                                                      :
                                                                                  </span>
                                                                                  <Button
                                                                                      variant={
                                                                                          result.result
                                                                                              ? "success"
                                                                                              : "danger"
                                                                                      }
                                                                                      onClick={() => {
                                                                                          handle_show_modal(
                                                                                              test_case_index,
                                                                                              result.result,
                                                                                              result.stdout,
                                                                                              result.stderr,
                                                                                              result.test_case_output,
                                                                                              result.test_case_input,
                                                                                              result.replace
                                                                                          );
                                                                                      }}
                                                                                  >
                                                                                      {result.result
                                                                                          ? "Pass"
                                                                                          : "Failed"}
                                                                                  </Button>
                                                                              </div>
                                                                          );
                                                                      }
                                                                  )
                                                                : ""}
                                                        </div>
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
                                                                    Test Run
                                                                </Button>
                                                                <Button
                                                                    variant="primary"
                                                                    id={`btn-submit-${index}`}
                                                                    onClick={() => {
                                                                        handle_submit(
                                                                            index
                                                                        );
                                                                    }}
                                                                >
                                                                    Submit
                                                                </Button>
                                                            </Stack>
                                                        </Stack>
                                                    </Card.Body>
                                                </Card>
                                                <hr
                                                    style={{
                                                        width: "95%",
                                                        margin: "auto",
                                                    }}
                                                />
                                            </Form>
                                        )
                                    )}
                                </Card>
                            )
                        )}
                    </div>
                    <Modal
                        show={showModal}
                        onHide={handle_close_modal}
                        scrollable={true}
                    >
                        <Modal.Header closeButton>
                            <Modal.Title>
                                <span>
                                    Test Case{" "}
                                    {modalDetails?.test_case_index !==
                                        undefined &&
                                        (modalDetails?.test_case_index === 0
                                            ? 1
                                            : modalDetails?.test_case_index +
                                              1)}
                                    <Badge
                                        bg={
                                            modalDetails && modalDetails.result
                                                ? "success"
                                                : "danger"
                                        }
                                        style={{ fontSize: "0.8rem" }}
                                    >
                                        {modalDetails && modalDetails.result
                                            ? " Passed"
                                            : " Failed"}
                                    </Badge>
                                </span>
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        {modalDetails &&
                                        modalDetails.stdout !== ""
                                            ? "Stdout"
                                            : "Stderr"}
                                    </Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        placeholder=""
                                        value={
                                            modalDetails &&
                                            (modalDetails.stdout !== ""
                                                ? modalDetails.stdout
                                                : modalDetails.stderr)
                                        }
                                        readOnly
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Expected Output</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        placeholder=""
                                        value={
                                            modalDetails &&
                                            atob(modalDetails.test_case_output)
                                        }
                                        readOnly
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Stdin</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        placeholder=""
                                        value={
                                            modalDetails &&
                                            atob(modalDetails.test_case_input)
                                        }
                                        readOnly
                                    />
                                </Form.Group>
                                <div className="container">
                                    {modalDetails &&
                                        modalDetails.replace.map(
                                            (modalDetail, modalDetailIndex) => {
                                                return (
                                                    <div
                                                        className="row"
                                                        key={modalDetailIndex}
                                                    >
                                                        <div className="col">
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>
                                                                    Replace
                                                                    Value From
                                                                </Form.Label>
                                                                <Form.Control
                                                                    as="textarea"
                                                                    placeholder=""
                                                                    value={atob(
                                                                        modalDetail.from
                                                                    )}
                                                                    readOnly
                                                                />
                                                            </Form.Group>
                                                        </div>
                                                        <div className="col">
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>
                                                                    Replace
                                                                    Value to
                                                                </Form.Label>
                                                                <Form.Control
                                                                    as="textarea"
                                                                    placeholder=""
                                                                    value={atob(
                                                                        modalDetail.to
                                                                    )}
                                                                    readOnly
                                                                />
                                                            </Form.Group>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        )}
                                </div>
                            </Form>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button
                                variant="secondary"
                                onClick={handle_close_modal}
                            >
                                Close
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </div>
            </div>
        </div>
    );
}
