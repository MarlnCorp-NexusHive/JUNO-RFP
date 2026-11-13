// Juno AI proxy: OpenAI GPT (default) or Anthropic, with per-workspace monthly hard budgets.
// The API key stays on the server. Usage is metered in tokens and dollars per workspace per month.
//
// Env vars (Netlify > Site configuration > Environment variables):
//   AI_PROVIDER            openai (default) | anthropic
//   OPENAI_API_KEY         required for OpenAI
//   OPENAI_MODEL           main model (default gpt-6.1-sol)
//   OPENAI_FAST_MODEL      fast model for quick tasks (default gpt-6-luna)
//   AI_PRICES_JSON         optional price overrides, e.g. {"gpt-6.1-sol":{"in":2,"cin":0.1,"out":10}} (USD per 1M tokens)
//   AI_DEFAULT_BUDGET_USD  hard monthly budget per workspace (default 250)
//   AI_BUDGETS_JSON        optional per-workspace budgets, e.g. {"w1":400,"w3":120}
//   AI_GLOBAL_BUDGET_USD   hard monthly budget across all workspaces (default 2500)
//   ALLOWED_ORIGIN, ACCESS_CODE (optional, as before)
//   ANTHROPIC_API_KEY / ANTHROPIC_MODEL if AI_PROVIDER=anthropic
import { getStore } from "@netlify/blobs";

const PRICES = { "gpt-6.1-sol": { in: 2, cin: 0.1, out: 10 }, "gpt-6-luna": { in: 0.1, cin: 0.01, out: 0.5 }, "gpt-6.1-terra": { in: 1, cin: 0.05, out: 5 }, "gpt-6-astra": { in: 10, cin: 1, out: 50 } };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const month = () => new Date().toISOString().slice(0, 7);
const wsId = (v) => (/^[a-z0-9_-]{1,40}$/i.test(v || "") ? v : "default");
function prices() { let o = {}; try { o = JSON.parse(process.env.AI_PRICES_JSON || "{}"); } catch {} return { ...PRICES, ...o }; }
export function costOf(model, u) { const p = prices()[model] || prices()[process.env.OPENAI_MODEL || "gpt-6.1-sol"] || { in: 2, cin: 0.1, out: 10 }; const c = u.cached_tokens || 0; return ((u.input_tokens - c) * p.in + c * p.cin + u.output_tokens * p.out) / 1e6; }
export function budgetFor(ws) { let o = {}; try { o = JSON.parse(process.env.AI_BUDGETS_JSON || "{}"); } catch {} return Number(o[ws] ?? process.env.AI_DEFAULT_BUDGET_USD ?? 250); }
export const store = () => getStore({ name: "ai-usage", consistency: "strong" });

// Anthropic-style messages <-> OpenAI chat completions
function toOpenAI(messages, system) {
  const out = system ? [{ role: "system", content: system }] : [];
  for (const m of messages) {
    if (typeof m.content === "string") { out.push({ role: m.role, content: m.content }); continue; }
    if (m.role === "assistant") {
      const text = m.content.filter((c) => c.type === "text").map((c) => c.text).join("");
      const calls = m.content.filter((c) => c.type === "tool_use").map((c) => ({ id: c.id, type: "function", function: { name: c.name, arguments: JSON.stringify(c.input || {}) } }));
      out.push({ role: "assistant", content: text || null, ...(calls.length ? { tool_calls: calls } : {}) });
    } else {
      for (const c of m.content) {
        if (c.type === "tool_result") out.push({ role: "tool", tool_call_id: c.tool_use_id, content: typeof c.content === "string" ? c.content : JSON.stringify(c.content) });
        else if (c.type === "text") out.push({ role: "user", content: c.text });
      }
    }
  }
  return out;
}
function fromOpenAI(j) {
  const ch = (j.choices && j.choices[0]) || {}; const msg = ch.message || {};
  const content = [];
  if (msg.content) content.push({ type: "text", text: msg.content });
  for (const tc of msg.tool_calls || []) { let input = {}; try { input = JSON.parse(tc.function.arguments || "{}"); } catch {} content.push({ type: "tool_use", id: tc.id, name: tc.function.name, input }); }
  const u = j.usage || {};
  return { content, stop_reason: ch.finish_reason === "tool_calls" ? "tool_use" : ch.finish_reason === "length" ? "max_tokens" : "end_turn", model: j.model,
    usage: { input_tokens: u.prompt_tokens || 0, output_tokens: u.completion_tokens || 0, cached_tokens: (u.prompt_tokens_details && u.prompt_tokens_details.cached_tokens) || 0 } };
}

