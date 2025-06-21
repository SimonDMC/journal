import { bootstrapHandle } from "./routes/bootstrap";
import { changePasswordHandle } from "./routes/change-password";
import { getEntryHandle } from "./routes/get-entry";
import { loginHandle } from "./routes/login";
import { setEntryHandle } from "./routes/set-entry";
import { overviewHandle } from "./routes/overview";
import { downloadHandle } from "./routes/download";
import { logoutHandle } from "./routes/logout";
import { uploadHandle } from "./routes/upload";
import { clientSyncHandle } from "./routes/client-sync";
import { serverSyncHandle } from "./routes/server-sync";
import { createAccountHandle } from "./routes/create-account";

export interface Env {
    DB: D1Database;

    ADMIN_TOKEN: string;
}

type Route = [method: string, path: RegExp, handler: (request: Request, env: Env) => Promise<Response>];

const routes: Route[] = [
    ["GET", /^overview$/, overviewHandle],
    ["GET", /^bootstrap$/, bootstrapHandle],
    ["GET", /^entry\/\d{4}-\d{2}-\d{2}$/, getEntryHandle],
    ["GET", /^download$/, downloadHandle],
    ["POST", /^entry\/\d{4}-\d{2}-\d{2}$/, setEntryHandle],
    ["POST", /^login$/, loginHandle],
    ["POST", /^upload$/, uploadHandle],
    ["POST", /^client-sync$/, clientSyncHandle],
    ["POST", /^server-sync$/, serverSyncHandle],
    ["POST", /^logout$/, logoutHandle],
    ["POST", /^change-password$/, changePasswordHandle],
    ["POST", /^create-account$/, createAccountHandle],
];

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        // remove /api/
        const path = url.pathname.substring(5);
        const method = request.method;

        let response;

        // find route by method and path
        const route = routes.find(([m, p]) => m === method && p.test(path));
        const preflight = routes.find(([, p]) => p.test(path));
        if (route) {
            // execute route handler and await the response
            response = await route[2](request, env);
        } else if (preflight && method === "OPTIONS") {
            // accept preflight requests
            response = new Response(null, { status: 204 });
        } else {
            response = new Response("Not found", { status: 404 });
        }

        return response;
    },
};
