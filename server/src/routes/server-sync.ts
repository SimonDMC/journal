import { auth } from "../auth";
import type { Entry } from "../types";
import { olderThan } from "../version";
import { MAX_ROWS } from "./upload";

export const serverSyncHandle = async (request: Request, env: Env): Promise<Response> => {
    // 0.0.28 revamped entry storage in a non-backwards-compatible way
    if (olderThan(request, "0.0.28")) return new Response("Outdated version", { status: 410 });

    // auth
    const user_id = await auth(request, env);
    if (!user_id) return new Response("Unauthorized", { status: 401 });

    // get entries from request body
    let entriesToSave: Entry[];
    try {
        entriesToSave = (await request.json()) as Entry[];
    } catch {
        return new Response("Bad request", { status: 400 });
    }

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
