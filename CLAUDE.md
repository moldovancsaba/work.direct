# AGENTS.md: work.direct

> `AGENTS.md` is the canonical agent-instructions file. `CLAUDE.md` is an identical copy for Claude Code: edit `AGENTS.md`, then run `cp AGENTS.md CLAUDE.md`.

## What this repo is

Inbox Triage v2: a small, dependency-free MCP server (Streamable HTTP, JSON-RPC 2.0) that lets Claude read and write Google Tasks for hourly Gmail triage. It runs as one Vercel function. Google Tasks is the single source of truth for tasks; this server stores nothing. It is a single-user personal tool, not a public service. Current state, traps and next steps: [HANDOVER.md](HANDOVER.md). Plan and decisions: [docs/PLAN.md](docs/PLAN.md).

Naming: GitHub repo `moldovancsaba/work.direct`; Vercel scope `narimato`, project `workdirect` (https://workdirect.vercel.app); npm package `work-direct`; MCP server name `gtasks-mcp`.

## Commands

- Install: none. There are no dependencies (Node >= 20, ES modules).
- Test and gate: `npm test` (`node --test test/*.test.js`, mocked Google API, runs offline).
- Build: none (`vercel.json` sets `framework: null`, empty `buildCommand`).
- Run locally: no script is defined in `package.json`.
- Doc checks: none are defined.

## Code map

- `src/app.js`: all logic (routing, the 12 Google Tasks tools, MCP, the one-time OAuth helper, public home and privacy pages).
- `api/index.js`: Vercel entry; `vercel.json` rewrites every path to it.
- `test/app.test.js`: the tests.
- `.env.example`: the four environment variable names. Real values live only in Vercel.

## Branch, push and deploy

- Single branch: `main`. Vercel's GitHub integration deploys this repo to Production, so a push can change the live connector: run `npm test` first and push only when the task or the owner asks for it.
- Commit identity must be `moldovancsaba <moldovancsaba@gmail.com>`. Check `git config user.email`; if it differs, run `git config user.email moldovancsaba@gmail.com && git config user.name moldovancsaba` (local config).
- No AI attribution anywhere: no `Co-Authored-By`, no "generated with/by", no model or provider names in commit messages, files, comments or docs. Commit messages describe the change only.

## Work tracking

- One repository, exactly ONE project board: https://github.com/users/moldovancsaba/projects/63. Work is tracked as issues and items on it. Never create a second board.
- Standard Status columns, in order: IDEABANK (SOMEDAY), Roadmap (LATER), Backlog (SOONER), Todo (NEXT), In Progress (NOW), Review (ALMOST), Done, Declined (NEVER).

## Do not

- Never commit a secret, and never print or copy values from a local `.env*` file or `.vercel/`; `.env.example` holds names only. The repo is public.
- Never put the `MCP_PATH_SECRET` value or the connector URL in code, docs, issues or chat: the URL is the credential. The public pages must not reveal it (a test checks this).
- Do not add a database, tracker app or other task store: Google Tasks is the only source of truth (docs/PLAN.md, "Decision").
- Do not add dependencies; keeping the server dependency-free is a stated design property (`package.json`, README).
- Do not enable Vercel Deployment Protection on Production; it blocks the claude.ai connector (docs/PLAN.md, "Security").

## Documentation

- Keep one source of truth: link to [docs/PLAN.md](docs/PLAN.md) and [README.md](README.md) instead of copying them.
- Setup steps live in README.md ("Configure"); environment variable names and their purpose live in `.env.example`.
- The tool list and the `--- triage ---` notes convention are described both in docs/PLAN.md and in the `instructions` string in `src/app.js`; keep the two in step.
- Use US English spelling.
