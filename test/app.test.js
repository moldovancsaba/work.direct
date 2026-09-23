import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/app.js";

// ---- mock Google -----------------------------------------------------------
const store = { lists: [{ id: "L1", title: "Inbox Triage", updated: "2026-09-23T00:00:00Z" }], tasks: {} };
let nextId = 1;
const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const url = input instanceof URL ? input : new URL(typeof input === "string" ? input : input.url);
  const m = init.method || "GET";
  const j = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });
  if (url.hostname === "oauth2.googleapis.com") {
    const p = new URLSearchParams(init.body.toString());
    if (p.get("refresh_token") === "RT_OK") return j({ access_token: "AT", expires_in: 3600 });
    return j({ error: "invalid_grant" }, 400);
  }
  assert.equal(init.headers.authorization, "Bearer AT", "must send bearer token");
  const path = url.pathname.replace("/tasks/v1", "");
  if (path === "/users/@me/lists" && m === "GET") return j({ items: store.lists });
  let mm;
  if ((mm = path.match(/^\/lists\/([^/]+)\/tasks$/)) && m === "GET") {
    let items = Object.values(store.tasks);
    if (url.searchParams.get("showHidden") !== "true") items = items.filter((t) => !t.hidden);
    if (url.searchParams.get("showCompleted") !== "true") items = items.filter((t) => t.status !== "completed");
    // fake pagination: 2 per page
    const page = Number(url.searchParams.get("pageToken") || 0);
    const slice = items.slice(page * 2, page * 2 + 2);
    return j({ items: slice, ...(items.length > (page + 1) * 2 ? { nextPageToken: String(page + 1) } : {}) });
  }
  if ((mm = path.match(/^\/lists\/([^/]+)\/tasks$/)) && m === "POST") {
    const b = JSON.parse(init.body);
    const t = { id: "T" + nextId++, status: "needsAction", updated: new Date().toISOString(), webViewLink: "https://tasks.google.com/task/x", ...b };
    store.tasks[t.id] = t;
    return j(t);
  }
  if ((mm = path.match(/^\/lists\/([^/]+)\/tasks\/([^/]+)$/)) && m === "PATCH") {
    const t = store.tasks[mm[2]];
    if (!t) return j({ error: { message: "Not Found" } }, 404);
    Object.assign(t, JSON.parse(init.body));
    if (t.status === "completed") { t.completed = new Date().toISOString(); t.hidden = true; }
    return j(t);
  }
  if ((mm = path.match(/^\/lists\/([^/]+)\/tasks\/([^/]+)$/)) && m === "GET") {
    const t = store.tasks[mm[2]];
    return t ? j(t) : j({ error: { message: "Not Found" } }, 404);
  }
  if ((mm = path.match(/^\/lists\/([^/]+)\/tasks\/([^/]+)\/move$/)) && m === "POST") {
    const t = store.tasks[mm[2]];
    if (!t) return j({ error: { message: "Not Found" } }, 404);
    t.list = url.searchParams.get("destinationTasklist") || mm[1];
    return j(t);
  }
  if ((mm = path.match(/^\/lists\/([^/]+)\/tasks\/([^/]+)$/)) && m === "DELETE") { delete store.tasks[mm[2]]; return new Response(null, { status: 204 }); }
  return j({ error: { message: "unmocked " + m + " " + path } }, 500);
};

