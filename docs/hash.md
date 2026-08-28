# Entry Hash Parameter

### Motivation

The client and the server need a reliable and dense way of communicating whether or not the stored
entries are identical.

### Format

The hash parameter is a Base64 SHA-1 hash of serialized JSON of the entry, limited to the content
and extras subproperties. Unencrypted content is used in the hash since the encryption algorithm,
AES-CBC, gives (by design) a different ciphertext every time the content is encrypted. If we were to
use the encrypted content instead of the plaintext one in the hashing process, we would thus also
need to store the encrypted content on the client (to ensure the hashes match and we don't recompute
the ciphertext, resulting in a different one). Since we're using plaintext, the hash has to always
be computed on the client.

### Example:

Entry:

```json
{
    "date": "2025-01-01",
    "content": "Entry Content",
    "extras": {
        "mood": 4
    },
    "word_count": 2,
    "last_modified": "2025-01-01T00:00:00.000Z"
}
```

To be hashed:
`{"content":"Entry Content","extras":{"mood":4}}`

Base64 hash:
tKTZYqsGzyY1yhO6G9WHuh60nZA=
