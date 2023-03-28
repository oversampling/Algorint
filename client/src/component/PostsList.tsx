import { Card, Stack } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Post } from "../interface";
import Showdown from "showdown";
import Badge from "react-bootstrap/Badge";
export default function PostList({ posts }: { posts?: Post[] }) {
    const showdown = Showdown,
        converter = new showdown.Converter();
    return (
        <div>
            {posts && (
                <div>
                    {posts &&
                        posts.map(
                            (post, index) =>
                                post._id && (
                                    <Card
                                        className="mb-3 shadow-sm bg-body rounded border-0"
                                        key={index}
                                    >
                                        <Card.Header>
                                            <Stack direction="horizontal">
                                                <div>
                                                    <span className="fw-light fs-4">
                                                        {post.title}
                                                    </span>
                                                    {post.assignments.length >
                                                        0 && (
                                                        <Badge
                                                            bg="info"
                                                            className="mx-1"
                                                        >
                                                            {
                                                                post.assignments
                                                                    .length
                                                            }{" "}
                                                            Assignments
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="ms-auto">
                                                    {post.stars}{" "}
                                                    <span className="mx-1">
                                                        <i className="fa-duotone fa-caret-up fa-xl"></i>
                                                    </span>
                                                </div>
                                            </Stack>
                                        </Card.Header>
                                        <Card.Body>
                                            <Stack direction="horizontal">
                                                <Link
                                                    to={`/posts/${post._id}`}
                                                    className="btn btn-primary"
                                                >
                                                    View
                                                </Link>
                                                <div className="ms-auto text-muted">
                                                    {post.publishDate &&
                                                        `${
                                                            new Date(
                                                                post.publishDate
                                                            )
                                                                .toISOString()
                                                                .split("T")[0]
                                                        } ${new Date(
                                                            post.publishDate
                                                        ).getHours()}:${new Date(
                                                            post.publishDate
                                                        ).getMinutes()}`}
                                                </div>
                                            </Stack>
                                        </Card.Body>
                                    </Card>
                                )
                        )}
                </div>
            )}
        </div>
    );
}
