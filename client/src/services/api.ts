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
    const res = await fetch(`${API_URL}${path}?appv=${getCurrentVersion()}`, {
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
