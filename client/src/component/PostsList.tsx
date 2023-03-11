import { Card, Stack } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Post } from "../interface";
import parse from "html-react-parser";
import Showdown from "showdown";
export default function PostList({ posts }: { posts?: Post[] }) {
    const showdown = Showdown,
        converter = new showdown.Converter();
    posts?.map((post) => {
        if (post.publishDate) {
            post.publishDate = new Date(post.publishDate);
        }
    });
    return (
        <div>
            {posts && (
                <div>
                    {posts &&
                        posts.map(
                            (post, index) =>
                                post._id && (
                                    <Card className="mb-3" key={index}>
                                        <Card.Header>
                                            <Stack direction="horizontal">
                                                <div className="fw-light fs-4 ">
                                                    {post.title}
                                                </div>
                                                <div className="ms-auto">
                                                    {post.stars}{" "}
                                                    <i className="fa-regular fa-star"></i>
                                                </div>
                                            </Stack>
                                        </Card.Header>
                                        <Card.Body>
                                            <div>
                                                <div>
                                                    {parse(
                                                        converter.makeHtml(
                                                            post.description
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                            <Stack direction="horizontal">
                                                <Link
                                                    to={`/posts/${post._id}`}
                                                    className="btn btn-primary"
                                                >
                                                    View
                                                </Link>
                                                <div className="ms-auto">
                                                    {post.publishDate &&
                                                        `${
                                                            post.publishDate
                                                                .toISOString()
                                                                .split("T")[0]
                                                        } ${post.publishDate.getHours()}:${post.publishDate.getMinutes()}`}
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
