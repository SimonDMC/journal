import { parse } from "cookie";

export async function auth(request: Request, env: Env): Promise<number | undefined> {
    const cookie = request.headers.get("Cookie");
    if (!cookie) {
        return;
    }
    const { session } = parse(cookie ?? "");
    if (!session) {
        return;
    }

    const sessionQuery = await env.DB.prepare("SELECT user_id FROM sessions WHERE token = ?")
        .bind(session)
        .all();

    if (sessionQuery.results.length === 0) {
        return;
    }
    return sessionQuery.results[0].user_id as number;
}

/**
 * Returns a Set-Cookie header to revalidate session, since the cookie has a 1-year expiration date
 */
export function revalidateCookieHeader(request: Request) {
    const cookie = request.headers.get("Cookie");
    if (!cookie) {
        return;
    }
    const { session } = parse(cookie ?? "");
    if (!session) {
        return;
    }

    return constructCookieHeader(request, session);
}

export function constructCookieHeader(request: Request, token: string) {
    // don't force secure cookie if on localhost (safari cares)
    const host = new URL(request.url).host;
    const isLocalhost =
        host.includes("localhost") || host.includes("127.0.0.1") || host.includes("[::1]");

    return {
        "Set-Cookie": `session=${token}; Path=/; HttpOnly; SameSite=Strict; ${isLocalhost ? "" : "Secure;"} Max-Age=${60 * 60 * 24 * 365}`,
    };
}
