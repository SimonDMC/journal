import { API_URL } from "../util/config";
import { errorToast } from "../util/toast";
import { getCurrentVersion } from "../util/update";

/**
 * Send a POST request to the Journal API as JSON, with the app version embedded
 * @param path request path
 * @param body request body
 * @returns promise with the request
 */
export async function postAPI(path: string, body: object): Promise<Response> {
    const url = new URL(`${window.location.origin}${API_URL}${path}`);
    url.searchParams.set("appv", getCurrentVersion() ?? "0.0.0");
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (res.status == 410) {
        errorToast("Outdated version, incompatible with API. Update or keep using only locally.");
    }

    return res;
}

/**
 * Send a GET request to the Journal API, with the app version embedded
 * @param path request path
 * @returns promise with the request
 */
export async function getAPI(path: string): Promise<Response> {
    const url = new URL(`${window.location.origin}${API_URL}${path}`);
    url.searchParams.set("appv", getCurrentVersion() ?? "0.0.0");
    const res = await fetch(url);

    if (res.status == 410) {
        errorToast("Outdated version, incompatible with API. Update or keep using only locally.");
    }

    return res;
}
