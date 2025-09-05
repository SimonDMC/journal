# Entry Hash Parameter

### Motivation

The client and the server need a reliable and dense way of communicating whether or not the stored
entries are identical.

### Format

The hash parameter is a Base64 SHA-1 hash of serialized JSON including the entry content, mood (if
applicable), and location (if applicable). The last character is truncated as it's always an equals
sign. Unencrypted content is used in the hash since encryption is not deterministic, which means it
is always computed by the client.

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
070f4d55b832efdf0d84d308f65c38f61f781987

Base64 hash:
Bw9NVbgy798NhNMI9lw49h94GYc=

Final hash:
Bw9NVbgy798NhNMI9lw49h94GYc
