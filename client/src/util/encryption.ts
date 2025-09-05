import { KEY_GENERATOR } from "./config";

let cryptoKey: CryptoKey | undefined;
async function getKey(): Promise<CryptoKey | null> {
    if (cryptoKey) return cryptoKey;

    const storedKey = localStorage.getItem("journal-key");
    if (!storedKey) return null;

    const keyBuffer = new Uint8Array(JSON.parse(storedKey));
    const key = await crypto.subtle.importKey("raw", keyBuffer, KEY_GENERATOR, true, ["encrypt", "decrypt"]);
    return key;
}

export async function showKeyHash() {
    const storedKey = localStorage.getItem("journal-key");
    if (!storedKey) {
        alert("No key saved.");
        return;
    }

    const keyBuffer = new Uint8Array(JSON.parse(storedKey));
    const hashBuffer = await crypto.subtle.digest("SHA-256", keyBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    alert(`Your key hash: ${hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")}\nThis is safe to share.`);
}

export async function encryptEntry(entry: string | null): Promise<string | null> {
    if (entry === null) return null;

    const data = new TextEncoder().encode(entry);
    const iv = crypto.getRandomValues(new Uint8Array(16));

    const key = await getKey();
    if (!key) {
        throw new Error("Missing key");
    }

    const encrypted = await crypto.subtle.encrypt({ name: "AES-CBC", iv }, key, data);

    const buffer = new Uint8Array(encrypted);
    const result = new Uint8Array(iv.length + buffer.length);
    result.set(iv, 0);
    result.set(buffer, iv.length);

    return btoa(String.fromCharCode(...result));
}

export async function decryptEntry(encrypted: string | null): Promise<string | null> {
    if (encrypted === null) return null;

    const toDecrypt = new Uint8Array([...atob(encrypted)].map((c) => c.charCodeAt(0)));
    const iv = toDecrypt.slice(0, 16);
    const buffer = toDecrypt.slice(16);

    const key = await getKey();
    if (!key) {
        throw new Error("Missing key");
    }

    const decrypted = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, buffer);
    return new TextDecoder().decode(decrypted);
}
