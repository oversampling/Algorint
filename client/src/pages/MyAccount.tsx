import { useEffect, useState } from "react";
import { Tab, Tabs } from "react-bootstrap";
import { Link } from "react-router-dom";
import Header from "../component/Header";
import PostList from "../component/PostsList";
import { useFetchAccountPostsMutation } from "../features/posts/postsApiSlice";
import { Post } from "../interface";

export default function MyAccount() {
    const [fetchAccountPosts] = useFetchAccountPostsMutation();
    const [posts, setPosts] = useState<Post[]>([]);
    useEffect(() => {
        const fetchPosts = async () => {
            const payload = await fetchAccountPosts("").unwrap();
            setPosts(payload);
        };
        fetchPosts();
    }, []);
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
                            <Tab eventKey="Posts" title="My Tutorial">
                                {posts && (
                                    <PostList
                                        posts={posts}
                                        isAccountPosts={true}
                                    />
                                )}
                            </Tab>
                            <Tab eventKey="Assignments" title="My Assignments">
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
