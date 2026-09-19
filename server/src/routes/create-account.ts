import bcrypt from "bcryptjs";
import { constructCookieHeader } from "../auth";

type RequestContent = {
    email: string;
    username: string;
    password: string;
    keyHash: string;
};

export const createAccountHandle = async (request: Request, env: Env): Promise<Response> => {
    let body: RequestContent;
    try {
        body = (await request.json()) as RequestContent;
    } catch {
        return new Response("Bad request", { status: 400 });
    }

    if (!body.email || !body.username || !body.password || !body.keyHash) {
        return new Response("Bad request", { status: 400 });
    }

    // No minimum passwords requirements, this is an enthusiast app so we can assume whoever is
    // using ts knows not to make their password "a"

    const emailCheck = await env.DB.prepare("SELECT * FROM Users WHERE email = ?")
        .bind(body.email)
        .run();
    if (emailCheck.results.length > 0) return new Response("email registered", { status: 409 });

    const usernameCheck = await env.DB.prepare("SELECT * FROM Users WHERE username = ?")
        .bind(body.username)
        .run();
    if (usernameCheck.results.length > 0) return new Response("username taken", { status: 409 });

    const userInsert = await env.DB.prepare(
        "INSERT INTO Users (email, username, password) VALUES (?, ?, ?) RETURNING *;",
    )
        // every resource i can find says running bcrypt on cf workers free is unfeasible but it
        // works fine and doesn't time out the request (?)
        .bind(body.username, await bcrypt.hash(body.password, 10))
        .run();

    const userId = userInsert.results[0].id;

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
