import { API_URL } from "../util/config";
import "../styles/login.css";
import { useEffect } from "react";
import { checkForUpdate } from "../util/update";
import { db } from "../database/db";
import { errorToast } from "../util/toast";
import { enforceAuth, RouteType } from "../util/auth";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
    component: Login,
});

export function Login() {
    const navigate = useNavigate();

    useEffect(() => {
        enforceAuth(navigate, RouteType.Unauthed);
        checkForUpdate();
    }, [navigate]);

    async function login() {
        const username = (document.getElementById("username") as HTMLInputElement).value;
        const password = (document.getElementById("password") as HTMLInputElement).value;

        let res;
        try {
            res = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                }),
            });
        } catch (e) {
            console.error(e);
            errorToast("Couldn't reach server.");
            return;
        }

        if (res.ok) {
            console.log("Logged in.");

            localStorage.setItem("journal-logged-in", "true");

            // TODO: Review this
            // wipe local database on login with a different account to prevent syncing entries with
            // another account
            if (localStorage.getItem("journal-username") && localStorage.getItem("journal-username") != username) {
                await db.entries.clear();
            }
            localStorage.setItem("journal-username", username);
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
                    <input type="text" name="username" id="username" autoFocus />
                </div>
                <div className="input">
                    <label htmlFor="password">Password: </label>
                    <input
                        type="password"
                        name="password"
                        id="password"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                login();
                            }
                        }}
                    />
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
