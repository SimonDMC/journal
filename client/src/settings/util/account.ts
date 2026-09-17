import { syncDatabase } from "../../database/sync";
import { getAPI, postAPI } from "../../services/api";
import { QR_KEY_GENERATOR } from "../../util/config";
import { generateKey, hashKey } from "../../util/crypto";
import { CloseOpenPopupEvent, eventTarget, QRCodeOpenEvent } from "../../util/events";
import { errorToast, successToast } from "../../util/toast";
import QRCode from "QRCode";

/**
 * Get whether a user is logged in or not
 */
export function isLoggedIn(): boolean {
    return (
        localStorage.getItem("journal-username") != undefined &&
        localStorage.getItem("journal-key") != undefined
    );
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

        if (res.ok) return true;

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

export async function showQRCode() {
    const timestamp = Date.now();
    const keyHashRes = await getAPI(`/qr-hash?t=${timestamp}`);

    if (keyHashRes.status == 401) {
        errorToast("The QR code couldn't be generated. Are you logged in?");
    }

    if (keyHashRes.status == 406) {
        errorToast("The QR code couldn't be generated. Check if your system clock is sync.");
    }

    if (!keyHashRes.ok) return;

    const keyHashEncoded = await keyHashRes.text();
    const keyHash = Uint8Array.fromBase64(keyHashEncoded);
    const qrKey = await crypto.subtle.importKey("raw", keyHash, QR_KEY_GENERATOR, true, [
        "encrypt",
        "decrypt",
    ]);

    const keyString = localStorage.getItem("journal-key");
    if (!keyString) return;

    const data = new Uint8Array(JSON.parse(keyString));

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, qrKey, data);

    const buffer = new Uint8Array(encrypted);
    const result = new Uint8Array(iv.length + buffer.length);
    result.set(iv, 0);
    result.set(buffer, iv.length);

    const header = new Uint8Array([
        // JRNL identifier header
        0x4a,
        0x52,
        0x4e,
        0x4c,
        // timestamp used as server key id, decomposed into bytes
        timestamp % 256,
        Math.floor(timestamp / 256) % 256,
        Math.floor(timestamp / Math.pow(256, 2)) % 256,
        Math.floor(timestamp / Math.pow(256, 3)) % 256,
        Math.floor(timestamp / Math.pow(256, 4)) % 256,
        Math.floor(timestamp / Math.pow(256, 5)) % 256,
    ]);

    const payload = new Uint8Array([...header, ...result]);
    const canvas = document.createElement("canvas");
    QRCode.toDataURL(canvas, [{ mode: "byte", data: payload }], (err, url) => {
        eventTarget.dispatchEvent(new CloseOpenPopupEvent());
        eventTarget.dispatchEvent(new QRCodeOpenEvent({ url }));
    });
}
