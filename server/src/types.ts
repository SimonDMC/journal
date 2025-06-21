export type DatelessEntry = {
    content: string;
    mood?: number;
    location?: string;
    word_count: number;
    hash?: string;
};

export type Entry = {
    date: string;
} & DatelessEntry;

type Timestamp = {
    last_modified: string;
};

export type DatelessEntryWithTimestamp = DatelessEntry & Timestamp;

export type EntryWithTimestamp = Entry & Timestamp;
