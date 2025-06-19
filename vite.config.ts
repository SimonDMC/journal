import { defineConfig, type ResolvedConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import type { OutputBundle, OutputOptions } from "rollup";
import fs from "fs";
import path from "path";

const STATIC_ASSETS = ["emoji.json"];

function generateBuildMeta() {
    let config: ResolvedConfig;

    return {
        name: "generate-build-meta",

        configResolved(resolvedConfig: ResolvedConfig) {
            config = resolvedConfig;
        },

        generateBundle(_: OutputOptions, bundle: OutputBundle) {
            // compile asset list
            const assets = [...STATIC_ASSETS, ...Object.keys(bundle)];

            const assetListPath = path.join(__dirname, config.build.outDir, "asset-list.json");
            fs.writeFileSync(assetListPath, JSON.stringify({ assets }, null, 2));
            console.log(`\n📝 Asset list written to ${assetListPath}`);
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
    // This splits code into separate .js files for each package, but since the app is always
    // downloaded and installed at once, the only metric that matters is the total bundle size,
    // which remains unchanged. Though it's still useful for auditing bundle size of each package.
    /* build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("node_modules")) {
                        return id.toString().split("node_modules/")[1].split("/")[0].toString();
                    }
                },
            },
        },
    }, */
});
