import bcrypt from "bcryptjs";

type RequestContent = {
    email: string;
    token: string;
    password: string;
};

export const resetPasswordHandle = async (request: Request, env: Env): Promise<Response> => {
    let body: RequestContent;
    try {
        body = (await request.json()) as RequestContent;
    } catch {
        return new Response("Bad request", { status: 400 });
    }

    if (!body.email || !body.token || !body.password) {
        return new Response("Bad request", { status: 400 });
    }

    const user = await env.DB.prepare("SELECT * FROM Users WHERE email = ?").bind(body.email).all();

    if (user.results.length === 0) {
        return new Response("User not found", { status: 404 });
    }

    if (user.results[0].reset_token != body.token) {
        return new Response("Invalid token", { status: 401 });
    }

    if (
        Date.now() - new Date(user.results[0].reset_token_sent_at as string).getTime() >
        60 * 60 * 1000
    ) {
        return new Response("Expired token", { status: 406 });
    }

    // reset password
    await env.DB.prepare("UPDATE Users SET password = ?, reset_token = ? WHERE email = ?")
        .bind(await bcrypt.hash(body.password, 10), null, body.email)
        .run();

    return new Response("OK");
};
