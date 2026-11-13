// GET  /api/ai-usage?ws=w1     -> this month's tokens, cost and hard budget for one workspace
// GET  /api/ai-usage?all=1     -> every workspace (admin only)
// Admin requests need:  Authorization: Bearer <ADMIN_TOKEN>
// Change budgets with the AI_BUDGETS_JSON / AI_DEFAULT_BUDGET_USD / AI_GLOBAL_BUDGET_USD env vars, then redeploy.
import { timingSafeEqual } from "node:crypto";
import { store, budgetFor } from "./copilot.mjs";
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });
function isAdmin(req) { const t = process.env.ADMIN_TOKEN || ""; const h = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, ""); if (!t || !h || h.length !== t.length) return false; return timingSafeEqual(Buffer.from(h), Buffer.from(t)); }
export default async (req) => {
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, 405);
  const u = new URL(req.url); const mk = u.searchParams.get("month") || new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(mk)) return json({ error: "bad_month" }, 400);
  const st = store();
  if (u.searchParams.get("all")) {
    if (!isAdmin(req)) return json({ error: "unauthorized" }, 401);
    const { blobs } = await st.list({ prefix: `${mk}:` }); const rows = {};
    for (const b of blobs) { const ws = b.key.split(":")[1]; const v = await st.get(b.key, { type: "json" }); rows[ws] = { ...v, cap: ws === "_all" ? Number(process.env.AI_GLOBAL_BUDGET_USD || 2500) : budgetFor(ws) }; }
    return json({ month: mk, workspaces: rows });
  }
  const ws = /^[a-z0-9_-]{1,40}$/i.test(u.searchParams.get("ws") || "") ? u.searchParams.get("ws") : "default";
  const v = (await st.get(`${mk}:${ws}`, { type: "json" })) || { tokens: 0, cost: 0, calls: 0 };
  return json({ month: mk, workspace: ws, tokens: v.tokens, calls: v.calls, cost: Math.round(v.cost * 100) / 100, cap: budgetFor(ws) });
};
export const config = { path: "/api/ai-usage" };
