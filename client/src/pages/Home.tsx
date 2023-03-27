import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Header from "../component/Header";

export default function Home() {
    const navigate = useNavigate();
    return (
        <div>
            <Header />
            <div style={{ margin: 15 }}>
                <div className="container" style={{ marginTop: "80px" }}>
                    <div className="row justify-content-center">
                        <div className="col-7">
                            <h1 className="text-center m-3">
                                Computer Science and Information System
                                Community
                            </h1>
                            <div className="d-flex justify-content-center">
                                <Button
                                    onClick={() => {
                                        navigate("/posts");
                                    }}
                                >
                                    Explore More
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ marginTop: "100px" }}>
                    <div className="container">
                        <div className="row">
                            <div className="col-8">
                                <h2 className="my-3">
                                    Data Structure And Algorithms
                                </h2>
                                UTAR Open Source is an open source foundation
                                dedicated to teaching data structures and
                                algorithms to students and developers of all
                                levels. We believe that understanding
                                fundamental concepts like data structures and
                                algorithms is essential for becoming a skilled
                                programmer, and we strive to make this knowledge
                                accessible to everyone.
                                <h2 className="my-3">Software Development</h2>
                                Our mission is to make software development
                                education accessible to anyone with an internet
                                connection. We believe that the ability to write
                                code is a valuable skill that can transform
                                lives and open up new opportunities.
                            </div>
                            <div className="col-4">
                                <h2>Recent News</h2>
                                <div className="border-0 shadow-sm p-3 mb-5 bg-body rounded">
                                    <h4 className="fw-normal">
                                        40% Development Status
                                    </h4>
                                    <p className="text-muted">28 March 2023</p>
                                    <p>
                                        UTAR open source had been develop 40%
                                        and is expected to available to use in
                                        20 April 2023
                                    </p>
                                    <p>
                                        Welcome to contribute at our GitHub
                                        <div>
                                            <a href="https://github.com/chan1992241/Algorint">
                                                https://github.com/chan1992241/Algorint
                                            </a>
                                        </div>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
