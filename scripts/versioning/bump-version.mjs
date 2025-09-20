#!/usr/bin/env node
/*
  bump-version.mjs
  Purpose: Enforce project versioning rules and synchronize documentation timestamps and version numbers.
  Why: This project requires strict, automated versioning and doc sync across README, ROADMAP, TASKLIST, RELEASE_NOTES, LEARNINGS, and WARP.DEV_AI_CONVERSATION.md with ISO 8601 UTC timestamps (including milliseconds).

  Usage examples:
    node scripts/versioning/bump-version.mjs --type patch --reason "Pre-dev patch bump"
    node scripts/versioning/bump-version.mjs --type minor --reason "Editor improvements"
    node scripts/versioning/bump-version.mjs --type major --reason "Breaking: centralized editor v3"

  Effects:
    - Bumps version in package.json according to --type
    - Updates timestamps and current version markers in docs
    - Prepends a new RELEASE_NOTES entry for this version with the provided reason (if any)
    - Appends a log entry to WARP.DEV_AI_CONVERSATION.md for traceability

  Notes:
    - No external dependencies used; pure Node.js
    - Timestamps are generated in ISO 8601 with milliseconds, in UTC (toISOString)
*/

import fs from 'fs';
import path from 'path';

function isoNow() {
  // Ensures millisecond precision UTC timestamp
  return new Date().toISOString();
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}

function bump(version, type) {
  const [maj, min, pat] = version.split('.').map(n => parseInt(n, 10));
  if ([maj, min, pat].some(Number.isNaN)) throw new Error(`Invalid semver: ${version}`);
  switch (type) {
    case 'patch':
      return `${maj}.${min}.${pat + 1}`;
    case 'minor':
      return `${maj}.${min + 1}.0`;
    case 'major':
      return `${maj + 1}.0.0`;
    default:
      throw new Error(`Unknown bump type: ${type}`);
  }
}

function replaceOnce(str, pattern, replacement) {
  const re = new RegExp(pattern, 'm');
  return str.replace(re, replacement);
}

function updateFile(filePath, updater) {
  const content = fs.readFileSync(filePath, 'utf8');
  const next = updater(content);
  if (next !== content) {
    fs.writeFileSync(filePath, next);
  }
}

function prependAfterHeader(content, headerPattern, insertBlock) {
  const re = new RegExp(headerPattern, 'm');
  const match = content.match(re);
  if (!match) return content; // header not found; return unchanged
  const idx = match.index + match[0].length;
  return content.slice(0, idx) + '\n\n' + insertBlock + '\n' + content.slice(idx);
}

function main() {
  const args = process.argv.slice(2);
  const typeIdx = args.indexOf('--type');
  const reasonIdx = args.indexOf('--reason');
  if (typeIdx === -1 || !args[typeIdx + 1]) {
    console.error('Error: --type patch|minor|major is required');
    process.exit(1);
  }
  const bumpType = args[typeIdx + 1];
  const reason = (reasonIdx !== -1 ? args.slice(reasonIdx + 1).join(' ').trim() : '').replace(/^"|"$/g, '');

  const repoRoot = process.cwd();
  const pkgPath = path.join(repoRoot, 'package.json');
  const pkg = readJson(pkgPath);
  const oldVersion = pkg.version;
  const newVersion = bump(oldVersion, bumpType);
  const now = isoNow();

  // 1) Update package.json
  pkg.version = newVersion;
  writeJson(pkgPath, pkg);

  // 2) Update README.md (Current Version / Last Updated)
  const readmePath = path.join(repoRoot, 'README.md');
  if (fs.existsSync(readmePath)) {
    updateFile(readmePath, (s) => {
      s = s.replace(/Current Version:\s*\d+\.\d+\.\d+/m, `Current Version: ${newVersion}`);
      s = s.replace(/Last Updated:\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/m, `Last Updated: ${now}`);
      return s;
    });
  }

  // 3) LEARNINGS.md (Current/Last Updated)
  const learnPath = path.join(repoRoot, 'LEARNINGS.md');
  if (fs.existsSync(learnPath)) {
    updateFile(learnPath, (s) => {
      s = s.replace(/\*\*Current Version\*\*:\s*\d+\.\d+\.\d+/m, `**Current Version**: ${newVersion}`);
      s = s.replace(/\*\*Last Updated\*\*:\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/m, `**Last Updated**: ${now}`);
      return s;
    });
  }

  // 4) TASKLIST.md (first-line version, Last Updated line near top, Current Version near bottom)
  const taskPath = path.join(repoRoot, 'TASKLIST.md');
  if (fs.existsSync(taskPath)) {
    updateFile(taskPath, (s) => {
      const lines = s.split('\n');
      // Replace first non-empty line if it looks like semver
      for (let i = 0; i < Math.min(5, lines.length); i++) {
        if (/^\d+\.\d+\.\d+$/.test(lines[i].trim())) { lines[i] = newVersion; break; }
      }
      let out = lines.join('\n');
      out = out.replace(/\*\*Last Updated\*\*:\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/m, `**Last Updated**: ${now}`);
      out = out.replace(/\*\*Current Version\*\*:\s*\d+\.\d+\.\d+/m, `**Current Version**: ${newVersion}`);
      return out;
    });
  }

  // 5) ROADMAP.md (Last Updated)
  const roadmapPath = path.join(repoRoot, 'ROADMAP.md');
  if (fs.existsSync(roadmapPath)) {
    updateFile(roadmapPath, (s) => s.replace(/Last Updated:\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/m, `Last Updated: ${now}`));
  }

  // 6) RELEASE_NOTES.md (Current Version / Last Updated + prepend entry)
  const rnPath = path.join(repoRoot, 'RELEASE_NOTES.md');
  if (fs.existsSync(rnPath)) {
    updateFile(rnPath, (s) => {
      s = s.replace(/\*\*Current Version\*\*:\s*\d+\.\d+\.\d+/m, `**Current Version**: ${newVersion}`);
      s = s.replace(/\*\*Last Updated\*\*:\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/m, `**Last Updated**: ${now}`);
      const block = [
        `### [v${newVersion}] — ${now}`,
        reason ? `- ${reason}` : '- Automated version bump and documentation synchronization.'
      ].join('\n');
      s = prependAfterHeader(s, '^## \uD83D\uDD39 Version History$', block);
      return s;
    });
  }

  // 7) WARP.DEV_AI_CONVERSATION.md (append delivery log)
  const warpPath = path.join(repoRoot, 'WARP.DEV_AI_CONVERSATION.md');
  if (fs.existsSync(warpPath)) {
    const entry = `\n${now} — Delivery: Version bump and doc sync to v${newVersion}\n- Notes: Automated via scripts/versioning/bump-version.mjs (UTC timestamps with ms)`;
    fs.appendFileSync(warpPath, entry);
  }

  // Output new version for downstream scripts (e.g., commit message composition)
  process.stdout.write(`${newVersion}\n`);
}

main();
