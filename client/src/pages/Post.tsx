import { useEffect } from "react";
import { Button, Card, FloatingLabel, Form, Stack } from "react-bootstrap";
import { json, Link, useParams } from "react-router-dom";
import Code from "../component/Editor/Code";
import Markdown from "../component/Editor/Markdown";
import Header from "../component/Header";
import useFetch from "../hooks/useFetch";
import { Post } from "../interface";

export default function Posts() {
    const url = "http://localhost:3000";
    const { id } = useParams<{ id: string }>();
    const [data, loading] = useFetch<Post>(`${url}/api/posts/${id}`, "GET", "");
    console.log(data);
    return (
        <div>
            <Header />
            <div style={{ margin: 15 }}>
                <Stack direction="horizontal" gap={3} className="mb-3">
                    <div className="fw-light fs-4">Post</div>
                    <Link to={"new"} className="btn btn-primary ms-auto">
                        New
                    </Link>
                </Stack>
                {loading ? (
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
                                <Markdown value={`${data["description"]}`} />
                            </Card.Body>
                            {data["assignments"].map((assignment, index) => (
                                <Form>
                                    <Card style={{ margin: 15 }} key={index}>
                                        <Card.Header>
                                            Assignment {index + 1}
                                        </Card.Header>
                                        <Card.Body>
                                            <div className="mb-3">
                                                <Form.Label>
                                                    Assignment Question
                                                </Form.Label>
                                                <Markdown
                                                    value={
                                                        assignment["question"]
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
                                                            language={
                                                                assignment[
                                                                    "language"
                                                                ]
                                                            }
                                                            index={index}
                                                            value={
                                                                assignment[
                                                                    "code_template"
                                                                ]
                                                            }
                                                        />
                                                    </Card.Body>
                                                </Card>
                                            </div>
                                            <FloatingLabel
                                                controlId="floatingTextarea2"
                                                label="Execution Result"
                                                className="mb-3"
                                            >
                                                <Form.Control
                                                    as="textarea"
                                                    placeholder="Leave a comment here"
                                                    style={{ height: "100px" }}
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
                                                        type="submit"
                                                    >
                                                        Execute
                                                    </Button>
                                                    <Button
                                                        variant="primary"
                                                        type="submit"
                                                    >
                                                        Submit
                                                    </Button>
                                                </Stack>
                                            </Stack>
                                        </Card.Body>
                                    </Card>
                                </Form>
                            ))}
                        </Card>
                    )
                )}
            </div>
        </div>
    );
}
