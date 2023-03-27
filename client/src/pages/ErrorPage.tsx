import { Card } from "react-bootstrap";
import Header from "../component/Header";

export default function ErrorPage() {
    return (
        <div>
            <Header />
            <div className="d-flex justify-content-center mt-5">
                <Card
                    bg={"Danger"}
                    text={"white"}
                    style={{ width: "50%" }}
                    className="mb-2"
                >
                    <Card.Header>
                        <h1>Something Went Wrong</h1>
                    </Card.Header>
                    <Card.Body>
                        <h2>Page Not Found</h2>
                        <p>
                            We're sorry, if you found abnormal behavior please
                            contact us or raise issue in GitHub repository.
                        </p>
                        <p>
                            <a href="https://github.com/chan1992241/Algorint">
                                https://github.com/chan1992241/Algorint
                            </a>
                        </p>
                        <a href="/" className="btn btn-primary">
                            Go to Home Page
                        </a>
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
}
