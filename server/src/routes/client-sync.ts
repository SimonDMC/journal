import { auth } from "../auth";
import type { Entry } from "../types";
import { olderThan } from "../version";

type RequestContent = {
    [key: string]: string | null;
};

// TODO: add rate limiting since it's a pretty expensive operation
export const clientSyncHandle = async (request: Request, env: Env): Promise<Response> => {
    // 0.0.28 revamped entry storage in a non-backwards-compatible way
    if (olderThan(request, "0.0.28")) return new Response("Outdated version", { status: 410 });

    // auth
    const user_id = await auth(request, env);
    if (!user_id) return new Response("Unauthorized", { status: 401 });

    // get entries from request body
    let localEntries: RequestContent;
    try {
        localEntries = (await request.json()) as RequestContent;
    } catch {
        return new Response("Bad request", { status: 400 });
    }

    // get all entries
    const data = await env.DB.prepare(
        "SELECT E.date, E.data, E.hash FROM Users U JOIN Entries_v2 E ON U.id = E.user_id WHERE U.id = ? ORDER BY E.date;",
    )
        .bind(user_id)
        .all();

    const missingEntries: Entry[] = [];
    const differingEntries: Entry[] = [];
    const excessEntries: string[] = [];

    const databaseDates: string[] = [];

    for (const entry of data.results as Entry[]) {
        // mark this entry as existing in database
        databaseDates.push(entry.date);

        const matchingLocalEntryHash = localEntries[entry.date];

        if (matchingLocalEntryHash === undefined) {
            // found in database but not in local
            missingEntries.push(entry);
        } else if (entry.hash !== matchingLocalEntryHash) {
            // found both in database and local, but with differing hashes
            differingEntries.push(entry);
        }
    }

    // run through local entries to see if there are any excess ones we don't have in the database
    for (const date of Object.keys(localEntries)) {
        if (!databaseDates.includes(date)) excessEntries.push(date);
    }

    return new Response(
        JSON.stringify({
            missing: missingEntries,
            differing: differingEntries,
            excess: excessEntries,
        }),
    );
};
