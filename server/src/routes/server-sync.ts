import { auth } from "../auth";
import { MAX_ENTRY_COUNT, MAX_ENTRY_SIZE } from "../config";
import type { Entry } from "../types";
import { olderThan } from "../version";
import { MAX_ROWS } from "./upload";

export const serverSyncHandle = async (request: Request, env: Env): Promise<Response> => {
    // 0.0.28 revamped entry storage in a non-backwards-compatible way
    if (olderThan(request, "0.0.28")) return new Response("Outdated version", { status: 410 });

    // auth
    const user_id = await auth(request, env);
    if (!user_id) return new Response("Unauthorized", { status: 401 });

    // rate limit
    const { success } = await env.RL_EXPENSIVE.limit({ key: `server-sync-${user_id}` });
    if (!success) {
        return new Response("Too many requests", { status: 429 });
    }

    // get entries from request body
    let entriesToSave: Entry[];
    try {
        entriesToSave = (await request.json()) as Entry[];
    } catch {
        return new Response("Bad request", { status: 400 });
    }

    if (entriesToSave.length > MAX_ENTRY_COUNT) {
        return new Response("Request too large", { status: 413 });
    }

    entriesToSave.forEach((e) => {
        if (e.date.length > 10 || (e.hash?.length ?? 0) > 28 || e.data.length > MAX_ENTRY_SIZE) {
            return new Response("Request too large", { status: 413 });
        }
    });

    // insert or update all entries
    for (let i = 0; i < entriesToSave.length; i += MAX_ROWS) {
        const chunk = entriesToSave.slice(i, i + MAX_ROWS);

        // Prepare placeholders and values
        const placeholders = chunk.map(() => "(?, ?, ?, ?)").join(",");
        const values = chunk.flatMap((entry) => [user_id, entry.date, entry.data, entry.hash]);

        // Perform the upsert
        await env.DB.prepare(
            `
			INSERT INTO Entries_v2 (user_id, date, data, hash)
			VALUES ${placeholders}
			ON CONFLICT(user_id, date) DO UPDATE SET
				data = excluded.data,
				hash = excluded.hash;
		`,
        )
            .bind(...values)
            .run();
    }

    return new Response("OK");
};
