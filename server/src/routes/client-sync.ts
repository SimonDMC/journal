import { auth, revalidateCookieHeader } from "../auth";
import { MAX_ENTRY_COUNT } from "../config";
import type { Entry } from "../types";
import { olderThan } from "../version";

type RequestContent = {
    [key: string]: string | null;
};

export const clientSyncHandle = async (request: Request, env: Env): Promise<Response> => {
    // 0.0.28 revamped entry storage in a non-backwards-compatible way
    if (olderThan(request, "0.0.28")) return new Response("Outdated version", { status: 410 });

    // auth
    const user_id = await auth(request, env);
    if (!user_id) return new Response("Unauthorized", { status: 401 });

    // rate limit
    const { success } = await env.RL_EXPENSIVE.limit({ key: `client-sync-${user_id}` });
    if (!success) {
        return new Response("Too many requests", { status: 429 });
    }

    // get entries from request body
    let localEntries: RequestContent;
    try {
        localEntries = (await request.json()) as RequestContent;
    } catch {
        return new Response("Bad request", { status: 400 });
    }

    if (Object.keys(localEntries).length > MAX_ENTRY_COUNT) {
        return new Response("Request too large", { status: 413 });
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
        {
            // ensure session cookie stays set in perpetuity
            headers: revalidateCookieHeader(request),
        },
    );
};
