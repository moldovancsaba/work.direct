/**
 * gtasks-mcp — a tiny, dependency-free MCP server for Google Tasks, deployed as one Vercel function
 * (api/index.js; vercel.json rewrites every path to it). Google Tasks is the single source of truth
 * for Inbox Triage tasks; this server is the only way Claude reads and writes them.
 *
 * Endpoints (all under the secret path prefix, see MCP_PATH_SECRET):
 *   POST /<secret>/mcp            MCP Streamable-HTTP (JSON-RPC 2.0, stateless)
 *   GET  /<secret>/mcp            405 (no server-push stream needed)
 *   GET  /<secret>/oauth/start    one-time: redirect to Google consent (offline access)
 *   GET  /<secret>/oauth/callback one-time: exchange the code, show the refresh token
 *   GET  /<secret>/health         quick check that the refresh token works
 *
 * Environment variables (Vercel project settings → Environment Variables, Production):
 *   MCP_PATH_SECRET        random string used as the URL prefix (the only "auth" claude.ai can carry)
 *   GOOGLE_CLIENT_ID       OAuth 2.0 client id  (Web application type)
 *   GOOGLE_CLIENT_SECRET   OAuth 2.0 client secret
 *   GOOGLE_REFRESH_TOKEN   obtained once via /oauth/start → /oauth/callback
 */

const SERVER_INFO = { name: "gtasks-mcp", version: "2.0.0" };
const PROTOCOL_VERSION = "2025-06-18";
const TASKS_API = "https://tasks.googleapis.com/tasks/v1";
const SCOPE = "https://www.googleapis.com/auth/tasks";

// ---------------------------------------------------------------------------
// Google auth (refresh-token flow, access token cached per function instance)
// ---------------------------------------------------------------------------
let cachedToken = { value: null, expiresAt: 0 };

async function getAccessToken(env) {
  if (cachedToken.value && Date.now() < cachedToken.expiresAt - 30_000) return cachedToken.value;
  if (!env.GOOGLE_REFRESH_TOKEN) throw new Error("GOOGLE_REFRESH_TOKEN secret is not set — run /oauth/start first");
  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    refresh_token: env.GOOGLE_REFRESH_TOKEN,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) throw new Error(`Google token refresh failed: ${res.status} ${JSON.stringify(json)}`);
  cachedToken = { value: json.access_token, expiresAt: Date.now() + (json.expires_in || 3600) * 1000 };
  return cachedToken.value;
}

async function gapi(env, method, path, { query, body } = {}) {
  const token = await getAccessToken(env);
  const url = new URL(TASKS_API + path);
  if (query) for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  const res = await fetch(url, {
    method,
    headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return {};
  const text = await res.text();
  let json = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) {
    const msg = json?.error?.message || text || res.statusText;
    throw new Error(`Google Tasks API ${method} ${path} → ${res.status}: ${msg}`);
  }
  return json;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Google Tasks stores `due` as an RFC3339 date at midnight UTC; a plain YYYY-MM-DD is normalised. */
function normaliseDue(due) {
  if (due === undefined) return undefined;
  if (due === null || due === "") return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(due)) return `${due}T00:00:00.000Z`;
  return due;
}

function slimTask(t) {
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    due: t.due ? t.due.slice(0, 10) : null,
    notes: t.notes ?? "",
    completed: t.completed ?? null,
    updated: t.updated,
    hidden: !!t.hidden,
    deleted: !!t.deleted,
    parent: t.parent ?? null,
    position: t.position,
    webViewLink: t.webViewLink,
  };
}

