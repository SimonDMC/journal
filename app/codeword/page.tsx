"use client";

import "./styles.css";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { faArrowRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { enforceAuth, logout, RouteType } from "@/util/auth";
import { getOptions } from "@/util/profile";

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        enforceAuth(router, RouteType.Auth2FA);
    }, []);

    function selectInput() {
        const input = document.getElementById("codeword") as HTMLInputElement;

        input.focus();
    }

    function countChars() {
        const input = document.getElementById("codeword") as HTMLInputElement;
        const display = document.getElementById("codeword-display") as HTMLElement;

        display.innerText = input.value.length.toString();
    }

    async function inputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        const input = document.getElementById("codeword") as HTMLInputElement;
        const display = document.getElementById("codeword-display") as HTMLElement;

        if (event.key == "Enter") {
            const encoder = new TextEncoder();
            const data = encoder.encode(input.value);
            const hashBuffer = await crypto.subtle.digest("SHA-256", data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

            if (hashHex == getOptions().codeword) {
                sessionStorage.setItem("2fa-authed", "true");
                router.push("/overview");
            } else {
                display.innerText = "x";
                input.value = "";
            }
        }
    }

    return (
        <main className="codeword">
            <input type="text" id="codeword" autoFocus onBlur={selectInput} onInput={countChars} onKeyDown={inputKeyDown} />
            <div className="visible">
                <span id="codeword-display">0</span>
            </div>
            <a onClick={() => logout(router)} className="logout-icon">
                <FontAwesomeIcon icon={faArrowRightFromBracket} />
            </a>
        </main>
    );
}
