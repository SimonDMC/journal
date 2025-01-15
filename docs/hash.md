# Entry Hash Parameter

### Purpose

The client and the server need a reliable and dense way of communicating whether or not the stored
entries are identical.

### Format

The hash parameter is a Base64 SHA-1 hash of serialized JSON including the entry content, mood (if
applicable), and location (if applicable). Unencrypted content is used in the hash since encryption
is not deterministic, which means it is always computed by the client.

### Example:

Entry:

```json
{
    "date": "2025-01-01",
    "content": "Entry Content",
    "mood": 4,
    "location": null,
    "word_count": 2,
    "last_modified": "2025-01-01T09:28:38.481Z"
}
```

To be hashed:
`{"content":"Entry Content","mood":4}`

Hex hash:
022af9cb7c106b4c1235b11f641c3a5f7a7d71cc18d1768461a7fd3a6276a7bf

Final hash:
Air5y3wQa0wSNbEfZBw6X3p9ccwY0XaEYaf9OmJ2p78=
