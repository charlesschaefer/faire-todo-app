
const shell = require('shelljs');


const DIR = require.main.path;
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY";


const FILES = [
    {
        origin: '../src/environments/environment.prod.ts',
        path: '../src/environments/environment.ts',
        patterns: [SUPABASE_URL, SUPABASE_KEY],
        replaces: [process.env['SUPABASE_URL'], process.env['SUPABASE_KEY']]
    }
]

// copy the file
shell.cp("-f", `${DIR}/${FILES[0].origin}`, `${DIR}/${FILES[0].path}`);
console.log(`Copied the file ${DIR}/${FILES[0].origin} to ${DIR}/${FILES[0].path}`);


FILES.forEach(file => {
    const found = new Array(file.patterns.length);
    found.fill(false);

    for (const key in file.patterns) {
        const replaced = shell.sed('-i', file.patterns[key], file.replaces[key], `${DIR}/${file.path}`);
        if (replaced.indexOf(file.replaces[key]) !== -1) {
            found[key] = true;
        }
    }
    
    const replaced = found.reduce((prev, curr) => curr && prev, true);
    if (!replaced) {
        console.error(`Failed to find at least one of the patterns in the file. Partially applied.`);
    } else {
        //shell.ShellString(lines.join("\n")).to(`${DIR}/${file.path}`);
        console.log(`File ${file.path} updated with env variables ....`);
    }
});
