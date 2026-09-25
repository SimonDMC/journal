import { auth } from "../auth";
import { MAX_ENTRY_COUNT, MAX_ENTRY_SIZE } from "../config";
import type { Entry } from "../types";
import { olderThan } from "../version";

export const MAX_VARIABLES = 100;
export const MAX_ROWS = Math.floor(MAX_VARIABLES / 8);

export const uploadHandle = async (request: Request, env: Env): Promise<Response> => {
    // 0.0.28 revamped entry storage in a non-backwards-compatible way
    if (olderThan(request, "0.0.28")) return new Response("Outdated version", { status: 410 });

    // auth
    const user_id = await auth(request, env);
    if (!user_id) return new Response("Unauthorized", { status: 401 });

    // rate limit
    const { success } = await env.RL_EXPENSIVE.limit({ key: `upload-${user_id}` });
    if (!success) {
        return new Response("Too many requests", { status: 429 });
    }

    // get entries from request body
    let entries: Entry[];
    try {
        entries = (await request.json()) as Entry[];
    } catch {
        return new Response("Bad request", { status: 400 });
    }

    if (!entries) {
        return new Response("Bad request", { status: 400 });
    }

    if (entries.length > MAX_ENTRY_COUNT) {
        return new Response("Request too large", { status: 413 });
    }

    entries.forEach((e) => {
        if (e.date.length > 10 || (e.hash?.length ?? 0) > 28 || e.data.length > MAX_ENTRY_SIZE) {
            return new Response("Request too large", { status: 413 });
        }
    });

    // wipe existing entries
    await env.DB.prepare("DELETE FROM Entries_v2 WHERE user_id = ?;").bind(user_id).run();

    // Split the results into chunks
    for (let i = 0; i < entries.length; i += MAX_ROWS) {
        const chunk = entries.slice(i, i + MAX_ROWS);

        // Prepare placeholders and values for this chunk
        const placeholders = chunk.map(() => "(?, ?, ?, ?)").join(",");
        const values = chunk.flatMap((entry) => [user_id, entry.date, entry.data, entry.hash]);

        // Execute the query for this chunk
        await env.DB.prepare(
            `INSERT INTO Entries_v2 (user_id, date, data, hash) VALUES ${placeholders};`,
        )
            .bind(...values)
            .run();
    }

    return new Response("OK");
};
