import bcrypt from "bcryptjs";
import { constructCookieHeader } from "../auth";

type RequestContent = {
    username: string;
    password: string;
};

export const loginHandle = async (request: Request, env: Env): Promise<Response> => {
    let body: RequestContent;
    try {
        body = (await request.json()) as RequestContent;
    } catch {
        return new Response("Bad request", { status: 400 });
    }

    if (!body.username || !body.password) {
        return new Response("Bad request", { status: 400 });
    }

    const username = body.username;
    const password = body.password;

    // check if valid login
    const user = await env.DB.prepare("SELECT password, id FROM Users WHERE username = ?")
        .bind(username)
        .all();

    if (user.results.length === 0) {
        return new Response("Unauthorized", { status: 401 });
    }

    if (!(await bcrypt.compare(password, user.results[0].password as string))) {
        return new Response("Unauthorized", { status: 401 });
    }

    // get userId from user query
    const userId = user.results[0].id;

    // generate session token
    const token = crypto.randomUUID().toString();

    // insert session into database
    await env.DB.prepare("INSERT INTO sessions (user_id, token) VALUES (?, ?);")
        .bind(userId, token)
        .run();

    return new Response("OK", {
        headers: constructCookieHeader(request, token),
    });
};
