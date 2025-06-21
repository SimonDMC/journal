import "./Editor.css";
import { useEffect, useRef, type MutableRefObject } from "react";
import { highlightNthOccurrence, moveCursorToEnd } from "../../util/selection";
import { QuoteButton } from "../quote-button/QuoteButton";
import { CKEditor } from "@ckeditor/ckeditor5-react";

import {
    BalloonEditor,
    Autosave,
    Bold,
    Code,
    Essentials,
    Italic,
    Strikethrough,
    Subscript,
    Superscript,
    TextTransformation,
    Underline,
    EmojiMention,
    Mention,
    Paragraph,
} from "ckeditor5";

import "ckeditor5/ckeditor5.css";
import { getRouteApi } from "@tanstack/react-router";
import { today } from "../../util/time";

const entryRoute = getRouteApi("/entry");

export default function Editor(props: {
    content: string;
    setContent: (newContent: string) => void;
    saveLocally: () => Promise<void>;
    setLoaded: React.Dispatch<React.SetStateAction<boolean>>;
    date: string;
}) {
    const editorRef: MutableRefObject<BalloonEditor | null> = useRef(null);
    const autosaveLoaded = useRef(false);
    const { query, index } = entryRoute.useSearch();

    useEffect(() => {
        if (editorRef.current && props.content) {
            focusContent();
            editorRef.current.setData(handleLineBreaks(props.content)); // update editor when content changes
        }
    }, [props.content]);

    const editorConfig = {
        licenseKey: "GPL",
        toolbar: {
            items: ["bold", "italic", "underline", "strikethrough", "subscript", "superscript", "code", "quote"],
            shouldNotGroupWhenFull: true,
        },
        plugins: [
            Autosave,
            Bold,
            Code,
            EmojiMention,
            Essentials,
            Italic,
            Mention,
            Paragraph,
            QuoteButton,
            Strikethrough,
            Subscript,
            Superscript,
            TextTransformation,
            Underline,
        ],
        autosave: {
            // only save max every second
            waitingTime: 1000,
            async save() {
                if (today === props.date) {
                    if (autosaveLoaded.current) {
                        console.log("Autosaving locally!");
                        await props.saveLocally();
                    } else {
                        autosaveLoaded.current = true;
                    }
                }
            },
        },
        typing: {
            transformations: {
                include: [
                    // ellipsis, en dash, em dash
                    "typography",
                    // replace single and double quotes
                    // if preceding character is space or the quote is the first character, use “
                    // otherwise use ”
                    {
                        from: /^(')$/,
                        to: "‘",
                    },
                    {
                        from: /(\s)(')$/,
                        to: [null, "‘"],
                    },
                    {
                        from: /(\S)(')$/,
                        to: [null, "’"],
                    },
                    {
                        from: /^(")$/,
                        to: "“",
                    },
                    {
                        from: /(\s)(")$/,
                        to: [null, "“"],
                    },
                    {
                        from: /(\S)(")$/,
                        to: [null, "”"],
                    },
                ],
            },
        },
        emoji: {
            definitionsUrl: `${window.location.origin}/emoji.json`,
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

        // let parent know editor has loaded
        props.setLoaded(true);
    }

    return (
        <CKEditor
            editor={BalloonEditor}
            config={editorConfig}
            onReady={(editor) => {
                editorRef.current = editor;
                const model = editor.model.document;

                // propagate edits to parent
                model.on("change:data", setEditorContent);

                const content = handleLineBreaks(props.content);
                editor.setData(content);
                focusContent();
            }}
        />
    );
}
