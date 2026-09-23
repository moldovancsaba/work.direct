# Inbox Triage v2 — plan

Single source for the plan. Work is tracked as issues on this repo's one project board.
(Supersedes the Google Doc "Inbox Triage v2 — web platform plan", which now only points here.)

## Decision

**Google Tasks is the single source of truth for tasks.** The claude.ai artifact and its database are retired; no MongoDB, no tracker web app, no Zapier, no Cloudflare worker.

| Piece | Where | Job |
|---|---|---|
| Claude scheduled task "Inbox Triage refresh" | claude.ai, hourly (Anthropic's schedule) | Scan Gmail, classify Do / Delegate / Delete, archive, write the per-task Google Doc and Calendar events, create/update Google Tasks, append a run-log line, push a notification |
| Google Tasks MCP server | this repo → Vercel project `narimato/work.direct` | The only way Claude reads and writes Google Tasks (custom connector) |
| Google Tasks app / web | your phone and browser | The task surface: tick, reorder, edit due dates, add notes |
| Per-task Google Doc | Google Drive | Long content: full context, thread excerpts, drafts |
| Runbook Google Doc | Google Drive | Run log (one line per run) and status: last run, archive counts |

## Task representation in Google Tasks

- Two lists: **`Triage · Do`** and **`Triage · Delegate`**. Changing type = `move_task` to the other list.
- Title: `[tNN] <title>` — the stable id Claude matches on (`find_tasks` with the prefix). Delegate tasks: `[tNN] → <name>: <title>`.
- Steps: subtasks of the task. Ticking a step in the Google Tasks app is the step being done.
- Due date: the task's date (Google Tasks stores dates only).
- Done: the task's completed state. Completing in the app is final — Claude never reopens a task the user completed unless new mail arrives on its thread, and then it says so in the run summary.
- Notes: free text you may edit on top, then a machine block Claude owns:

```
<summary — Claude writes it on create; yours to edit afterwards>

--- triage ---
doc: https://docs.google.com/document/d/…
threads: 18f2a…, 18f3b…
contacts: Name <mail@x>; Name <mail@y>
delegate: Name — why
priority: high|medium|low
updated: 2026-09-23T14:00Z
```

Rules: Claude rewrites only the lines below `--- triage ---`; anything above it is yours after creation. Notes stay under Google's 8,192-character limit — long content goes to the Doc.
- Next id: Claude takes the highest `[tNN]` across both lists (completed and hidden included) + 1.

## Hourly flow

1. `list_tasks` on both lists (completed + hidden included) → current state, including what you ticked or edited.
2. Gmail scan and classification (unchanged).
3. New item → `create_task` (+ subtasks for steps) in the right list; existing item → `update_task` on the triage block, due date or title only; type change → `move_task`.
4. Tasks you completed are left alone; their threads are archived if still in the inbox.
5. Append one line to the runbook's Run log: time, threads scanned, new / updated / archived, errors.
6. Push notification only if something new needs you.

## Server (this repo)

Dependency-free JavaScript: `src/app.js` (MCP Streamable HTTP, JSON-RPC 2.0, stateless), `api/index.js` (Vercel entry), `vercel.json` (rewrite every path to the function).

Tools: `list_task_lists`, `create_task_list`, `list_tasks`, `find_tasks`, `get_task`, `create_task`, `update_task` (partial), `move_task`, `complete_task`, `reopen_task`, `delete_task`, `clear_completed`.

Endpoints, all under `/<MCP_PATH_SECRET>/`: `mcp` (POST), `oauth/start`, `oauth/callback`, `health`. Anything else → 404.

## Security

- `MCP_PATH_SECRET` (`openssl rand -hex 24`) is the only credential a claude.ai custom connector carries without OAuth; wrong secret → 404. Rotate by changing the env var and the connector URL.
- Google scope `https://www.googleapis.com/auth/tasks` only. Refresh token lives only in Vercel env (encrypted). The OAuth consent screen must be **In production** (testing-mode tokens expire after 7 days); as the only user you accept a one-time "unverified app" warning.
- Repo is public: no secrets in it, `.env*` ignored. Vercel Deployment Protection stays off for Production (it would block the connector).

## Free-tier fit

Vercel Hobby (personal, non-commercial): ≈ 24 runs/day × ~10 calls ≈ 7,000 invocations/month of 1M. Google Tasks API: 50,000 queries/day, free. Claude scheduled task: inside the existing subscription. No metered services.

## Delivery (issues on the board)

1. Deploy the MCP server to Vercel (`framework: null`), set `MCP_PATH_SECRET` — `/health` answers (Google not yet connected).
2. Google Cloud OAuth client (Web), redirect URI `https://workdirect-narimato.vercel.app/<secret>/oauth/callback`, consent screen In production; set client id/secret, run `/oauth/start`, store `GOOGLE_REFRESH_TOKEN` — `/health` → `ok: true`.
3. Add the claude.ai custom connector **Google Tasks** (`…/<secret>/mcp`, no auth); create the lists `Triage · Do` and `Triage · Delegate`.
4. Migrate: export the 30 artifact rows once, create them as Google Tasks per the representation above (done ones as completed); verify counts per list.
5. Update the scheduled-task prompt and the runbook to this flow; run one full cycle and check the run-log line.
6. Retire: delete the artifact after 7 clean days, disconnect Zapier, delete the Cloudflare worker, remove ArtifactData/Zapier paragraphs from the runbook and memory.

Steps only you can do: Google Cloud console (2), claude.ai connector (3), approving the prompt change (5), secret rotation.

## Rollback

Until step 6 the artifact is untouched: put the previous prompt back and remove the connector. Anything changed in Google Tasks in between stays there.
