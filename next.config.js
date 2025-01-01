const fs = require("fs");
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack(config) {
        const buildTimestamp = Date.now();
        fs.writeFileSync(path.join(__dirname, "public", "build-meta.json"), JSON.stringify({ buildTimestamp }));
        return config;
    },
};

module.exports = nextConfig;
