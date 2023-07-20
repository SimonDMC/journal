"use client";

import "./styles.css";
import { auth, getEntries, logout } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import Calendar from "@/components/Calendar";

export default function Home() {
    const [entries, setEntries] = useState([]);

    // wrapped to only run on the client
    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            // If the user is not logged in, redirect to the login page
            if (!user) {
                window.location.href = "/login";
            } else {
                // Load the entries from the database
                getEntries().then((entries) => {
                    setEntries(entries);
                });
            }
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "ArrowLeft") {
                const previous = document.querySelector(".top-bar button:first-child") as HTMLButtonElement;
                previous.click();
            } else if (e.key === "ArrowRight") {
                const next = document.querySelector(".top-bar button:last-child") as HTMLButtonElement;
                next.click();
            }
        });
    }, []);

    function sendToToday() {
        const today = new Date().toISOString().slice(0, 10);
        window.location.href = `/${today}`;
    }

    // js date supports stuff like (2023, -7, 20) or (2023, 54, 20) so no need to worry about going out of bounds
    const [month, setMonth] = useState(new Date().getMonth() + 1);

    function previousMonth() {
        setMonth(month - 1);
    }

    function nextMonth() {
        setMonth(month + 1);
    }

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
        </main>
    );
}
