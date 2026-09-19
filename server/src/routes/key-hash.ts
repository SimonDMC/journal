import { auth } from "../auth";

export const keyHashHandle = async (request: Request, env: Env): Promise<Response> => {
    // auth
    const user_id = await auth(request, env);
    if (!user_id) return new Response("Unauthorized", { status: 401 });

    const res = await env.DB.prepare("SELECT key_hash FROM Users WHERE id = ?").bind(user_id).run();

    return new Response((res.results[0] as { key_hash: string }).key_hash);
};
