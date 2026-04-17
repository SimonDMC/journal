import { defineConfig, type Connect, type ResolvedConfig, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { dirSize } from "./client/src/util/filesystem";
import type { OutputBundle, OutputOptions } from "rolldown";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import { execSync } from "child_process";
import type { ServerResponse } from "http";

const STATIC_ASSETS = ["emoji.json", "InterVariable.woff2", "InterVariable-Italic.woff2"];

function generateBuildMeta() {
    let config: ResolvedConfig;

    return {
        name: "generate-build-meta",

        configResolved(resolvedConfig: ResolvedConfig) {
            config = resolvedConfig;
        },

        generateBundle(_: OutputOptions, bundle: OutputBundle) {
            if (!config.build.outDir.endsWith("client")) return;

            // compile asset list
            const assets = [...STATIC_ASSETS, ...Object.keys(bundle)];

            const assetListDir = path.join(__dirname, config.build.outDir);
            fs.mkdirSync(assetListDir, { recursive: true });
            const assetListPath = path.join(assetListDir, "asset-list.json");
            fs.writeFileSync(assetListPath, JSON.stringify({ assets }, null, 2));
            console.log(`\n📝 Asset list written to ${assetListPath}`);
        },

        closeBundle() {
            if (!config.build.outDir.endsWith("client")) return;

            // log bundle size
            dirSize(path.join(__dirname, config.build.outDir)).then((size) => {
                const sizeInMb = size / 1024 / 1024;
                const roundedSize = Math.round(sizeInMb * 100) / 100;
                console.log(chalk.cyan("Bundle size:"), chalk.bold(chalk.yellow(`${roundedSize} MB`)));
            });
        },
    };
}

function getBuildInfo() {
    const commitHash = execSync("git rev-parse --short HEAD").toString().trim();
    const buildTimestamp = Date.now();

    return { commitHash, buildTimestamp };
}

// bypass cloudflare plugin breaking SPA behavior on local network addresses
function spaFallback() {
    return {
        name: "spa-fallback",
        configureServer(server: ViteDevServer) {
            server.middlewares.use((req: Connect.IncomingMessage, _: ServerResponse, next: Connect.NextFunction) => {
                // rewrite request back to / if it's a static request
                if (req.method === "GET" && req.url && !req.url.startsWith("/api/") && req.headers.accept?.includes("text/html")) {
                    req.url = "/";
                }
                next();
            });
        },
    };
}

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        tanstackRouter({
            target: "react",
            autoCodeSplitting: true,
            routesDirectory: "./client/src/routes",
            generatedRouteTree: "./client/src/routeTree.gen.ts",
        }),
        react(),
        spaFallback(),
        cloudflare(),
        generateBuildMeta(),
        viteStaticCopy({
            targets: [
                { src: "versions.json", dest: "" },
                { src: "client/src/sw.js", dest: "" },
            ],
            silent: true,
        }),
    ],
    server: {
        allowedHosts: true,
    },
    build: {
        // This splits code into separate js/css files for npm each package, but since the app is always
        // downloaded and installed at once, the only metric that matters is the total bundle size,
        // which remains unchanged. Though it's still useful for auditing bundle size of each package.
        /* rolldownOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("node_modules")) {
                        return id.toString().split("node_modules/")[1].split("/")[0].toString();
                    }
                },
            },
        }, */
        chunkSizeWarningLimit: 2500,
    },
    publicDir: "client/public",
    define: {
        __BUILD_INFO__: JSON.stringify(getBuildInfo()),
    },
});
