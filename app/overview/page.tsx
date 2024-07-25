"use client";

import "./styles.css";
import { useEffect, useRef, useState } from "react";
import Calendar, { dayAdjustedTime, today } from "@/components/Calendar";
import { API_URL, KEY_GENERATOR } from "../../util/config";

export default function Home() {
    const [entries, setEntries] = useState([]);
    const [wordCount, setWordCount] = useState(0);
    const entriesLoaded = useRef(false);

    // wrapped to only run on the client
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("./sw.js");
        }

        // check for token in local storage
        if (!localStorage.getItem("logged-in")) {
            window.location.href = "/login";
        }
        // load entries from database
        fetch(`${API_URL}/overview`)
            .then((res) => res.json())
            .then((data) => {
                setEntries(data.entries);
                setWordCount(data.totalWords);
                document.getElementById("calendar")?.classList.remove("loading");
            })
            .catch((err) => {
                console.error(err);
                localStorage.removeItem("logged-in");
                window.location.href = "/login";
            });

        const keydown = (e: KeyboardEvent) => {
            // quick calendar navigation
            if (e.key === "ArrowLeft") {
                const previous = document.querySelector(".top-bar button:first-child") as HTMLButtonElement;
                previous.click();
            } else if (e.key === "ArrowRight") {
                const next = document.querySelector(".top-bar button:last-child") as HTMLButtonElement;
                next.click();
            }

            // quick today navigation
            if (e.key === "Enter" || e.key === "t" || e.key === " ") {
                sendToToday();
            }

            // quick one year ago navigation
            if (e.key === "y" || e.key === "l" || e.key === "a") {
                const lastYear = document.getElementById("lastYear") as HTMLAnchorElement;
                lastYear.click();
            }
        };
        document.addEventListener("keydown", keydown);

        // remove listener on unmount
        return () => {
            document.removeEventListener("keydown", keydown);
        };
    }, []);

    useEffect(() => {
        if (entriesLoaded.current) {
            setOneYearAgo();
        } else {
            entriesLoaded.current = true;
        }
    }, [entries]);

    function download() {
        fetch(`${API_URL}/download`)
            .then((res) => res.json())
            .then(async (json) => {
                // decrypt entries
                const storedKey = localStorage.getItem("key");
                if (!storedKey) {
                    alert("No key found.");
                    return;
                }
                const buffer = new Uint8Array(JSON.parse(storedKey));
                const key = await window.crypto.subtle.importKey("raw", buffer, KEY_GENERATOR, false, ["decrypt"]);

                let failed = false;
                for (const entry of json.results) {
                    const data = new Uint8Array([...atob(entry.content)].map((c) => c.charCodeAt(0)));
                    const iv = data.slice(0, 16);
                    const encrypted = data.slice(16);
                    try {
                        const decrypted = await window.crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, encrypted);
                        entry.content = new TextDecoder().decode(decrypted);
                    } catch (err) {
                        console.error(err);
                        failed = true;
                    }
                }

                if (failed) {
                    alert("Failed to decrypt some entries.");
                }

                const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `journal-export-${today}.json`;
                a.click();
            })
            .catch((err) => {
                alert("Didn't work :(");
                console.error(err);
            });
    }

    function sendToToday() {
        window.location.href = `/${today}`;
    }

    // js date supports stuff like (2023, -7, 20) or (2023, 54, 20) so no need to worry about going out of bounds
    const [month, setMonth] = useState(dayAdjustedTime.getMonth() + 1);

    function previousMonth() {
        setMonth(month - 1);
    }

    function nextMonth() {
        setMonth(month + 1);
    }

    function setOneYearAgo() {
        const lastYear = new Date(dayAdjustedTime);
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        const lastYearString = lastYear.toISOString().substring(0, 10);
        const lastYearLink = document.getElementById("lastYear") as HTMLAnchorElement;
        lastYearLink.href = `/${lastYearString}`;
        if (entries.find((entry) => entry === lastYearString)) {
            lastYearLink.classList.remove("inactive");
        }
    }

    function uploadKey() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".key";
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) {
                return;
            }

            const reader = new FileReader();
            reader.onload = async () => {
                const imported = new Uint8Array(reader.result as ArrayBuffer);
                localStorage.setItem("key", JSON.stringify(Array.from(imported)));
                alert("Key imported successfully!");
            };
            reader.readAsArrayBuffer(file);
        };
        input.click();
    }

    function downloadKey() {
        const key = localStorage.getItem("key");
        if (!key) {
            alert("No key found.");
            return;
        }

        const blob = new Blob([new Uint8Array(JSON.parse(key))], { type: "application/octet-stream" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "JOURNAL_SECRET.key";
        a.click();
    }

    async function logout() {
        await fetch(`${API_URL}/logout`, {
            method: "POST",
        });
        localStorage.removeItem("logged-in");
        window.location.href = "/login";
    }

    // https://stackoverflow.com/a/2901298
    const commaFormat = (x: number) => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return (
        <main>
            <Calendar
                month={new Date(new Date().getFullYear(), month, 1).toISOString().substring(0, 10)}
                previousMonth={previousMonth}
                nextMonth={nextMonth}
                entries={entries}
            />
            <button onClick={sendToToday}>Today</button>
            <a href="" id="lastYear" className="inactive">
                One Year Ago
            </a>
            <div className="key">
                <a onClick={uploadKey}>
                    <i className="fa-solid fa-key key-button"></i>
                    <i className="fa-solid fa-arrow-up key-arrow"></i>
                </a>
                <a onClick={downloadKey}>
                    <i className="fa-solid fa-key key-button"></i>
                    <i className="fa-solid fa-arrow-down key-arrow"></i>
                </a>
            </div>
            <button onClick={logout} className="logout">
                Log Out
            </button>
            <div className="stats">
                <p className="entryCount">Entry Count: {commaFormat(entries.length)}</p>
                <p className="wordCount">Total Words: {commaFormat(wordCount)}</p>
            </div>
            <div className="controls">
                <a onClick={download}>
                    <i className="fa-solid fa-download"></i>
                </a>
                <a href="/search">
                    <i className="fa-solid fa-magnifying-glass"></i>
                </a>
            </div>
        </main>
    );
}
