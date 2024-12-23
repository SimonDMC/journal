import { Slide, toast } from "react-toastify";
import { API_URL, KEY_GENERATOR } from "./config";
import { today } from "@/components/calendar/Calendar";

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

export function download() {
    fetch(`${API_URL}/download?codeword=${sessionStorage.getItem("codeword")}`)
        .then((res) => res.json())
        .then(async (json) => {
            // decrypt entries
            const storedKey = localStorage.getItem("key");
            if (!storedKey) {
                toast.error("No key has been imported.", {
                    position: "top-right",
                    theme: "dark",
                    transition: Slide,
                });
                return;
            }
            const buffer = new Uint8Array(JSON.parse(storedKey));
            const key = await window.crypto.subtle.importKey("raw", buffer, KEY_GENERATOR, false, ["decrypt"]);

            let failed = false;
            for (const entry of json.results) {
                const data = new Uint8Array([...atob(entry.content)].map((c) => c.charCodeAt(0)));
                const iv = data.slice(0, 16);
                const encrypted = data.slice(16);
                try {
                    const decrypted = await window.crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, encrypted);
                    entry.content = new TextDecoder().decode(decrypted);
                } catch (err) {
                    console.error(err);
                    failed = true;
                }
            }

            if (failed) {
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
        })
        .catch((err) => {
            toast.error("Something went wrong :(", {
                position: "top-right",
                theme: "dark",
                transition: Slide,
            });
            console.error(err);
        });
}
