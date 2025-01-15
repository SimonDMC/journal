import { Slide, toast } from "react-toastify";
import { API_URL, KEY_GENERATOR } from "./config";
import { today } from "@/components/calendar/Calendar";
import { decryptEntry } from "./encryption";

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
    const decryptPromises = [];
    let error = false;

    for (const entry of json.results) {
        decryptPromises.push(
            new Promise<void>(async (resolve, reject) => {
                const decoded = await decryptEntry(entry.content);
                if (!decoded) {
                    error = true;
                    console.log("Failed decrypting:", entry.content, entry.date);
                } else {
                    entry.content = decoded;
                }

                resolve();
            })
        );
    }

    await Promise.all(decryptPromises);

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
