#!/usr/bin/env node
// Prints the current version from package.json. Helpful for composing commit messages.
import fs from 'fs';
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
process.stdout.write(`${pkg.version}\n`);
