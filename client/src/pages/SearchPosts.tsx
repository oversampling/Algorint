import { Stack } from "react-bootstrap";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Header from "../component/Header";
import useFetch from "../hooks/useFetch";
import { Post } from "../interface";
import PostList from "../component/PostsList";
import { useState } from "react";
import { useSearchPostsQuery } from "../features/posts/postsApiSlice";

export default function SearchPosts() {
    let [searchParams, setSearchParams] = useSearchParams();
    const search = searchParams.get("search");
    const { data, isLoading }: { data?: Post[]; isLoading: boolean } =
        useSearchPostsQuery({
            page: 1,
            limit: 10,
            search: search || "",
        });
    return (
        <div>
            <Header />
            <>
                <div style={{ margin: 15 }}>
                    <Stack direction="horizontal" gap={3} className="mb-3">
                        <div className="fw-light fs-4">Public Post</div>
                        <Link
                            to={"/posts/new"}
                            className="btn btn-primary ms-auto"
                        >
                            New
                        </Link>
                    </Stack>
                    {isLoading ? (
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
            </>
        </div>
    );
}
