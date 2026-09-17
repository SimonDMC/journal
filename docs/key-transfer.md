# Key transferring between devices

### Motivation

When adding a new device to journal, the old device needs to share its encryption key in a simple
and secure manner.

### Rationale

Since we want to never upload the encryption key to the server in plaintext, the clients need to
either communicate via the server through an encrypted channel, or communicate directly. A possible
pathway for the first paradigm would be pairing up the clients via a one-time code, performing
Diffie-Hellman using the server as an insecure channel, and then sending it over, encrypted with the
shared key. The issue arises in the fact that nothing is stopping the server from becoming a
man-in-the-middle proxy and acting as the other party for each client, since clients can't
authenticate themselves in any way. For that reason, the second paradigm was used - communicating
directly via the camera using a QR code.

### Protocol

Let Alice be the client with the encryption key, sharing with Bob, who is logged in but doesn't yet
have the encryption key.

At a high level, Alice generates a QR code with the account encryption key, encrypted with a
time-based hash obtained from the server. Bob scans the QR code, gets the same hash from the server
and decrypts the QR code payload with it, obtaining the encryption key.

The process works as follows:

1. Alice asks the server for the time-based hash. She hits `GET
/api/key-share-hash?t=[current_timestamp_in_ms]`, which returns a unique hash comprised of a secret
   key only the server knows, the timestamp of the request, and a unique user id. The user id, derived
   from the session cookie, ensures only a client logged into the app can retrieve the hash used for
   key encryption.

2. Alice encrypts the account encryption key with the hash obtained from the server. This results in
   a 64-byte Uint8Array.

3. Alice prepends a header, consisting of the ASCII characters "JRNL" identifying the QR code as a
   Journal encryption key. After the identification header, the timestamp of the server hash is
   placed as a 6-byte number, from least significant to the most significant bytes. This 74-byte
   payload is used to construct the resulting QR code.

4. After logging in, Bob selects to import the key by scanning a QR code. He scans the QR code from
   Alice, checking the first 4 bytes match the "JRNL" header. He uses the following 6 bytes to
   reconstruct the timestamp, then hits the same API endpoint as Alice, and since he's logged into
   the same account, all parameters match and he gets back the same hash, which he uses to decrypt
   the key. This step has to happen less than 3 minutes after the generation of the QR code, since
   the server only serves hashes of a certain timestamp for a maximum of 3 minutes for extra
   security.
