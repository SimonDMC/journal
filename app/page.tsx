"use client";

import { enforceAuth, RouteType } from "@/util/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        // register service worker
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js");
            if (!localStorage.getItem("cached-at")) localStorage.setItem("cached-at", Date.now().toString());
        }

        enforceAuth(router, RouteType.Unauthed);
    }, []);

    return <main></main>;
}
