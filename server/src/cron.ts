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
        const gzipStream = new CompressionStream("gzip");
        // gzip whole database in memory, since R2 doesn't support direct streaming. if the
        // database gets larger than ~50MB we'll have to start chunking and uploading in parts,
        // but that's not a cause of concern right now
        const compressedStream = exportResponse.body!.pipeThrough(gzipStream);
        const compressedBuffer = await new Response(compressedStream).arrayBuffer();
        const today = new Date().toISOString().substring(0, 10);
        await env.BUCKET.put(`${today}.sql.gz`, compressedBuffer, {
            httpMetadata: {
                contentEncoding: "gzip",
                contentType: "application/x-sql",
            },
        });
    }

    console.log("Database finished exporting!");
}
