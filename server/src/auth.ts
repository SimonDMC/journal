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

    const sessionQuery = await env.DB.prepare("SELECT user_id FROM sessions WHERE token = ?").bind(session).all();

    if (sessionQuery.results.length === 0) {
        return;
    }
    return sessionQuery.results[0].user_id as number;
}
