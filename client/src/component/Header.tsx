import React, { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import {
    Figure,
    ListGroup,
    OverlayTrigger,
    Popover,
    PopoverBody,
    PopoverHeader,
    Stack,
} from "react-bootstrap";
import { selectCurrentToken, setCredentials } from "../features/auth/authSlice";
import jwt_decode from "jwt-decode";
import { IJWT_decode } from "../interface";
import {
    useGoogleLoginMutation,
    useLogoutMutation,
} from "../features/auth/authApiSlice";
import { useDispatch, useSelector } from "react-redux";

export default function Header() {
    const navigate = useNavigate();
    const [login] = useGoogleLoginMutation();
    const dispatch = useDispatch();
    const token = useSelector(selectCurrentToken);
    const [logout] = useLogoutMutation();
    const [name, setName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [picture, setPicture] = useState<string>("");
    const onSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        let target = e.target as HTMLFormElement;
        navigate(`/posts/search?search=${target["search"].value || ""}`);
    };
    document.documentElement.setAttribute("data-color-mode", "light");
    useEffect(() => {
        if (token) {
            let decoded_jwt: IJWT_decode = jwt_decode(token);
            // There are no picture and name in refresh token
            if (name === "" && picture === "") {
                // If logined before
                // Get name and picture from first login token
                setName(decoded_jwt.name);
                setPicture(decoded_jwt.picture);
            }
            setEmail(decoded_jwt.email);
        }
    }, []);
    const googleLogin = useGoogleLogin({
        onSuccess: async ({ code }) => {
            try {
                const { tokens }: { tokens: string } = await login(
                    code
                ).unwrap();
                let decoded_jwt: IJWT_decode = jwt_decode(tokens);
                dispatch(
                    setCredentials({
                        token: tokens,
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
        <Navbar bg="light" expand="lg" className="shadow-sm bg-body rounded">
            <Container fluid>
                <Navbar.Brand href="#">UTAR Open Source</Navbar.Brand>
                <Navbar.Toggle aria-controls="navbarScroll" />
                <Navbar.Collapse id="navbarScroll">
                    <Nav
                        className="me-auto my-2 my-lg-0"
                        style={{ maxHeight: "100px" }}
                        navbarScroll
                    >
                        {token ? (
                            <Nav.Link
                                onClick={() => {
                                    navigate("/posts");
                                }}
                            >
                                Home
                            </Nav.Link>
                        ) : (
                            <Nav.Link href="/about">About</Nav.Link>
                        )}
                    </Nav>
                    <Form className="d-flex" onSubmit={onSearchSubmit}>
                        {token ? (
                            <Stack
                                direction="horizontal"
                                gap={1}
                                style={{ width: "100%" }}
                            >
                                <Form.Control
                                    type="search"
                                    placeholder="Search"
                                    className="me-2"
                                    aria-label="Search"
                                    name="search"
                                />
                                <Button
                                    variant="outline-success ms-auto"
                                    type="submit"
                                >
                                    Search
                                </Button>
                                <OverlayTrigger
                                    trigger="click"
                                    placement="bottom"
                                    overlay={
                                        <Popover>
                                            <PopoverHeader
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                }}
                                            >
                                                <Figure className="d-flex justify-content-center align-items-center">
                                                    <Figure.Image
                                                        className="rounded-circle"
                                                        width={100}
                                                        height={100}
                                                        alt="171x180"
                                                        src={picture}
                                                    />
                                                </Figure>
                                                <p className="text-center mb-0">
                                                    {name}
                                                </p>
                                                <p className="text-center mb-1">
                                                    {email}
                                                </p>
                                            </PopoverHeader>
                                            <PopoverBody
                                                style={{ padding: "0" }}
                                            >
                                                <ListGroup variant="flush">
                                                    <ListGroup.Item
                                                        as="li"
                                                        className="text-center"
                                                        onClick={() => {
                                                            navigate("/posts");
                                                        }}
                                                        style={{
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        Home
                                                    </ListGroup.Item>
                                                    <ListGroup.Item
                                                        as="li"
                                                        className="text-center"
                                                        onClick={() => {
                                                            navigate(
                                                                "/account"
                                                            );
                                                        }}
                                                        style={{
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        My Account
                                                    </ListGroup.Item>
                                                    <ListGroup.Item
                                                        as="li"
                                                        className="text-center"
                                                        style={{
                                                            cursor: "pointer",
                                                        }}
                                                        onClick={async () => {
                                                            try {
                                                                const payload =
                                                                    await logout(
                                                                        ""
                                                                    ).unwrap();
                                                                dispatch(
                                                                    setCredentials(
                                                                        {
                                                                            token: "",
                                                                            user: "",
                                                                        }
                                                                    )
                                                                );
                                                                navigate("/");
                                                            } catch (e) {
                                                                console.error(
                                                                    e
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        Logout Out
                                                    </ListGroup.Item>
                                                </ListGroup>
                                            </PopoverBody>
                                        </Popover>
                                    }
                                >
                                    <a
                                        className="ms-auto"
                                        style={{
                                            cursor: "pointer",
                                            marginLeft: "8px",
                                        }}
                                        onClick={() => {}}
                                    >
                                        <img
                                            src={picture && picture}
                                            className="rounded-circle"
                                            width={40}
                                            height={40}
                                        />
                                    </a>
                                </OverlayTrigger>
                            </Stack>
                        ) : (
                            <Stack direction="horizontal" gap={1}>
                                <Button onClick={googleLogin}>Login</Button>
                            </Stack>
                        )}
                    </Form>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}
