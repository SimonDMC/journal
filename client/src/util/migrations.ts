import { db } from "../database/db";
import { API_URL } from "./config";
import { encryptEntry } from "./encryption";
import { successToast, warningToast } from "./toast";
import { calculateWords } from "./words";

const migrationMap = new Map<string, () => Promise<MigrationResponse>>([["0.0.8", v0_0_8_fixWordCount]]);

type MigrationResponse = {
    success: boolean;
    message?: string;
};

// Run all available migrations
export async function runMigrations() {
    const completeMigrations = JSON.parse(localStorage.getItem("journal-migrations") ?? "[]") as string[];

    let migrationsDone = 0;
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
            } else {
                if (response.message) warningToast(response.message);
            }
        }
    }

    // update done migrations if any were ran
    if (migrationsDone) localStorage.setItem("journal-migrations", JSON.stringify(completeMigrations));
}

// === MIGRATIONS ===

// recalculate all word counts and sync necessary ones
async function v0_0_8_fixWordCount(): Promise<MigrationResponse> {
    const miscalculatedEntries = [];

    // compile list of entries with wrong word counts (and recalculate them)
    for (const entry of await db.entries.toArray()) {
        const correctWordCount = calculateWords(entry.content);
        if (entry.word_count != correctWordCount) {
            const encryptedContent = await encryptEntry(entry.content);
            if (!encryptedContent) return { success: false, message: "Word count fix failed (encryption)" };

            entry.content = encryptedContent;
            entry.word_count = correctWordCount;

            miscalculatedEntries.push(entry);
        }
    }

    // remote sync first to make sure it's really synced
    try {
        await fetch(`${API_URL}/server-sync`, {
            method: "POST",
            body: JSON.stringify(miscalculatedEntries),
        });
    } catch (e) {
        console.error(e);
        return { success: false, message: "Couldn't reach server for fixing word counts!" };
    }

    // update local entries
    for (const entry of miscalculatedEntries) {
        await db.entries.update(entry.date, { word_count: entry.word_count });
    }

    // only show toast if any changes were made
    if (miscalculatedEntries.length) {
        return { success: true, message: "Successfully fixed word counts!" };
    } else {
        return { success: true };
    }
}
