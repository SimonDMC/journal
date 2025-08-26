import bcrypt from "bcryptjs";
import { auth } from "../auth";

type RequestContent = {
    password: string;
};

export const changePasswordHandle = async (request: Request, env: Env): Promise<Response> => {
    // auth
    const user_id = await auth(request, env);
    if (!user_id) return new Response("Unauthorized", { status: 401 });

    let body: RequestContent;
    try {
        body = (await request.json()) as RequestContent;
    } catch {
        return new Response("Bad request", { status: 400 });
    }

    if (!body.password) {
        return new Response("Bad request", { status: 400 });
    }

    const password = body.password;

    // clear all sessions
    await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user_id).all();

    // change password in database
    await env.DB.prepare("UPDATE Users SET password = ? WHERE id = ?")
        .bind(await bcrypt.hash(password, 10), user_id)
        .all();

    // generate session token
    const token = crypto.randomUUID().toString();

    // insert session into database
    await env.DB.prepare("INSERT INTO sessions (user_id, token) VALUES (?, ?);").bind(user_id, token).all();

    return new Response("OK", {
        headers: {
            "Set-Cookie": `session=${token}; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=${60 * 60 * 24 * 365}`,
        },
    });
};
