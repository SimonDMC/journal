import { db } from "./db";
import { useSettings } from "../state/settings";
import { decryptText, encryptEntry, hashEntry } from "../util/crypto";
import { successToast, warningToast } from "../util/toast";
import { calculateWords } from "../util/words";
import type { EncryptedEntry, EntryExtras } from "../types/entry";
import { postAPI } from "../services/api";

const migrationMap = new Map<string, () => Promise<MigrationResponse>>([
    ["0.0.8", v0_0_8_fixWordCount],
    ["0.0.13", v0_0_13_fixLocalStorageKeys],
    ["0.0.17", v0_0_17_migrateSettings],
    ["0.0.28", v0_0_28_migrateEntries],
]);

type MigrationResponse = {
    success: boolean;
    message?: string;
    reload?: boolean;
};

// Run all available migrations
export async function runMigrations() {
    const completeMigrations = JSON.parse(
        localStorage.getItem("journal-migrations") ?? "[]",
    ) as string[];

    let migrationsDone = 0;
    let shouldReload = false;
    for (const [version, callback] of migrationMap) {
        // only run if it hasn't been done previously
        if (!completeMigrations.includes(version)) {
            // run migration
            console.log(`Running migration for ${version}!`);

            const response = await callback();

            if (response.success) {
                migrationsDone++;
                completeMigrations.push(version);
                if (response.message) successToast(response.message);
                if (response.reload) shouldReload = true;
            } else {
                if (response.message) warningToast(response.message);
            }
        }
    }

    // update done migrations if any were ran
    if (migrationsDone)
        localStorage.setItem("journal-migrations", JSON.stringify(completeMigrations));
    // reload page if any migration requested it
    if (shouldReload) window.location.reload();
}

// === MIGRATIONS ===

// recalculate all word counts and sync necessary ones
async function v0_0_8_fixWordCount(): Promise<MigrationResponse> {
    const miscalculatedEntries: EncryptedEntry[] = [];

    // compile list of entries with wrong word counts (and recalculate them)
    for (const entry of await db.entries.toArray()) {
        const correctWordCount = calculateWords(entry.content);
        if (entry.word_count != correctWordCount) {
            entry.word_count = correctWordCount;

            try {
                miscalculatedEntries.push({
                    date: entry.date,
                    data: await encryptEntry(entry),
                    hash: entry.hash,
                });
            } catch {
                return { success: false, message: "Word count fix failed (encryption)" };
            }

            await db.entries.update(entry.date, { word_count: entry.word_count });
        }
    }

    // do nothing if there are no miscalculated entries
    if (miscalculatedEntries.length == 0) {
        return { success: true };
    }

    // remote sync to make sure it's really synced
    try {
        await postAPI("/server-sync", miscalculatedEntries);
    } catch (e) {
        console.error(e);
        return { success: false, message: "Couldn't reach server for fixing word counts!" };
    }

    // show toast if any changes were made
    return { success: true, message: "Successfully fixed word counts!" };
}

// rename all localStorage and sessionStorage keys to include journal- prefix
async function v0_0_13_fixLocalStorageKeys(): Promise<MigrationResponse> {
    const key = localStorage.getItem("key");
    if (key) {
        localStorage.removeItem("key");
        localStorage.setItem("journal-key", key);
    }

    const username = localStorage.getItem("username");
    if (username) {
        localStorage.removeItem("username");
        localStorage.setItem("journal-username", username);
    }

    const loggedIn = localStorage.getItem("logged-in");
    if (loggedIn) {
        localStorage.removeItem("logged-in");
        localStorage.setItem("journal-logged-in", loggedIn);
    }

    const options = localStorage.getItem(`options-${username}`);
    if (options) {
        localStorage.removeItem(`options-${username}`);
        localStorage.setItem(`journal-options-${username}`, options);
    }

    const twofaAuthed = sessionStorage.getItem("2fa-authed");
    if (twofaAuthed) {
        sessionStorage.removeItem("2fa-authed");
        sessionStorage.setItem("journal-2fa-authed", twofaAuthed);
    }

    const codeword = sessionStorage.getItem("codeword");
    if (codeword) {
        sessionStorage.removeItem("codeword");
        sessionStorage.setItem("journal-codeword", codeword);
    }

    const month = sessionStorage.getItem("month");
    if (month) {
        sessionStorage.removeItem("month");
        sessionStorage.setItem("journal-month", month);
    }

    return { success: true, reload: true };
}

// migrate to new settings system
async function v0_0_17_migrateSettings(): Promise<MigrationResponse> {
    const username = localStorage.getItem("journal-username");
    const settings = localStorage.getItem(`journal-options-${username}`);

    if (username && settings) {
        // delete old settings
        localStorage.removeItem(`journal-options-${username}`);

        const parsedSettings = JSON.parse(settings);

        // copy over settings
        const settingsState = useSettings.getState();
        if (parsedSettings["2fa_method"] == 1)
            settingsState.setSetting("security.secondary_auth", "codeword");
        if (parsedSettings["2fa_method"] == 2)
            settingsState.setSetting("security.secondary_auth", "passkey");
        if (parsedSettings.codeword)
            settingsState.setSetting("data.codeword_hash", parsedSettings.codeword);
        if (parsedSettings.passkey)
            settingsState.setSetting("data.passkey", parsedSettings.passkey);
    }

    return { success: true, reload: true };
}

interface Entry_v1 {
    date: string;
    content: string | null;
    hash: string | null;
    mood: number | null;
    location: number | null;
    word_count: number;
    last_modified: string;
}
// migrate all entries in remote database from v1 to v2 format
async function v0_0_28_migrateEntries(): Promise<MigrationResponse> {
    try {
        const pullRes = await postAPI("/migrate/entries-v2-pull", {});
        const dbEntries = (await pullRes.json()) as Entry_v1[];

        // migration was already done, do nothing
        if (dbEntries.length == 0) return { success: true };

        const migratedEntries: EncryptedEntry[] = [];
        for (const entry of dbEntries) {
            entry.content = await decryptText(entry.content);

            const migratedEntry = {
                date: entry.date,
                content: entry.content,
                extras: {} as EntryExtras,
                word_count: entry.word_count,
                last_modified: entry.last_modified,
                hash: null,
            };
            if (entry.mood) migratedEntry.extras.mood = entry.mood;

            migratedEntries.push({
                date: entry.date,
                data: await encryptEntry(migratedEntry),
                hash: await hashEntry(migratedEntry),
            });
        }

        const pushRes = await postAPI("/migrate/entries-v2-push", migratedEntries);

        if (pushRes.ok)
            return { success: true, message: "Successfully upgraded all database entries." };

        return { success: false, message: "Couldn't upgrade database entries to v2." };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Couldn't upgrade database entries to v2." };
    }
}
