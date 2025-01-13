import { KEY_GENERATOR } from "./config";

let cryptoKey;
async function getKey() {
    if (cryptoKey) return cryptoKey;

    const storedKey = localStorage.getItem("key");
    if (!storedKey) return null;

    const keyBuffer = new Uint8Array(JSON.parse(storedKey));
    const key = await crypto.subtle.importKey("raw", keyBuffer, KEY_GENERATOR, true, ["encrypt", "decrypt"]);
    return key;
}

export async function encryptEntry(entry: string): Promise<string | null> {
    try {
        const data = new TextEncoder().encode(entry);
        const iv = crypto.getRandomValues(new Uint8Array(16));

        const key = await getKey();
        if (!key) {
            console.log("Missing key");
            return null;
        }

        const encrypted = await crypto.subtle.encrypt({ name: "AES-CBC", iv }, key, data);

        const buffer = new Uint8Array(encrypted);
        const result = new Uint8Array(iv.length + buffer.length);
        result.set(iv, 0);
        result.set(buffer, iv.length);

        return btoa(String.fromCharCode(...result));
    } catch (error) {
        console.log("Encryption failed:", error);
        return null;
    }
}

export async function decryptEntry(encrypted: string) {
    const toDecrypt = new Uint8Array([...atob(encrypted)].map((c) => c.charCodeAt(0)));
    const iv = toDecrypt.slice(0, 16);
    const buffer = toDecrypt.slice(16);

    const key = await getKey();
    if (!key) {
        console.log("Missing key");
        return null;
    }

    try {
        const decrypted = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, buffer);
        return new TextDecoder().decode(decrypted);
    } catch (error) {
        console.log("Decryption failed:", error);
        return null;
    }
}
