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
import { today } from "./Calendar";

export default function App(props: { content: string; onKeyUp: GetCallback<BaseEvent>; setContent: Function; date: string }) {
    const [isLayoutReady, setIsLayoutReady] = useState(false);
    const editorRef = useRef(null);

    useEffect(() => {
        setIsLayoutReady(true);

        return () => setIsLayoutReady(false);
    }, []);

    useEffect(() => {
        if (editorRef.current && props.content) {
            (editorRef.current as any).setData(props.content); // update editor when content changes
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
            const editorData = (editorRef.current as any).getData();
            props.setContent(editorData); // send content up to parent
        }
    }

    const moveCursorToEnd = (contentEle: HTMLElement) => {
        const range = document.createRange();
        const selection = window.getSelection();
        range.setStart(contentEle, contentEle.childNodes.length);
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);
    };

    return (
        <CKEditor
            editor={BalloonEditor}
            config={editorConfig}
            onReady={(editor) => {
                (editorRef.current as any) = editor;
                if (props.content) editor.setData(props.content); // set data if already loaded
                editor.editing.view.document.on("keyup", setEditorContent);

                const editorEl = document.querySelector(".ck-content") as HTMLElement;

                // focus it if it's today
                if (today === props.date) {
                    moveCursorToEnd(editorEl);
                }

                /* 
                TODO: figure out search at some point
                
                // select occurrence if linked from search
                const startIndex = searchParams.get("s");
                const endIndex = searchParams.get("e");
                if (startIndex && endIndex) {
                    textarea.focus();

                    textarea.selectionStart = parseInt(startIndex);
                    textarea.selectionEnd = parseInt(endIndex);
                } */
            }}
        />
    );
}
