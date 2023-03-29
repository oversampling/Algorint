import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { useEffect, useState } from "react";

interface CodeProps {
    onCode?: (data: string, language: string, index?: number) => void;
    index?: number;
    language: string;
    value?: string;
}
export default function Code(props: CodeProps) {
    const [editorValue, setEditorValue] = useState<string>("");
    function handleEditorChange(
        value: string | undefined,
        event: monaco.editor.IModelContentChangedEvent
    ) {
        props.onCode && props.onCode(value || "", props.language, props.index);
        setEditorValue(value || "");
    }
    useEffect(() => {
        setEditorValue(props.value || "");
    }, [props.value]);
    return (
        <Editor
            height="500px"
            value={editorValue}
            width="100%"
            language={
                props.language === "nodejs" ? "javascript" : props.language
            }
            onChange={handleEditorChange}
        />
    );
}
