import type { Env } from "..";
import { auth } from "../auth";

// LEGACY API ENDPOINT. CURRENTLY UNUSED IN FRONTEND
export const downloadHandle = async (request: Request, env: Env): Promise<Response> => {
    // auth
    const user_id = await auth(request, env);
    if (!user_id) return new Response("Unauthorized", { status: 401 });

    // get data from database
    const data = await env.DB.prepare(
        "SELECT E.date, E.content, E.mood, E.location, E.word_count, E.hash, E.last_modified FROM Users U JOIN Entries E ON U.id = E.user_id WHERE U.id = ? ORDER BY E.date;"
    )
        .bind(user_id)
        .all();

    return new Response(JSON.stringify(data, null, 2));
};
