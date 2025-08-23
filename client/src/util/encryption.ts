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
