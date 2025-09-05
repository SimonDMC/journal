import "../styles/entry.css";
import { type MutableRefObject, useEffect, useRef, useState } from "react";
import EditorBubble from "../components/editor-bubble/EditorBubble.tsx";
import { db } from "../database/db.ts";
import { syncEntry } from "../database/sync.ts";
import { moveCursorToEnd } from "../util/selection.ts";
import { enforceAuth, RouteType } from "../util/auth.ts";
import QuoteImage from "../components/quote-image/QuoteImage.tsx";
import Editor from "../components/editor/Editor.tsx";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import type { SelectInstance } from "react-select";
import { moods } from "../util/parameters.ts";
import { formatDate } from "../util/time.ts";
import { calculateWords } from "../util/words.ts";
import { eventTarget, QuoteImageOpenEvent } from "../util/events.ts";
import BackArrow from "../components/back-arrow/BackArrow.tsx";

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
    const [quoteImageOpen, setQuoteImageOpen] = useState(false);
    const [editorLoaded, setEditorLoaded] = useState(false);
    const [mood, setMood] = useState<number | null>(null);
    const [location, setLocation] = useState<number | null>(null);

    useEffect(() => {
        enforceAuth(navigate, RouteType.Authed);

        setIsSafari((navigator.vendor && navigator.vendor.indexOf("Apple") > -1) as boolean);

        // load entry
        db.entries.get(date).then(async (data) => {
            if (!data || data.content === null) return;

            if (data.mood) {
                setMood(data.mood);
            }
            if (data.location) setLocation(data.location);

            contentRef.current = data.content;
            setInitialContent(data.content);
        });
    }, [date, navigate]);

    useEffect(() => {
        const keyDown = async (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();

                // exit or close popup on esc
                if (quoteImageOpen) {
                    setQuoteImageOpen(false);
                } else if (document.activeElement?.tagName != "BODY" && event.shiftKey) {
                    // or deselect element if shift+esc
                    (document.activeElement as HTMLElement).blur();
                } else if (!event.shiftKey) {
                    // or exit if text is unfocused
                    router.history.back();
                }
            }

            // select mood
            if (event.key == "m" && event.ctrlKey && moodSelectRef.current) {
                moodSelectRef.current.focus();
            }

            if (
                parseInt(event.key) >= 1 &&
                parseInt(event.key) <= 7 &&
                moodSelectRef.current &&
                document.activeElement?.id == "react-select-mood-input"
            ) {
                moodSelectRef.current.setValue([moods[parseInt(event.key) - 1]], "select-option");
                setMood(parseInt(event.key));
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

        // open quote image on toolbar button press
        const quoteImageOpenHandler = () => setQuoteImageOpen(true);
        eventTarget.addEventListener(QuoteImageOpenEvent.eventId, quoteImageOpenHandler);

        // remove listeners on unmount
        return () => {
            document.removeEventListener("keydown", keyDown);
            eventTarget.removeEventListener(QuoteImageOpenEvent.eventId, quoteImageOpenHandler);
        };
    }, [quoteImageOpen, mood, location]);

    async function handleContentChange(newContent: string) {
        contentRef.current = newContent;
        setWordCount(calculateWords(newContent));
    }

    async function saveLocally() {
        const text = contentRef.current;
        const existingEntry = await db.entries.get(date);

        // deleting entry -- mark as null content and remove all other properties
        if (text === "") {
            const entryJson = {
                content: null,
                mood: null,
                location: null,
                word_count: 0,
                hash: null,
                last_modified: new Date().toISOString(),
            };

            if (existingEntry) {
                // update existing entry
                await db.entries.update(date, entryJson);
            } else {
                // create new entry
                await db.entries.add({ date: date, ...entryJson });
            }

            return;
        }

        // compute hash -- docs/hash.md
        const toHashObject: { content: string; mood?: number; location?: number } = {
            content: text,
        };
        if (mood) toHashObject.mood = mood;
        if (location) toHashObject.location = location;
        const toHashString = JSON.stringify(toHashObject);

        const encoder = new TextEncoder();
        const data = encoder.encode(toHashString);
        const hashBuffer = await window.crypto.subtle.digest("SHA-1", data);
        const hashed = btoa(String.fromCharCode(...new Uint8Array(hashBuffer))).slice(0, -1);

        const entryJson = {
            content: text,
            mood: mood,
            location: location,
            word_count: calculateWords(text),
            hash: hashed,
            last_modified: new Date().toISOString(),
        };

        if (existingEntry) {
            // update existing entry
            await db.entries.update(date, entryJson);
        } else {
            // create new entry
            await db.entries.add({ date: date, ...entryJson });
        }
    }

    async function saveRemotely() {
        await saveLocally();
        const saveButton = document.getElementById("save-button") as HTMLButtonElement;
        saveButton.innerText = "Saved!";
        setTimeout(() => {
            saveButton.innerText = "Save";
        }, 1000);

        // this returns a boolean but we do nothing with it (?) might be better to show
        // it was only saved locally
        syncEntry(date);
    }

    return (
        <main className={`entry ${isSafari ? "safari" : ""}`}>
            {editorLoaded || <div id="loadingEntry">Loading...</div>}
            <div className={`content ${date?.substring(0, 4) === "2024" && "short"}`}>
                {editorLoaded && <div className="line"></div>}
                <Editor
                    content={initialContent}
                    setContent={handleContentChange}
                    saveLocally={saveLocally}
                    setLoaded={setEditorLoaded}
                    date={date}
                />
                <div className="line-clip"></div>
            </div>
            <div className="date">{formatDate(date)}</div>
            <BackArrow />
            <EditorBubble
                saveEntry={saveRemotely}
                saveLocally={saveLocally}
                mood={mood}
                setMood={setMood}
                location={location}
                setLocation={setLocation}
                date={date}
                ref={moodSelectRef}
                wordCount={wordCount}
            />
            <QuoteImage open={quoteImageOpen} setOpen={setQuoteImageOpen} />
        </main>
    );
}
