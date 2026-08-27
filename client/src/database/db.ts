import Dexie, { type EntityTable } from "dexie";
import type { Entry } from "../types/entry";

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
// removing indices on unnecessary properties
db.version(2)
    .stores({
        entries: "date",
    })
    .upgrade((tx) => {
        // remove location, move mood, init extras
        return tx
            .table("entries")
            .toCollection()
            .modify((entry) => {
                entry.extras = {};
                if (entry.mood) entry.extras.mood = entry.mood;
                delete entry.mood;
                delete entry.location;
            });
    });

export { db };
