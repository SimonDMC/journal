"use client";

import { useState, useEffect, MutableRefObject, useRef } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";

import {
    BalloonEditor,
    AccessibilityHelp,
    Autosave,
    Bold,
    Code,
    Essentials,
    Italic,
    Paragraph,
    SelectAll,
    Strikethrough,
    Subscript,
    Superscript,
    TextTransformation,
    Underline,
    Undo,
    GetCallback,
    BaseEvent,
} from "ckeditor5";

import "ckeditor5/ckeditor5.css";

export default function App(props: { content: string; onKeyUp: GetCallback<BaseEvent>; setContent: Function }) {
    const [isLayoutReady, setIsLayoutReady] = useState(false);
    const editorRef = useRef(null);

    useEffect(() => {
        setIsLayoutReady(true);

        return () => setIsLayoutReady(false);
    }, []);

    useEffect(() => {
        if (editorRef.current && props.content) {
            editorRef.current.setData(props.content); // update editor when content changes
        }
    }, [props.content]);

    const editorConfig = {
        toolbar: {
            items: ["undo", "redo", "|", "bold", "italic", "underline", "strikethrough", "subscript", "superscript", "code"],
            shouldNotGroupWhenFull: false,
        },
        plugins: [
            AccessibilityHelp,
            Autosave,
            Bold,
            Code,
            Essentials,
            Italic,
            Paragraph,
            SelectAll,
            Strikethrough,
            Subscript,
            Superscript,
            TextTransformation,
            Underline,
            Undo,
        ],
    };

    function setEditorContent() {
        if (editorRef.current) {
            const editorData = editorRef.current.getData();
            props.setContent(editorData); // send content up to parent
        }
    }

    return (
        <CKEditor
            editor={BalloonEditor}
            config={editorConfig}
            onReady={(editor) => {
                editorRef.current = editor;
                if (props.content) editor.setData(props.content); // set data if already loaded
                editor.editing.view.document.on("keyup", setEditorContent);
            }}
        />
    );
}
