"use client";

import "./styles.css";
import { auth, login } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Home() {
    let awaitingWrite = false;
    onAuthStateChanged(auth, (user) => {
        // If the user is logged in, redirect to the overview page
        if (user && !awaitingWrite) {
            window.location.href = "/overview";
        }
    });

    async function loginAndRedirect() {
        awaitingWrite = true;
        await login();
        awaitingWrite = false;
        window.location.href = "/overview";
    }

    return (
        <main>
            <button onClick={loginAndRedirect}>Login</button>
        </main>
    );
}
