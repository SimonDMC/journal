import { changePasswordHandle } from "./routes/change-password";
import { loginHandle } from "./routes/login";
import { setEntryHandle } from "./routes/set-entry";
import { logoutHandle } from "./routes/logout";
import { uploadHandle } from "./routes/upload";
import { clientSyncHandle } from "./routes/client-sync";
import { serverSyncHandle } from "./routes/server-sync";
import { createAccountHandle } from "./routes/create-account";
import { downloadDB } from "./cron";
import {
    upgradeEntriesV2PullHandle,
    upgradeEntriesV2PushHandle,
} from "./routes/migrations/upgrade-entries-v2";
import { qrHashHandle } from "./routes/qr-hash";
import { keyHashHandle } from "./routes/key-hash";
import { setKeyHashHandle } from "./routes/migrations/set-key-hash";
import { forgotPasswordHandle } from "./routes/forgot-password";
import { resetPasswordHandle } from "./routes/reset-password";
import { deleteAccountHandle } from "./routes/delete-account";

type Route = [
    method: string,
    path: RegExp,
    handler: (request: Request, env: Env) => Promise<Response>,
];

const routes: Route[] = [
    ["POST", /^entry\/\d{4}-\d{2}-\d{2}$/, setEntryHandle],
    ["POST", /^login$/, loginHandle],
    ["POST", /^upload$/, uploadHandle],
    ["POST", /^client-sync$/, clientSyncHandle],
    ["POST", /^server-sync$/, serverSyncHandle],
    ["POST", /^logout$/, logoutHandle],
    ["POST", /^change-password$/, changePasswordHandle],
    ["POST", /^forgot-password$/, forgotPasswordHandle],
    ["POST", /^reset-password$/, resetPasswordHandle],
    ["POST", /^create-account$/, createAccountHandle],
    ["POST", /^delete-account$/, deleteAccountHandle],
    ["GET", /^qr-hash$/, qrHashHandle],
    ["GET", /^key-hash$/, keyHashHandle],

    ["POST", /^migrate\/entries-v2-pull$/, upgradeEntriesV2PullHandle],
    ["POST", /^migrate\/entries-v2-push$/, upgradeEntriesV2PushHandle],
    ["POST", /^migrate\/set-key-hash$/, setKeyHashHandle],
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

    async scheduled(controller: ScheduledController, env: Env) {
        switch (controller.cron) {
            case "0 0 * * MON":
                await downloadDB(env);
                break;
        }
        console.log("Processed cron trigger!");
    },
};
