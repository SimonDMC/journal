import { db } from "../database/db";
import { syncDatabase } from "../database/sync";
import { postAPI } from "../services/api";
import { encryptEntry, hashEntry } from "../util/crypto";
import { today } from "../util/time";
import { errorToast, successToast } from "../util/toast";

export async function exportEntries() {
    const entries = await db.entries.toArray();

    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `journal-export-${today}.json`;
    a.click();
}

export async function uploadEntries() {
    if (
        !confirm(
            "This operation will wipe all your existing entries. Make sure you know what you're doing. Do you want to continue?",
        )
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

            // v0 exports have entries in {results: [...]}
            // v1+ exports have entries in [...]
            for (const entry of json.results ?? json) {
                let encrypted;
                try {
                    // remove location and move mood, if present (v1-)
                    delete entry.location;
                    entry.extras ??= {};
                    if (entry.mood) {
                        entry.extras = {
                            mood: entry.mood,
                        };
                    }
                    delete entry.mood;

                    encrypted = await encryptEntry(entry);

                    // recompute hash, we can't trust it
                    entry.hash = await hashEntry(entry);

                    // remove encrypted parameters
                    delete entry.content;
                    delete entry.extras;
                    delete entry.word_count;
                    delete entry.last_modified;
                } catch (error) {
                    hasError = true;
                    console.log(error);
                    console.log("Failed encrypting:", entry.content, entry.date);
                    continue;
                }

                entry.data = encrypted;
            }

            if (hasError) {
                errorToast("Failed to encrypt some entries.");
                return;
            }

            // wipe all local entries
            await db.entries.clear();

            const res = await postAPI("/upload", json.results ?? json);

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
