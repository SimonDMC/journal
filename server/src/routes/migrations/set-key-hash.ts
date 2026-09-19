import { auth } from "../../auth";

export const setKeyHashHandle = async (request: Request, env: Env): Promise<Response> => {
    // auth
    const user_id = await auth(request, env);
    if (!user_id) return new Response("Unauthorized", { status: 401 });

    let body: { keyHash: string };
    try {
        body = await request.json();
    } catch {
        return new Response("Bad request", { status: 400 });
    }

    if (body.keyHash === undefined) {
        return new Response("Bad request", { status: 400 });
    }

    const keyHash = body.keyHash;

    await env.DB.prepare("UPDATE Users SET key_hash = ? WHERE id = ?").bind(keyHash, user_id).run();

    return new Response("OK");
};
