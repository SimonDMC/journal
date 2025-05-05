"use client";

import { enforceAuth, RouteType } from "../util/auth";
import { useEffect } from "react";

export default function Home() {
    useEffect(() => {
        // register service worker
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js");
            if (!localStorage.getItem("cached-at")) localStorage.setItem("cached-at", Date.now().toString());
        }

        /* enforceAuth(router, RouteType.Unauthed); */
    }, []);

    return <main></main>;
}
