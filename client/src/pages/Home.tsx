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
                            <h1 className="">
                                Tutorial and Learning Platform With Automatic
                                Marking Capability
                            </h1>
                            <p className="">
                                A tutorial and learning platform with automatic
                                marking capability is an educational tool that
                                combines online course content with automated
                                assessment and feedback capabilities. This
                                platform is designed to provide a more efficient
                                and effective learning experience for students,
                                instructors, and educators alike.
                            </p>
                            <div className="">
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
                                <h2 className="my-3">Effective Learning</h2>
                                The platform provide interactive and engaging
                                content that is designed to keep students
                                motivated and focused.The platform should be
                                designed to provide a personalized learning
                                experience, tailored to the individual needs and
                                learning styles of each student.
                                <h2 className="my-3">Flexible</h2>
                                Students can access the platform at any time,
                                from anywhere with an internet connection,
                                allowing them to learn at their own pace and on
                                their own schedule. The platform also provides a
                                range of assessment and feedback tools, allowing
                                students to test their understanding of the
                                material and receive feedback on their progress.
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
                                    <div>
                                        Welcome to contribute at our GitHub
                                        <div>
                                            <a href="https://github.com/chan1992241/Algorint">
                                                https://github.com/chan1992241/Algorint
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