async function listAllTasks(env, tasklist, opts = {}) {
  const out = [];
  let pageToken;
  do {
    const page = await gapi(env, "GET", `/lists/${encodeURIComponent(tasklist)}/tasks`, {
      query: {
        maxResults: 100,
        showCompleted: opts.showCompleted ?? true,
        showHidden: opts.showHidden ?? true,
        showDeleted: opts.showDeleted ?? false,
        updatedMin: opts.updatedMin,
        dueMin: opts.dueMin ? normaliseDue(opts.dueMin) : undefined,
        dueMax: opts.dueMax ? normaliseDue(opts.dueMax) : undefined,
        pageToken,
      },
    });
    for (const t of page.items || []) out.push(slimTask(t));
    pageToken = page.nextPageToken;
  } while (pageToken);
  return out;
}

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------
const TOOLS = [
  {
    name: "list_task_lists",
    description: "List all Google Tasks lists of the connected account (id, title, updated).",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    handler: async (env) => {
      const res = await gapi(env, "GET", "/users/@me/lists", { query: { maxResults: 100 } });
      return { lists: (res.items || []).map((l) => ({ id: l.id, title: l.title, updated: l.updated })) };
    },
  },
  {
    name: "create_task_list",
    description: "Create a new Google Tasks list.",
    inputSchema: { type: "object", properties: { title: { type: "string" } }, required: ["title"], additionalProperties: false },
    handler: async (env, { title }) => {
      const l = await gapi(env, "POST", "/users/@me/lists", { body: { title } });
      return { id: l.id, title: l.title };
    },
  },
  {
    name: "list_tasks",
    description:
      "List every task in a list, including completed and hidden ones (unlike Zapier, showHidden is on by default). Handles pagination. Optional filters: showCompleted, showHidden, updatedMin (RFC3339), dueMin/dueMax (YYYY-MM-DD).",
    inputSchema: {
      type: "object",
      properties: {
        tasklist: { type: "string", description: "Task list id" },
        showCompleted: { type: "boolean", default: true },
        showHidden: { type: "boolean", default: true },
        showDeleted: { type: "boolean", default: false },
        updatedMin: { type: "string", description: "RFC3339 timestamp; only tasks updated after this" },
        dueMin: { type: "string" },
        dueMax: { type: "string" },
      },
      required: ["tasklist"],
      additionalProperties: false,
    },
    handler: async (env, a) => {
      const tasks = await listAllTasks(env, a.tasklist, a);
      return { count: tasks.length, tasks };
    },
  },
  {
    name: "find_tasks",
    description:
      "Find tasks in a list whose title starts with (or contains) the given text — e.g. the tracker prefix \"[t12]\". Searches completed and hidden tasks too.",
    inputSchema: {
      type: "object",
      properties: {
        tasklist: { type: "string" },
        title: { type: "string", description: "Text to match against the title" },
        mode: { type: "string", enum: ["prefix", "contains"], default: "prefix" },
      },
      required: ["tasklist", "title"],
      additionalProperties: false,
    },
    handler: async (env, { tasklist, title, mode = "prefix" }) => {
      const needle = title.toLowerCase();
      const tasks = (await listAllTasks(env, tasklist)).filter((t) => {
        const h = (t.title || "").toLowerCase();
        return mode === "contains" ? h.includes(needle) : h.startsWith(needle);
      });
      return { count: tasks.length, tasks };
    },
  },
  {
    name: "get_task",
    description: "Get one task by id.",
    inputSchema: { type: "object", properties: { tasklist: { type: "string" }, task: { type: "string" } }, required: ["tasklist", "task"], additionalProperties: false },
    handler: async (env, { tasklist, task }) => slimTask(await gapi(env, "GET", `/lists/${encodeURIComponent(tasklist)}/tasks/${encodeURIComponent(task)}`)),
  },
  {
    name: "create_task",
    description: "Create a task. `due` is YYYY-MM-DD (Google Tasks keeps dates only, no time).",
    inputSchema: {
      type: "object",
      properties: {
        tasklist: { type: "string" },
        title: { type: "string" },
        notes: { type: "string" },
        due: { type: "string", description: "YYYY-MM-DD" },
        parent: { type: "string", description: "Parent task id to create a subtask" },
      },
      required: ["tasklist", "title"],
      additionalProperties: false,
    },
    handler: async (env, { tasklist, title, notes, due, parent }) => {
      const body = { title };
      if (notes !== undefined) body.notes = notes;
      const d = normaliseDue(due);
      if (d) body.due = d;
      const t = await gapi(env, "POST", `/lists/${encodeURIComponent(tasklist)}/tasks`, { query: { parent }, body });
      return slimTask(t);
    },
  },
  {
    name: "update_task",
    description:
      "Partially update a task (PATCH): only the fields you pass change — omitted fields are kept, unlike Zapier's update. Pass due: null to clear the date. status is \"needsAction\" or \"completed\".",
    inputSchema: {
      type: "object",
      properties: {
        tasklist: { type: "string" },
        task: { type: "string" },
        title: { type: "string" },
        notes: { type: "string" },
        due: { type: ["string", "null"], description: "YYYY-MM-DD or null to clear" },
        status: { type: "string", enum: ["needsAction", "completed"] },
      },
      required: ["tasklist", "task"],
      additionalProperties: false,
    },
    handler: async (env, { tasklist, task, title, notes, due, status }) => {
      const body = {};
      if (title !== undefined) body.title = title;
      if (notes !== undefined) body.notes = notes;
      if (due !== undefined) body.due = normaliseDue(due);
      if (status !== undefined) {
        body.status = status;
        if (status === "needsAction") body.completed = null; // required by the API to reopen
      }
      const t = await gapi(env, "PATCH", `/lists/${encodeURIComponent(tasklist)}/tasks/${encodeURIComponent(task)}`, { body });
      return slimTask(t);
    },
  },
  {
    name: "move_task",
    description:
      "Move a task to another list (e.g. from \"Triage · Do\" to \"Triage · Delegate\") and/or under a new parent or after a sibling. Subtasks move with their parent.",
    inputSchema: {
      type: "object",
      properties: {
        tasklist: { type: "string", description: "Current list id" },
        task: { type: "string" },
        destinationTasklist: { type: "string", description: "Target list id; omit to stay in the same list" },
        parent: { type: "string", description: "New parent task id (makes it a subtask)" },
        previous: { type: "string", description: "Sibling task id to place it after" },
      },
      required: ["tasklist", "task"],
      additionalProperties: false,
    },
    handler: async (env, { tasklist, task, destinationTasklist, parent, previous }) =>
      slimTask(
        await gapi(env, "POST", `/lists/${encodeURIComponent(tasklist)}/tasks/${encodeURIComponent(task)}/move`, {
          query: { destinationTasklist, parent, previous },
        })
      ),
  },
  {
    name: "complete_task",
    description: "Mark a task completed.",
    inputSchema: { type: "object", properties: { tasklist: { type: "string" }, task: { type: "string" } }, required: ["tasklist", "task"], additionalProperties: false },
    handler: async (env, { tasklist, task }) =>
      slimTask(await gapi(env, "PATCH", `/lists/${encodeURIComponent(tasklist)}/tasks/${encodeURIComponent(task)}`, { body: { status: "completed" } })),
  },
  {
    name: "reopen_task",
    description: "Reopen a completed task (status needsAction, un-hides it).",
    inputSchema: { type: "object", properties: { tasklist: { type: "string" }, task: { type: "string" } }, required: ["tasklist", "task"], additionalProperties: false },
    handler: async (env, { tasklist, task }) =>
      slimTask(await gapi(env, "PATCH", `/lists/${encodeURIComponent(tasklist)}/tasks/${encodeURIComponent(task)}`, { body: { status: "needsAction", completed: null, hidden: false } })),
  },
  {
    name: "delete_task",
    description: "Permanently delete a task.",
    inputSchema: { type: "object", properties: { tasklist: { type: "string" }, task: { type: "string" } }, required: ["tasklist", "task"], additionalProperties: false },
    handler: async (env, { tasklist, task }) => {
      await gapi(env, "DELETE", `/lists/${encodeURIComponent(tasklist)}/tasks/${encodeURIComponent(task)}`);
      return { deleted: task };
    },
  },
  {
    name: "clear_completed",
    description: "Clear (hide) all completed tasks in a list — same as the 'Clear completed' button in Google Tasks.",
    inputSchema: { type: "object", properties: { tasklist: { type: "string" } }, required: ["tasklist"], additionalProperties: false },
    handler: async (env, { tasklist }) => {
      await gapi(env, "POST", `/lists/${encodeURIComponent(tasklist)}/clear`);
      return { cleared: true };
    },
  },
];

