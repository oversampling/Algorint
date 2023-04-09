import Header from "../component/Header";
import {
    Button,
    Card,
    Col,
    FloatingLabel,
    Form,
    Row,
    Stack,
} from "react-bootstrap";
import Code from "../component/Editor/Code";
import { useNavigate, useParams } from "react-router-dom";
import { Assignment, Post, Test_Case } from "../interface";
import {
    useUpdateAccountPostMutation,
    useViewPostQuery,
} from "../features/posts/postsApiSlice";
import Markdown from "../component/Editor/Markdown";
import { useEffect, useState } from "react";

export default function EditPost() {
    const { id } = useParams<{ id: string }>();
    const [post, setPost] = useState<Post>({} as Post);
    const [assingmentList, setAssignmentList] = useState<Assignment[]>([]);
    const navigate = useNavigate();
    const { data, isLoading }: { data?: any; isLoading: boolean } =
        useViewPostQuery(id || "");
    const [updateAccountPost] = useUpdateAccountPostMutation();
    useEffect(() => {
        const newData = { ...data };
        if (newData) {
            const assignmentList: Assignment[] = [];
            if (newData.assignments !== undefined) {
                for (let i = 0; i < newData.assignments.length; i++) {
                    const testCases: Test_Case[] = [];
                    for (
                        let j = 0;
                        j < newData.assignments[i].test_cases.length;
                        j++
                    ) {
                        const replace: { from: string; to: string }[] = [];
                        for (
                            let k = 0;
                            k <
                            newData.assignments[i].test_cases[j].replace.length;
                            k++
                        ) {
                            const obj = {
                                from: atob(
                                    newData.assignments[i].test_cases[j]
                                        .replace[k][0].from
                                ),
                                to: atob(
                                    newData.assignments[i].test_cases[j]
                                        .replace[k][0].to
                                ),
                            };
                            replace.push(obj);
                        }
                        const testCase: Test_Case = {
                            _id: newData.assignments[i].test_cases[j]._id,
                            replace: replace,
                            stdin: atob(
                                newData.assignments[i].test_cases[j].stdin
                            ),
                            stdout: atob(
                                newData.assignments[i].test_cases[j].stdout
                            ),
                        };
                        testCases.push(testCase);
                    }
                    const assignment: Assignment = {
                        _id: newData.assignments[i]._id,
                        question: atob(newData.assignments[i].question),
                        code_template: atob(
                            newData.assignments[i].code_template
                        ),
                        language: newData.assignments[i].language,
                        test_cases: testCases,
                    };
                    assignmentList.push(assignment);
                }
            }
            const post: Post = {
                _id: newData._id,
                title: atob(newData.title || ""),
                description: atob(newData.description || ""),
                isPublic: newData.isPublic || false,
                assignments: newData.assignments || [],
            };
            setPost(post);
            setAssignmentList(assignmentList);
        } else {
            navigate("/404");
        }
    }, [isLoading]);
    function handlePostChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target;
        if (name === "isPublic") {
            const label = document.querySelector("label[for='isPublic']");
            if (label !== null) {
                e.target.checked
                    ? (label.innerHTML = "Public")
                    : (label.innerHTML = "Private");
            }
            setPost({ ...post, [name]: e.target.checked });
        } else {
            setPost({ ...post, [name]: value });
        }
    }
    function addAssignmentClick() {
        const newAssignment: Assignment = {} as Assignment;
        assingmentList === undefined
            ? setAssignmentList([newAssignment])
            : setAssignmentList([...assingmentList, newAssignment]);
    }
    function addTestCaseClick(assignment_index: number) {
        const list: Assignment[] = [...assingmentList];
        list[assignment_index]["test_cases"] === undefined
            ? (list[assignment_index]["test_cases"] = [
                  { replace: [{ from: "", to: "" }], stdin: "", stdout: "" },
              ])
            : list[assignment_index]["test_cases"].push({
                  replace: [{ from: "", to: "" }],
                  stdin: "",
                  stdout: "",
              });
        setAssignmentList(list);
        setPost({ ...post, assignments: list });
    }
    function handlePostDescriptionChange(value: string) {
        setPost({ ...post, description: value });
    }
    function handleAssignmentQuestionChange(value: string, index?: number) {
        if (index != undefined) {
            const list: Assignment[] = [...assingmentList];
            list[index]["question"] = value;
            setAssignmentList(list);
            setPost({ ...post, assignments: list });
        }
    }
    function onCodeChange(data: string, language: string, index?: number) {
        if (index != undefined) {
            const list: Assignment[] = [...assingmentList];
            list[index]["code_template"] = data;
            setAssignmentList(list);
            setPost({ ...post, assignments: list });
        }
    }
    function onLanguageChange(
        e: React.ChangeEvent<HTMLSelectElement>,
        index: number
    ) {
        const { name, value } = e.target;
        const list: Assignment[] = [...assingmentList];
        if (list[index] !== undefined) {
            list[index]["language"] = value;
            list[index]["code_template"] = "";
        }
        setAssignmentList(list);
        setPost({ ...post, assignments: list });
    }
    function onTestCasesChange(
        e: React.ChangeEvent<any>,
        index: number,
        testIndex: number,
        replaceIndex?: number
    ) {
        const obj: { name: string; value: string } = e.target;
        const { name, value } = obj;
        const list: Assignment[] = [...assingmentList];
        if (name === "from" || name === "to") {
            if (replaceIndex !== undefined) {
                list[index]["test_cases"][testIndex]["replace"][replaceIndex][
                    name
                ] = value;
            }
        } else if (name === "stdin" || name === "stdout") {
            list[index]["test_cases"][testIndex][name] = value;
        }
        setAssignmentList(list);
        setPost({ ...post, assignments: list });
    }
    function addReplace(testIndex: number, assignment_index: number) {
        const list: Assignment[] = [...assingmentList];
        list[assignment_index]["test_cases"][testIndex]["replace"].push({
            from: "",
            to: "",
        });
        setAssignmentList(list);
        setPost({ ...post, assignments: list });
    }
    function removeReplace(
        testIndex: number,
        assignment_index: number,
        replaceIndex: number
    ) {
        const list: Assignment[] = [...assingmentList];
        list[assignment_index]["test_cases"][testIndex]["replace"].splice(
            replaceIndex,
            1
        );
        setAssignmentList(list);
        setPost({ ...post, assignments: list });
    }
    async function updatePost(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (post.title === undefined || post.title === "") {
            alert("Title is required");
            return;
        }
        if (post.isPublic === undefined) {
            post["isPublic"] = false;
        }
        if (post.description === undefined || post.description === "") {
            alert("Description is required");
            return;
        }
        if (post.assignments === undefined) {
            post["assignments"] = [];
        } else {
            for (let i = 0; i < post.assignments.length; i++) {
                if (post.assignments[i].question === undefined) {
                    alert("Question is required");
                    return;
                }
                if (post.assignments[i].code_template === undefined) {
                    alert("Code Template is required");
                    return;
                }
                if (post.assignments[i].language === undefined) {
                    post.assignments[i].language = "python";
                    return;
                }
                if (post.assignments[i].test_cases === undefined) {
                    post.assignments[i].test_cases = [
                        {
                            stdin: "",
                            stdout: "",
                            replace: [{ from: "", to: "" }],
                        },
                    ];
                    return;
                }
            }
        }
        // Encode data to base64
        const postToUpdate: Post = { ...post };
        postToUpdate.description = btoa(post.description);
        postToUpdate.title = btoa(post.title);
        const assingmentListToUpdate: Assignment[] = [...assingmentList];
        for (let i = 0; i < assingmentListToUpdate.length; i++) {
            assingmentListToUpdate[i].question = btoa(
                assingmentListToUpdate[i].question
            );
            assingmentListToUpdate[i].code_template = btoa(
                assingmentListToUpdate[i].code_template
            );
            for (
                let j = 0;
                j < assingmentListToUpdate[i].test_cases.length;
                j++
            ) {
                assingmentListToUpdate[i].test_cases[j].stdin = btoa(
                    assingmentListToUpdate[i].test_cases[j].stdin
                );
                assingmentListToUpdate[i].test_cases[j].stdout = btoa(
                    assingmentListToUpdate[i].test_cases[j].stdout
                );
                if (
                    assingmentListToUpdate[i].test_cases[j].replace ===
                    undefined
                ) {
                    assingmentListToUpdate[i].test_cases[j].replace = [
                        {
                            from: "",
                            to: "",
                        },
                    ];
                } else {
                    for (
                        let k = 0;
                        k <
                        assingmentListToUpdate[i].test_cases[j].replace.length;
                        k++
                    ) {
                        if (
                            assingmentListToUpdate[i].test_cases[j].replace[
                                k
                            ] === undefined
                        ) {
                            assingmentListToUpdate[i].test_cases[j].replace[k] =
                                {
                                    from: "",
                                    to: "",
                                };
                        }
                        if (
                            assingmentListToUpdate[i].test_cases[j].replace[k]
                                .from === undefined
                        ) {
                            assingmentListToUpdate[i].test_cases[j].replace[
                                k
                            ].from = "";
                        }
                        if (
                            assingmentListToUpdate[i].test_cases[j].replace[k]
                                .to === undefined
                        ) {
                            assingmentListToUpdate[i].test_cases[j].replace[
                                k
                            ].to = "";
                        }
                        assingmentListToUpdate[i].test_cases[j].replace[
                            k
                        ].from = btoa(
                            assingmentListToUpdate[i].test_cases[j].replace[k]
                                .from
                        );
                        assingmentListToUpdate[i].test_cases[j].replace[k].to =
                            btoa(
                                assingmentListToUpdate[i].test_cases[j].replace[
                                    k
                                ].to
                            );
                    }
                }
            }
        }
        postToUpdate.assignments = assingmentListToUpdate;
        const data = await updateAccountPost(postToUpdate).unwrap();
        navigate(`/posts/${data._id}`);
    }
    return (
        <div>
            <Header />
            <div className="container mt-3">
                <div className="row justify-content-center">
                    <div className="col-8">
                        <Form onSubmit={updatePost}>
                            <Card className="shadow-sm bg-body rounded border-0 mb-2">
                                <Card.Header>
                                    <Stack direction="horizontal" gap={3}>
                                        <div>New Post</div>
                                        <Form.Check
                                            className="ms-auto"
                                            type="switch"
                                            id="isPublic"
                                            name="isPublic"
                                            label={`Private`}
                                            defaultChecked={
                                                post.isPublic ? true : false
                                            }
                                            onChange={handlePostChange}
                                        />
                                    </Stack>
                                </Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Post Title</Form.Label>
                                        <Form.Control
                                            type="text"
                                            maxLength={100}
                                            required
                                            name="title"
                                            onChange={handlePostChange}
                                            value={post.title || ""}
                                            placeholder="Enter Tutorial Title"
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Description</Form.Label>
                                        <Markdown
                                            onChange={
                                                handlePostDescriptionChange
                                            }
                                            value={post.description || ""}
                                        />
                                    </Form.Group>
                                    {assingmentList?.map(
                                        (assignment, index) => (
                                            <Card
                                                className="mb-3"
                                                key={index + 1}
                                            >
                                                <Card.Header>
                                                    Assignment {index + 1}
                                                </Card.Header>
                                                <Card.Body>
                                                    <>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label>
                                                                Assignment
                                                                Question
                                                            </Form.Label>
                                                            <Markdown
                                                                index={index}
                                                                value={
                                                                    assignment.question.trim() ||
                                                                    ""
                                                                }
                                                                onChange={
                                                                    handleAssignmentQuestionChange
                                                                }
                                                            />
                                                        </Form.Group>
                                                        <Form.Label
                                                            column
                                                            sm="5"
                                                        >
                                                            Code Template
                                                        </Form.Label>
                                                        <Card className="mb-3">
                                                            <Card.Header>
                                                                <Form.Select
                                                                    aria-label="Default select example"
                                                                    className="w-25"
                                                                    name="language"
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        onLanguageChange(
                                                                            e,
                                                                            index
                                                                        )
                                                                    }
                                                                >
                                                                    <option value="python">
                                                                        Python
                                                                    </option>
                                                                    <option value="nodejs">
                                                                        NodeJS
                                                                    </option>
                                                                    <option value="rust">
                                                                        Rust
                                                                    </option>
                                                                    <option value="cpp">
                                                                        C++
                                                                    </option>
                                                                    <option value="c">
                                                                        C
                                                                    </option>
                                                                </Form.Select>
                                                            </Card.Header>
                                                            <Card.Body>
                                                                <Code
                                                                    language={
                                                                        assignment[
                                                                            "language"
                                                                        ] ===
                                                                        undefined
                                                                            ? "python"
                                                                            : assignment[
                                                                                  "language"
                                                                              ]
                                                                    }
                                                                    index={
                                                                        index
                                                                    }
                                                                    onCode={
                                                                        onCodeChange
                                                                    }
                                                                    value={
                                                                        assignment[
                                                                            "code_template"
                                                                        ]
                                                                    }
                                                                />
                                                            </Card.Body>
                                                        </Card>
                                                        <Form.Label
                                                            column
                                                            sm="5"
                                                            className="d-block"
                                                        >
                                                            Assignment Test
                                                            Settings
                                                        </Form.Label>
                                                        {assignment[
                                                            "test_cases"
                                                        ]?.map(
                                                            (
                                                                test,
                                                                testIndex
                                                            ) => {
                                                                return (
                                                                    <Card
                                                                        className="mb-3"
                                                                        key={
                                                                            testIndex
                                                                        }
                                                                    >
                                                                        <Card.Body>
                                                                            <Form.Label>
                                                                                Replace
                                                                            </Form.Label>
                                                                            <br></br>
                                                                            {test.replace.map(
                                                                                (
                                                                                    replace,
                                                                                    replaceIndex
                                                                                ) => {
                                                                                    return (
                                                                                        <Row className="mb-3">
                                                                                            <Col xs="5">
                                                                                                <FloatingLabel
                                                                                                    controlId="floatingTextarea2"
                                                                                                    label="From"
                                                                                                >
                                                                                                    <Form.Control
                                                                                                        as="textarea"
                                                                                                        placeholder="Leave a comment here"
                                                                                                        name={`from`}
                                                                                                        value={
                                                                                                            replace.from
                                                                                                        }
                                                                                                        onChange={(
                                                                                                            e
                                                                                                        ) => {
                                                                                                            onTestCasesChange(
                                                                                                                e,
                                                                                                                index,
                                                                                                                testIndex,
                                                                                                                replaceIndex
                                                                                                            );
                                                                                                        }}
                                                                                                        style={{
                                                                                                            height: "100px",
                                                                                                        }}
                                                                                                    />
                                                                                                </FloatingLabel>
                                                                                            </Col>
                                                                                            <Col xs="5">
                                                                                                <FloatingLabel
                                                                                                    controlId="floatingTextarea2"
                                                                                                    label="To"
                                                                                                >
                                                                                                    <Form.Control
                                                                                                        as="textarea"
                                                                                                        name="to"
                                                                                                        value={
                                                                                                            replace.to
                                                                                                        }
                                                                                                        onChange={(
                                                                                                            e
                                                                                                        ) => {
                                                                                                            onTestCasesChange(
                                                                                                                e,
                                                                                                                index,
                                                                                                                testIndex,
                                                                                                                replaceIndex
                                                                                                            );
                                                                                                        }}
                                                                                                        placeholder="Leave a comment here"
                                                                                                        style={{
                                                                                                            height: "100px",
                                                                                                        }}
                                                                                                    />
                                                                                                </FloatingLabel>
                                                                                            </Col>
                                                                                            <Col xs="2">
                                                                                                <Button
                                                                                                    variant="danger"
                                                                                                    onClick={() => {
                                                                                                        removeReplace(
                                                                                                            testIndex,
                                                                                                            index,
                                                                                                            replaceIndex
                                                                                                        );
                                                                                                    }}
                                                                                                >
                                                                                                    remove
                                                                                                </Button>
                                                                                            </Col>
                                                                                        </Row>
                                                                                    );
                                                                                }
                                                                            )}
                                                                            <Button
                                                                                variant="primary"
                                                                                className="mb-3"
                                                                                onClick={() => {
                                                                                    addReplace(
                                                                                        testIndex,
                                                                                        index
                                                                                    );
                                                                                }}
                                                                            >
                                                                                Add
                                                                                Replace
                                                                            </Button>
                                                                            <FloatingLabel
                                                                                controlId="floatingTextarea2"
                                                                                label="Stdin"
                                                                                className="mb-3"
                                                                            >
                                                                                <Form.Control
                                                                                    as="textarea"
                                                                                    placeholder="Leave a comment here"
                                                                                    name="stdin"
                                                                                    value={
                                                                                        test[
                                                                                            "stdin"
                                                                                        ]
                                                                                    }
                                                                                    onChange={(
                                                                                        e
                                                                                    ) => {
                                                                                        onTestCasesChange(
                                                                                            e,
                                                                                            index,
                                                                                            testIndex
                                                                                        );
                                                                                    }}
                                                                                    style={{
                                                                                        height: "100px",
                                                                                    }}
                                                                                />
                                                                            </FloatingLabel>
                                                                            <FloatingLabel
                                                                                controlId="floatingTextarea2"
                                                                                label="Stdout"
                                                                                className="mb-3"
                                                                            >
                                                                                <Form.Control
                                                                                    as="textarea"
                                                                                    placeholder="Leave a comment here"
                                                                                    name="stdout"
                                                                                    value={
                                                                                        test[
                                                                                            "stdout"
                                                                                        ]
                                                                                    }
                                                                                    onChange={(
                                                                                        e
                                                                                    ) => {
                                                                                        onTestCasesChange(
                                                                                            e,
                                                                                            index,
                                                                                            testIndex
                                                                                        );
                                                                                    }}
                                                                                    style={{
                                                                                        height: "100px",
                                                                                    }}
                                                                                />
                                                                            </FloatingLabel>
                                                                        </Card.Body>
                                                                    </Card>
                                                                );
                                                            }
                                                        )}
                                                        <Button
                                                            variant="outline-info"
                                                            onClick={() =>
                                                                addTestCaseClick(
                                                                    index
                                                                )
                                                            }
                                                        >
                                                            Add Test Case
                                                        </Button>
                                                    </>
                                                </Card.Body>
                                            </Card>
                                        )
                                    )}
                                    <Button
                                        variant="primary"
                                        onClick={addAssignmentClick}
                                    >
                                        Add Assignment
                                    </Button>
                                </Card.Body>
                            </Card>
                            <Stack direction="horizontal">
                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="ms-auto"
                                >
                                    Update Tutorial
                                </Button>
                            </Stack>
                        </Form>
                    </div>
                </div>
            </div>
            <div>{JSON.stringify(post)}</div>
        </div>
    );
}
