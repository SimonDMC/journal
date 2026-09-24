import { auth } from "../auth";

export const deleteAccountHandle = async (request: Request, env: Env): Promise<Response> => {
    // auth
    const user_id = await auth(request, env);
    if (!user_id) return new Response("Unauthorized", { status: 401 });

    await env.DB.prepare("DELETE FROM Entries WHERE user_id = ?").bind(user_id).run();
    await env.DB.prepare("DELETE FROM Users WHERE id = ?").bind(user_id).run();
    return new Response("OK", {
        headers: {
            "Set-Cookie": "session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT",
        },
    });
};
