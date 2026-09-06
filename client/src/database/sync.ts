import { db } from "./db";
import { decryptEntry, encryptEntry } from "../util/crypto";
import { warningToast } from "../util/toast";
import { eventTarget, OfflineModeEvent } from "../util/events";
import { logoutImperatively } from "../util/auth";
import type { EncryptedEntry } from "../types/entry";
import { calculateWords } from "../util/words";
import { postAPI } from "../services/api";

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
        clientSyncResponse = await postAPI("/client-sync", entries);

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

                return {
                    date: entry.date,
                    content: decrypted?.content ?? null,
                    extras: decrypted?.extras ?? {},
                    hash: entry.hash,
                    word_count: decrypted?.content ? calculateWords(decrypted.content) : 0,
                    last_modified: decrypted?.last_modified,
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

            const remoteTime = new Date(decrypted.last_modified).getTime();
            const localTime = new Date(localEntry.last_modified).getTime();

            // crucially, remote wins if the updated time is identical. otherwise we could get into
            // a loop where two clients have differing entries with the same timestamp and sync
            // keeps alternating between the two
            if (localTime > remoteTime) {
                // local wins
                console.log(
                    `Sync conflict at day ${localEntry.date} -- choosing local @ ${localEntry.last_modified} over remote @ ${decrypted.last_modified}`,
                );
                serverSyncEntries.push({
                    date: localEntry.date,
                    data: await encryptEntry(localEntry),
                    hash: localEntry.hash,
                });
            } else {
                // remote wins
                console.log(
                    `Sync conflict at day ${localEntry.date} -- choosing remote @ ${decrypted.last_modified} over local @ ${localEntry.last_modified}`,
                );
                await db.entries.delete(entry.date);

                const remoteEntry = {
                    date: entry.date,
                    content: decrypted.content,
                    hash: entry.hash,
                    extras: {},
                    word_count: calculateWords(decrypted.content),
                    last_modified: decrypted.last_modified,
                };
                // decrypted.extras should *never* be undefined, but it somehow happened to me
                if (decrypted.extras?.mood) remoteEntry.extras = { mood: decrypted.extras.mood };

                await db.entries.add(remoteEntry);
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
        const serverSyncResponse = await postAPI("/server-sync", serverSyncEntries);

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
        const res = await postAPI(`/entry/${date}`, {
            data: await encryptEntry(entry),
            hash: entry.hash,
        });

        return res.ok;
    } catch (error) {
        console.log(error);
        return false;
    }
}
