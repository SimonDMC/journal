"use client";

import { API_URL } from "../page";
import "./styles.css";
import { useEffect } from "react";

export default function Home() {
    // wrapped to only run on the client
    useEffect(() => {
        // check for token in local storage
        if (localStorage.getItem("token")) {
            window.location.href = "/overview";
        }

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
        await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: (document.getElementById("username") as HTMLInputElement).value,
                password: (document.getElementById("password") as HTMLInputElement).value,
            }),
        })
            .then(async (res) => {
                if (res.ok) {
                    console.log("Logged in.");

                    localStorage.setItem("token", await res.text());
                    window.location.href = "/overview";
                } else {
                    alert("Incorrect username or password.");
                }
            })
            .catch((err) => {
                alert("Something went wrong. Please try again later.");
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
        <main>
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
            <button onClick={login}>Login</button>
            <div className="info" onClick={openInfo}>
                ?
            </div>
            <dialog onClick={closeInfo}>
                <p>
                    This is an app I use for keeping a daily personal journal. There is no way to create an account because I&apos;m the
                    only one who uses this. I might open this up for public use (unlikely) but for now it&apos;s just for me :)
                </p>
                <form method="dialog">
                    <button>Close</button>
                </form>
            </dialog>
        </main>
    );
}
