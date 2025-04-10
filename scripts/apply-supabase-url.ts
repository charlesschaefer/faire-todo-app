const shell = require('shelljs');
const environment = require('../src/environments/environment').environment;

const DIR = require.main?.path;
const SUPABASE_URL_PATTERN = /\$\{SUPABASE_URL\}/g;

const content = shell.cat(`${DIR}/../src-tauri/capabilities/default.json`);
const lines = content.split('\n');
let found = false;

for (let i = 0; i < lines.length; i++) {
    if (SUPABASE_URL_PATTERN.test(lines[i])) {
        lines[i] = lines[i].replace(SUPABASE_URL_PATTERN, environment.supabaseUrl);
        found = true;
        break;
    }
}
if (!found) {
    console.log(`Failed to find \${SUPABASE_URL} in default.json. Maybe already defined?`);
}
else {
    shell.ShellString(lines.join("\n")).to(`${DIR}/../src-tauri/capabilities/default.json`);
    console.log(`File default.json opener context updated to ${environment.supabaseUrl} ....`);
}
