"use client";

import "./styles.css";
import { useEffect, useState } from "react";
import Calendar, { dayAdjustedTime, today } from "@/components/Calendar";
import { API_URL } from "../../util/config";

export default function Home() {
    const [entries, setEntries] = useState([]);
    const [wordCount, setWordCount] = useState(0);

    // wrapped to only run on the client
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("./sw.js");
        }

        // check for token in local storage
        if (!localStorage.getItem("token")) {
            window.location.href = "/login";
        }
        // load entries from database
        fetch(`${API_URL}/overview`, {
            headers: {
                Authorization: localStorage.getItem("token") as string,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                setEntries(data.entries);
                setWordCount(data.totalWords);
            })
            .catch((err) => {
                console.error(err);
                window.location.href = "/login";
                localStorage.removeItem("token");
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
        };
        document.addEventListener("keydown", keydown);

        // remove listener on unmount
        return () => {
            document.removeEventListener("keydown", keydown);
        };
    }, []);

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

    function logout() {
        localStorage.removeItem("token");
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
            <button onClick={logout} className="logout">
                Log Out
            </button>
            <div className="stats">
                <p className="entryCount">Entry Count: {commaFormat(entries.length)}</p>
                <p className="wordCount">Total Words: {commaFormat(wordCount)}</p>
            </div>
            <div className="search">
                <i className="fa-solid fa-magnifying-glass"></i>
            </div>
        </main>
    );
}
