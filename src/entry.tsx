"use client";

import "./entry.css";
import { type MutableRefObject, type Ref, Suspense, useEffect, useRef, useState } from "react";
import { today } from "../components/calendar/Calendar.tsx";
import EditorBubble, { moods } from "../components/editor-bubble/EditorBubble.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { db } from "../database/db.ts";
import { syncEntry } from "../database/sync.ts";
import { moveCursorToEnd } from "../util/selection.ts";
import { enforceAuth, RouteType } from "../util/auth.ts";
import QuoteImage from "../components/quote-image/QuoteImage.tsx";
import { Link, useNavigate, useSearchParams } from "react-router";
import Editor from "../components/editor/Editor.tsx";

function EntryContent() {
    const word_count = useRef(0);
    const navigate = useNavigate();
    const contentRef = useRef("");
    const moodSelectRef: Ref<any> = useRef(null);
    const [searchParams] = useSearchParams();
    const date = searchParams.get("date") as string;

    const [initialContent, setInitialContent] = useState("");
    const [isSafari, setIsSafari] = useState(false);
    const mood: MutableRefObject<number | null> = useRef(null);
    const location: MutableRefObject<number | null> = useRef(null);

    useEffect(() => {
        enforceAuth(navigate, RouteType.Authed);

        setIsSafari((navigator.vendor && navigator.vendor.indexOf("Apple") > -1) as boolean);

        let prevText: string;
        let prevMood = mood.current;
        let initialized = false;

        // Autosave every 10 seconds if on today's entry
        let autosaveInterval: NodeJS.Timer;
        if (today === date) {
            autosaveInterval = setInterval(() => {
                const text = contentRef.current;
                if (!prevText) {
                    prevText = text;
                    return;
                }

                if (initialized && text && (text !== prevText || mood.current !== prevMood)) {
                    console.log("Autosaving locally");
                    saveEntry(text, date);
                    prevText = text;
                    prevMood = mood.current;
                }
            }, 10000);
        }

        // load entry
        db.entries.get(date).then(async (data) => {
            if (!data) {
                initialized = true;
                return;
            }

            if (data.mood) {
                mood.current = data.mood;
            }
            if (data.location) {
                location.current = data.location;
            }

            contentRef.current = data.content;
            prevText = data.content;
            setInitialContent(data.content);

            initialized = true;
            countWords();
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
                    //router.back();
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
                save();
            }
        };
        document.addEventListener("keydown", keyDown);

        // remove listener on unmount
        return () => {
            document.removeEventListener("keydown", keyDown);
            clearInterval(autosaveInterval);
        };
    }, []);

    const handleContentChange = (newContent: string) => {
        contentRef.current = newContent;
        countWords();
    };

    function countWords() {
        const wordCountEl = document.getElementById("word-count") as HTMLParagraphElement;
        word_count.current = contentRef.current.split(/\s+/).filter((word) => word !== "").length;
        wordCountEl.innerText = `Word Count: ${word_count.current}`;
    }

    async function save() {
        const text = contentRef.current;
        await saveEntry(text, date);
        const saveButton = document.getElementById("save-button") as HTMLButtonElement;
        saveButton.innerText = "Saved!";
        setTimeout(() => {
            saveButton.innerText = "Save";
        }, 1000);

        syncEntry(date);
    }

    async function saveEntry(text: string, date: string) {
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
                word_count: word_count.current,
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
                word_count: word_count.current,
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
                <Editor content={initialContent} onKeyUp={countWords} setContent={handleContentChange} date={date} />
            </div>
            <Link to="/overview" className="back-arrow">
                <FontAwesomeIcon icon={faArrowLeft} />
            </Link>
            <EditorBubble
                saveEntry={save}
                mood={mood}
                location={location}
                year={date?.substring(0, 4)}
                ref={moodSelectRef as MutableRefObject<null>}
            />
            <QuoteImage />
        </main>
    );
}

export default function Entry() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EntryContent />
        </Suspense>
    );
}
