import Dexie, { type EntityTable } from "dexie";
import type { Entry } from "../types/entry";
import { hashEntry } from "../util/crypto";

const db = new Dexie("JournalDatabase") as Dexie & {
    entries: EntityTable<
        Entry,
        "date" // primary key "date" (for the typings only)
    >;
};

// V1, January 2025
db.version(1).stores({
    entries: "date, content, hash, mood, location, word_count, last_modified",
});

// V2, August 2026 - full removal of location, extracting mood into a more generic "extras" object,
// removing indices on unnecessary properties, simplifying hash protocol
db.version(2)
    .stores({
        entries: "date",
    })
    .upgrade(async (tx) => {
        const entries = await tx.table("entries").toArray();

        // remove location, move mood, init extras
        for (const entry of entries) {
            entry.extras = {};
            if (entry.mood) entry.extras.mood = entry.mood;
            delete entry.mood;
            delete entry.location;

            // recompute hash
            entry.hash = await hashEntry(entry);
        }

        await tx.table("entries").bulkPut(entries);
    });

export { db };
