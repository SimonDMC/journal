import Dexie, { type EntityTable } from "dexie";

interface Entry {
    date: string;
    content: string | null;
    hash: string | null;
    mood: number | null;
    location: number | null;
    word_count: number;
    last_modified: string;
}

const db = new Dexie("JournalDatabase") as Dexie & {
    entries: EntityTable<
        Entry,
        "date" // primary key "date" (for the typings only)
    >;
};

// Schema declaration:
db.version(1).stores({
    entries: "date, content, hash, mood, location, word_count, last_modified",
});

export type { Entry };
export { db };
