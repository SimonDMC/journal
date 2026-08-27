import { auth } from "../auth";
import { olderThan } from "../version";

type RequestContent = {
    data: string;
    hash?: string;
};

export const setEntryHandle = async (request: Request, env: Env): Promise<Response> => {
    // 0.0.28 revamped entry storage in a non-backwards-compatible way
    if (olderThan(request, "0.0.28")) return new Response("Outdated version", { status: 410 });

    // auth
    const user_id = await auth(request, env);
    if (!user_id) return new Response("Unauthorized", { status: 401 });

    // get date from URL
    const url = new URL(request.url);
    const date = url.pathname.split("/")[3];

    // get content from request body
    let body: RequestContent;
    try {
        body = (await request.json()) as RequestContent;
    } catch {
        return new Response("Bad request", { status: 400 });
    }

    if (body.data === undefined) {
        return new Response("Bad request", { status: 400 });
    }

    const data = body.data;
    const hash = body.hash;

    // get entry for today if it exists
    const entry = await env.DB.prepare("SELECT id FROM Entries_v2 WHERE user_id = ? AND date = ?;")
        .bind(user_id, date)
        .all();

    if (entry.results.length === 0) {
        // add entry if it doesn't exist
        await env.DB.prepare(
            "INSERT INTO Entries_v2 (user_id, date, data, hash) VALUES (?, ?, ?, ?);",
        )
            .bind(user_id, date, data, hash)
            .run();
    } else {
        // update entry if it does exist
        await env.DB.prepare(
            "UPDATE Entries_v2 SET data = ?, hash = ? WHERE user_id = ? AND date = ?;",
        )
            .bind(data, hash, user_id, date)
            .run();
    }

    return new Response("OK");
};
