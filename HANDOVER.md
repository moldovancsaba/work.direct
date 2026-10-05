# HANDOVER: work.direct

Date: 2026-10-05. Owner: moldovancsaba. Board: https://github.com/users/moldovancsaba/projects/63. Repo: https://github.com/moldovancsaba/work.direct. Production: https://workdirect.vercel.app (public home page answered HTTP 200 on 2026-10-05; the private endpoints were not checked, the path secret is held by the owner).

## What this is

"Inbox Triage v2": Claude triages the owner's Gmail every hour, and Google Tasks is the single source of truth for the resulting tasks. This repo is the small MCP server (one Vercel function, no dependencies) that gives Claude 12 tools to read and write Google Tasks. The only user is the owner, through a claude.ai custom connector. It is NOT a task tracker, a database or a public service: it stores nothing and passes every call to the Google Tasks API.

## State today

- Version 2.0.0 (`package.json`; the same string is in `SERVER_INFO` in `src/app.js`). No git tags.
- Deploy target: Vercel, scope `narimato`, project `workdirect`. `vercel.json` sets `framework: null`, an empty build command and rewrites every path to `api/index.js`. Vercel's GitHub integration creates the Production deployments (the GitHub repo shows deployments by `vercel[bot]`, latest 2026-09-23). Which branch Vercel treats as production is unverified.
- Last meaningful change: 2026-09-23, `24c9607` (rewrite the bare root), after `d51441f` (public home and privacy pages for the Google OAuth consent screen).
- Works: `npm test` passes, 7 of 7 tests, offline (checked 2026-10-05). The public home page is live.
- Not finished: the Google connection (board issue #29 is In Progress). Whether `GOOGLE_REFRESH_TOKEN` is set in Vercel is unverified. Nothing has been confirmed broken.

## Run, test, deploy

- Install: nothing to install. Node >= 20 (`package.json` engines).
- Test: `npm test` (`node --test test/*.test.js`, mocked Google API).
- Local run: `package.json` defines no dev script. Unverified whether `vercel dev` is used.
- Deploy: push to GitHub; Vercel deploys. Manual form, taken from the text of the server's own OAuth callback page: `vercel env add GOOGLE_REFRESH_TOKEN production && vercel --prod`.
- Environment variable names and purposes: [.env.example](.env.example). Set them in Vercel, Production. Setup order (secret, Google OAuth client, refresh token, connector): [README.md](README.md), "Configure".
- No doc-check script exists.

## In flight

Board: https://github.com/users/moldovancsaba/projects/63 (6 items, standard columns). 5 open issues, 0 open PRs:

- #29 Connect Google: OAuth client, consent screen, refresh token (In Progress, the current blocker)
- #30 Add the claude.ai connector and create the two task lists (Todo)
- #31 Migrate the 30 artifact tasks into Google Tasks (Backlog)
- #32 Switch the hourly scheduled task and runbook to Google Tasks (Backlog)
- #33 Retire the artifact, Zapier and the Cloudflare worker (Backlog, only after 7 clean days)

#28 (deploy to Vercel) is Done. The plan and rollback are in [docs/PLAN.md](docs/PLAN.md).

## Traps and decisions

- Names differ by place: folder and GitHub repo `work.direct`, npm package `work-direct`, MCP server name `gtasks-mcp`, Vercel scope `narimato` and project `workdirect` (project name read from deployment hostnames such as `workdirect-<hash>-narimato.vercel.app`). The README and PLAN used to say `narimato/work.direct`; both are fixed.
- The URL path secret is the only credential: wrong secret returns 404, unset `MCP_PATH_SECRET` returns 500. Only `GET /` and `GET /privacy` are public (needed by the Google consent screen). Never share the connector URL. Source: `src/app.js`, docs/PLAN.md "Security".
- Vercel Deployment Protection must stay off for Production or the connector cannot reach the server (issue #28, docs/PLAN.md).
- The Google consent screen must be "In production"; testing-mode refresh tokens expire after 7 days (docs/PLAN.md).
- Google Tasks keeps dates only, and notes are limited to 8,192 characters (docs/PLAN.md).
- Git history before `fa20def` (2026-09-23) belongs to a different, retired app (`playmass`, v4.x); that commit removed all its files and kept the history. Old commits tracked `.env.local` and `.env.vercel` (file names seen in `git log`, contents not read). The repo is public, so treat anything that was in those files as exposed and rotate it if it is still in use (unverified).
- Five older commits carry `Co-Authored-By` trailers. New commits must not (see [AGENTS.md](AGENTS.md)).
- The GitHub repo's homepage setting points to `https://playmass.vercel.app`, which looks stale. It is a GitHub setting, not a file.
- A local, git-ignored `.env.local` and `.vercel/` exist in the working copy. Do not read or paste them.

## First hour for the next agent

1. Read [AGENTS.md](AGENTS.md), then [README.md](README.md) and [docs/PLAN.md](docs/PLAN.md).
2. Run `npm test` and expect 7 passing.
3. Check `git config user.email` is `moldovancsaba@gmail.com`.
4. Open the board and read issue #29; confirm with the owner which of its checkboxes are done.
5. Verify production: `curl -s -o /dev/null -w "%{http_code}" https://workdirect.vercel.app/` should print 200. Only the owner can test `/<secret>/health`.
6. Take the next item from the board; do not create a second board or a second task store.

## Where things live

- [README.md](README.md): purpose and setup steps.
- [docs/PLAN.md](docs/PLAN.md): decision, task format in Google Tasks, hourly flow, security, delivery steps, rollback. The only doc under `docs/`.
- `src/app.js`: all server logic. `api/index.js`: Vercel entry. `vercel.json`: rewrites. `test/app.test.js`: tests.
- [.env.example](.env.example): environment variable names.
- [AGENTS.md](AGENTS.md) and the identical `CLAUDE.md`: agent rules.
