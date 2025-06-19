#!/usr/bin/env node

// Creates an update entry in versions.json
//
// Syntax: `version add <version> <description>`
//         `version remove <version>`
//         `version update <version> <new description>`
//         `version list [amount]`
//         `version listall`
//
// You can also use `patch`, `minor` and `major` in
// place of version numbers to use the next available
// version number, or `latest` to use the current one
//
// Shorthands: version -> ver
//
//             add -> a
//             update -> up
//             remove -> rm
//             list -> ls
//             listall -> lsa
//
//             l -> latest
//             p -> patch
//             min -> minor

import chalk from "chalk";
import fs from "fs";
import path from "path";

const versionsPath = path.join(import.meta.dirname, "../../versions.json");

if (!fs.existsSync(versionsPath)) {
    log(chalk.gray("Creating versions.json"));
    fs.writeFileSync(
        versionsPath,
        JSON.stringify({
            current: {},
            history: [],
        })
    );
}

const versions = JSON.parse(fs.readFileSync(versionsPath));

let version;
const desc = process.argv.slice(4).join(" ");

switch (process.argv[2]) {
    case "add":
    case "a":
        if (process.argv.length < 5) {
            log(chalk.red(`❌ Missing arguments`));
            break;
        }

        const oldVersion = versions.current?.version ?? "0.0.0";
        version = parseVersion(process.argv[3]);
        if (!version) {
            log(chalk.red(`❌ Couldn't parse version "${version}"`));
            break;
        }

        if (versions.history.filter((v) => v.version == version).length > 0) {
            log(chalk.red(`❌ Version ${version} already exists`));
            break;
        }

        const versionEntry = {
            version,
            desc,
            released: Date.now(),
        };

        versions.current = versionEntry;
        // prepend to history
        versions.history.unshift(versionEntry);

        log(chalk.green(`✅ Updated ${oldVersion} -> ${version} with description "${desc}"`));
        break;
    case "remove":
    case "rm":
        if (process.argv.length < 4) {
            log(chalk.red(`❌ Missing arguments`));
            break;
        }

        version = parseVersion(process.argv[3]);
        if (!version) {
            log(chalk.red(`❌ Couldn't parse version "${version}"`));
            break;
        }

        if (versions.history.filter((v) => v.version == version).length == 0) {
            log(chalk.red(`❌ Version ${version} doesn't exist`));
            break;
        }

        // remove from history
        versions.history = versions.history.filter((v) => v.version != version);

        // downgrade current if necessary
        if (versions.current.version == version) {
            versions.current = versions.history[0] ?? {};
        }

        log(chalk.green(`✅ Removed version ${version}`));
        break;
    case "update":
    case "up":
        if (process.argv.length < 5) {
            log(chalk.red(`❌ Missing arguments`));
            break;
        }

        version = parseVersion(process.argv[3]);
        if (!version) {
            log(chalk.red(`❌ Couldn't parse version "${version}"`));
            break;
        }

        if (versions.history.filter((v) => v.version == version).length == 0) {
            log(chalk.red(`❌ Version ${version} doesn't exist`));
            break;
        }

        versions.history = versions.history.map((v) => {
            if (v.version == version) v.desc = desc;
            return v;
        });

        // update current desc if necessary
        if (versions.current.version == version) {
            versions.current.desc = desc;
        }

        log(chalk.green(`✅ Updated version ${version} with description "${desc}"`));
        break;
    case "list":
    case "ls":
        let versionAmount = 5;
        if (process.argv.length > 3) {
            versionAmount = parseInt(process.argv[3]);
            if (isNaN(versionAmount)) {
                log(chalk.red(`❌ Couldn't parse "${process.argv[4]}"`));
                break;
            }
        }

        for (let i = 0; i < Math.min(versionAmount, versions.history.length); i++) {
            logVersion(versions.history[i]);
        }
        break;
    case "listall":
    case "lsa":
        for (let i = 0; i < versions.history.length; i++) {
            logVersion(versions.history[i]);
        }
        break;
    default:
        if (process.argv[2]) {
            log(chalk.red(`❌ Unknown subcommand "${process.argv[2]}"`));
        } else {
            log(chalk.yellow("Syntax: `version add <version> <description>`"));
            log(chalk.yellow("        `version remove <version>`"));
            log(chalk.yellow("        `version update <version> <new description>`"));
            log(chalk.yellow("        `version list [amount]`"));
            log(chalk.yellow("        `version listall`"));
        }
        break;
}

fs.writeFileSync(versionsPath, JSON.stringify(versions, null, 2));

////////////////////
// util functions //
////////////////////

function log(text) {
    const date = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    const seconds = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
    console.log(chalk.dim(`[${hours}:${minutes}:${seconds}] `) + text);
}

function parseVersion(version) {
    const oldVersion = versions.current?.version ?? "0.0.0";
    if (!version.match(/^\d+\.\d+\.\d+$/)) {
        const versionSplit = oldVersion.split(".").map((v) => parseInt(v));

        if (version == "latest" || version == "l") {
            return oldVersion;
        } else if (version == "patch" || version == "p") {
            versionSplit[2]++;
        } else if (version == "minor" || version == "min") {
            versionSplit[1]++;
            versionSplit[2] = 0;
        } else if (version == "major") {
            versionSplit[0]++;
            versionSplit[1] = 0;
            versionSplit[2] = 0;
        } else {
            return;
        }

        return versionSplit.join(".");
    }
}

function logVersion(version) {
    console.log(
        chalk.gray(`[${new Date(version.released).toISOString().substring(0, 10)}]`),
        chalk.blue(`v${version.version}`),
        chalk.cyan(version.desc)
    );
}
