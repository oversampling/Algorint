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

const router = createBrowserRouter([
    {
        path: "/posts",
        errorElement: <ErrorPage />,
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
        element: <App />,
    },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <RouterProvider router={router} />
);
