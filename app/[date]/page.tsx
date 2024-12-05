"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { API_URL, KEY_GENERATOR } from "../../util/config";
import "./styles.css";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { today } from "@/components/Calendar";
import { Slide, toast } from "react-toastify";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("../../components/Editor.tsx"), { ssr: false });

export default function Home({ params }: { params: { date: string } }) {
    const key = useRef<CryptoKey>();
    const word_count = useRef(0);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [initialContent, setInitialContent] = useState("");
    const contentRef = useRef("");

    // wrapped to only run on the client
    useEffect(() => {
        // check login status
        if (!localStorage.getItem("logged-in")) {
            router.push("/login");
        } else if (!sessionStorage.getItem("codeword")) {
            router.push("/codeword");
        }

        const mood = document.getElementById("mood") as HTMLSelectElement;
        const location = document.getElementById("location") as HTMLSelectElement;
        let prevText: string;
        let prevMood = mood.value;
        let prevLocation = location.value;
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
                if (initialized && text && (text !== prevText || mood.value !== prevMood || location.value !== prevLocation)) {
                    /* console.log(text, prevText);
                    console.log(mood.value, prevMood);
                    console.log(location.value, prevLocation); */

                    saveWithoutNotify(text);
                    prevText = text;
                    prevMood = mood.value;
                    prevLocation = location.value;
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
                    mood.value = data.mood.toString();
                }
                if (data.location) {
                    location.value = data.location.toString();
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
                router.push("/overview");
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
        const saveButton = document.querySelector("button") as HTMLButtonElement;
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
        let moodStr = (document.getElementById("mood") as HTMLSelectElement).value;
        let moodNum = moodStr === "" ? null : parseInt(moodStr);
        let locationStr = (document.getElementById("location") as HTMLSelectElement).value;
        let locationNum = locationStr === "" ? null : parseInt(locationStr);
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

        return new Promise((resolve) => {
            fetch(`${API_URL}/entry/${date}?codeword=${sessionStorage.getItem("codeword")}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    content: encryptedContent,
                    mood: moodNum,
                    location: locationNum,
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
            <div className="bubble">
                <p id="word-count">Word Count: 0</p>
                <div className="selections">
                    <select title="Mood" name="mood" id="mood" defaultValue="">
                        <option value="" disabled hidden>
                            Mood
                        </option>
                        <option value="1">1 - Worst day ever</option>
                        <option value="2">2 - Awful</option>
                        <option value="3">3 - Bad</option>
                        <option value="4">4 - Average</option>
                        <option value="5">5 - Good</option>
                        <option value="6">6 - Great</option>
                        <option value="7">7 - Best day ever</option>
                    </select>
                    <select title="Location" name="location" id="location" defaultValue="">
                        <option value="" disabled hidden>
                            Location
                        </option>
                        <option value="1">Mom&apos;s</option>
                        <option value="2">Dad&apos;s</option>
                        <option value="3">Cottage</option>
                        <option value="4">Not home!</option>
                    </select>
                </div>
                <button type="button" onClick={save} id="save-button">
                    Save
                </button>
            </div>
        </main>
    );
}
