import React, { useState } from "react";
import { CodeEditor } from "./CodeEditor";
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import Button from "react-bootstrap/Button";
import "bootstrap/dist/css/bootstrap.min.css";
import { FloatingLabel, Form } from "react-bootstrap";
import axios from "axios";
import Alert from "react-bootstrap/Alert";

self.MonacoEnvironment = {
	getWorker(_, label) {
		if (label === "json") {
			return new jsonWorker();
		}
		if (label === "css" || label === "scss" || label === "less") {
			return new cssWorker();
		}
		if (label === "html" || label === "handlebars" || label === "razor") {
			return new htmlWorker();
		}
		if (label === "typescript" || label === "javascript") {
			return new tsWorker();
		}
		return new editorWorker();
	},
};
loader.config({ monaco });

function App() {
	async function handleSubmit(e: React.FormEvent) {
		let url = "http://localhost/make_submission";
		e.preventDefault();
		const result = await axios.post(url, {
			language: "python",
			code: code,
			test_cases: [output],
			input: [input],
		});
		fetchSubmission(result.data);
	}
	async function fetchSubmission(token: string) {
		let url = `http://localhost/retrieve_submission/${token}`;
		const result = await axios.get(url);
		console.log(result);
		let status = result.data.status;
		if (status === "pending") {
			setTimeout(async () => {
				const result = await axios.get(url);
				console.log(result);
				let exeout: {
					stdout: [string];
					stderr: [string];
					result: [boolean];
				} = {
					stdout: result.data.stdout,
					stderr: result.data.stderr,
					result: result.data.result,
				};
				setExeout(exeout);
			}, 3000);
		}
	}
	const [exeout, setExeout] = useState<{
		stdout: [string];
		stderr: [string];
		result: [boolean];
	}>();
	const [code, setCode] = useState<string>("");
	function handleCode(childCode: string) {
		setCode(childCode);
	}
	let input = "4 \n57 57 -57 57";
	let output = "-57";
	return (
		<div className="App">
			<form onSubmit={handleSubmit}>
				<h1>Question: How to get second largest element from array</h1>
				<FloatingLabel controlId="floatingTextarea2" label="Sample Input">
					<Form.Control
						as="textarea"
						value={input}
						readOnly
						style={{ height: "100px" }}
					/>
				</FloatingLabel>
				<FloatingLabel controlId="floatingTextarea2" label="Sample Output">
					<Form.Control
						as="textarea"
						readOnly
						value={output}
						style={{ height: "100px" }}
					/>
				</FloatingLabel>
				<h2>Enter your code</h2>
				<CodeEditor onCode={handleCode} />
				{exeout &&
					exeout["result"].map((result, index) => {
						return (
							<TestCasesOutput
								key={index}
								stdout={exeout["stdout"][index]}
								result={result}
								no={index + 1}
								stderr={exeout["stderr"][index]}
							/>
						);
					})}
				<Button variant="primary" type="submit">
					Submit Code
				</Button>
			</form>
		</div>
	);
}

interface TestCaseProps {
	stdout: string;
	stderr: string;
	result: boolean;
	no: number;
	key: number;
}

function TestCasesOutput(props: TestCaseProps) {
	return (
		<>
			{props.result ? (
				<div>
					<Alert key="primary" variant="primary">
						Test Case {props.no}
					</Alert>
					<FloatingLabel
						controlId="floatingTextarea"
						label="Stdout"
						className="mb-3"
					>
						<Form.Control
							as="textarea"
							placeholder="Leave a comment here"
							value={props.stdout}
							readOnly
						/>
					</FloatingLabel>
				</div>
			) : (
				<div>
					<Alert key="danger" variant="danger">
						Test Case {props.no}
					</Alert>
					<FloatingLabel
						controlId="floatingTextarea"
						label="Stderr"
						className="mb-3"
					>
						<Form.Control
							as="textarea"
							placeholder="Leave a comment here"
							value={props.stdout}
							readOnly
						/>
					</FloatingLabel>
				</div>
			)}
		</>
	);
}

export default App;
