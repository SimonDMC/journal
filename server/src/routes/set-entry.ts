import type { Env } from "..";
import { auth } from "../auth";

type RequestContent = {
    content: string;
    mood?: number;
    location?: string;
    word_count: number;
    hash?: string;
};

export const setEntryHandle = async (request: Request, env: Env): Promise<Response> => {
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

    if (body.content === undefined) {
        return new Response("Bad request", { status: 400 });
    }

    const content = body.content;
    const mood = body.mood ?? null;
    const location = body.location ?? null;
    const word_count = body.word_count;
    const hash = body.hash;

    // get entry for today if it exists
    const entry = await env.DB.prepare("SELECT id FROM Entries WHERE user_id = ? AND date = ?;").bind(user_id, date).all();

    if (entry.results.length === 0) {
        // add entry if it doesn't exist
        await env.DB.prepare("INSERT INTO Entries (user_id, date, content, word_count, mood, location, hash) VALUES (?, ?, ?, ?, ?, ?, ?);")
            .bind(user_id, date, content, word_count, mood, location, hash)
            .all();
    } else {
        // update entry if it does exist
        await env.DB.prepare(
            "UPDATE Entries SET content = ?, word_count = ?, mood = ?, location = ?, hash = ?, last_modified = ? WHERE user_id = ? AND date = ?;"
        )
            .bind(content, word_count, mood, location, hash, new Date().toISOString(), user_id, date)
            .all();
    }

    return new Response("OK");
};
