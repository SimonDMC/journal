import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { enforceAuth, RouteType } from "../util/auth";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
    component: Home,
});

export function Home() {
    const navigate = useNavigate();

    useEffect(() => {
        // register service worker
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js");
        }

        enforceAuth(navigate, RouteType.Unauthed);
    }, [navigate]);

    return <main></main>;
}
