import { Stack } from "react-bootstrap";
import { Link } from "react-router-dom";
import Header from "../component/Header";
import useFetch from "../hooks/useFetch";
import { Post } from "../interface";
import PostList from "../component/PostsList";

export default function Posts({ posts }: { posts?: Post[] }) {
    const url = "http://localhost:3000";
    const [data, loading] = useFetch<Post[]>(
        `${url}/api/posts?page=1`,
        "GET",
        {}
    );
    return (
        <div>
            <Header />
            <div style={{ margin: 15 }}>
                <Stack direction="horizontal" gap={3} className="mb-3">
                    <div className="fw-light fs-4">Public Post</div>
                    <Link to={"/posts/new"} className="btn btn-primary ms-auto">
                        New
                    </Link>
                </Stack>
                {loading ? (
                    <div
                        className="spinner-border text-primary position-absolute top-50 start-50"
                        role="status"
                    >
                        <span className="visually-hidden">Loading...</span>
                    </div>
                ) : (
                    data && <PostList posts={data} />
                )}
            </div>
        </div>
    );
}
