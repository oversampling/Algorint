import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import New from "./pages/New";
import "bootstrap/dist/css/bootstrap.min.css";
import Posts from "./pages/Posts";
import ErrorPage from "./pages/ErrorPage";
import Post from "./pages/Post";
import SearchPosts from "./pages/SearchPosts";
import Home from "./pages/Home";
import { GoogleOAuthProvider } from "@react-oauth/google";
import RequireAuth from "./features/auth/RequireAuth";
import { Provider } from "react-redux";
import { store } from "./app/store";

const router = createBrowserRouter([
    {
        path: "/posts",
        errorElement: <ErrorPage />,
        element: <RequireAuth />,
        children: [
            {
                path: "",
                element: <Posts />,
            },
            {
                path: ":id",
                element: <Post />,
            },
            {
                path: "new",
                element: <New />,
            },
            {
                path: "search",
                element: <SearchPosts />,
            },
        ],
    },
    {
        path: "/",
        element: <Home />,
        errorElement: <ErrorPage />,
    },
    {
        path: "/404",
        element: <ErrorPage />,
    },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <Provider store={store}>
        <GoogleOAuthProvider clientId="912051958375-ja2q860ntc18iu1rvhsdpr8oi2n5qnku.apps.googleusercontent.com">
            <RouterProvider router={router} />
        </GoogleOAuthProvider>
    </Provider>
);
