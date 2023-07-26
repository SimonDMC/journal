"use client";

import "./styles.css";
import { auth, saveEntry, getEntry } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";

export default function Home({ params }: { params: { date: string } }) {
    // wrapped to only run on the client
    useEffect(() => {
        onAuthStateChanged(auth, async (user) => {
            // If the user is not logged in, redirect to the login page
            if (!user) {
                window.location.href = "/overview";
            } else {
                // Load the entry from the database
                const textarea = document.getElementById("entry") as HTMLTextAreaElement;
                const text = await getEntry(params.date);
                textarea.value = text;
                countWords();

                // Autosave every 10 seconds
                let prevText = textarea.value;
                setInterval(() => {
                    const text = textarea.value;
                    if (text !== prevText) {
                        saveWithoutNotify(text);
                        prevText = text;
                    }
                }, 10000);
            }
        });
    }, []);

    function countWords() {
        const entry = document.getElementById("entry") as HTMLTextAreaElement;
        const wordCountEl = document.getElementById("word-count") as HTMLParagraphElement;
        const words = entry.value.split(" ");
        let wordCount = words.length;
        if (words[0] === "") {
            wordCount = 0;
        }
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
        const res = await saveEntry(text, params.date);
        if (!res) {
            alert("Error saving entry");
        }
    }

    return (
        <main>
            <textarea name="entry" id="entry" cols={60} rows={20} onKeyUp={countWords}></textarea>
            <p id="word-count">Word Count: 0</p>

            <button onClick={save}>Save</button>
            <a href="/overview" className="back">
                ←
            </a>
        </main>
    );
}
