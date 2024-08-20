"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        // decide whether to redirect to login or overview
        if (localStorage.getItem("logged-in")) {
            router.push("/overview");
        } else {
            router.push("/login");
        }
    }, []);

    return <main></main>;
}
