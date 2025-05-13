import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import fs from "fs";
import path from "path";

function createUpdate() {
    return {
        name: "write-build-meta",
        buildStart() {
            const buildTimestamp = Date.now();
            const outputPath = path.join(__dirname, "public", "build-meta.json");
            fs.writeFileSync(outputPath, JSON.stringify({ buildTimestamp }));
            console.log(`⬆️  Build timestamp written to ${outputPath}`);
        },
    };
}

// https://vite.dev/config/
export default defineConfig({
    plugins: [TanStackRouterVite({ target: "react", autoCodeSplitting: true }), react(), createUpdate()],
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
