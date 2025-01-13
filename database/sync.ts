import { Slide, toast } from "react-toastify";
import { db } from "./db";
import { API_URL } from "@/util/config";
import { decryptEntry, encryptEntry } from "@/util/encryption";

export async function syncDatabase() {
    // 1. Compile a list of entries with their hashes
    const entries = (await db.entries.toArray()).map((entry) => {
        return [entry.date, entry.hash];
    });

    // 2. Send API sync request with existing entry hashes, server responds with:
    // - missing entries
    // - differing entries
    // - excess entries

    const response = await fetch(`${API_URL}/client-sync`, {
        method: "POST",
        body: JSON.stringify(entries),
    });
    const json = await response.json();

    if (!json) {
        toast.error("Sync failed (request)", {
            position: "top-right",
            theme: "dark",
            transition: Slide,
        });
        return;
    }

    // 3. Save all missing entries locally
    for (const entry of json.missing) {
        const decrypted = await decryptEntry(entry.content);
        if (!decrypted) {
            toast.error("Sync failed (decryption)", {
                position: "top-right",
                theme: "dark",
                transition: Slide,
            });
            return;
        }

        await db.entries.add({
            date: entry.date,
            content: decrypted,
            hash: entry.hash,
            mood: entry.mood,
            location: entry.location,
            word_count: entry.word_count,
            last_modified: entry.last_modified,
        });
    }

    // 4. Decide based off last modification date which version of differing entries to use
    let serverSyncEntries = [];
    for (const entry of json.differing) {
        const localEntry = await db.entries.get(entry.date);
        if (!localEntry) {
            toast.error("Sync failed (desync)", {
                position: "top-right",
                theme: "dark",
                transition: Slide,
            });
            return;
        }

        const remoteTime = new Date(entry.last_modified).getTime();
        const localTime = new Date(localEntry.last_modified).getTime();

        if (localTime > remoteTime) {
            // local wins
            serverSyncEntries.push(localEntry);
        } else {
            // remote wins
            await db.entries.delete(entry.date);

            const decrypted = await decryptEntry(entry.content);
            if (!decrypted) {
                toast.error("Sync failed (decryption)", {
                    position: "top-right",
                    theme: "dark",
                    transition: Slide,
                });
                return;
            }

            await db.entries.add({
                date: entry.date,
                content: decrypted,
                hash: entry.hash,
                mood: entry.mood,
                location: entry.location,
                word_count: entry.word_count,
                last_modified: entry.last_modified,
            });
        }
    }

    // 5. Compile excess entries
    for (const date of json.excess) {
        const localEntry = await db.entries.get(date);
        if (!localEntry) {
            toast.error("Sync failed (desync)", {
                position: "top-right",
                theme: "dark",
                transition: Slide,
            });
            return;
        }

        serverSyncEntries.push(localEntry);
    }

    // 6. Encrypt entries and send over to server
    for (const entry of serverSyncEntries) {
        const encryptedContent = await encryptEntry(entry.content);
        if (!encryptedContent) {
            toast.error("Sync failed (encryption)", {
                position: "top-right",
                theme: "dark",
                transition: Slide,
            });
            return;
        }

        entry.content = encryptedContent;
    }
}
