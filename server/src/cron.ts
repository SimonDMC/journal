import Cloudflare from "cloudflare";
import type { DatabaseExportResponse } from "cloudflare/resources/d1/database.mjs";

// https://github.com/cloudflare/cloudflare-typescript/issues/2669
type DatabaseExportResponseFixed = Omit<DatabaseExportResponse, "status"> & {
    status?: DatabaseExportResponse["status"] | "active";
};

export async function downloadDB(env: Env) {
    const client = new Cloudflare({
        apiToken: env.CLOUDFLARE_TOKEN,
    });

    let response = (await client.d1.database.export(env.CLOUDFLARE_DB, {
        account_id: env.CLOUDFLARE_ACCOUNT,
        output_format: "polling",
    })) as DatabaseExportResponseFixed;

    // poll while db is exporting
    while (response.status == "active") {
        response = await client.d1.database.export(env.CLOUDFLARE_DB, {
            account_id: env.CLOUDFLARE_ACCOUNT,
            output_format: "polling",
            current_bookmark: response.at_bookmark,
        });
    }

    // db has exported
    if (response.status == "complete" && response.result?.signed_url) {
        const exportResponse = await fetch(response.result.signed_url);
        // stream directly into r2
        const today = new Date().toISOString().substring(0, 10);
        await env.BUCKET.put(`${today}.sql`, exportResponse.body);
    }

    console.log("Database finished exporting!");
}
