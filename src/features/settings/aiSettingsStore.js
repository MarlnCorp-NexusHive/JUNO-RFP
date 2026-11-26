/** AI usage / budgets store — Demo keeps seeded mock data; Trial & Walkthrough sync cleanly with backend per tenant. */
import API from "../../services/api.js";

export const PLAN_AI = {
  team: { n: "Team", tokens: 20e6 },
  pro: { n: "Professional", tokens: 40e6 },
  ent: { n: "Enterprise Pro", tokens: 60e6 },
};

export const TOPUP = { tokens: 10e6, price: 99 };

export const AI_ADMINS = ["ana", "rosa"];

export const PEOPLE = {
  ana: { n: "Ana López", i: "AL", c: "#4F6BFF", r: "Grants manager" },
  maya: { n: "Maya Reed", i: "MR", c: "#0EA5E9", r: "Program lead" },
  dev: { n: "Dev Patel", i: "DP", c: "#8B5CF6", r: "Compliance" },
  priya: { n: "Priya Shah", i: "PS", c: "#F59E0B", r: "Finance" },
  rosa: { n: "Rosa Martín", i: "RM", c: "#EC4899", r: "Executive director" },
  sam: { n: "Sam Kim", i: "SK", c: "#14B8A6", r: "Data & evaluation" },
};

export const ME = "ana";

export const WORKSPACES = [
  {
    id: "w1",
    n: "Bright Futures · Grants",
    sub: "Grants & projects workspace",
    ab: "BF",
    c: "#4F85B5",
    host: "AWS United States",
    users: ["ana", "maya", "dev", "priya", "rosa", "sam"],
  },
  {
    id: "w2",
    n: "North America BU",
    sub: "Commercial RFPs & RFIs",
    ab: "NA",
    c: "#8B5CF6",
    host: "AWS United States",
    users: ["ana", "dev", "priya", "rosa"],
  },
  {
    id: "w3",
    n: "State & local government",
    sub: "Public-sector bids",
    ab: "SL",
    c: "#F59E0B",
    host: "AWS United States",
    users: ["maya", "dev", "sam", "rosa"],
  },
  {
    id: "w4",
    n: "Client: Acme Health",
    sub: "Client workspace",
    ab: "AH",
    c: "#14B8A6",
    host: "AWS Canada",
    users: ["ana", "sam", "dev"],
  },
];

export const WSM = Object.fromEntries(WORKSPACES.map((w) => [w.id, w]));

const STORAGE_KEY = "juno-app-settings-ai-v1";
const AVATAR_PALETTE = ["#4F46E5", "#0EA5E9", "#8B5CF6", "#F59E0B", "#EC4899", "#14B8A6", "#10B981"];

