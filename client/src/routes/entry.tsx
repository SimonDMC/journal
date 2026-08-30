import "../styles/entry.css";
import { type RefObject, useEffect, useRef, useState } from "react";
import EditorBubble from "../components/editor-bubble/EditorBubble.tsx";
import { db } from "../database/db.ts";
import { syncEntry } from "../database/sync.ts";
import { moveCursorToEnd } from "../util/selection.ts";
import { enforceAuth, RouteType } from "../util/auth.ts";
import QuoteImage from "../components/quote-image/QuoteImage.tsx";
import Editor from "../components/editor/Editor.tsx";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import type { SelectInstance } from "react-select";
import { moods } from "../util/extras.ts";
import { formatDate } from "../util/time.ts";
import { calculateWords } from "../util/words.ts";
import { eventTarget, QuoteImageOpenEvent } from "../util/events.ts";
import BackArrow from "../components/back-arrow/BackArrow.tsx";
import type { Entry, EntryExtras } from "../types/entry.ts";
import { hashEntry } from "../util/crypto.ts";

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

function Entry() {
    const [wordCount, setWordCount] = useState(0);
    const navigate = useNavigate();
    const router = useRouter();
    const contentRef = useRef("");
    const moodSelectRef: RefObject<SelectInstance | null> = useRef(null);
    const { date } = Route.useSearch();

    const [initialContent, setInitialContent] = useState("");
    const [quoteImageOpen, setQuoteImageOpen] = useState(false);
    const [editorLoaded, setEditorLoaded] = useState(false);
    const [mood, setMood] = useState<number | null>(null);

    useEffect(() => {
        enforceAuth(navigate, RouteType.Authed);

        // load entry
        db.entries.get(date).then(async (data) => {
            if (!data || data.content === null) return;

            if (data.extras.mood) {
                setMood(data.extras.mood);
            }

            contentRef.current = data.content;
            setInitialContent(data.content);
        });
    }, [date, navigate]);

    useEffect(() => {
        const keyDown = async (event: KeyboardEvent) => {
            const moodSelected =
                document.activeElement?.id === moodSelectRef.current?.getElementId("input");

            if (event.key === "Escape") {
                event.preventDefault();

                // exit or close popup on esc
                if (quoteImageOpen) {
                    // close quote image popup if open
                    setQuoteImageOpen(false);
                } else if (moodSelected) {
                    // close mood select if open
                    moodSelectRef.current?.blur();
                } else if (document.activeElement?.tagName != "BODY" && event.shiftKey) {
                    // or deselect element if shift+esc
                    (document.activeElement as HTMLElement).blur();
                } else if (!event.shiftKey) {
                    // or exit, if nothing is blocking esc key
                    router.history.back();
                }
            }

            // select mood
            // ^M instead of ⌘M on mac because ⌘M is reserved by minimize
            if (event.key == "m" && event.ctrlKey && moodSelectRef.current) {
                if (moodSelected) {
                    moodSelectRef.current?.blur();
                } else {
                    moodSelectRef.current.focus();
                }
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
            if (
                (event.key == "Enter" || event.key == " ") &&
                !document.activeElement?.classList.contains("ck-content")
            ) {
                moveCursorToEnd(document.querySelector(".ck-content")!);
                event.preventDefault();
            }

            // save
            const isMac = navigator.platform.toLowerCase().includes("mac");
            const isModifierPressed = isMac ? event.metaKey : event.ctrlKey;
            if (event.key === "s" && isModifierPressed) {
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
    }, [quoteImageOpen, mood]);

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
                extras: {},
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

        const entryJson = {
            content: text,
            extras: {} as EntryExtras,
            word_count: calculateWords(text),
            last_modified: new Date().toISOString(),
            hash: null as null | string,
        };
        if (mood) entryJson.extras.mood = mood;
        entryJson.hash = await hashEntry(entryJson);

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
        <main className="entry">
            {editorLoaded || <div id="loadingEntry">Loading...</div>}
            <div className="content">
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
                date={date}
                ref={moodSelectRef}
                wordCount={wordCount}
            />
            <QuoteImage open={quoteImageOpen} setOpen={setQuoteImageOpen} />
        </main>
    );
}
