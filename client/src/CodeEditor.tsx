import Editor from "@monaco-editor/react";
import React, { useRef } from "react";
import * as monaco from "monaco-editor";

interface CodeProps {
	onCode: (data: string) => void;
}

export function CodeEditor(props: CodeProps) {
	function handleEditorChange(
		value: string | undefined,
		event: monaco.editor.IModelContentChangedEvent
	) {
		props.onCode(value || "");
	}
	return (
		<Editor
			height="500px"
			defaultLanguage="python"
			width="90vw"
			defaultValue="# some comment"
			onChange={handleEditorChange}
		/>
	);
}