export function initialsOf(name = "") {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "TM";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function colorForKey(key = "") {
  let h = 0;
  const s = String(key || "user");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

export function aiDefaults() {
  return {
    provider: "openai",
    model: "gpt-6.1-sol",
    fast: "gpt-6-luna",
    prices: {
      "gpt-6.1-sol": { in: 2, cin: 0.1, out: 10 },
      "gpt-6-luna": { in: 0.1, cin: 0.01, out: 0.5 },
      "gpt-6.1-terra": { in: 1, cin: 0.05, out: 5 },
    },
    alerts: { a80: true, a100: true },
    overage: "block",
    globalCap: 2500,
    ws: {
      w1: { plan: "ent", topup: 0, cap: 400 },
      w2: { plan: "pro", topup: 0, cap: 250 },
      w3: { plan: "team", topup: 0, cap: 120 },
      w4: { plan: "pro", topup: 0, cap: 250 },
    },
    alerted: {},
    activeWs: "w1",
  };
}

export function emptyTenantSettings(tenantId) {
  const tid = String(tenantId || "tenant");
  return {
    cfg: {
      provider: "openai",
      model: "gpt-6.1-sol",
      fast: "gpt-6-luna",
      prices: {
        "gpt-6.1-sol": { in: 2, cin: 0.1, out: 10 },
        "gpt-6-luna": { in: 0.1, cin: 0.01, out: 0.5 },
        "gpt-6.1-terra": { in: 1, cin: 0.05, out: 5 },
      },
      alerts: { a80: true, a100: true },
      overage: "block",
      globalCap: 2500,
      ws: {
        [tid]: { plan: "pro", topup: 0, cap: 250 },
      },
      alerted: {},
      activeWs: tid,
    },
    log: [],
  };
}

export function buildTenantWorkspace(tenant, members = []) {
  const id = tenant?.id || "tenant";
  const name = tenant?.name || "Workspace";
  return {
    id,
    n: name,
    sub: "Tenant workspace",
    ab: initialsOf(name),
    c: "#4F46E5",
    host: "AWS United States",
    slug: id,
    users: members.map((m) => m.id || m.email),
  };
}

export async function fetchTrialSettings() {
  const res = await API.get("/trial/settings", { timeout: 20_000 });
  return res.data;
}

export async function saveTrialSettings(cfg) {
  const res = await API.put("/trial/settings", { cfg }, { timeout: 20_000 });
  return res.data;
}

export async function resetTrialSettings() {
  const res = await API.delete("/trial/settings", { timeout: 20_000 });
  return res.data;
}

export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const monthKey = (d) => String(d || todayISO()).slice(0, 7);

export const fmtTok = (n) => {
  if (!n || n <= 0) return "0";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 1 : 2)}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}K`;
  return String(Math.round(n));
};

export const usd = (n) => `$${n < 10 ? n.toFixed(2) : Math.round(n).toLocaleString("en-US")}`;

export function priceOf(aiCfg, model) {
  return aiCfg.prices[model] || aiCfg.prices[aiCfg.model] || { in: 2, cin: 0.1, out: 10 };
}

export function costOf(aiCfg, model, tin, tout, tc = 0) {
  const p = priceOf(aiCfg, model);
  return ((tin - (tc || 0)) * p.in + (tc || 0) * p.cin + tout * p.out) / 1e6;
}

export function seedAiLog(aiCfg, TODAY = todayISO()) {
  const out = [];
  const m = TODAY.slice(0, 8);
  const today = +TODAY.slice(8, 10);
  const F = [
    ["Copilot", 0.38],
    ["Drafting", 0.3],
    ["Solicitation reader", 0.12],
    ["Award reader", 0.06],
    ["Funder reports", 0.08],
    ["Status updates", 0.06],
  ];
  const target = { w1: 0.31, w2: 0.27, w3: 0.86, w4: 0.14 };
  let seed = 7;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  WORKSPACES.forEach((w) => {
    const cfg = aiCfg.ws[w.id];
    const allow = PLAN_AI[cfg.plan].tokens;
    const total = allow * target[w.id];
    const days = [];
    for (let d = 1; d <= today; d++) {
      const dd = new Date(+m.slice(0, 4), +m.slice(5, 7) - 1, d).getDay();
      days.push(dd % 6 ? 1 + rnd() : 0.2);
    }
    const sum = days.reduce((a, b) => a + b, 0) || 1;
    days.forEach((wt, i) => {
      const dayTok = (total * wt) / sum;
      const n = Math.max(1, Math.round(dayTok / 350000));
      for (let k = 0; k < n; k++) {
        let f = F[0];
        for (let j = 0; j < F.length; j++) {
          const acc = F.slice(0, j + 1).reduce((s, y) => s + y[1], 0);
          if (rnd() <= acc) {
            f = F[j];
            break;
          }
        }
        const tok = dayTok / n;
        const tout = Math.round(tok * 0.09);
        const tin = Math.round(tok - tout);
        const tc = Math.round(tin * 0.35);
        const model =
          f[0] === "Solicitation reader" || f[0] === "Award reader" ? aiCfg.fast : aiCfg.model;
        out.push({
          ws: w.id,
          day: m + String(i + 1).padStart(2, "0"),
          at: m + String(i + 1).padStart(2, "0"),
          feature: f[0],
          user: w.users[Math.floor(rnd() * w.users.length)],
          tin,
          tout,
          tc,
          model,
          cost: costOf(aiCfg, model, tin, tout, tc),
          src: "sample",
        });
      }
    });
  });
  return out;
}

export function loadAiSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const cfg = aiDefaults();
      const log = seedAiLog(cfg);
      const payload = { cfg, log };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return payload;
    }
    const parsed = JSON.parse(raw);
    const cfg = { ...aiDefaults(), ...(parsed.cfg || {}) };
    cfg.ws = { ...aiDefaults().ws, ...(parsed.cfg?.ws || {}) };
    cfg.prices = { ...aiDefaults().prices, ...(parsed.cfg?.prices || {}) };
    cfg.alerts = { ...aiDefaults().alerts, ...(parsed.cfg?.alerts || {}) };
    let log = Array.isArray(parsed.log) ? parsed.log : [];
    if (!log.length) log = seedAiLog(cfg);
    return { cfg, log };
  } catch {
    const cfg = aiDefaults();
    return { cfg, log: seedAiLog(cfg) };
  }
}

export function saveAiSettings(cfg, log) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ cfg, log }));
}

export function monthUse(log, ws, mk = monthKey()) {
  const L = (Array.isArray(log) ? log : []).filter(
    (x) => x.ws === ws && String(x.day).slice(0, 7) === mk,
  );
  const tok = L.reduce((s, x) => s + (x.tin || 0) + (x.tout || 0), 0);
  const cost = L.reduce((s, x) => s + (x.cost || 0), 0);
  return { L, tok, cost, calls: L.length };
}

export function allowanceOf(cfg, ws) {
  const c = cfg?.ws?.[ws] || { plan: "pro", topup: 0, cap: 250 };
  const plan = PLAN_AI[c.plan] || PLAN_AI.pro;
  return plan.tokens + (c.topup || 0);
}

export function aiState(cfg, log, ws) {
  const u = monthUse(log, ws);
  const allow = allowanceOf(cfg, ws);
  const cap = cfg?.ws?.[ws]?.cap ?? 250;
  return {
    ...u,
    allow,
    pct: allow ? (u.tok / allow) * 100 : 0,
    cap,
    capPct: cap ? (u.cost / cap) * 100 : 0,
  };
}

export function globalCost(log) {
  const mk = monthKey();
  return (Array.isArray(log) ? log : [])
    .filter((x) => String(x.day).slice(0, 7) === mk)
    .reduce((s, x) => s + (x.cost || 0), 0);
}

export function aiBlocked(cfg, log, ws) {
  const st = aiState(cfg, log, ws);
  if (st.cap > 0 && st.cost >= st.cap) return "cap";
  if (cfg.globalCap > 0 && globalCost(log) >= cfg.globalCap) return "global";
  if (st.tok >= st.allow && cfg.overage === "block") return "allowance";
  return "";
}

export function fmtDay(iso) {
  try {
    const d = new Date(`${iso}T12:00:00`);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
