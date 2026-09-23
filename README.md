# work.direct

Inbox Triage v2. Claude triages Gmail hourly; **Google Tasks is the single source of truth for tasks**. This repo is the small MCP server that lets Claude read and write Google Tasks, deployed on Vercel (`narimato/work.direct`).

- Plan: [docs/PLAN.md](docs/PLAN.md)
- Work: the repo's one project board

## Develop

```bash
npm test                      # node --test, mocked Google API, no dependencies
```

## Configure (Vercel → Environment Variables, Production)

See [.env.example](.env.example): `MCP_PATH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`.

1. Set `MCP_PATH_SECRET` (`openssl rand -hex 24`), deploy.
2. Google Cloud → enable the Tasks API → OAuth client (Web application), redirect URI `https://<host>/<MCP_PATH_SECRET>/oauth/callback`; consent screen **In production**.
3. Set the client id and secret, redeploy, open `https://<host>/<MCP_PATH_SECRET>/oauth/start`, store the shown refresh token as `GOOGLE_REFRESH_TOKEN`, redeploy.
4. `https://<host>/<MCP_PATH_SECRET>/health` → `{"ok":true,…}`.
5. claude.ai → Settings → Connectors → Add custom connector: URL `https://<host>/<MCP_PATH_SECRET>/mcp`, no authentication. The URL is the credential — never share it.
