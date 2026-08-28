import { eventTarget, UpdateReadyEvent } from "./events";
import { useSettings } from "../state/settings";
import { infoToast } from "./toast";

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

/**
 * Retrieve the currently running app version
 */
export function getCurrentVersion() {
    return localStorage.getItem("journal-version");
}

/**
 * Check for update -- only once, at the beginning of the session, unless it's available and
 * wasn't dismissed
 */
export async function checkForUpdateIfDesired() {
    if (!sessionStorage.getItem("journal-update-undesired")) {
        const updatePolicy = useSettings.getState().getString("general.update_policy");
        if (updatePolicy == "manual") return;

        const versionsFile = await checkForUpdate();
        if (!versionsFile) {
            sessionStorage.setItem("journal-update-undesired", "true");
            return;
        }

        invokeUpdatePopup(versionsFile, updatePolicy);
    }
}

export async function checkForUpdateManually() {
    const versionsFile = await checkForUpdate();
    if (versionsFile) {
        // to prevent popup stacking, close the settings popup and open the update popup
        invokeUpdatePopup(versionsFile, "confirm");
        useSettings.getState().closeSettings();
    } else {
        // inform about no update found
        infoToast("No update available.");
    }
}

async function checkForUpdate(): Promise<VersionsFile | null> {
    let versionsFile;
    try {
        const res = await fetch("/versions.json");
        versionsFile = (await res.json()) as VersionsFile;
    } catch {
        console.error("Couldn't fetch version data.");
        return null;
    }
    const latestVersion = versionsFile.current.version;

    // install update if newer
    const currentVersion = getCurrentVersion();
    if (!currentVersion) {
        forceReload();
        return null;
    }

    // check successful if latest version is ahead of current
    if (compareVersions(currentVersion, latestVersion)) {
        return versionsFile;
    }

    // otherwise no update exists
    return null;
}

export async function invokeUpdatePopup(versionsFile: VersionsFile, updateMode: string) {
    const currentVersion = getCurrentVersion();
    if (!currentVersion) {
        forceReload();
        return null;
    }

    const keys = await caches.keys();
    if (!keys.includes(`journal-cache-${versionsFile.current.version}`)) {
        await installApp(versionsFile.current.version);
    }

    eventTarget.dispatchEvent(
        new UpdateReadyEvent({
            version: versionsFile.current.version,
            // only show what's new
            changelogs: versionsFile.history
                .filter((v) => compareVersions(currentVersion, v.version))
                .map((v) => v.desc),
            updateMode,
        }),
    );
}

/**
 * Compares two app versions
 * @param versionA
 * @param versionB
 * @returns true if versionA is older, false otherwise
 */
export function compareVersions(versionA: string, versionB: string): boolean {
    const subversionsA = versionA.split(".").map((s) => parseInt(s));
    const subversionsB = versionB.split(".").map((s) => parseInt(s));
    const subversions = Math.max(subversionsA.length, subversionsB.length);

    for (let i = 0; i < subversions; i++) {
        if ((subversionsA[i] ?? 0) < (subversionsB[i] ?? 0)) return true;
    }
    return false;
}

/**
 * Downloads all necessary files for Journal to work offline
 */
export async function installApp(version: string) {
    console.log(`Installing version ${version}!`);

    let json;
    try {
        const res = await fetch("/asset-list.json");
        json = await res.json();
    } catch {
        console.log("Couldn't fetch asset list.");
        return;
    }
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
    console.log(`Installed version ${version}!`);
}

export async function forceReload() {
    if (window.caches) {
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
}
