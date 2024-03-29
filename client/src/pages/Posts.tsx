import { Button, Stack, Tab, Tabs } from "react-bootstrap";
import { Link } from "react-router-dom";
import Header from "../component/Header";
import { Post } from "../interface";
import PostList from "../component/PostsList";
import { useSearchPostsQuery } from "../features/posts/postsApiSlice";

export default function Posts({ posts }: { posts?: Post[] }) {
    const { data, isLoading, error } = useSearchPostsQuery({
        page: 1,
        limit: 10,
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
                            <Tab eventKey="Posts" title="Tutorial">
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
                        </Tabs>
                        <Link
                            to="/posts/new"
                            className="position-absolute top-0 end-0 btn btn-primary mx-2"
                        >
                            New Tutorial
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
