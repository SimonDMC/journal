"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        // decide whether to redirect to login, codeword or overview
        if (localStorage.getItem("logged-in") && sessionStorage.getItem("codeword")) {
            router.push("/overview");
        } else if (localStorage.getItem("logged-in")) {
            router.push("/codeword");
        } else {
            router.push("/login");
        }
    }, []);

    return <main></main>;
}
