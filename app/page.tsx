"use client";

import "./styles.css";
import { useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Home() {
    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                window.location.href = "/overview";
            } else {
                window.location.href = "/login";
            }
        });
    }, []);

    return <main></main>;
}
