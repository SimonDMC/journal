export const API_URL = "/api";

// encryption should have also been done with AES-GCM, but i currently don't want to redo it since
// it requires handling legacy entries and the benefits aren't groundbreaking. i might change it in
// the future.
export const ENCRYPTION_KEY_GENERATOR = {
    name: "AES-CBC",
    length: 256,
};

export const QR_KEY_GENERATOR = {
    name: "AES-GCM",
    length: 256,
};
