#!/usr/bin/env node

// Creates an update entry in versions.json
//
// Syntax: `version add [version] [description]`
//         `version remove [version]`
//         `version update [version] [new description]`
//
// You can also use `patch`, `minor` and `major` in
// place of version numbers to use the next available
// version number
//
// Shorthands: version -> ver
//             add -> a
//             update -> up
//             remove -> rm
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

let version = process.argv[3];
const desc = process.argv.slice(4).join(" ");

switch (process.argv[2]) {
    case "add":
    case "a":
        if (process.argv.length < 5) {
            log(chalk.red(`❌ Missing arguments`));
            break;
        }

        const oldVersion = versions.current?.version ?? "0.0.0";
        if (!version.match(/^\d+\.\d+\.\d+$/)) {
            const versionSplit = oldVersion.split(".").map((v) => parseInt(v));

            if (version == "patch" || version == "p") {
                versionSplit[2]++;
            } else if (version == "minor" || version == "min") {
                versionSplit[1]++;
                versionSplit[2] = 0;
            } else if (version == "major") {
                versionSplit[0]++;
                versionSplit[1] = 0;
                versionSplit[2] = 0;
            } else {
                log(chalk.red(`❌ Couldn't parse version "${version}"`));
                break;
            }

            version = versionSplit.join(".");
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
    default:
        if (process.argv[2]) {
            log(chalk.red(`❌ Unknown subcommand "${process.argv[2]}"`));
        } else {
            log(chalk.yellow("Syntax: `version add [version] [description]`"));
            log(chalk.yellow("        `version remove [version]`"));
            log(chalk.yellow("        `version update [version] [new description]`"));
        }
        break;
}

fs.writeFileSync(versionsPath, JSON.stringify(versions, null, 2));

function log(text) {
    const date = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    const seconds = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
    console.log(chalk.dim(`[${hours}:${minutes}:${seconds}] `) + text);
}
