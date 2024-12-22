"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { API_URL, KEY_GENERATOR } from "../../util/config";
import "./styles.css";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { today } from "@/components/Calendar";
import { Slide, toast } from "react-toastify";
import dynamic from "next/dynamic";
import EditorBubble from "@/components/EditorBubble.tsx";

const Editor = dynamic(() => import("../../components/Editor.tsx"), { ssr: false });

export default function Home({ params }: { params: { date: string } }) {
    const key = useRef<CryptoKey>();
    const word_count = useRef(0);
    const router = useRouter();
    const contentRef = useRef("");

    const [initialContent, setInitialContent] = useState("");
    const mood = useRef(0);
    const location = useRef(0);

    // wrapped to only run on the client
    useEffect(() => {
        // check login status
        if (!localStorage.getItem("logged-in")) {
            router.push("/login");
        } else if (!sessionStorage.getItem("codeword")) {
            router.push("/codeword");
        }

        let prevText: string;
        let prevMood = mood;
        let prevLocation = location;
        let initialized = false;

        // Autosave every 10 seconds if on today's entry
        let autosaveInterval: NodeJS.Timer;
        if (today === params.date) {
            autosaveInterval = setInterval(() => {
                const text = contentRef.current;
                if (!prevText) {
                    prevText = text;
                    return;
                }
                if (initialized && text && (text !== prevText || mood !== prevMood || location !== prevLocation)) {
                    /* console.log(text, prevText);
                    console.log(mood.value, prevMood);
                    console.log(location.value, prevLocation); */

                    saveWithoutNotify(text);
                    prevText = text;
                    prevMood = mood;
                    prevLocation = location;
                }
            }, 10000);
        }

        // load entry from database
        fetch(`${API_URL}/entry/${params.date}?codeword=${sessionStorage.getItem("codeword")}`)
            .then((res) => res.json())
            .then(async (data) => {
                const json = localStorage.getItem("key");
                if (json) {
                    const keyBuffer = new Uint8Array(JSON.parse(json));
                    key.current = await crypto.subtle.importKey("raw", keyBuffer, KEY_GENERATOR, true, ["encrypt", "decrypt"]);
                } else {
                    showDecryptionError();
                    return;
                }

                if (data.mood) {
                    mood.current = data.mood;
                }
                if (data.location) {
                    location.current = data.location;
                }
                if (data.content) {
                    // decrypt entry
                    const toDecrypt = new Uint8Array([...atob(data.content)].map((c) => c.charCodeAt(0)));
                    const iv = toDecrypt.slice(0, 16);
                    const buffer = toDecrypt.slice(16);
                    try {
                        const decrypted = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, key.current, buffer);
                        const decryptedText = new TextDecoder().decode(decrypted);
                        contentRef.current = decryptedText;
                        setInitialContent(decryptedText);

                        initialized = true;
                        countWords();
                    } catch (err) {
                        console.error(err);
                        showDecryptionError();
                    }
                } else {
                    initialized = true;
                }
            });

        const keyDown = async (event: KeyboardEvent) => {
            // exit on esc
            if (event.key === "Escape") {
                router.back();
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

    function showDecryptionError() {
        document.getElementById("decryptError")?.classList.remove("hidden");
        document.getElementById("loadingEntry")?.classList.add("hidden");
        document.querySelector(".content")?.classList.add("hidden");
        document.querySelector(".line")?.classList.remove("visible");
    }

    function countWords() {
        const wordCountEl = document.getElementById("word-count") as HTMLParagraphElement;
        word_count.current = contentRef.current.split(/\s+/).filter((word) => word !== "").length;
        wordCountEl.innerText = `Word Count: ${word_count.current}`;
    }

    async function save() {
        const text = contentRef.current;
        const result = await saveEntry(text, params.date);
        const saveButton = document.getElementById("save-button") as HTMLButtonElement;

        if (result) {
            saveButton.innerText = "Saved!";
        } else {
            saveButton.innerText = "Error :(";
        }
        setTimeout(() => {
            saveButton.innerText = "Save";
        }, 1000);
    }

    async function saveWithoutNotify(text: string) {
        console.log("Autosaving...");
        const res = await saveEntry(text, params.date);
        if (!res) {
            toast.error("Error saving entry.", {
                position: "top-right",
                theme: "dark",
                transition: Slide,
            });
        }
    }

    async function saveEntry(text: string, date: string) {
        // encrypt entry
        const data = new TextEncoder().encode(text);
        const iv = crypto.getRandomValues(new Uint8Array(16));
        if (!key.current) {
            document.getElementById("decryptError")?.classList.remove("hidden");
            return false;
        }
        const encrypted = await crypto.subtle.encrypt({ name: "AES-CBC", iv }, key.current, data);
        const buffer = new Uint8Array(encrypted);
        const result = new Uint8Array(iv.length + buffer.length);
        result.set(iv, 0);
        result.set(buffer, iv.length);
        const encryptedContent = btoa(String.fromCharCode(...result));

        console.log("mood", mood.current, "location", location.current);

        return new Promise((resolve) => {
            fetch(`${API_URL}/entry/${date}?codeword=${sessionStorage.getItem("codeword")}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    content: encryptedContent,
                    mood: mood.current,
                    location: location.current,
                    // word count has to be sent because you can't recalculate it once encrypted
                    word_count: word_count.current,
                }),
            })
                .then((res) => {
                    resolve(res.ok);
                })
                .catch((err) => {
                    console.error(err);
                    resolve(false);
                });
        });
    }

    return (
        <main className="date">
            <div className="sidebar invis"></div>
            <div id="decryptError" className="hidden">
                Error decrypting entry. Make sure you have imported your key.
            </div>
            <div id="loadingEntry">Loading...</div>
            <div className="content">
                <div className="line"></div>
                <Editor content={initialContent} onKeyUp={countWords} setContent={handleContentChange} date={params.date} />
            </div>
            <Link href="/overview" className="back">
                <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <EditorBubble saveEntry={save} mood={mood} location={location} />
        </main>
    );
}