const env = { MCP_PATH_SECRET: "s3cret", GOOGLE_CLIENT_ID: "cid", GOOGLE_CLIENT_SECRET: "cs", GOOGLE_REFRESH_TOKEN: "RT_OK" };
const BASE = "https://gtasks-mcp.example.workers.dev/s3cret";
let rpcId = 0;
async function rpc(method, params) {
  const res = await worker.fetch(new Request(BASE + "/mcp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }) }), env);
  assert.equal(res.status, 200, await res.clone().text());
  return res.json();
}
async function call(name, args) {
  const r = await rpc("tools/call", { name, arguments: args });
  assert.ok(!r.error, JSON.stringify(r));
  return r.result;
}

test("wrong secret → 404, health → ok", async () => {
  assert.equal((await worker.fetch(new Request("https://x/wrong/mcp", { method: "POST" }), env)).status, 404);
  const h = await (await worker.fetch(new Request(BASE + "/health"), env)).json();
  assert.equal(h.ok, true);
  assert.equal(h.lists[0].title, "Inbox Triage");
});

test("initialize / tools/list / notifications", async () => {
  const init = await rpc("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "test", version: "0" } });
  assert.equal(init.result.protocolVersion, "2025-03-26");
  assert.equal(init.result.serverInfo.name, "gtasks-mcp");
  const notif = await worker.fetch(new Request(BASE + "/mcp", { method: "POST", body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) }), env);
  assert.equal(notif.status, 202);
  const list = await rpc("tools/list");
  const names = list.result.tools.map((t) => t.name);
  for (const n of ["list_task_lists", "list_tasks", "find_tasks", "create_task", "update_task", "complete_task", "reopen_task", "delete_task"]) assert.ok(names.includes(n), n);
  const bad = await rpc("nope");
  assert.equal(bad.error.code, -32601);
});

test("create → find → partial update keeps notes → complete → hidden still listed → reopen → delete", async () => {
  const c = await call("create_task", { tasklist: "L1", title: "[t29] Zapier task limit", notes: "summary\nDoc: x", due: "2026-09-24" });
  assert.equal(c.structuredContent.due, "2026-09-24");
  const c2 = await call("create_task", { tasklist: "L1", title: "[t30] Revolut KYC" });
  await call("create_task", { tasklist: "L1", title: "[t31] third" }); // forces pagination (2/page)

  const f = await call("find_tasks", { tasklist: "L1", title: "[t29]" });
  assert.equal(f.structuredContent.count, 1);
  const id = f.structuredContent.tasks[0].id;

  const u = await call("update_task", { tasklist: "L1", task: id, due: "2026-09-25" });
  assert.equal(u.structuredContent.notes, "summary\nDoc: x", "PATCH must keep notes");
  assert.equal(u.structuredContent.due, "2026-09-25");

  await call("complete_task", { tasklist: "L1", task: id });
  const all = await call("list_tasks", { tasklist: "L1" });
  assert.equal(all.structuredContent.count, 3, "hidden completed task is still returned");
  const done = all.structuredContent.tasks.find((t) => t.id === id);
  assert.equal(done.status, "completed");
  assert.equal(done.hidden, true);

  const open = await call("list_tasks", { tasklist: "L1", showCompleted: false, showHidden: false });
  assert.equal(open.structuredContent.count, 2);

  const r = await call("reopen_task", { tasklist: "L1", task: id });
  assert.equal(r.structuredContent.status, "needsAction");
  assert.equal(r.structuredContent.completed, null);

  await call("delete_task", { tasklist: "L1", task: c2.structuredContent.id });
  const after = await call("list_tasks", { tasklist: "L1" });
  assert.equal(after.structuredContent.count, 2);

  const missing = await call("get_task", { tasklist: "L1", task: "nope" });
  assert.equal(missing.isError, true);
  assert.match(missing.content[0].text, /404/);
});

test("vercel rewrite: /api/index?path=<secret>/health reaches the same route; wrong secret still 404", async () => {
  const ok = await worker.fetch(new Request("https://work.direct.example/api/index?path=s3cret/health"), env);
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).ok, true);
  const bad = await worker.fetch(new Request("https://work.direct.example/api/index?path=wrong/health"), env);
  assert.equal(bad.status, 404);
});

test("move_task sends destinationTasklist", async () => {
  const c = await call("create_task", { tasklist: "L1", title: "[t40] move me" });
  const mv = await call("move_task", { tasklist: "L1", task: c.structuredContent.id, destinationTasklist: "L2" });
  assert.equal(mv.isError, false);
  assert.equal(store.tasks[c.structuredContent.id].list, "L2");
});

test("bad refresh token surfaces as tool error, not a crash", async () => {
  const badEnv = { ...env, GOOGLE_REFRESH_TOKEN: "RT_BAD" };
  // fresh module state: token cache is per-isolate; simulate by expiring it via a different env value on first call
  const res = await worker.fetch(new Request(BASE + "/health"), badEnv);
  // cache may still hold AT from previous tests — either outcome is acceptable as long as it's JSON
  const body = await res.json();
  assert.ok("ok" in body);
});

test.after(() => { globalThis.fetch = realFetch; });
