"use client";

import { useRouter } from "next/navigation";
import { API_URL } from "../../util/config";
import "./styles.css";
import { useEffect } from "react";
import { Slide, toast } from "react-toastify";
import { checkForUpdate } from "@/util/update";

export default function Home() {
    const router = useRouter();

    // wrapped to only run on the client
    useEffect(() => {
        // check login status
        if (localStorage.getItem("logged-in") && sessionStorage.getItem("codeword")) {
            router.push("/overview");
        } else if (localStorage.getItem("logged-in")) {
            router.push("/codeword");
        } else {
            sessionStorage.removeItem("codeword");
        }

        checkForUpdate();

        // add event listener to login on enter
        const keydown = (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                login();
            }
        };
        document.addEventListener("keydown", keydown);

        // remove listener on unmount
        return () => {
            document.removeEventListener("keydown", keydown);
        };
    }, []);

    async function login() {
        const username = (document.getElementById("username") as HTMLInputElement).value;
        const password = (document.getElementById("password") as HTMLInputElement).value;

        await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: username,
                password: password,
            }),
        })
            .then(async (res) => {
                if (res.ok) {
                    console.log("Logged in.");

                    localStorage.setItem("logged-in", "true");
                    localStorage.setItem("username", username);
                    router.push("/codeword");
                } else {
                    toast.error("Incorrect username or password.", {
                        position: "top-right",
                        theme: "dark",
                        transition: Slide,
                    });
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

    function openInfo() {
        const dialog = document.querySelector("dialog") as HTMLDialogElement;
        dialog.showModal();
    }

    function closeInfo(event: any) {
        if (event.target !== event.currentTarget) return;
        const dialog = document.querySelector("dialog") as HTMLDialogElement;
        dialog.close();
    }

    return (
        <main className="login">
            <div className="container">
                <div className="input">
                    <label htmlFor="username">Username: </label>
                    <input type="text" name="username" id="username" />
                </div>
                <div className="input">
                    <label htmlFor="password">Password: </label>
                    <input type="password" name="password" id="password" />
                </div>
            </div>
            <button onClick={login} id="login-button">
                Login
            </button>
            <div className="info" onClick={openInfo}>
                ?
            </div>
            <dialog onClick={closeInfo}>
                <p>
                    This is an app I use for keeping a daily personal journal. There is no way to create an account because I&apos;m the
                    only one who uses this. I might open this up for public use once I think it&apos;s ready, but for now it&apos;s just for
                    me :)
                </p>
                <form method="dialog">
                    <button>Close</button>
                </form>
            </dialog>
        </main>
    );
}