const toolByName = Object.fromEntries(TOOLS.map((t) => [t.name, t]));

// ---------------------------------------------------------------------------
// JSON-RPC / MCP
// ---------------------------------------------------------------------------
const rpcResult = (id, result) => ({ jsonrpc: "2.0", id, result });
const rpcError = (id, code, message, data) => ({ jsonrpc: "2.0", id, error: { code, message, ...(data ? { data } : {}) } });

export async function handleRpc(msg, env) {
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") return rpcError(msg?.id ?? null, -32600, "Invalid Request");
  const { id, method, params = {} } = msg;
  const isNotification = id === undefined;

  switch (method) {
    case "initialize":
      return rpcResult(id, {
        protocolVersion: params.protocolVersion && ["2024-11-05", "2025-03-26", "2025-06-18"].includes(params.protocolVersion) ? params.protocolVersion : PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          "Google Tasks is the single source of truth for the Inbox Triage tracker. Lists: \"Triage · Do\" and \"Triage · Delegate\". Tasks are titled \"[tNN] <title>\"; steps are subtasks; notes end with a \"--- triage ---\" block of key: value lines (doc, threads, contacts, delegate). list_tasks returns completed and hidden tasks too, so a task missing from it really was deleted. update_task is a partial update — pass only what changes; never rewrite the user's text above the triage block.",
      });
    case "notifications/initialized":
    case "notifications/cancelled":
      return null; // notifications get no response
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, { tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) });
    case "tools/call": {
      const tool = toolByName[params.name];
      if (!tool) return rpcError(id, -32602, `Unknown tool: ${params.name}`);
      try {
        const result = await tool.handler(env, params.arguments || {});
        return rpcResult(id, { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], structuredContent: result, isError: false });
      } catch (e) {
        return rpcResult(id, { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true });
      }
    }
    default:
      if (isNotification) return null;
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

