import { auth } from "../auth";

export const qrHashHandle = async (request: Request, env: Env): Promise<Response> => {
    // auth
    const user_id = await auth(request, env);
    if (!user_id) return new Response("Unauthorized", { status: 401 });

    const searchParams = new URLSearchParams(new URL(request.url).search);
    const timestamp = parseInt(searchParams.get("t") ?? "");

    if (!timestamp || isNaN(timestamp)) return new Response("Bad request", { status: 400 });

    const actualTimestamp = Date.now();

    // don't serve future timestamps (tolerance of a couple seconds ahead)
    if (actualTimestamp - timestamp < 3 * 1000) {
        return new Response("Ahead", { status: 406 });
    }

    // don't serve old timestamps
    if (actualTimestamp - timestamp > 3 * 1000 * 60) {
        // the proper HTTP status should be 410 but that's used for incompatible client versions
        return new Response("Expired", { status: 406 });
    }

    const base = env.KEY_SHARE_BASE;
    const key = await crypto.subtle.importKey(
        "raw",
        Uint8Array.fromBase64(base),
        {
            name: "HMAC",
            hash: "SHA-256",
        },
        false,
        ["sign"],
    );

    // composite hash payload from the current timestamp and the unique user id
    const toHash = `${timestamp}-${user_id}`;

    const encoder = new TextEncoder();
    const data = encoder.encode(toHash);
    const hashBuffer = await crypto.subtle.sign("HMAC", key, data);
    const hash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));

    return new Response(hash);
};
