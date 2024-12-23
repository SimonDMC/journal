"use client";

import { useState, useEffect, useRef } from "react";
import { highlightNthOccurrence } from "../../util/selection";
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
    GetCallback,
    BaseEvent,
} from "ckeditor5";

import "ckeditor5/ckeditor5.css";
import { today } from "../calendar/Calendar";
import { useSearchParams } from "next/navigation";

export default function App(props: { content: string; onKeyUp: GetCallback<BaseEvent>; setContent: Function; date: string }) {
    const [isLayoutReady, setIsLayoutReady] = useState(false);
    const editorRef = useRef(null);
    const searchParams = useSearchParams();

    useEffect(() => {
        setIsLayoutReady(true);

        return () => setIsLayoutReady(false);
    }, []);

    useEffect(() => {
        if (editorRef.current && props.content) {
            focusContent();
            (editorRef.current as any).setData(handleLineBreaks(props.content)); // update editor when content changes
        }
    }, [props.content]);

    const editorConfig = {
        toolbar: {
            items: ["bold", "italic", "underline", "strikethrough", "subscript", "superscript", "code"],
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

    function handleLineBreaks(text: string) {
        return text
            .split("\n")
            .map((line) => (line.startsWith("<p") ? line : `<p>${line}</p>`))
            .join("");
    }

    function focusContent() {
        const editorEl = document.querySelector(".ck-content") as HTMLElement;

        // focus it if it's today
        if (today === props.date) {
            // idk it needs a delay
            requestAnimationFrame(() => moveCursorToEnd(editorEl));
        }

        // select occurrence if linked from search
        const query = searchParams.get("q");
        if (query) {
            let index = parseInt(searchParams.get("i") ?? "0");
            // this also needs a delay for whatever reason
            requestAnimationFrame(() => highlightNthOccurrence(editorEl, query, index));
        }

        // show line now that content has loaded
        document.querySelector(".line")?.classList.add("visible");
        // and hide loading text
        document.getElementById("loadingEntry")?.classList.add("hidden");
    }

    return (
        <CKEditor
            editor={BalloonEditor}
            config={editorConfig}
            onReady={(editor) => {
                (editorRef.current as any) = editor;

                const model = editor.model.document;
                const setDataCallback = () => {
                    focusContent();

                    // remove the listener so it only runs once
                    model.off("change:data", setDataCallback);
                };

                model.on("change:data", setDataCallback);

                // set data if already loaded
                if (props.content) editor.setData(handleLineBreaks(props.content));
                // or focus if theres nothing
                if (props.content == "") setDataCallback();

                editor.editing.view.document.on("keyup", setEditorContent);
            }}
        />
    );
}
