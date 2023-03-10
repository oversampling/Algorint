import { Stack } from "react-bootstrap";
import { Link } from "react-router-dom";
import Header from "../component/Header";

export default function Posts() {
    return (
        <div>
            <Header />
            <div style={{ margin: 15 }}>
                <Stack direction="horizontal" gap={3}>
                    <div className="fw-light fs-4">Public Post</div>
                    <Link to={"new"} className="btn btn-primary ms-auto">
                        New
                    </Link>
                </Stack>
            </div>
        </div>
    );
}
