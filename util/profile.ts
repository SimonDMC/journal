import { Slide, toast } from "react-toastify";
import { API_URL } from "./config";
import { today } from "@/components/calendar/Calendar";
import { decryptEntry, encryptEntry } from "./encryption";

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
            localStorage.setItem("key", JSON.stringify(Array.from(imported)));
            toast.success("Key imported successfully!", {
                position: "top-right",
                theme: "dark",
                transition: Slide,
            });
            document.getElementById("keyless-bar")?.classList.add("hidden");
            document.querySelector(".stats")?.classList.remove("hidden");
            document.querySelector(".controls")?.classList.remove("hidden");
        };
        reader.readAsArrayBuffer(file);
    };
    input.click();
}

export function downloadKey() {
    const key = localStorage.getItem("key");
    if (!key) {
        toast.error("No key has been imported.", {
            position: "top-right",
            theme: "dark",
            transition: Slide,
        });
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
    const response = await fetch(`${API_URL}/download?codeword=${sessionStorage.getItem("codeword")}`);
    const json = await response.json();

    // decrypt entries
    let error = false;

    for (const entry of json.results) {
        const decrypted = await decryptEntry(entry.content);
        if (!decrypted) {
            error = true;
            console.log("Failed decrypting:", entry.content, entry.date);
        } else {
            entry.content = decrypted;
        }
    }

    if (error) {
        toast.warn("Failed to decrypt some entries.", {
            position: "top-right",
            theme: "dark",
            transition: Slide,
        });
    }

    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `journal-export-${today}.json`;
    a.click();
}

export async function upload() {
    if (
        !confirm(`
            This operation will wipe all your existing entries.
            Are you sure you want to continue?
        `)
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

            for (const entry of json.results) {
                const encrypted = await encryptEntry(entry.content);
                if (!encrypted) {
                    error = true;
                    console.log("Failed encrypting:", entry.content, entry.date);
                } else {
                    entry.content = encrypted;
                }
            }

            if (error) {
                toast.error("Failed to encrypt some entries.", {
                    position: "top-right",
                    theme: "dark",
                    transition: Slide,
                });
                return;
            }

            const res = await fetch(`${API_URL}/upload?codeword=${sessionStorage.getItem("codeword")}`, {
                method: "POST",
                body: JSON.stringify(json),
            });

            if (res.ok) {
                toast.success("Data imported successfully!", {
                    position: "top-right",
                    theme: "dark",
                    transition: Slide,
                });
            } else {
                toast.error("Failed to import.", {
                    position: "top-right",
                    theme: "dark",
                    transition: Slide,
                });
            }
        };
        reader.readAsText(file);
    };
    inputEl.click();
}
