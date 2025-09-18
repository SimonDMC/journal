import { syncDatabase } from "../database/sync";
import { eventTarget, KeyCreateEvent } from "../util/events";
import { successToast, errorToast } from "../util/toast";

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
