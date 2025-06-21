import { eventTarget, UpdateReadyEvent } from "./events";

type VersionsFile = {
    current: {
        version: string;
        desc: string;
        released: number;
    };
    history: {
        version: string;
        desc: string;
        released: number;
    }[];
};

export async function checkForUpdate() {
    const res = await fetch("/versions.json");
    const json = (await res.json()) as VersionsFile;
    const version = json.current.version;

    // install update if newer
    const currentVersion = localStorage.getItem("journal-version");
    if (!currentVersion) {
        forceReload();
        return;
    }

    if (compareVersions(currentVersion, version)) {
        const keys = await caches.keys();
        if (!keys.includes(`journal-cache-${version}`)) {
            await installApp(version);
        }

        eventTarget.dispatchEvent(
            new UpdateReadyEvent({
                version,
                // only show what's new
                changelogs: json.history.filter((v) => compareVersions(currentVersion, v.version)).map((v) => v.desc),
            })
        );
    }
}

// returns true if versionA is older, false otherwise
export function compareVersions(versionA: string, versionB: string) {
    const subversionsA = versionA.split(".").map((s) => parseInt(s));
    const subversionsB = versionB.split(".").map((s) => parseInt(s));
    const subversions = Math.max(subversionsA.length, subversionsB.length);

    for (let i = 0; i < subversions; i++) {
        if ((subversionsA[i] ?? 0) < (subversionsB[i] ?? 0)) return true;
    }
    return false;
}

// downloads all necessary files for journal to work offline
export async function installApp(version: string) {
    console.log(`Installing version ${version}!`);

    const res = await fetch("asset-list.json");
    const json = await res.json();
    // also download root html page
    json.assets.push(`/?v=${version}`);

    const cache = await caches.open(`journal-cache-${version}`);
    const fetchPromises = json.assets.map(async (assetUrl: string) => {
        try {
            const response = await fetch(assetUrl);
            // cache response
            await cache.put(assetUrl, response.clone());
        } catch (err) {
            console.error(`Failed to download ${assetUrl}`, err);
        }
    });

    await Promise.all(fetchPromises);
}

export async function forceReload() {
    const caches = await window.caches.keys();
    for (const cache of caches) {
        await window.caches.delete(cache);
    }

    const res = await fetch("/versions.json");
    const json = await res.json();
    const version = json.current.version;

    await installApp(version);
    localStorage.setItem("journal-version", version);
    window.location.reload();
}
