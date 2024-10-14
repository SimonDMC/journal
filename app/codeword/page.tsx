"use client";

import { useRouter } from "next/navigation";
import { API_URL } from "../../util/config";
import "./styles.css";
import { KeyboardEventHandler, useEffect } from "react";

export default function Home() {
    const router = useRouter();

    // wrapped to only run on the client
    useEffect(() => {
        // check login status
        /* if (localStorage.getItem("logged-in") && sessionStorage.getItem("codeword")) {
            router.push("/overview");
        } else if (localStorage.getItem("logged-in")) {
            router.push("/codeword");
        } */
    });

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
            display.innerText = "...";

            await fetch(`${API_URL}/codeword`, {
                method: "POST",
                body: input.value,
            })
                .then(async (res) => {
                    if (res.ok) {
                        console.log("Codeword verified.");
                        display.innerText = "☺";

                        sessionStorage.setItem("codeword", input.value);
                        router.push("/overview");
                    } else {
                        display.innerText = "x";
                        input.value = "";
                    }
                })
                .catch((err) => {
                    alert("Something went wrong. Please try again later.");
                    console.error(err);
                });
        }
    }

    async function logout() {
        await fetch(`${API_URL}/logout`, {
            method: "POST",
        });
        localStorage.removeItem("logged-in");
        sessionStorage.removeItem("codeword");
        router.push("/login");
    }

    return (
        <main className="codeword">
            <input type="text" id="codeword" autoFocus onBlur={selectInput} onInput={countChars} onKeyDown={inputKeyDown} />
            <div className="visible">
                <span id="codeword-display">0</span>
            </div>
            <i onClick={logout} className="fa-solid fa-arrow-right-from-bracket logout"></i>
        </main>
    );
}
