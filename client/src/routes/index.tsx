import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { enforceAuth, RouteType } from "../util/auth";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
    component: Home,
});

function Home() {
    const navigate = useNavigate();

    useEffect(() => {
        // register service worker
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js");
        }

        console.log(1);

        enforceAuth(navigate, RouteType.Redirect);
        console.log(2);
    }, [navigate]);

    return <main></main>;
}
