import { db } from "./db";
import { API_URL } from "../util/config";
import { decryptEntry, encryptEntry } from "../util/encryption";
import { warningToast } from "../util/toast";
import { eventTarget, OfflineModeEvent } from "../util/events";

type ClientSyncBody = {
    [key: string]: string;
};

export async function syncDatabase() {
    // don't sync if no key is set
    if (!localStorage.getItem("key")) return;

    // 1. Compile a list of entries with their hashes
    const entries: ClientSyncBody = {};

    for (const entry of await db.entries.toArray()) {
        entries[entry.date] = entry.hash;
    }

    // 2. Send API sync request with existing entry hashes, server responds with:
    // - missing entries
    // - differing entries
    // - excess entries

    let clientSyncResponse;
    try {
        clientSyncResponse = await fetch(`${API_URL}/client-sync`, {
            method: "POST",
            body: JSON.stringify(entries),
        });

        if (!clientSyncResponse.ok) {
            throw new Error();
        }
    } catch {
        // show offline mode badge
        eventTarget.dispatchEvent(new OfflineModeEvent());
        return;
    }

    const json = await clientSyncResponse.json();
    console.log(json);

    // 3. Save all missing entries locally
    for (const entry of json.missing) {
        const decrypted = await decryptEntry(entry.content);
        if (decrypted === null) {
            warningToast("Sync failed (decryption)");
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
            warningToast("Sync failed (adding)");
            return;
        }
    }

    // 4. Decide based off last modification date which version of differing entries to use
    const serverSyncEntries = [];
    for (const entry of json.differing) {
        const localEntry = await db.entries.get(entry.date);
        if (!localEntry) {
            warningToast("Sync failed (desynced?)");
            return;
        }

        const remoteTime = new Date(entry.last_modified).getTime();
        const localTime = new Date(localEntry.last_modified).getTime();

        // crucially, remote wins if the updated time is identical. otherwise we could get into
        // a loop where two clients have differing entries with the same timestamp and sync
        // keeps alternating between the two
        if (localTime > remoteTime) {
            // local wins
            serverSyncEntries.push(localEntry);
        } else {
            // remote wins
            await db.entries.delete(entry.date);

            const decrypted = await decryptEntry(entry.content);
            if (decrypted === null) {
                warningToast("Sync failed (decryption)");
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
            warningToast("Sync failed (desynced?)");
            return;
        }

        serverSyncEntries.push(localEntry);
    }

    // 6. Encrypt entries and send over to server
    for (const entry of serverSyncEntries) {
        const encryptedContent = await encryptEntry(entry.content);
        if (!encryptedContent) {
            warningToast("Sync failed (encryption)");
            return;
        }

        entry.content = encryptedContent;
    }

    if (serverSyncEntries.length > 0) {
        const serverSyncResponse = await fetch(`${API_URL}/server-sync`, {
            method: "POST",
            body: JSON.stringify(serverSyncEntries),
        });

        if (!serverSyncResponse.ok) {
            warningToast("Sync failed (server request)");
            return;
        }
    }
}

export async function syncEntry(date: string) {
    const entry = await db.entries.get(date);
    if (!entry) return false;

    const encryptedContent = await encryptEntry(entry.content);
    if (!encryptedContent) return false;

    fetch(`${API_URL}/entry/${date}`, {
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
        .catch(() => {
            // silently ignore not being able to sync
            // (is this a good idea? possibly revisit later)
            return false;
        });
}
