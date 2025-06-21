export const logoutHandle = async (): Promise<Response> => {
    return new Response("OK", {
        headers: {
            "Set-Cookie": "session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT",
        },
    });
};