export default async (req) => {
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();
  const key = provider === "anthropic" ? process.env.ANTHROPIC_API_KEY : process.env.OPENAI_API_KEY;
  const code = process.env.ACCESS_CODE || "";
  const allowed = process.env.ALLOWED_ORIGIN;
  const origin = req.headers.get("origin");
  if (allowed && origin && origin !== allowed) return json({ error: "origin_not_allowed" }, 403);
  if (req.method === "GET") return json({ ok: !!key, needsCode: !!code, provider });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!key) return json({ error: "not_configured" }, 503);
  if (code && req.headers.get("x-juno-code") !== code) return json({ error: "bad_code" }, 401);

  // Hard budgets, checked before any tokens are spent.
  // In production, take the workspace from the signed-in user's session, not from a request header.
  const ws = wsId(req.headers.get("x-juno-ws"));
  const st = store(); const mk = month();
  const use = (await st.get(`${mk}:${ws}`, { type: "json" })) || { tokens: 0, cost: 0, calls: 0 };
  const all = (await st.get(`${mk}:_all`, { type: "json" })) || { tokens: 0, cost: 0, calls: 0 };
  const cap = budgetFor(ws), gcap = Number(process.env.AI_GLOBAL_BUDGET_USD || 2500);
  if (use.cost >= cap) return json({ error: "budget_exceeded", scope: "workspace", cost: use.cost, cap }, 402);
  if (all.cost >= gcap) return json({ error: "budget_exceeded", scope: "global" }, 402);

  const raw = await req.text();
  if (raw.length > 400_000) return json({ error: "too_large" }, 413);
  let b; try { b = JSON.parse(raw); } catch { return json({ error: "bad_json" }, 400); }
  if (!Array.isArray(b.messages) || !b.messages.length) return json({ error: "no_messages" }, 400);
  const maxTok = Math.min(Number(b.max_tokens) || 1500, 2048);
  const quick = req.headers.get("x-juno-tier") === "quick";

  let out;
  if (provider === "anthropic") {
    const payload = { model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5", max_tokens: maxTok, messages: b.messages };
    if (typeof b.system === "string" && b.system) payload.system = b.system.slice(0, 200_000);
    if (Array.isArray(b.tools) && b.tools.length) payload.tools = b.tools.slice(0, 16);
    const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" }, body: JSON.stringify(payload) });
    const j = await r.json(); if (!r.ok) return json({ error: (j.error && j.error.type) || "upstream_error" }, r.status === 429 ? 429 : 502);
    out = { content: j.content, stop_reason: j.stop_reason, model: j.model, usage: { input_tokens: j.usage.input_tokens || 0, output_tokens: j.usage.output_tokens || 0, cached_tokens: j.usage.cache_read_input_tokens || 0 } };
  } else {
    const model = quick ? (process.env.OPENAI_FAST_MODEL || "gpt-6-luna") : (process.env.OPENAI_MODEL || "gpt-6.1-sol");
    const payload = { model, max_completion_tokens: maxTok, messages: toOpenAI(b.messages, b.system), user: `ws-${ws}` };
    if (Array.isArray(b.tools) && b.tools.length) payload.tools = b.tools.slice(0, 16).map((t) => ({ type: "function", function: { name: t.name, description: t.description || "", parameters: t.input_schema || { type: "object", properties: {} } } }));
    const r = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${key}` }, body: JSON.stringify(payload) });
    const j = await r.json(); if (!r.ok) return json({ error: (j.error && (j.error.code || j.error.type)) || "upstream_error" }, r.status === 429 ? 429 : 502);
    out = fromOpenAI(j);
  }

  const cost = costOf(out.model, out.usage); const tok = out.usage.input_tokens + out.usage.output_tokens;
  const feature = String(req.headers.get("x-juno-feature") || "").slice(0, 40);
  await st.setJSON(`${mk}:${ws}`, { tokens: use.tokens + tok, cost: use.cost + cost, calls: use.calls + 1, byFeature: { ...(use.byFeature || {}), [feature || "other"]: ((use.byFeature || {})[feature || "other"] || 0) + tok } });
  await st.setJSON(`${mk}:_all`, { tokens: all.tokens + tok, cost: all.cost + cost, calls: all.calls + 1 });
  out.usage.model = out.model; out.budget = { month: mk, workspace: ws, cost: use.cost + cost, cap };
  return json(out);
};
export const config = { path: "/api/copilot" };
