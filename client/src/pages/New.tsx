import React, { useEffect, useState } from "react";
import {
    Button,
    Card,
    Col,
    FloatingLabel,
    Form,
    Row,
    Stack,
} from "react-bootstrap";
import Code from "../component/Editor/Code";
import Markdown from "../component/Editor/Markdown";
import Header from "../component/Header";
import { useNavigate } from "react-router-dom";
import { Assignment, Post, Test_Case } from "../interface";
import { useAddNewPostMutation } from "../features/posts/postsApiSlice";

export default function New() {
    const [post, setPost] = useState<Post>({} as Post);
    const [assingmentList, setAssignmentList] = useState<Assignment[]>([]);
    const [addNewPost, { isLoading }] = useAddNewPostMutation();
    const navigate = useNavigate();
    function handlePostChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target;
        if (name === "isPublic") {
            const label = document.querySelector("label[for='isPublic']");
            if (label !== null) {
                e.target.checked
                    ? (label.innerHTML = "Public")
                    : (label.innerHTML = "Private");
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
            list[index]["question"] = value;
            setAssignmentList(list);
            setPost({ ...post, assignments: list });
        }
    }
    function onCodeChange(data: string, language: string, index?: number) {
        if (index != undefined) {
            const list: Assignment[] = [...assingmentList];
            list[index]["code_template"] = data;
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
        if (list[index] !== undefined) {
            list[index]["language"] = value;
            list[index]["code_template"] = "";
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
    async function savePost(e: React.FormEvent<HTMLFormElement>) {
        const url = "http://localhost:3000";
        e.preventDefault();
        if (post.title === undefined) {
            alert("Title is required");
            return;
        }
        if (post.isPublic === undefined) {
            post["isPublic"] = false;
        }
        if (post.description === undefined) {
            alert("Description is required");
            return;
        }
        if (post.assignments === undefined) {
            post["assignments"] = [];
        } else {
            for (let i = 0; i < post.assignments.length; i++) {
                if (post.assignments[i].question === undefined) {
                    alert("Question is required");
                    return;
                }
                if (post.assignments[i].code_template === undefined) {
                    alert("Code Template is required");
                    return;
                }
                if (post.assignments[i].language === undefined) {
                    post.assignments[i].language = "python";
                    return;
                }
                if (post.assignments[i].test_cases === undefined) {
                    post.assignments[i].test_cases = [
                        {
                            stdin: "",
                            stdout: "",
                            replace: { from: "", to: "" },
                        },
                    ];
                    return;
                }
            }
        }
        // Encode data to base64
        post.description = btoa(post.description);
        post.title = btoa(post.title);
        for (let i = 0; i < post.assignments.length; i++) {
            post.assignments[i].question = btoa(post.assignments[i].question);
            post.assignments[i].code_template = btoa(
                post.assignments[i].code_template
            );
            for (let j = 0; j < post.assignments[i].test_cases.length; j++) {
                post.assignments[i].test_cases[j].stdin = btoa(
                    post.assignments[i].test_cases[j].stdin
                );
                post.assignments[i].test_cases[j].stdout = btoa(
                    post.assignments[i].test_cases[j].stdout
                );
                if (post.assignments[i].test_cases[j].replace === undefined) {
                    post.assignments[i].test_cases[j].replace = {
                        from: "",
                        to: "",
                    };
                } else if (
                    post.assignments[i].test_cases[j].replace.from === undefined
                ) {
                    post.assignments[i].test_cases[j].replace.from = "";
                } else if (
                    post.assignments[i].test_cases[j].replace.to === undefined
                ) {
                    post.assignments[i].test_cases[j].replace.to = "";
                } else {
                    post.assignments[i].test_cases[j].replace.from = btoa(
                        post.assignments[i].test_cases[j].replace.from
                    );
                    post.assignments[i].test_cases[j].replace.to = btoa(
                        post.assignments[i].test_cases[j].replace.to
                    );
                }
            }
        }
        const data = await addNewPost(post).unwrap();
        navigate(`/posts/${data._id}`);
    }
    return (
        <div>
            <Header />
            <div className="container mt-3">
                <div className="row justify-content-center">
                    <div className="col-8">
                        <Form onSubmit={savePost}>
                            <Card className="shadow-sm bg-body rounded border-0 mb-2">
                                <Card.Header>
                                    <Stack direction="horizontal" gap={3}>
                                        <div>New Post</div>
                                        <Form.Check
                                            className="ms-auto"
                                            type="switch"
                                            id="isPublic"
                                            name="isPublic"
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
                                            onChange={
                                                handlePostDescriptionChange
                                            }
                                        />
                                    </Form.Group>
                                    {assingmentList?.map(
                                        (assignment, index) => (
                                            <Card
                                                className="mb-3"
                                                key={index + 1}
                                            >
                                                <Card.Header>
                                                    Assignment {index + 1}
                                                </Card.Header>
                                                <Card.Body>
                                                    <>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label>
                                                                Assignment
                                                                Question
                                                            </Form.Label>
                                                            <Markdown
                                                                index={index}
                                                                onChange={
                                                                    handleAssignmentQuestionChange
                                                                }
                                                            />
                                                        </Form.Group>
                                                        <Form.Label
                                                            column
                                                            sm="5"
                                                        >
                                                            Code Template
                                                        </Form.Label>
                                                        <Card className="mb-3">
                                                            <Card.Header>
                                                                <Form.Select
                                                                    aria-label="Default select example"
                                                                    className="w-25"
                                                                    name="language"
                                                                    onChange={(
                                                                        e
                                                                    ) =>
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
                                                                            "language"
                                                                        ] ===
                                                                        undefined
                                                                            ? "python"
                                                                            : assignment[
                                                                                  "language"
                                                                              ]
                                                                    }
                                                                    index={
                                                                        index
                                                                    }
                                                                    onCode={
                                                                        onCodeChange
                                                                    }
                                                                    value={
                                                                        assignment[
                                                                            "code_template"
                                                                        ]
                                                                    }
                                                                />
                                                            </Card.Body>
                                                        </Card>
                                                        <Form.Label
                                                            column
                                                            sm="5"
                                                            className="d-block"
                                                        >
                                                            Assignment Test
                                                            Settings
                                                        </Form.Label>
                                                        {assignment[
                                                            "test_cases"
                                                        ]?.map(
                                                            (
                                                                test,
                                                                testIndex
                                                            ) => {
                                                                return (
                                                                    <Card
                                                                        className="mb-3"
                                                                        key={
                                                                            testIndex
                                                                        }
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
                                                                addTestCaseClick(
                                                                    index
                                                                )
                                                            }
                                                        >
                                                            Add Test Case
                                                        </Button>
                                                    </>
                                                </Card.Body>
                                            </Card>
                                        )
                                    )}
                                    <Button
                                        variant="primary"
                                        onClick={addAssignmentClick}
                                    >
                                        Add Assignment
                                    </Button>
                                </Card.Body>
                            </Card>
                            <Stack direction="horizontal">
                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="ms-auto"
                                >
                                    Save Post
                                </Button>
                            </Stack>
                        </Form>
                    </div>
                </div>
            </div>
            <div>{JSON.stringify(post)}</div>
        </div>
    );
}
