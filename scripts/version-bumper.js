#!/usr/bin/env node

const shell = require('shelljs');

const DIR = require.main.path;
const SNAPCRAFT_PATTERN = /^version: '(\d+\.\d+\.\d+)'$/;
const CARGO_PATTERN = /^version = "(\d+\.\d+\.\d+)"$/;
const TAURI_PATTERN = /^  "version": "(\d+\.\d+\.\d+)",$/;

const FILES = [
    {
        path: '../snapcraft.yaml',
        pattern: SNAPCRAFT_PATTERN,
        replace: "version: '$version'"
    },
    {
        path: '../src-tauri/Cargo.toml',
        pattern: CARGO_PATTERN,
        replace: 'version = "$version"'
    },
    {
        path: '../src-tauri/tauri.conf.toml',
        pattern: TAURI_PATTERN,
        replace: '  "version": "$version",'
    }
]

const version = shell.exec('npm version patch');

if (version.code !== 0) {
    console.error('Failed to bump version. Check stderr for more information.');
    process.exit(1);
}

let versionNumber = version.stdout.trim();

console.log(`Bumped version to ${versionNumber}`);
versionNumber = versionNumber.replace('v', '');

FILES.forEach(file => {
    const content = shell.cat(`${DIR}/${file.path}`);
    const lines = content.split('\n');
    let found = false;
    for (let i = 0; i < lines.length; i++) {
        if (file.pattern.test(lines[i])) {
            let line = file.replace.replace("$version", versionNumber);
            lines[i] = file.pattern.replace(file.pattern, line);
            break;
        }
    }
    if (!found) {
        console.error(`Failed to find version in ${file.path} using pattern ${file.pattern}`);
    } else {
        //shell.ShellString(lines.join("\n")).to(file.path);
        console.log(`File ${file.path} updated to ${versionNumber}: ${lines.slice(0, 10).join("\n")} ....`);
        console.info(`Updated ${file.path} to ${versionNumber}`);
    }
});


