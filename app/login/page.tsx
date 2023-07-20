"use client";

import "./styles.css";
import { auth, login } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";

export default function Home() {
    let awaitingWrite = false;
    // wrapped to only run on the client
    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            // If the user is logged in, redirect to the overview page
            if (user && !awaitingWrite) {
                window.location.href = "/overview";
            }
        });
    }, []);

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
