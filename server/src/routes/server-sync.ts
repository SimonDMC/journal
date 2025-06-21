import type { Env } from "..";
import { auth } from "../auth";
import type { EntryWithTimestamp } from "../types";
import { MAX_ROWS } from "./upload";

export const serverSyncHandle = async (request: Request, env: Env): Promise<Response> => {
    // auth
    const user_id = await auth(request, env);
    if (!user_id) return new Response("Unauthorized", { status: 401 });

    // get entries from request body
    let entriesToSave: EntryWithTimestamp[];
    try {
        entriesToSave = (await request.json()) as EntryWithTimestamp[];
    } catch {
        return new Response("Bad request", { status: 400 });
    }

    // insert or update all entries
    for (let i = 0; i < entriesToSave.length; i += MAX_ROWS) {
        const chunk = entriesToSave.slice(i, i + MAX_ROWS);

        // Prepare placeholders and values
        const placeholders = chunk.map(() => "(?, ?, ?, ?, ?, ?, ?, ?)").join(",");
        const values = chunk.flatMap((entry) => [
            user_id,
            entry.date,
            entry.content,
            entry.mood,
            entry.location,
            entry.word_count,
            entry.hash,
            entry.last_modified,
        ]);

        // Perform the upsert
        await env.DB.prepare(
            `
			INSERT INTO Entries (user_id, date, content, mood, location, word_count, hash, last_modified)
			VALUES ${placeholders}
			ON CONFLICT(user_id, date) DO UPDATE SET
				content = excluded.content,
				mood = excluded.mood,
				location = excluded.location,
				word_count = excluded.word_count,
				hash = excluded.hash,
				last_modified = excluded.last_modified;
		`
        )
            .bind(...values)
            .all();
    }

    return new Response("OK");
};
