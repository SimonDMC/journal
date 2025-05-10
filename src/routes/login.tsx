import { API_URL } from "../../util/config";
import "../styles/login.css";
import { useEffect } from "react";
import { checkForUpdate } from "../../util/update";
import { db } from "../../database/db";
import { errorToast } from "../../util/toast";
import { enforceAuth, RouteType } from "../../util/auth";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
    component: Login,
});

export function Login() {
    const navigate = useNavigate();

    useEffect(() => {
        enforceAuth(navigate, RouteType.Unauthed);
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

        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: username,
                password: password,
            }),
        });

        if (res.ok) {
            console.log("Logged in.");

            localStorage.setItem("logged-in", "true");

            // TODO: Review this
            // wipe local database on login with a different account to prevent syncing entries with
            // another account
            if (localStorage.getItem("username") && localStorage.getItem("username") != username) {
                await db.entries.clear();
            }
            localStorage.setItem("username", username);
            navigate({ to: "/overview" });
        } else {
            errorToast("Incorrect username or password.");
        }
    }

    function openInfo() {
        const dialog = document.querySelector("dialog") as HTMLDialogElement;
        dialog.showModal();
    }

    function closeInfo(event: React.MouseEvent) {
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
