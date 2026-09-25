import { syncDatabase } from "../../database/sync";
import { getAPI } from "../../services/api";
import { QR_KEY_GENERATOR } from "../../util/config";
import { generateKey, hashKey } from "../../util/crypto";
import { eventTarget, CloseOpenPopupEvent, QRCodeOpenEvent } from "../../util/events";
import { successToast, errorToast } from "../../util/toast";
import { useSettings } from "./state";
import QRCode from "qrcode";

export async function generateAndSaveKey() {
    if (localStorage.getItem("journal-key")) {
        if (!confirm("You already have a key saved. Are you sure you want to generate a new one?"))
            return;
    }

    const buffer = await generateKey();
    const json = JSON.stringify([...buffer]);
    localStorage.setItem("journal-key", json);

    successToast("Key generated!");
}

export async function showKeyHash() {
    const storedKey = localStorage.getItem("journal-key");
    if (!storedKey) {
        alert("No key saved.");
        return;
    }

    const keyBuffer = new Uint8Array(JSON.parse(storedKey));
    alert(`Your key hash: ${hashKey(keyBuffer)}\nThis is safe to share.`);
}

export function forceUploadKey() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".key";
    input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            const imported = new Uint8Array(reader.result as ArrayBuffer);
            // save key into storage
            localStorage.setItem("journal-key", JSON.stringify(Array.from(imported)));
            successToast("Key imported successfully!");
            // immediately download all entries
            syncDatabase();
        };
        reader.readAsArrayBuffer(file);
    };
    input.click();
}

export function uploadKey() {
    return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".key";
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) {
                return;
            }

            const reader = new FileReader();
            reader.onload = async () => {
                const imported = new Uint8Array(reader.result as ArrayBuffer);
                const uploadedKeyHash = await hashKey(imported);
                const expectedKeyRes = await getAPI("/key-hash");
                const expectedKeyHash = await expectedKeyRes.text();

                if (uploadedKeyHash != expectedKeyHash) {
                    errorToast(
                        "Your imported key didn't match the expected key hash. Did you select the right file?",
                    );
                    resolve(false);
                    return;
                }

                // save key into storage
                localStorage.setItem("journal-key", JSON.stringify(Array.from(imported)));
                successToast("Key imported successfully!");
                // immediately download all entries
                syncDatabase();
                resolve(true);
            };
            reader.readAsArrayBuffer(file);
        };
        input.click();
    });
}

export function downloadKey() {
    const key = localStorage.getItem("journal-key");
    if (!key) {
        errorToast("No key has been imported.");
        return;
    }

    const blob = new Blob([new Uint8Array(JSON.parse(key))], { type: "application/octet-stream" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "JOURNAL_SECRET.key";
    a.click();

    // dismiss key download alert
    useSettings.getState().setSetting("alert.key_irrecoverability", false);
}

export async function showQRCode() {
    const timestamp = Date.now();
    const keyHashRes = await getAPI(`/qr-hash?t=${timestamp}`);

    if (keyHashRes.status == 401) {
        errorToast("The QR code couldn't be generated. Are you logged in?");
    }

    if (keyHashRes.status == 406) {
        errorToast("The QR code couldn't be generated. Check if your system clock is sync.");
    }

    if (!keyHashRes.ok) return;

    const qrHashEncoded = await keyHashRes.text();
    const qrHash = Uint8Array.fromBase64(qrHashEncoded);
    const qrKey = await crypto.subtle.importKey("raw", qrHash, QR_KEY_GENERATOR, true, [
        "encrypt",
        "decrypt",
    ]);

    const keyString = localStorage.getItem("journal-key");
    if (!keyString) return;

    const data = new Uint8Array(JSON.parse(keyString));

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, qrKey, data);

    const buffer = new Uint8Array(encrypted);
    const result = new Uint8Array(iv.length + buffer.length);
    result.set(iv, 0);
    result.set(buffer, iv.length);

    const header = new Uint8Array([
        // JRNL identifier header
        0x4a,
        0x52,
        0x4e,
        0x4c,
        // timestamp used as server key id, decomposed into bytes
        timestamp % 256,
        Math.floor(timestamp / 256) % 256,
        Math.floor(timestamp / Math.pow(256, 2)) % 256,
        Math.floor(timestamp / Math.pow(256, 3)) % 256,
        Math.floor(timestamp / Math.pow(256, 4)) % 256,
        Math.floor(timestamp / Math.pow(256, 5)) % 256,
    ]);

    const payload = new Uint8Array([...header, ...result]);
    const canvas = document.createElement("canvas");
    QRCode.toDataURL(canvas, [{ mode: "byte", data: payload }], (_err, url) => {
        eventTarget.dispatchEvent(new CloseOpenPopupEvent());
        eventTarget.dispatchEvent(new QRCodeOpenEvent({ url }));
    });
}

export async function decryptQRCode(data: Uint8Array) {
    const timestamp =
        data[4] +
        data[5] * 256 +
        data[6] * Math.pow(256, 2) +
        data[7] * Math.pow(256, 3) +
        data[8] * Math.pow(256, 4) +
        data[9] * Math.pow(256, 5);

    const res = await getAPI(`/qr-hash?t=${timestamp}`);

    if (res.status == 406) {
        errorToast("This QR code has expired. Please generate and scan a new one.");
        return false;
    }

    if (res.status == 401) {
        errorToast("Your session is invalid. Please log out and log in again.");
        return false;
    }

    if (!res.ok) {
        errorToast("Something went wrong. This shouldn't happen!");
        return false;
    }

    const qrHashEncoded = await res.text();
    const qrHash = Uint8Array.fromBase64(qrHashEncoded);
    const qrKey = await crypto.subtle.importKey("raw", qrHash, QR_KEY_GENERATOR, true, [
        "encrypt",
        "decrypt",
    ]);

    const encryptedKey = new Uint8Array(data.slice(10));
    const iv = encryptedKey.slice(0, 12);
    const ciphertext = encryptedKey.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, qrKey, ciphertext);
    const decryptedArray = new Uint8Array(decrypted);

    const scannedKeyHash = await hashKey(decryptedArray);
    const expectedKeyRes = await getAPI("/key-hash");
    const expectedKeyHash = await expectedKeyRes.text();

    if (scannedKeyHash == expectedKeyHash) {
        localStorage.setItem("journal-key", JSON.stringify(Array.from(decryptedArray)));
        successToast("Imported key successfully!");
        syncDatabase();
        return true;
    } else {
        errorToast("The scanned key didn't match the expected hash. Did you scan the right key?");
        return false;
    }
}
