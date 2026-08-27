/**
 * Checks whether a request comes from an app version before a specific one
 * @param request
 * @param version
 */
export function olderThan(request: Request, version: string): boolean {
    const searchParams = new URLSearchParams(new URL(request.url).search);
    const requestVersion = searchParams.get("appv") ?? "0.0.0";
    return compareVersions(requestVersion, version);
}

/**
 * Compares two app versions
 * @param versionA
 * @param versionB
 * @returns true if versionA is older, false otherwise
 */
function compareVersions(versionA: string, versionB: string): boolean {
    const subversionsA = versionA.split(".").map((s) => parseInt(s));
    const subversionsB = versionB.split(".").map((s) => parseInt(s));
    const subversions = Math.max(subversionsA.length, subversionsB.length);

    for (let i = 0; i < subversions; i++) {
        if ((subversionsA[i] ?? 0) < (subversionsB[i] ?? 0)) return true;
    }
    return false;
}
