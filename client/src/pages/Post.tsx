import { Key, useEffect } from "react";
import { Button, Card, FloatingLabel, Form, Stack } from "react-bootstrap";
import { json, Link, useParams } from "react-router-dom";
import Code from "../component/Editor/Code";
import Header from "../component/Header";
import MarkdownPreview from "../component/MarkdownPreview";
import { useViewPostQuery } from "../features/posts/postsApiSlice";
import { Post } from "../interface";

export default function Posts() {
    const { id } = useParams<{ id: string }>();
    const { data, isLoading }: { data?: Post; isLoading: boolean } =
        useViewPostQuery(id || "");
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
                                )
                            )}
                        </Card>
                    )
                )}
            </div>
        </div>
    );
}
