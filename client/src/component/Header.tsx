import React from "react";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { Stack } from "react-bootstrap";
import { setCredentials } from "../features/auth/authSlice";
import jwt_decode from "jwt-decode";
import { IJWT_decode } from "../interface";
import { useGoogleLoginMutation } from "../features/auth/authApiSlice";
import { useDispatch } from "react-redux";

export default function Header() {
    const navigate = useNavigate();
    const [login] = useGoogleLoginMutation();
    const dispatch = useDispatch();
    const onSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        let target = e.target as HTMLFormElement;
        navigate(`/posts/search?search=${target["search"].value || ""}`);
    };
    document.documentElement.setAttribute("data-color-mode", "light");
    const googleLogin = useGoogleLogin({
        onSuccess: async ({ code }) => {
            try {
                const tokens = await login(code).unwrap();
                let decoded_jwt: IJWT_decode = jwt_decode(tokens.id_token);
                dispatch(
                    setCredentials({
                        token: tokens.id_token,
                        user: decoded_jwt.name,
                    })
                );
                navigate("/posts");
            } catch (e) {
                console.error(e);
            }
        },
        flow: "auth-code",
        onError: (error) => {
            navigate("/404");
        },
    });
    return (
        <Navbar bg="light" expand="lg">
            <Container fluid>
                <Navbar.Brand href="#">UTAR Open Source</Navbar.Brand>
                <Navbar.Toggle aria-controls="navbarScroll" />
                <Navbar.Collapse id="navbarScroll">
                    <Nav
                        className="me-auto my-2 my-lg-0"
                        style={{ maxHeight: "100px" }}
                        navbarScroll
                    >
                        <Nav.Link href="#action1">About</Nav.Link>
                    </Nav>
                    <Form className="d-flex" onSubmit={onSearchSubmit}>
                        <Stack direction="horizontal" gap={1}>
                            <Form.Control
                                type="search"
                                placeholder="Search"
                                className="me-2"
                                aria-label="Search"
                                name="search"
                            />
                            <Button variant="outline-success" type="submit">
                                Search
                            </Button>
                            <Button onClick={googleLogin}>Login</Button>
                        </Stack>
                    </Form>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}
