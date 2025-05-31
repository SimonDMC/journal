import "../styles/entry.css";
import { type MutableRefObject, useEffect, useRef, useState } from "react";
import EditorBubble from "../components/editor-bubble/EditorBubble.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { db } from "../database/db.ts";
import { syncEntry } from "../database/sync.ts";
import { moveCursorToEnd } from "../util/selection.ts";
import { enforceAuth, RouteType } from "../util/auth.ts";
import QuoteImage from "../components/quote-image/QuoteImage.tsx";
import Editor from "../components/editor/Editor.tsx";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import type { SelectInstance } from "react-select";
import { moods } from "../util/parameters.ts";
import { formatDate } from "../util/time.ts";

export type EntrySearchParams = {
    date: string;
    query?: string;
    index?: number;
};

export const Route = createFileRoute("/entry")({
    component: Entry,
    validateSearch: (search: Record<string, unknown>): EntrySearchParams => {
        // validate and parse the search params into a typed state
        return {
            date: search.date as string,
            query: search.query as string,
            index: search.index as number,
        };
    },
});

export function Entry() {
    const [wordCount, setWordCount] = useState(0);
    const navigate = useNavigate();
    const router = useRouter();
    const contentRef = useRef("");
    const moodSelectRef: MutableRefObject<SelectInstance | null> = useRef(null);
    const { date } = Route.useSearch();

    const [initialContent, setInitialContent] = useState("");
    const [isSafari, setIsSafari] = useState(false);
    const mood: MutableRefObject<number | null> = useRef(null);
    const location: MutableRefObject<number | null> = useRef(null);

    useEffect(() => {
        enforceAuth(navigate, RouteType.Authed);

        setIsSafari((navigator.vendor && navigator.vendor.indexOf("Apple") > -1) as boolean);

        // load entry
        db.entries.get(date).then(async (data) => {
            if (!data) return;

            if (data.mood) {
                mood.current = data.mood;
            }
            if (data.location) {
                location.current = data.location;
            }

            contentRef.current = data.content;
            setInitialContent(data.content);
        });

        const keyDown = async (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();

                // unfocus text or close popup on esc
                const quoteImageBg = document.getElementById("quoteImageBg")!;
                if (quoteImageBg.classList.contains("visible")) {
                    quoteImageBg.classList.remove("visible");
                } else if (document.activeElement?.tagName != "BODY") {
                    (document.activeElement as HTMLElement).blur();
                } else {
                    // or exit if text is unfocused
                    router.history.back();
                }
            }

            // select mood
            if (event.key == "m" && !document.activeElement?.classList.contains("ck-content") && moodSelectRef.current) {
                moodSelectRef.current.focus();
            }

            if (
                parseInt(event.key) >= 1 &&
                parseInt(event.key) <= 7 &&
                moodSelectRef.current &&
                document.activeElement?.id == "react-select-mood-input"
            ) {
                moodSelectRef.current.setValue([moods[parseInt(event.key) - 1]], "select-option");
                mood.current = parseInt(event.key);
                moodSelectRef.current.blur();
            }

            // refocus entry
            if ((event.key == "Enter" || event.key == " ") && !document.activeElement?.classList.contains("ck-content")) {
                moveCursorToEnd(document.querySelector(".ck-content")!);
                event.preventDefault();
            }

            // capture ctrl + s
            if (event.key === "s" && event.ctrlKey) {
                // prevent the browser from opening the save dialog
                event.preventDefault();

                // save the entry
                saveRemotely();
            }
        };
        document.addEventListener("keydown", keyDown);

        // remove listener on unmount
        return () => {
            document.removeEventListener("keydown", keyDown);
        };
    }, []);

    const handleContentChange = async (newContent: string) => {
        contentRef.current = newContent;
        countWords();
    };

    function countWords() {
        setWordCount(contentRef.current.split(/\s+/).filter((word) => word !== "").length);
    }

    async function saveRemotely() {
        await saveLocally();
        const saveButton = document.getElementById("save-button") as HTMLButtonElement;
        saveButton.innerText = "Saved!";
        setTimeout(() => {
            saveButton.innerText = "Save";
        }, 1000);

        syncEntry(date);
    }

    async function saveLocally() {
        const text = contentRef.current;
        // compute hash -- docs/hash.md
        const toHashObject: { content: string; mood?: number; location?: number } = {
            content: text,
        };
        if (mood.current) toHashObject.mood = mood.current;
        if (location.current) toHashObject.location = location.current;
        const toHashString = JSON.stringify(toHashObject);

        const encoder = new TextEncoder();
        const data = encoder.encode(toHashString);
        const hashBuffer = await window.crypto.subtle.digest("SHA-1", data);
        const hashed = btoa(String.fromCharCode(...new Uint8Array(hashBuffer))).slice(0, -1);

        const existingEntry = await db.entries.get(date);

        if (existingEntry) {
            // update existing entry
            await db.entries.update(date, {
                content: text,
                mood: mood.current,
                location: location.current,
                word_count: wordCount,
                hash: hashed,
                last_modified: new Date().toISOString(),
            });
        } else {
            // create new entry
            await db.entries.add({
                date: date,
                content: text,
                mood: mood.current,
                location: location.current,
                word_count: wordCount,
                hash: hashed,
                last_modified: new Date().toISOString(),
            });
        }
    }

    return (
        <main className={`entry ${isSafari ? "safari" : ""}`}>
            <div className="sidebar invis"></div>
            <div id="loadingEntry">Loading...</div>
            <div className={`content ${date?.substring(0, 4) === "2024" ? "short" : ""}`}>
                <div className="line"></div>
                <Editor content={initialContent} setContent={handleContentChange} saveLocally={saveLocally} date={date} />
            </div>
            <div className="date">{formatDate(date)}</div>
            <Link to="/overview" className="back-arrow">
                <FontAwesomeIcon icon={faArrowLeft} />
            </Link>
            <EditorBubble
                saveEntry={saveRemotely}
                saveLocally={saveLocally}
                mood={mood}
                location={location}
                year={date?.substring(0, 4)}
                ref={moodSelectRef}
                wordCount={wordCount}
            />
            <QuoteImage />
        </main>
    );
}
