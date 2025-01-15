# Client-Server sync protocol

### Purpose

Entries are primarily stored locally, but need to be synced with the server to make sure all devices
have the same data.

### Protocol

Whenever the overview page is loaded, data is taken locally and sync happens in the background.

The client sends a list of all entry dates it has along with their hashes.

The server responds with three lists:

1. Missing entries - entries that are stored on the server but which the client does not have
2. Differing entries - entries that are stored on both the server and the client, but whose hash
   does not match
3. Excess entries - entries that only the client has

The client saves all the entries from the Missing entries list, compares timestamps of differing
entries and for each of them decides whether to use the local version (and sends it back to the
server), or whether to accept the version from the server.

Finally, it sends over to the server the list of excess entries along with newer differing entries.

### Example

`POST /api/client-sync`

```json
[
    ["2025-01-01", "Nfv7B8vuaXEtMnICOmkUdPlBHvmsMaMtRyL9RksjNd8="],
    ["2025-01-03", "aTv/mFkGqjEkb3lLdA1/RqdLxkc4L5OsJWsQ/zzNmPA="],
    ["2025-01-04", "dXISXGXZKuQcOoZ24dzWwvAeIE7OX4P85eJ7GvsRuFU="],
    ["2025-01-05", "sbxRN4Nj4BOhZGO+ITPFHzSO3PksmPhqY34nGCqoeYM="]
]
```

Response:

```json
{
    "missing": [
        {
            "date": "2025-01-02",
            "content": "NuStGqHaes3yxBzUhZ/PBUg+fBlnUOUUvFY4Vse46JQ=",
            "mood": 4,
            "location": null,
            "word_count": 2,
            "last_modified": "2025-01-02T09:28:38.481Z",
            "hash": "iobE7s8SRG/yc6/APhs6CakR0LeYHbGvWMtFxDkWEpU="
        }
    ],
    "differing": [
        {
            "date": "2025-01-03",
            "content": "Unez6azoLXYY1VDiDKsrXXseyqknNAUA2oocplBAb94=",
            "mood": 5,
            "location": 1,
            "word_count": 3,
            "last_modified": "2025-01-03T09:28:38.481Z",
            "hash": "ZgnWKVdtXMwvZ2ee8d34Z2FdVSHX9csntsWIrUDt3ko="
        },
        {
            "date": "2025-01-04",
            "content": "n87nMHcIH5t+I2C6Wb/YirRqsSYfcgWNWOVrFazGc0M=",
            "mood": 1,
            "location": 4,
            "word_count": 3,
            "last_modified": "2025-01-04T09:28:38.481Z",
            "hash": "sh/Iz7zXzOaFPxxZj1sE7wTMfdlPRZ/4yDBEgCVVbnQ="
        }
    ],
    "excess": ["2025-01-05"]
}
```

Client decides 2025-01-03 is newer local, 2025-01-04 is newer remote

`POST /api/server-sync`

```json
[
    {
        "date": "2025-01-03",
        "content": "wvZIsLi58Suj/xXKOl7IR52h28xi3vCKT08F+Iizz/U=",
        "mood": 2,
        "location": null,
        "word_count": 3,
        "last_modified": "2025-01-03T10:28:38.481Z",
        "hash": "8PWkivuSFk8FX7QbsVSagU93gLhAq25qeBpRHyH1q4M="
    },
    {
        "date": "2025-01-05",
        "content": "HP45wWuBKGYTIkvmSr7ZlF24i1Zt9Mg0bm1gpp5Tg2c=",
        "mood": 4,
        "location": null,
        "word_count": 3,
        "last_modified": "2025-01-05T09:28:38.481Z",
        "hash": "TElSpdwRANa8r8J1zAIJj6iKZ3gG9ioLtUeGnSNAW88="
    }
]
```
