-- Migration number: 0003 	 2025-01-18T10:16:12.546Z

CREATE UNIQUE INDEX IF NOT EXISTS unique_user_date ON Entries(user_id, date);