import { Resend } from "resend";

type RequestContent = {
    email: string;
};

export const forgotPasswordHandle = async (request: Request, env: Env): Promise<Response> => {
    let body: RequestContent;
    try {
        body = (await request.json()) as RequestContent;
    } catch {
        return new Response("Bad request", { status: 400 });
    }

    if (!body.email) {
        return new Response("Bad request", { status: 400 });
    }

    // rate limit
    const { success } = await env.RL_EXPENSIVE.limit({ key: `forgot-password-${body.email}` });
    if (!success) {
        return new Response("Too many requests", { status: 429 });
    }

    const email = body.email;

    const user = await env.DB.prepare("SELECT username FROM Users WHERE email = ?")
        .bind(email)
        .all();

    if (user.results.length === 0) {
        return new Response("User not found", { status: 404 });
    }

    const token = crypto.randomUUID().toString();
    await env.DB.prepare(
        "UPDATE Users SET reset_token = ?, reset_token_sent_at = ? WHERE email = ?",
    )
        .bind(token, new Date().toISOString(), email)
        .all();

    const resend = new Resend(env.RESEND_API_KEY);
    const username = user.results[0].username;
    const resetLink = `${new URL(request.url).origin}/reset-password?email=${email}&token=${token}`;
    await resend.emails.send({
        from: "Journal <noreply@simondmc.com>",
        to: [email],
        subject: "Journal Password Reset",
        html: `
            <p>Hello, ${username}.</p>
            <p>
                Someone (probably you) has recently requested to reset your account's password for Journal.<br>
                If it was you, open this link and choose a new password: <a href=${resetLink}>${resetLink}</a>. 
                The link is valid for 60 minutes.<br>
                If it wasn't you, you can safely ignore this email.
            </p>
            <p>
                Best regards,<br>
                SimonDMC (Journal)
            </p>
        `,
    });

    return new Response("OK");
};
