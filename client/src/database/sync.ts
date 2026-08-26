import { db } from "./db";
import { API_URL } from "../util/config";
import { decryptEntry, encryptEntry } from "../util/encryption";
import { warningToast } from "../util/toast";
import { eventTarget, OfflineModeEvent } from "../util/events";
import { logoutImperatively } from "../util/auth";
import type { EncryptedEntry, EncryptedEntryData } from "../types/entry";
import { calculateWords } from "../util/words";

interface ClientSyncBody {
    // deleted entries have a null hash
    [key: string]: string | null;
}

interface ClientSyncResponse {
    missing: EncryptedEntry[];
    differing: EncryptedEntry[];
    excess: string[];
}

export async function syncDatabase() {
    // don't sync if no key is set
    if (!localStorage.getItem("journal-key")) return;

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

        if (clientSyncResponse.status == 401) {
            // unauthorized! log out
            logoutImperatively();
        } else if (!clientSyncResponse.ok) {
            throw new Error();
        }
    } catch {
        // show offline mode badge
        eventTarget.dispatchEvent(new OfflineModeEvent());
        return;
    }

    const json = (await clientSyncResponse.json()) as ClientSyncResponse;
    console.log(json);

    // 3. Save all missing entries locally
    try {
        const missingEntriesSync = await Promise.all(
            json.missing.map(async (entry: EncryptedEntry) => {
                const decrypted = await decryptEntry(entry.data);
                const entryData = JSON.parse(decrypted!) as EncryptedEntryData;

                return {
                    date: entry.date,
                    content: entryData.content,
                    extras: entryData.extras,
                    hash: entry.hash,
                    word_count: calculateWords(entryData.content),
                    last_modified: entryData.last_modified,
                };
            }),
        );

        await db.entries.bulkAdd(missingEntriesSync);
    } catch (e) {
        console.error(e);
        warningToast("Sync failed (adding)");
        return;
    }

    // 4. Decide based off last modification date which version of differing entries to use
    const serverSyncEntries: EncryptedEntry[] = [];
    for (const entry of json.differing) {
        const localEntry = await db.entries.get(entry.date);
        if (!localEntry) {
            warningToast("Sync failed (desynced?)");
            return;
        }

        try {
            const decrypted = await decryptEntry(entry.data);
            const entryData = JSON.parse(decrypted!) as EncryptedEntryData;

            const remoteTime = new Date(entryData.last_modified).getTime();
            const localTime = new Date(localEntry.last_modified).getTime();

            // crucially, remote wins if the updated time is identical. otherwise we could get into
            // a loop where two clients have differing entries with the same timestamp and sync
            // keeps alternating between the two
            if (localTime > remoteTime) {
                // local wins
                console.log(
                    `Sync conflict at day ${localEntry.date} -- choosing local @ ${localEntry.last_modified} over remote @ ${entryData.last_modified}`,
                );
                serverSyncEntries.push({
                    date: localEntry.date,
                    data: await encryptEntry(localEntry),
                    hash: localEntry.hash,
                });
            } else {
                // remote wins
                console.log(
                    `Sync conflict at day ${localEntry.date} -- choosing remote @ ${entryData.last_modified} over local @ ${localEntry.last_modified}`,
                );
                await db.entries.delete(entry.date);

                await db.entries.add({
                    date: entry.date,
                    content: entryData.content,
                    hash: entry.hash,
                    extras: {},
                    word_count: calculateWords(entryData.content),
                    last_modified: entryData.last_modified,
                });
            }
        } catch (error) {
            console.log(error);
            warningToast("Sync failed (decryption)");
            return;
        }
    }

    // 5. Compile excess entries
    for (const date of json.excess) {
        const localEntry = await db.entries.get(date);
        if (!localEntry) {
            warningToast("Sync failed (desynced?)");
            return;
        }

        try {
            serverSyncEntries.push({
                date: localEntry.date,
                data: await encryptEntry(localEntry),
                hash: localEntry.hash,
            });
        } catch (error) {
            console.log(error);
            warningToast("Sync failed (encryption)");
            return;
        }
    }

    // 6. Send over excess and new local entries to server
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

export async function syncEntry(date: string): Promise<boolean> {
    const entry = await db.entries.get(date);
    if (!entry) return false;

    try {
        const res = await fetch(`${API_URL}/entry/${date}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                data: await encryptEntry(entry),
                hash: entry.hash,
            }),
        });

        return res.ok;
    } catch (error) {
        console.log(error);
        return false;
    }
}
