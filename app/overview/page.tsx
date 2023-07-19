"use client";

import "./styles.css";
import { auth, logout } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Home() {
    onAuthStateChanged(auth, (user) => {
        // If the user is not logged in, redirect to the login page
        if (!user) {
            window.location.href = "/login";
        }
    });

    function sendToToday() {
        const today = new Date().toISOString().slice(0, 10);
        window.location.href = `/${today}`;
    }

    return (
        <main>
            <button onClick={sendToToday}>Today</button>
            <button onClick={logout} className="logout">
                Log Out
            </button>
        </main>
    );
}
