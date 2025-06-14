import { defineConfig, type ResolvedConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import type { OutputBundle, OutputOptions } from "rollup";
import fs from "fs";
import path from "path";

function generateBuildMeta() {
    let config: ResolvedConfig;

    return {
        name: "generate-build-meta",

        configResolved(resolvedConfig: ResolvedConfig) {
            config = resolvedConfig;
        },

        generateBundle(_: OutputOptions, bundle: OutputBundle) {
            // generate asset list
            const assets = Object.keys(bundle);

            const assetListPath = path.join(__dirname, config.build.outDir, "asset-list.json");
            fs.writeFileSync(assetListPath, JSON.stringify({ assets }, null, 2));
            console.log(`📝 Asset list written to ${assetListPath}`);
        },
    };
}

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        TanStackRouterVite({
            target: "react",
            autoCodeSplitting: true,
        }),
        react(),
        generateBuildMeta(),
        viteStaticCopy({
            targets: [
                { src: "versions.json", dest: "" },
                { src: "src/sw.js", dest: "" },
            ],
        }),
    ],
    server: {
        hmr: {
            host: "localhost",
            protocol: "ws",
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("node_modules")) {
                        return id.toString().split("node_modules/")[1].split("/")[0].toString();
                    }
                },
            },
        },
    },
});
