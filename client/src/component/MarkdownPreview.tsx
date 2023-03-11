import MarkdownEditor from "@uiw/react-markdown-editor";

interface MarkdownPreviewProps {
    value?: string;
}

export default function MarkdownPreview(props: MarkdownPreviewProps) {
    return <MarkdownEditor.Markdown source={props.value || ""} />;
}
