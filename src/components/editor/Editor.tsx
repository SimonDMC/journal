import { useState, useEffect, useRef, type MutableRefObject } from "react";
import { highlightNthOccurrence, moveCursorToEnd } from "../../util/selection";
import { QuoteButton } from "../quote-button/QuoteButton";
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
    type GetCallback,
    type BaseEvent,
} from "ckeditor5";

import "ckeditor5/ckeditor5.css";
import { getRouteApi } from "@tanstack/react-router";
import { today } from "../../util/time";

const entryRoute = getRouteApi("/entry");

export default function Editor(props: {
    content: string;
    onKeyUp: GetCallback<BaseEvent>;
    setContent: (newContent: string) => void;
    date: string;
}) {
    const [, setIsLayoutReady] = useState(false);
    const editorRef: MutableRefObject<BalloonEditor | null> = useRef(null);
    const { query, index } = entryRoute.useSearch();

    useEffect(() => {
        setIsLayoutReady(true);

        return () => setIsLayoutReady(false);
    }, []);

    useEffect(() => {
        if (editorRef.current && props.content) {
            focusContent();
            editorRef.current.setData(handleLineBreaks(props.content)); // update editor when content changes
        }
    }, [props.content]);

    const editorConfig = {
        toolbar: {
            items: ["bold", "italic", "underline", "strikethrough", "subscript", "superscript", "code", "quote"],
            shouldNotGroupWhenFull: true,
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
            QuoteButton,
        ],
        typing: {
            transformations: {
                include: [
                    // replace single and double quotes
                    // -- if preceding character is space or “ (or is the first character), use “; otherwise use ”
                    {
                        from: /^(')$/,
                        to: "‘",
                    },
                    {
                        from: /([\s‘])(')$/,
                        to: [null, "‘"],
                    },
                    {
                        from: /([^\s‘])(')$/,
                        to: [null, "’"],
                    },
                    {
                        from: /^(")$/,
                        to: "“",
                    },
                    {
                        from: /([\s“])(")$/,
                        to: [null, "“"],
                    },
                    {
                        from: /([^\s“])(")$/,
                        to: [null, "”"],
                    },
                ],
            },
        },
    };

    function setEditorContent() {
        if (editorRef.current) {
            const editorData = editorRef.current.getData();
            props.setContent(editorData); // send content up to parent
        }
    }

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
        if (query && index) {
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
                editorRef.current = editor;

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

                // fancify apostrophes

                model.on("change:data", setEditorContent);
            }}
        />
    );
}
