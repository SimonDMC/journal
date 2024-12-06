"use client";

import { useRouter } from "next/navigation";
import { API_URL } from "../../util/config";
import "./styles.css";
import { KeyboardEventHandler, useEffect } from "react";
import { Slide, toast } from "react-toastify";

export default function Home() {
    const router = useRouter();

    // wrapped to only run on the client
    useEffect(() => {
        // check login status
        if (localStorage.getItem("logged-in") && sessionStorage.getItem("codeword")) {
            router.push("/overview");
        } else if (!localStorage.getItem("logged-in")) {
            router.push("/login");
        }
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
                        display.classList.add("smiley");

                        sessionStorage.setItem("codeword", input.value);
                        router.push("/overview");
                    } else {
                        display.innerText = "x";
                        input.value = "";

                        // probably missing cookie or something, log out
                        if (res.status == 401) {
                            localStorage.removeItem("logged-in");
                            router.push("/login");
                        }
                    }
                })
                .catch((err) => {
                    toast.error("Something went wrong. Please try again later.", {
                        position: "top-right",
                        theme: "dark",
                        transition: Slide,
                    });
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
            <a onClick={logout}>
                <i className="fa-solid fa-arrow-right-from-bracket logout"></i>
            </a>
        </main>
    );
}
