import { db } from "../database/db";
import { syncDatabase } from "../database/sync";
import { API_URL } from "../util/config";
import { encryptEntry } from "../util/encryption";
import { today } from "../util/time";
import { errorToast, successToast } from "../util/toast";

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
            let hasError = false;

            // legacy exports have entries in {results: [...]}
            // new exports have entries in [...]
            for (const entry of json.results ?? json) {
                let encrypted;
                try {
                    encrypted = await encryptEntry(entry.content);
                } catch (error) {
                    hasError = true;
                    console.log(error);
                    console.log("Failed encrypting:", entry.content, entry.date);
                    continue;
                }

                entry.content = encrypted;
            }

            if (hasError) {
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
