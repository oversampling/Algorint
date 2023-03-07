import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";

interface CodeProps {
    onCode: (data: string, language: string, index?: number) => void;
    index?: number;
    language: string;
}
export default function Code(props: CodeProps) {
    function handleEditorChange(
        value: string | undefined,
        event: monaco.editor.IModelContentChangedEvent
    ) {
        props.onCode(value || "", props.language, props.index);
    }
    return (
        <Editor
            height="500px"
            defaultLanguage="python"
            width="100%"
            language={
                props.language === "nodejs" ? "javascript" : props.language
            }
            onChange={handleEditorChange}
        />
    );
}
