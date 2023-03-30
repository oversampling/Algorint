import { Card, Stack } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Post } from "../interface";
import Badge from "react-bootstrap/Badge";
import { useDeleteAccountPostMutation } from "../features/posts/postsApiSlice";
import { useEffect, useState } from "react";
export default function PostList({
    posts,
    isAccountPosts,
}: {
    posts?: Post[];
    isAccountPosts?: boolean;
}) {
    const [deleteAccountPost] = useDeleteAccountPostMutation();
    const [postList, setPostList] = useState<Post[]>([]);
    async function deletePostClick(post_id: string) {
        try {
            await deleteAccountPost(post_id).unwrap();
            setPostList(postList.filter((post) => post._id !== post_id));
        } catch (err) {
            console.error(err);
        }
    }
    useEffect(() => {
        setPostList(posts || []);
    }, [posts]);
    return (
        <div>
            {postList.length !== 0 ? (
                postList.map(
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
                                            {post.assignments.length > 0 && (
                                                <Badge
                                                    bg="info"
                                                    className="mx-1"
                                                >
                                                    {post.assignments.length}{" "}
                                                    Assignments
                                                </Badge>
                                            )}
                                            {isAccountPosts && (
                                                <Badge
                                                    bg={
                                                        post.isPublic
                                                            ? "success"
                                                            : "secondary"
                                                    }
                                                    className="mx-1"
                                                >
                                                    {post.isPublic
                                                        ? "Public"
                                                        : "Private"}
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
                                            className="btn btn-primary mx-1"
                                        >
                                            View
                                        </Link>
                                        {isAccountPosts && (
                                            <>
                                                <Link
                                                    to={`/posts/edit`}
                                                    className="btn btn-success mx-1"
                                                >
                                                    Edit
                                                </Link>
                                                <Link
                                                    // variant="danger"
                                                    to={"/account"}
                                                    className="btn btn-danger mx-1"
                                                    onClick={() => {
                                                        post._id &&
                                                            deletePostClick(
                                                                post._id
                                                            );
                                                    }}
                                                >
                                                    Delete
                                                </Link>
                                            </>
                                        )}
                                        <div className="ms-auto text-muted">
                                            {post.publishDate &&
                                                `${
                                                    new Date(post.publishDate)
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
                )
            ) : (
                <div className="text-center text-muted">No Post Found</div>
            )}
        </div>
    );
}
