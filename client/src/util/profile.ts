import { KEY_GENERATOR } from "./config";
import { db } from "../database/db";
import { successToast } from "./toast";

export async function wipeLocalDatabase() {
    await db.entries.clear();
    successToast("Database wiped successfully.");
}

export async function generateKey() {
    if (localStorage.getItem("journal-key")) {
        if (!confirm("You already have a key saved. Are you sure you want to generate a new one?")) return;
    }

    const key = await window.crypto.subtle.generateKey(KEY_GENERATOR, true, ["encrypt", "decrypt"]);
    const exported = await window.crypto.subtle.exportKey("raw", key);
    const buffer = new Uint8Array(exported);
    const json = JSON.stringify([...buffer]);
    localStorage.setItem("journal-key", json);

    successToast("Key generated!");
}

export function getUserName() {
    return localStorage.getItem("journal-username") ?? "User";
}

export function getSettings() {
    return JSON.parse(localStorage.getItem(`journal-options-${getUserName()}`) ?? "{}");
}
