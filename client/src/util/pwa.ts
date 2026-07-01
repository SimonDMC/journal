/**
 * Injects either manifest-default.json or manifest-apple.json, based on the operating system.
 * This is done so that iOS/macOS have a liquid glass icon, without looking strange on windows/linux
 * systems.
 */
export function injectAppropriateManifest() {
    // iOS includes string "like Mac OS X"
    const isApple = navigator.userAgent.toLowerCase().includes("mac");
    const manifest = document.createElement("link");
    manifest.rel = "manifest";
    manifest.href = `manifest-${isApple ? "apple" : "default"}.json`;
    document.head.appendChild(manifest);
}
