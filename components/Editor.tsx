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

        const lastChild = contentEle.lastElementChild!;
        const lastLineRect = lastChild.getBoundingClientRect();
        const contentRect = contentEle.getBoundingClientRect();

        // scroll into view if too far down
        if (lastLineRect.bottom > contentRect.bottom) lastChild!.scrollIntoView();
    };

    return (
        <CKEditor
            editor={BalloonEditor}
            config={editorConfig}
            onReady={(editor) => {
                (editorRef.current as any) = editor;

                const model = editor.model.document;
                const setDataCallback = () => {
                    console.log("does this run", props.content);

                    // focus it if it's today
                    if (today === props.date) {
                        const editorEl = document.querySelector(".ck-content") as HTMLElement;
                        // idk it needs a delay
                        requestAnimationFrame(() => moveCursorToEnd(editorEl));
                    }

                    // show line now that content has loaded
                    document.querySelector(".line")?.classList.add("visible");
                    // and hide loading text
                    document.getElementById("loadingEntry")?.classList.add("hidden");

                    // remove the listener so it only runs once
                    model.off("change:data", setDataCallback);
                };

                model.on("change:data", setDataCallback);

                // set data if already loaded
                if (props.content) editor.setData(props.content);
                // or focus if theres nothing
                if (props.content == "") setDataCallback();

                editor.editing.view.document.on("keyup", setEditorContent);

                const editorEl = document.querySelector(".ck-content") as HTMLElement;

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
