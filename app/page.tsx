"use client";

import { useEffect } from "react";

export const API_URL = "https://journal.simondmcplayer.workers.dev";
//export const API_URL = "http://localhost:8787";

export default function Home() {
    useEffect(() => {
        // decide whether to redirect to login or overview
        if (localStorage.getItem("token")) {
            window.location.href = "/overview";
        } else {
            window.location.href = "/login";
        }
    }, []);

    return <main></main>;
}
