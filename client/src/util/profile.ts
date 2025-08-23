import { API_URL, KEY_GENERATOR } from "./config";
import { encryptEntry } from "./encryption";
import { db } from "../database/db";
import { syncDatabase } from "../database/sync";
import { errorToast, successToast } from "./toast";
import { today } from "./time";
import { eventTarget, KeyCreateEvent } from "./events";

export function uploadKey() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".key";
    input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            const imported = new Uint8Array(reader.result as ArrayBuffer);
            // save key into storage
            localStorage.setItem("journal-key", JSON.stringify(Array.from(imported)));
            successToast("Key imported successfully!");
            // let overview know key has been imported to hide warning and show stats
            eventTarget.dispatchEvent(new KeyCreateEvent());
            // immediately download all entries
            syncDatabase();
        };
        reader.readAsArrayBuffer(file);
    };
    input.click();
}

export function downloadKey() {
    const key = localStorage.getItem("journal-key");
    if (!key) {
        errorToast("No key has been imported.");
        return;
    }

    const blob = new Blob([new Uint8Array(JSON.parse(key))], { type: "application/octet-stream" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "JOURNAL_SECRET.key";
    a.click();
}

export async function download() {
    const entries = await db.entries.toArray();

    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `journal-export-${today}.json`;
    a.click();
}

export async function upload() {
    if (
        !confirm(`This operation will wipe all your existing entries.
Are you sure you want to continue?`)
    )
        return;

    const inputEl = document.createElement("input");
    inputEl.type = "file";
    inputEl.accept = ".json";
    inputEl.onchange = () => {
        if (!inputEl.files) return;
        const file = inputEl.files[0];
        const reader = new FileReader();
        reader.onload = async () => {
            // encrypt all entries
            const json = JSON.parse(reader.result as string);
            let error = false;

            // legacy exports have entries in {results: [...]}
            // new exports have entries in [...]
            for (const entry of json.results ?? json) {
                const encrypted = await encryptEntry(entry.content);
                if (!encrypted) {
                    error = true;
                    console.log("Failed encrypting:", entry.content, entry.date);
                } else {
                    entry.content = encrypted;
                }
            }

            if (error) {
                errorToast("Failed to encrypt some entries.");
                return;
            }

            // wipe all local entries
            await db.entries.clear();

            const res = await fetch(`${API_URL}/upload`, {
                method: "POST",
                body: JSON.stringify(json.results ?? json),
            });

            if (res.ok) {
                successToast("Data imported successfully!");
            } else {
                errorToast("Failed to import.");
            }

            await syncDatabase();
        };
        reader.readAsText(file);
    };
    inputEl.click();
}

export async function wipeLocalDatabase() {
    await db.entries.clear();
    successToast("Database wiped successfully.");
}

export async function changePassword() {
    const password = prompt("Set a new password:");
    if (!password) return;

    const res = await fetch(`${API_URL}/change-password`, {
        method: "POST",
        body: JSON.stringify({ password }),
    });

    if (res.ok) {
        successToast("Password changed successfully!");
    } else {
        errorToast("Failed to change password.");
    }
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

export function getOptions() {
    return JSON.parse(localStorage.getItem(`journal-options-${getUserName()}`) ?? "{}");
}
