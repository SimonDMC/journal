import { syncDatabase } from "../../database/sync";
import { postAPI } from "../../services/api";
import { generateKey, hashKey } from "../../util/crypto";
import { errorToast, successToast } from "../../util/toast";

/**
 * Get whether a user is logged in or not
 */
export function isLoggedIn(): boolean {
    return localStorage.getItem("journal-username") != undefined;
}

/**
 * Get the logged in user's username
 */
export function getUserName() {
    return localStorage.getItem("journal-username") ?? "User";
}

export async function createAccount(email: string, username: string, password: string) {
    const key = await generateKey();

    try {
        const res = await postAPI("/create-account", {
            email,
            username,
            password,
            keyHash: await hashKey(key),
        });

        if (res.status == 409) {
            const reason = await res.text();
            if (reason == "email registered") {
                errorToast(
                    "An account belonging to this email already exists, log into that account instead.",
                );
            }
            if (reason == "username taken") {
                errorToast("This username is taken. Pick a different one!");
            }
            return false;
        }

        if (res.ok) {
            successToast("Account created successfully!");

            // save key to localstorage
            const json = JSON.stringify([...key]);
            localStorage.setItem("journal-key", json);

            syncDatabase();
            return true;
        }

        errorToast("Unexpected error while creating account. Try again later.");
    } catch (e) {
        console.error(e);
        errorToast("Couldn't reach server. Are you connected to the internet?");
    }

    return false;
}

export async function login(username: string, password: string) {
    try {
        const res = await postAPI("/login", {
            username,
            password,
        });

        if (res.status == 401) {
            errorToast("Invalid credentials.");
        }

        if (res.ok) {
            successToast("Re-logged in successfully!");
            syncDatabase();
            return true;
        }

        errorToast("Unexpected error while logging in. Try again later.");
    } catch (e) {
        console.error(e);
        errorToast("Couldn't reach server. Are you connected to the internet?");
    }
}

export async function unlinkAccount() {
    try {
        await postAPI("/logout", {});
    } catch (e) {
        console.error(e);
        errorToast("Couldn't reach server. Are you connected to the internet?");
        return;
    }
    localStorage.removeItem("journal-username");
    localStorage.removeItem("journal-key");
}
