import { Slide, toast } from "react-toastify";
import { db } from "./db";
import { API_URL } from "@/util/config";
import { decryptEntry, encryptEntry } from "@/util/encryption";

type ClientSyncBody = {
    [key: string]: string;
};

export async function syncDatabase() {
    // 1. Compile a list of entries with their hashes
    const entries: ClientSyncBody = {};

    for (const entry of await db.entries.toArray()) {
        entries[entry.date] = entry.hash;
    }

    // 2. Send API sync request with existing entry hashes, server responds with:
    // - missing entries
    // - differing entries
    // - excess entries

    const clientSyncResponse = await fetch(`${API_URL}/client-sync?codeword=${sessionStorage.getItem("codeword")}`, {
        method: "POST",
        body: JSON.stringify(entries),
    });

    if (!clientSyncResponse.ok) {
        toast.error("Sync failed (client request)", {
            position: "top-right",
            theme: "dark",
            transition: Slide,
        });
        return;
    }

    const json = await clientSyncResponse.json();
    console.log(json);

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

        try {
            await db.entries.add({
                date: entry.date,
                content: decrypted,
                hash: entry.hash,
                mood: entry.mood,
                location: entry.location,
                word_count: entry.word_count,
                last_modified: entry.last_modified,
            });
        } catch (e) {
            console.error(e);
            toast.error("Sync failed (adding)", {
                position: "top-right",
                theme: "dark",
                transition: Slide,
            });
            return;
        }
    }

    // 4. Decide based off last modification date which version of differing entries to use
    let serverSyncEntries = [];
    for (const entry of json.differing) {
        const localEntry = await db.entries.get(entry.date);
        if (!localEntry) {
            toast.error("Sync failed (desynced?)", {
                position: "top-right",
                theme: "dark",
                transition: Slide,
            });
            return;
        }

        const remoteTime = new Date(entry.last_modified).getTime();
        const localTime = new Date(localEntry.last_modified).getTime();

        if (localTime >= remoteTime) {
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
            toast.error("Sync failed (desynced?)", {
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

    if (serverSyncEntries.length > 0) {
        const serverSyncResponse = await fetch(`${API_URL}/server-sync?codeword=${sessionStorage.getItem("codeword")}`, {
            method: "POST",
            body: JSON.stringify(serverSyncEntries),
        });

        if (!serverSyncResponse.ok) {
            toast.error("Sync failed (server request)", {
                position: "top-right",
                theme: "dark",
                transition: Slide,
            });
            return;
        }
    }
}

export async function syncEntry(date: string) {
    const entry = await db.entries.get(date);
    if (!entry) return false;

    const encryptedContent = await encryptEntry(entry.content);
    if (!encryptedContent) return false;

    fetch(`${API_URL}/entry/${date}?codeword=${sessionStorage.getItem("codeword")}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            content: encryptedContent,
            mood: entry.mood,
            location: entry.location,
            // word count has to be sent because you can't recalculate it once encrypted
            word_count: entry.word_count,
            hash: entry.hash,
        }),
    })
        .then((res) => {
            return res.ok;
        })
        .catch((err) => {
            console.error(err);
            return true;
        });
}