async function handleMcpPost(request, env) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(rpcError(null, -32700, "Parse error"), 400);
  }
  const batch = Array.isArray(payload);
  const responses = [];
  for (const m of batch ? payload : [payload]) {
    const r = await handleRpc(m, env);
    if (r) responses.push(r);
  }
  if (responses.length === 0) return new Response(null, { status: 202 });
  return json(batch ? responses : responses[0]);
}

// ---------------------------------------------------------------------------
// One-time OAuth helper
// ---------------------------------------------------------------------------
function oauthStart(url, env, base) {
  const redirect = `${url.origin}${base}/oauth/callback`;
  const consent = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  consent.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  consent.searchParams.set("redirect_uri", redirect);
  consent.searchParams.set("response_type", "code");
  consent.searchParams.set("scope", SCOPE);
  consent.searchParams.set("access_type", "offline");
  consent.searchParams.set("prompt", "consent");
  consent.searchParams.set("include_granted_scopes", "true");
  return Response.redirect(consent.toString(), 302);
}

async function oauthCallback(url, env, base) {
  const code = url.searchParams.get("code");
  const err = url.searchParams.get("error");
  if (err) return html(`<h1>Google returned an error</h1><pre>${escapeHtml(err)}</pre>`, 400);
  if (!code) return html("<h1>Missing ?code</h1>", 400);
  const redirect = `${url.origin}${base}/oauth/callback`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: redirect, grant_type: "authorization_code" }),
  });
  const j = await res.json();
  if (!j.refresh_token) return html(`<h1>No refresh token returned</h1><p>Remove the app at <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a> and try /oauth/start again.</p><pre>${escapeHtml(JSON.stringify(j, null, 2))}</pre>`, 400);
  return html(
    `<h1>Refresh token obtained</h1>
     <p>Store it as the Vercel environment variable <code>GOOGLE_REFRESH_TOKEN</code> (Production), redeploy, then reload <code>${base}/health</code>:</p>
     <pre>vercel env add GOOGLE_REFRESH_TOKEN production &amp;&amp; vercel --prod</pre>
     <p>Token (copy it now — this page is not stored anywhere):</p>
     <textarea rows="4" cols="90" onclick="this.select()">${escapeHtml(j.refresh_token)}</textarea>`
  );
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const secret = env.MCP_PATH_SECRET;
    if (!secret) return text("MCP_PATH_SECRET is not configured", 500);
    const base = `/${secret}`;
    const pathname = requestPath(url);
    if (!pathname.startsWith(base + "/") && pathname !== base) return text("Not found", 404);
    const route = pathname.slice(base.length) || "/";

    if (route === "/mcp") {
      if (request.method === "POST") return handleMcpPost(request, env);
      if (request.method === "GET") return text("Method Not Allowed — this server has no server-push stream", 405, { allow: "POST" });
      if (request.method === "DELETE") return new Response(null, { status: 204 });
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors() });
      return text("Method Not Allowed", 405);
    }
    if (route === "/oauth/start") return oauthStart(url, env, base);
    if (route === "/oauth/callback") return oauthCallback(url, env, base);
    if (route === "/health") {
      try {
        const lists = await toolByName.list_task_lists.handler(env);
        return json({ ok: true, account: "connected", lists: lists.lists });
      } catch (e) {
        return json({ ok: false, error: e.message }, 500);
      }
    }
    if (route === "/") return text(`gtasks-mcp ${SERVER_INFO.version}. MCP endpoint: POST ${base}/mcp`);
    return text("Not found", 404);
  },
};

/** The vercel.json rewrite sends every path to /api/index?path=<original>; direct calls keep their own path. */
function requestPath(url) {
  if (url.pathname === "/api/index" || url.pathname === "/api") return "/" + (url.searchParams.get("path") || "").replace(/^\/+/, "");
  return url.pathname;
}

function cors() {
  return { "access-control-allow-origin": "*", "access-control-allow-methods": "POST, GET, OPTIONS, DELETE", "access-control-allow-headers": "content-type, accept, mcp-session-id, mcp-protocol-version" };
}
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", ...cors() } });
}
function text(s, status = 200, extra = {}) {
  return new Response(s, { status, headers: { "content-type": "text/plain; charset=utf-8", ...extra } });
}
function html(s, status = 200) {
  return new Response(`<!doctype html><meta charset="utf-8"><body style="font-family:system-ui;max-width:800px;margin:40px auto">${s}</body>`, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
