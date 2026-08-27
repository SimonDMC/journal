-- Migration number: 0004 	 2026-08-27T09:27:45.842Z

ALTER TABLE Entries RENAME TO Entries_v1;

CREATE TABLE Entries_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    data TEXT NOT NULL,
    hash TEXT
);

CREATE UNIQUE INDEX unique_user_date_v2 ON Entries_v2(user_id, date);

-- Unrelated to the entries table revamp but it's an unused column that should be removed
ALTER TABLE Users DROP COLUMN codeword_hash;