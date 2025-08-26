import { auth } from "../auth";

export const getEntryHandle = async (request: Request, env: Env): Promise<Response> => {
    // auth
    const user_id = await auth(request, env);
    if (!user_id) return new Response("Unauthorized", { status: 401 });

    // get date from URL
    const url = new URL(request.url);
    const date = url.pathname.split("/")[3];

    // get entry from database
    const entry = await env.DB.prepare("SELECT content, mood, location FROM Entries WHERE user_id = ? AND date = ?;")
        .bind(user_id, date)
        .all();

    if (entry.results.length === 0) {
        return new Response("{}");
    }

    return new Response(JSON.stringify(entry.results[0]));
};
