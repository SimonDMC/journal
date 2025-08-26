import { auth } from "../auth";

type Row = {
    word_count: number;
    date: string;
    tag: string;
};

type Stats = {
    totalWords: number;
    entries: string[];
};

export const overviewHandle = async (request: Request, env: Env): Promise<Response> => {
    // auth
    const user_id = await auth(request, env);
    if (!user_id) return new Response("Unauthorized", { status: 401 });

    // get data from database
    const data = await env.DB.prepare(
        "SELECT E.word_count, E.date FROM Users U JOIN Entries E ON U.id = E.user_id WHERE U.id = ? ORDER BY E.date;"
    )
        .bind(user_id)
        .all();

    // get into result format
    const stats = {
        totalWords: 0,
        entries: [],
    } as Stats;

    for (const row of data.results as Row[]) {
        stats.entries.push(row.date);
        stats.totalWords += row.word_count;
    }

    return new Response(JSON.stringify(stats));
};
