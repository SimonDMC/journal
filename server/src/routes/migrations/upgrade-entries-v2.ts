import { auth } from "../../auth";
import type { Entry } from "../../types";
import { MAX_ROWS } from "../upload";

export const upgradeEntriesV2PullHandle = async (request: Request, env: Env): Promise<Response> => {
    // auth
    const user_id = await auth(request, env);
    if (!user_id) return new Response("Unauthorized", { status: 401 });

    // get unmigrated data from legacy entries table
    const data = await env.DB.prepare(
        "SELECT E.* FROM Users U JOIN Entries_v1 E ON U.id = E.user_id WHERE U.id = ? AND NOT EXISTS (SELECT 1 FROM Entries_v2 E2 WHERE E2.user_id = E.user_id AND E2.date = E.date);",
    )
        .bind(user_id)
        .all();

    return new Response(JSON.stringify(data.results));
};

export const upgradeEntriesV2PushHandle = async (request: Request, env: Env): Promise<Response> => {
    // auth
    const user_id = await auth(request, env);
    if (!user_id) return new Response("Unauthorized", { status: 401 });

    // get content from request body
    let entries: Entry[];
    try {
        entries = (await request.json()) as Entry[];
    } catch {
        return new Response("Bad request", { status: 400 });
    }

    if (entries === undefined) {
        return new Response("Bad request", { status: 400 });
    }

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
