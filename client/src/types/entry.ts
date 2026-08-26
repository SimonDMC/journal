export interface Entry {
    date: string;
    // null signifies deleted entry
    content: string | null;
    extras: EntryExtras;
    // null is used in deleted entries
    hash: string | null;
    word_count: number;
    last_modified: string;
}

export interface EntryExtras {
    // [key: string]: any
    mood?: number;
}

export interface EncryptedEntry {
    date: string;
    data: string | null;
    hash: string | null;
}

export interface EncryptedEntryData {
    content: string | null;
    extras: EntryExtras;
    last_modified: string;
}
