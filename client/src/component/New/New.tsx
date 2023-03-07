import React, { useState } from "react";
import {
    Button,
    Card,
    Col,
    FloatingLabel,
    Form,
    Row,
    Stack,
} from "react-bootstrap";
import Code from "../Editor/Code";
import Markdown from "../Editor/Markdown";
import Header from "../Header";

interface Test_Case {
    replace: {
        from: string;
        to: string;
    };
    stdin: string;
    stdout: string;
}

interface Assignment {
    questions: string;
    code_template: {
        language: string;
        code: string;
    };
    test_cases: [Test_Case];
}

interface Post {
    title: string;
    description: string;
    isPrivate: boolean;
    assignments: Assignment[];
}

export default function New() {
    const [post, setPost] = useState<Post>({} as Post);
    const [assingmentList, setAssignmentList] = useState<Assignment[]>([]);
    function handlePostChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target;
        if (name === "isPrivate") {
            const label = document.querySelector("label[for='isPrivate']");
            if (label !== null) {
                e.target.checked
                    ? (label.innerHTML = "Private")
                    : (label.innerHTML = "Public");
            }
            setPost({ ...post, [name]: e.target.checked });
        } else {
            setPost({ ...post, [name]: value });
        }
    }
    function addAssignmentClick() {
        const newAssignment: Assignment = {} as Assignment;
        assingmentList === undefined
            ? setAssignmentList([newAssignment])
            : setAssignmentList([...assingmentList, newAssignment]);
    }
    function addTestCaseClick(assignment_index: number) {
        const list: Assignment[] = [...assingmentList];
        list[assignment_index]["test_cases"] === undefined
            ? (list[assignment_index]["test_cases"] = [
                  { replace: { from: "", to: "" }, stdin: "", stdout: "" },
              ])
            : list[assignment_index]["test_cases"].push({
                  replace: { from: "", to: "" },
                  stdin: "",
                  stdout: "",
              });
        setAssignmentList(list);
        setPost({ ...post, assignments: list });
    }
    function handlePostDescriptionChange(value: string) {
        setPost({ ...post, description: value });
    }
    function handleAssignmentQuestionChange(value: string, index?: number) {
        if (index != undefined) {
            const list: Assignment[] = [...assingmentList];
            list[index]["questions"] = value;
            setAssignmentList(list);
            setPost({ ...post, assignments: list });
        }
    }
    function onCodeChange(data: string, language: string, index?: number) {
        if (index != undefined) {
            const list: Assignment[] = [...assingmentList];
            list[index]["code_template"] = {
                language: language,
                code: data,
            };
            setAssignmentList(list);
            setPost({ ...post, assignments: list });
        }
    }
    function onLanguageChange(
        e: React.ChangeEvent<HTMLSelectElement>,
        index: number
    ) {
        const { name, value } = e.target;
        const list: Assignment[] = [...assingmentList];
        if (list[index] === undefined) {
            list[index]["code_template"] = {
                language: value,
                code: "",
            };
        } else {
            list[index]["code_template"] = {
                language: value,
                code: "",
            };
        }
        setAssignmentList(list);
        setPost({ ...post, assignments: list });
    }
    function onTestCasesChange(
        e: React.ChangeEvent<any>,
        index: number,
        testIndex: number
    ) {
        const obj: { name: string; value: string } = e.target;
        const { name, value } = obj;
        const list: Assignment[] = [...assingmentList];
        if (name === "from" || name === "to") {
            list[index]["test_cases"][testIndex]["replace"][name] = value;
        } else if (name === "stdin" || name === "stdout") {
            list[index]["test_cases"][testIndex][name] = value;
        }
        setAssignmentList(list);
        setPost({ ...post, assignments: list });
    }
    return (
        <div>
            <Header />
            <div>
                <Form>
                    <Card style={{ margin: 15 }}>
                        <Card.Header>
                            <Stack direction="horizontal" gap={3}>
                                <div>New Post</div>
                                <Form.Check
                                    className="ms-auto"
                                    type="switch"
                                    id="isPrivate"
                                    name="isPrivate"
                                    label={`Private`}
                                    onChange={handlePostChange}
                                />
                            </Stack>
                        </Card.Header>
                        <Card.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>Post Title</Form.Label>
                                <Form.Control
                                    type="text"
                                    maxLength={100}
                                    required
                                    name="title"
                                    onChange={handlePostChange}
                                    placeholder="Enter Post Title"
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Markdown
                                    onChange={handlePostDescriptionChange}
                                />
                            </Form.Group>
                            {assingmentList?.map((assignment, index) => (
                                <Card className="mb-3" key={index + 1}>
                                    <Card.Header>
                                        Assignment {index + 1}
                                    </Card.Header>
                                    <Card.Body>
                                        <>
                                            <Form.Group className="mb-3">
                                                <Form.Label>
                                                    Assignment Question
                                                </Form.Label>
                                                <Markdown
                                                    index={index}
                                                    onChange={
                                                        handleAssignmentQuestionChange
                                                    }
                                                />
                                            </Form.Group>
                                            <Form.Label column sm="5">
                                                Code Template
                                            </Form.Label>
                                            <Card className="mb-3">
                                                <Card.Header>
                                                    <Form.Select
                                                        aria-label="Default select example"
                                                        className="w-25"
                                                        name="language"
                                                        onChange={(e) =>
                                                            onLanguageChange(
                                                                e,
                                                                index
                                                            )
                                                        }
                                                    >
                                                        <option value="python">
                                                            Python
                                                        </option>
                                                        <option value="nodejs">
                                                            NodeJS
                                                        </option>
                                                        <option value="rust">
                                                            Rust
                                                        </option>
                                                        <option value="cpp">
                                                            C++
                                                        </option>
                                                        <option value="c">
                                                            C
                                                        </option>
                                                    </Form.Select>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Code
                                                        language={
                                                            assignment[
                                                                "code_template"
                                                            ] === undefined
                                                                ? "python"
                                                                : assignment[
                                                                      "code_template"
                                                                  ]["language"]
                                                        }
                                                        index={index}
                                                        onCode={onCodeChange}
                                                    />
                                                </Card.Body>
                                            </Card>
                                            <Form.Label
                                                column
                                                sm="5"
                                                className="d-block"
                                            >
                                                Assignment Test Settings
                                            </Form.Label>
                                            {assignment["test_cases"]?.map(
                                                (test, testIndex) => {
                                                    return (
                                                        <Card
                                                            className="mb-3"
                                                            key={testIndex}
                                                        >
                                                            <Card.Body>
                                                                <Form.Label>
                                                                    Replace
                                                                </Form.Label>
                                                                <Row className="mb-3">
                                                                    <Col>
                                                                        <FloatingLabel
                                                                            controlId="floatingTextarea2"
                                                                            label="From"
                                                                        >
                                                                            <Form.Control
                                                                                as="textarea"
                                                                                placeholder="Leave a comment here"
                                                                                name={`from`}
                                                                                onChange={(
                                                                                    e
                                                                                ) => {
                                                                                    onTestCasesChange(
                                                                                        e,
                                                                                        index,
                                                                                        testIndex
                                                                                    );
                                                                                    console.log(
                                                                                        typeof e
                                                                                    );
                                                                                }}
                                                                                style={{
                                                                                    height: "100px",
                                                                                }}
                                                                            />
                                                                        </FloatingLabel>
                                                                    </Col>
                                                                    <Col>
                                                                        <FloatingLabel
                                                                            controlId="floatingTextarea2"
                                                                            label="To"
                                                                        >
                                                                            <Form.Control
                                                                                as="textarea"
                                                                                name="to"
                                                                                onChange={(
                                                                                    e
                                                                                ) => {
                                                                                    onTestCasesChange(
                                                                                        e,
                                                                                        index,
                                                                                        testIndex
                                                                                    );
                                                                                    console.log(
                                                                                        typeof e
                                                                                    );
                                                                                }}
                                                                                placeholder="Leave a comment here"
                                                                                style={{
                                                                                    height: "100px",
                                                                                }}
                                                                            />
                                                                        </FloatingLabel>
                                                                    </Col>
                                                                </Row>
                                                                <FloatingLabel
                                                                    controlId="floatingTextarea2"
                                                                    label="Stdin"
                                                                    className="mb-3"
                                                                >
                                                                    <Form.Control
                                                                        as="textarea"
                                                                        placeholder="Leave a comment here"
                                                                        name="stdin"
                                                                        onChange={(
                                                                            e
                                                                        ) => {
                                                                            onTestCasesChange(
                                                                                e,
                                                                                index,
                                                                                testIndex
                                                                            );
                                                                            console.log(
                                                                                typeof e
                                                                            );
                                                                        }}
                                                                        style={{
                                                                            height: "100px",
                                                                        }}
                                                                    />
                                                                </FloatingLabel>
                                                                <FloatingLabel
                                                                    controlId="floatingTextarea2"
                                                                    label="Stdout"
                                                                    className="mb-3"
                                                                >
                                                                    <Form.Control
                                                                        as="textarea"
                                                                        placeholder="Leave a comment here"
                                                                        name="stdout"
                                                                        onChange={(
                                                                            e
                                                                        ) => {
                                                                            onTestCasesChange(
                                                                                e,
                                                                                index,
                                                                                testIndex
                                                                            );
                                                                            console.log(
                                                                                typeof e
                                                                            );
                                                                        }}
                                                                        style={{
                                                                            height: "100px",
                                                                        }}
                                                                    />
                                                                </FloatingLabel>
                                                            </Card.Body>
                                                        </Card>
                                                    );
                                                }
                                            )}
                                            <Button
                                                variant="outline-info"
                                                onClick={() =>
                                                    addTestCaseClick(index)
                                                }
                                            >
                                                Add Test Case
                                            </Button>
                                        </>
                                    </Card.Body>
                                </Card>
                            ))}
                            <Button
                                variant="primary"
                                onClick={addAssignmentClick}
                            >
                                Add Assignment
                            </Button>
                        </Card.Body>
                    </Card>
                </Form>
            </div>
            <div>{JSON.stringify(post)}</div>
        </div>
    );
}
