# Client-Server Sync Protocol

### Motivation

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
{
    "2025-01-01": "nyTx8YuJ+5jnYPp384fAlkzCPGI=",
    "2025-01-03": "EjA3zYOQrA/pUpaTf3iXX8RJSIc=",
    "2025-01-04": "dOVBO6wBnAPDvlXzuES8S+Cp3rQ=",
    "2025-01-05": "q4Q/dnmEkG/ZQqvZvoBtzDZY8jY="
}
```

Response:

```json
{
    "missing": [
        {
            "date": "2025-01-02",
            "data": "kd5E0VzrqLTT3pyEFmfLCKxTG0N5QgkbFreMyrH/1b/0az1vt8lJQUkfPojXTeoxpekTyGp7yCToogVgRhkzJo2TerxnQYUqLuYhCNKX1D6ebyWYWHPvieIJZMSx2kEHUEMOjz/f60E0pRlOPJZsB8lhW8ErxaNaJ1WXa6myUxk=",
            "hash": "DxyI6/eFsoC5r2Jpdpa/smZab40="
        }
    ],
    "differing": [
        {
            "date": "2025-01-03",
            "data": "HFet2WQIVrVJCin6fzaTtj8VI5SE5WehqEwAV4CvsN2m5gRA0FZ5idzVS99pnCcaZC7ehqs9TerCe83ACDTaxgKn8bRWd/459ymwQI3Wor8aYJYrcpyogGz1xdYp3t5fQh4V7xm+VoFISvTy0W8yhEXGRUl8xK2RV9vrOAgojP4=",
            "hash": "mAUVfM3abIvG2J5GgA4bSZFV+NM="
        },
        {
            "date": "2025-01-04",
            "data": "akOLcCbp4IHyCyDJ2ceLVI+uGBWhSqLc0Y+IvyWVRI6PsOtcW52m1phB9WX6CPRWDa9Bi8rhLdOTgQ//o8DY8+UzM6/Mb4rPeQP719b+9iPSCe5Qz1OC5ryqcF1QF1M3+6IRqmuvLAOCdG6zeiXYpHLudyK/qYWw0jMt7TE/feg=",
            "hash": "yxNPcXJacYAMfRPQnJYOT2gLdyQ="
        }
    ],
    "excess": ["2025-01-05"]
}
```

Client decrypts all `data` fields, effectively resulting in this payload:

```json
{
    "missing": [
        {
            "date": "2025-01-02",
            "content": "Hello world!",
            "extras": {
                "mood": 4
            },
            "last_modified": "2025-01-02T09:28:38.481Z",
            "hash": "DxyI6/eFsoC5r2Jpdpa/smZab40="
        }
    ],
    "differing": [
        {
            "date": "2025-01-03",
            "content": "Hello world, again!",
            "extras": {
                "mood": 5
            },
            "last_modified": "2025-01-03T09:28:38.481Z",
            "hash": "mAUVfM3abIvG2J5GgA4bSZFV+NM="
        },
        {
            "date": "2025-01-04",
            "content": "Hello world, forevermore.",
            "extras": {},
            "last_modified": "2025-01-04T09:28:38.481Z",
            "hash": "yxNPcXJacYAMfRPQnJYOT2gLdyQ="
        }
    ],
    "excess": ["2025-01-05"]
}
```

Client decides 2025-01-03 is newer on local, while 2025-01-04 is newer on remote. It therefore sends
over 2025-01-03 (out-of-date entry) and 2025-01-05 (completely missing in the database). It also
overrides its out-of-date entry for 2025-01-04 with the one received from the server.

`POST /api/server-sync`

```json
[
    {
        "date": "2025-01-03",
        "data": "Xi9kzAJmJchcxL12b9G98JoCW73GwyhhN9wR6wQIL6YkFsY41qRJK3kVBTeO6HforOkAb5XP9UJphjBMVRLSKZYU/457cJ8dEWc1/Rq7eH6uwNaQx46T1qx3XBpR4kcNqnGwug8p4mSqLBXqak/ZznwVkGHsbP55nk4kTt17HC4=",
        "hash": "EjA3zYOQrA/pUpaTf3iXX8RJSIc="
    },
    {
        "date": "2025-01-05",
        "data": "NbhZKY4YKm34Y217Pv0XJwCETs83NFAVgr6uXwbYGYPwNfO9uo3af43QnekPNRNP5cXyzoDUWTY5VNVmLn55xhu+0R6T3RvO7FmDZrpJLcaT4Zwl85q4AdNtYMiW7y9mSFBb6F3l88utxYZmDrDLYEWDJ5kv4WtaOz3tEkJmGNttgFy3NnkvQNNEE2eGyGNp",
        "hash": "q4Q/dnmEkG/ZQqvZvoBtzDZY8jY="
    }
]
```
