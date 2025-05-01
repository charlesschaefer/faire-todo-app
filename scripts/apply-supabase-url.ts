const shell = require('shelljs');
const environment = require('../src/environments/environment').environment;

const DIR = require.main?.path;
const SUPABASE_URL_PATTERN = /\$SUPABASE_URL/g;
const TARGET_FILE = 'src-tauri/capabilities/opener-permissions.json';

const content = `
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "opener-permissions",
  "description": "Scoped permissions for the opener plugin",
  "platforms": ["iOS", "android", "linux", "macOS", "windows"],
  "windows": [
    "main"
  ],
  "permissions": [
    {
      "identifier": "opener:allow-open-url",
      "allow": [
        {
          "url": "$SUPABASE_URL/*"
        }
      ]
    }
  ]
}
`;

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
    shell.ShellString(lines.join("\n")).to(`${DIR}/../${TARGET_FILE}`);
    console.log(`File ${TARGET_FILE} updated to ${environment.supabaseUrl} on opener plugin context...`);
}
