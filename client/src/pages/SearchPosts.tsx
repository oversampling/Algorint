import { Stack, Tab, Tabs } from "react-bootstrap";
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
            <div className="container mt-3">
                <div className="row justify-content-center">
                    <div className="col-8 position-relative">
                        <Tabs
                            defaultActiveKey="Posts"
                            id="uncontrolled-tab-example"
                            className="mb-3"
                        >
                            <Tab eventKey="Posts" title="Posts">
                                {isLoading ? (
                                    <div
                                        className="spinner-border text-primary position-absolute top-50 start-50"
                                        role="status"
                                    >
                                        <span className="visually-hidden">
                                            Loading...
                                        </span>
                                    </div>
                                ) : (
                                    data && <PostList posts={data} />
                                )}
                            </Tab>
                            <Tab eventKey="Assignments" title="Assignments">
                                <div>Under Development</div>
                            </Tab>
                        </Tabs>
                        <Link
                            to="/posts/new"
                            className="position-absolute top-0 end-0 btn btn-primary mx-2"
                        >
                            New Post
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
