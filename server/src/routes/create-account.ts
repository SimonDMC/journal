import bcrypt from "bcryptjs";

type RequestContent = {
    username: string;
    password: string;
    token: string;
};

export const createAccountHandle = async (request: Request, env: Env): Promise<Response> => {
    let body: RequestContent;
    try {
        body = (await request.json()) as RequestContent;
    } catch {
        return new Response("Bad request", { status: 400 });
    }

    if (!body.username || !body.password || !body.token) {
        return new Response("Bad request", { status: 400 });
    }

    if (body.token !== env.ADMIN_TOKEN) {
        return new Response("Unauthorized", { status: 401 });
    }

    env.DB.prepare("INSERT INTO Users (username, password) VALUES (?, ?);")
        .bind(body.username, await bcrypt.hash(body.password, 10))
        .all();

    return new Response("OK");
};
