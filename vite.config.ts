import { defineConfig, type ResolvedConfig } from "vite";
import react from "@vitejs/plugin-react-oxc";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { dirSize } from "./src/util/filesystem";
import type { OutputBundle, OutputOptions } from "rolldown";
import fs from "fs";
import path from "path";
import chalk from "chalk";

const STATIC_ASSETS = ["emoji.json", "InterVariable.woff2"];

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

        closeBundle() {
            // log bundle size
            dirSize(path.join(__dirname, config.build.outDir)).then((size) => {
                const sizeInMb = size / 1024 / 1024;
                const roundedSize = Math.round(sizeInMb * 100) / 100;
                console.log(chalk.cyan("Bundle size:"), chalk.bold(chalk.yellow(`${roundedSize} MB`)));
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
        // This splits code into separate js/css files for npm each package, but since the app is always
        // downloaded and installed at once, the only metric that matters is the total bundle size,
        // which remains unchanged. Though it's still useful for auditing bundle size of each package.
        //
        // No longer works after switching to rolldown since its chunking system is different
        /* rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("node_modules")) {
                        return id.toString().split("node_modules/")[1].split("/")[0].toString();
                    }
                },
            },
        }, */
        chunkSizeWarningLimit: 2000,
    },
});
