-- Migration number: 0005 	 2026-09-12T08:58:59.289Z

ALTER TABLE Users ADD email TEXT;
ALTER TABLE Users ADD key_hash TEXT;
ALTER TABLE Users ADD reset_token TEXT;
ALTER TABLE Users ADD reset_token_sent_at DATETIME;

CREATE UNIQUE INDEX username_idx ON Users(username);
CREATE UNIQUE INDEX email_idx ON Users(email);

-- Not sure why this index didn't exist but better late than never
CREATE UNIQUE INDEX session_idx ON Sessions(token);