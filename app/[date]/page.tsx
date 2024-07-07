"use client";

import { API_URL, KEY_GENERATOR } from "../../util/config";
import "./styles.css";
import { useEffect } from "react";

export default function Home({ params }: { params: { date: string } }) {
    // wrapped to only run on the client
    useEffect(() => {
        // Autosave every 10 seconds
        const textarea = document.getElementById("entry") as HTMLTextAreaElement;
        const mood = document.getElementById("mood") as HTMLSelectElement;
        const location = document.getElementById("location") as HTMLSelectElement;
        let prevText = textarea.value;
        let prevMood = mood.value;
        let prevLocation = location.value;
        let initialized = false;
        const autosaveInterval = setInterval(() => {
            const text = textarea.value;
            if (initialized && (text !== prevText || mood.value !== prevMood || location.value !== prevLocation)) {
                saveWithoutNotify(text);
                prevText = text;
            }
        }, 10000);

        // load entry from database
        fetch(`${API_URL}/entry/${params.date}`)
            .then((res) => res.json())
            .then(async (data) => {
                if (data.mood) {
                    mood.value = data.mood.toString();
                }
                if (data.location) {
                    location.value = data.location.toString();
                }
                if (data.content) {
                    // import key
                    const json = localStorage.getItem("key");
                    if (json) {
                        const keyBuffer = new Uint8Array(JSON.parse(json));
                        const key = await crypto.subtle.importKey("raw", keyBuffer, KEY_GENERATOR, true, ["encrypt", "decrypt"]);
                        const toDecrypt = new Uint8Array([...atob(data.content)].map((c) => c.charCodeAt(0)));
                        const iv = toDecrypt.slice(0, 16);
                        const buffer = toDecrypt.slice(16);
                        try {
                            const decrypted = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, buffer);
                            const decryptedText = new TextDecoder().decode(decrypted);
                            textarea.value = decryptedText;
                            initialized = true;
                        } catch (err) {
                            console.error(err);
                            document.getElementById("decryptError")?.classList.remove("hidden");
                        }
                    } else {
                        document.getElementById("decryptError")?.classList.remove("hidden");
                    }
                } else {
                    initialized = true;
                }
                if (initialized) {
                    // data has been loaded, so enable the textarea
                    textarea.disabled = false;
                    // and focus it
                    textarea.focus();

                    countWords();
                }
            })
            .catch((err) => {
                console.error(err);
                window.location.href = "/login";
            });

        const keyDown = async (event: KeyboardEvent) => {
            // exit on esc
            if (event.key === "Escape") {
                window.location.href = "/overview";
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

    function countWords() {
        const entry = document.getElementById("entry") as HTMLTextAreaElement;
        const wordCountEl = document.getElementById("word-count") as HTMLParagraphElement;
        let wordCount = entry.value.split(/\s+/).filter((word) => word !== "").length;
        wordCountEl.innerText = `Word Count: ${wordCount}`;
    }

    async function save() {
        const textarea = document.getElementById("entry") as HTMLTextAreaElement;
        const text = textarea.value;
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
            alert("Error saving entry");
        }
    }

    async function saveEntry(text: string, date: string) {
        let moodStr = (document.getElementById("mood") as HTMLSelectElement).value;
        let moodNum = moodStr === "" ? null : parseInt(moodStr);
        let locationStr = (document.getElementById("location") as HTMLSelectElement).value;
        let locationNum = locationStr === "" ? null : parseInt(locationStr);
        return new Promise((resolve) => {
            fetch(`${API_URL}/entry/${date}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ content: text, mood: moodNum, location: locationNum }),
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
        <main>
            <div id="decryptError" className="hidden">
                Error decrypting entry. Make sure you have imported your key.
            </div>
            <textarea name="entry" id="entry" onKeyUp={countWords} disabled></textarea>
            <p id="word-count">Word Count: 0</p>

            <div className="bottom-bar">
                <select name="mood" id="mood" defaultValue="">
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
                <button onClick={save}>Save</button>
                <select name="location" id="location" defaultValue="">
                    <option value="" disabled hidden>
                        Location
                    </option>
                    <option value="1">Mom&apos;s</option>
                    <option value="2">Dad&apos;s</option>
                    <option value="3">Cottage</option>
                    <option value="4">Not home!</option>
                </select>
            </div>
            <a href="/overview" className="back">
                ←
            </a>
        </main>
    );
}
