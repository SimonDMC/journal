import type { Env } from "..";
import { auth } from "../auth";
import type { EntryWithTimestamp } from "../types";

export const MAX_VARIABLES = 100;
export const MAX_ROWS = Math.floor(MAX_VARIABLES / 8);

export const uploadHandle = async (request: Request, env: Env): Promise<Response> => {
    // auth
    const user_id = await auth(request, env);
    if (!user_id) return new Response("Unauthorized", { status: 401 });

    // get content from request body
    let entries: EntryWithTimestamp[];
    try {
        entries = (await request.json()) as EntryWithTimestamp[];
    } catch {
        return new Response("Bad request", { status: 400 });
    }

    console.log(entries[0]);

    if (entries === undefined) {
        return new Response("Bad request", { status: 400 });
    }

    // wipe existing entries
    await env.DB.prepare("DELETE FROM Entries WHERE user_id = ?;").bind(user_id).all();

    // Split the results into chunks
    for (let i = 0; i < entries.length; i += MAX_ROWS) {
        const chunk = entries.slice(i, i + MAX_ROWS);

        // Prepare placeholders and values for this chunk
        const placeholders = chunk.map(() => "(?, ?, ?, ?, ?, ?, ?, ?)").join(",");
        const values = chunk.flatMap((entry) => [
            user_id,
            entry.date,
            entry.content,
            entry.word_count,
            entry.mood,
            entry.location,
            entry.hash,
            entry.last_modified,
        ]);

        // Execute the query for this chunk
        await env.DB.prepare(
            `INSERT INTO Entries (user_id, date, content, word_count, mood, location, hash, last_modified) VALUES ${placeholders};`
        )
            .bind(...values)
            .all();
    }

    return new Response("OK");
};
