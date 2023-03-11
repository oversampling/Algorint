import React, { useState } from "react";
import MarkdownEditor from "@uiw/react-markdown-editor";
import ReactDOM from "react-dom";

interface MarkdownProps {
    onChange?: (value: string, index?: number) => void;
    index?: number;
    value?: string;
}

export default function Markdown(props: MarkdownProps) {
    const [markdown, setMarkdown] = useState<string>("");
    document.documentElement.setAttribute("data-color-mode", "light");
    function onChange(value: string) {
        setMarkdown(value);
        props.onChange && props.onChange(value, props.index);
    }
    return (
        <MarkdownEditor
            value={props.value || ""}
            onChange={onChange}
            height="300"
            style={{ height: "300px" }}
        />
    );
}
