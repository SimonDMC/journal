import { syncDatabase } from "../../database/sync";
import { getAPI } from "../../services/api";
import { generateKey, hashKey } from "../../util/crypto";
import { successToast, errorToast } from "../../util/toast";
import { useSettings } from "./state";

export async function generateAndSaveKey() {
    if (localStorage.getItem("journal-key")) {
        if (!confirm("You already have a key saved. Are you sure you want to generate a new one?"))
            return;
    }

    const buffer = await generateKey();
    const json = JSON.stringify([...buffer]);
    localStorage.setItem("journal-key", json);

    successToast("Key generated!");
}

export async function showKeyHash() {
    const storedKey = localStorage.getItem("journal-key");
    if (!storedKey) {
        alert("No key saved.");
        return;
    }

    const keyBuffer = new Uint8Array(JSON.parse(storedKey));
    alert(`Your key hash: ${hashKey(keyBuffer)}\nThis is safe to share.`);
}

export function forceUploadKey() {
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
            // immediately download all entries
            syncDatabase();
        };
        reader.readAsArrayBuffer(file);
    };
    input.click();
}

export function uploadKey() {
    return new Promise((resolve) => {
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
                const uploadedKeyHash = await hashKey(imported);
                const expectedKeyRes = await getAPI("/key-hash");
                const expectedKeyHash = await expectedKeyRes.text();

                if (uploadedKeyHash != expectedKeyHash) {
                    errorToast(
                        "Your imported key didn't match the expected key hash. Did you select the right file?",
                    );
                    resolve(false);
                    return;
                }

                // save key into storage
                localStorage.setItem("journal-key", JSON.stringify(Array.from(imported)));
                successToast("Key imported successfully!");
                // immediately download all entries
                syncDatabase();
                resolve(true);
            };
            reader.readAsArrayBuffer(file);
        };
        input.click();
    });
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

    // dismiss key download alert
    useSettings.getState().setSetting("alert.key_irrecoverability", false);
}
