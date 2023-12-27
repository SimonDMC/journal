"use client";

import { useEffect } from "react";

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
