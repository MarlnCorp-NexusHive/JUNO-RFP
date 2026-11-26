import { AsyncLocalStorage } from "node:async_hooks";
import { Router } from "express";
import { requireTrialAuth } from "./authMiddleware.js";
import {
  deleteTenantFeature,
  getTenantFeature,
  putTenantFeature,
} from "./featureStore.js";
import { listUsersForTenant } from "./tenantStore.js";

const aiRequestContext = new AsyncLocalStorage();

const DEFAULT_PRICES = {
  "gpt-6.1-sol": { in: 2, cin: 0.1, out: 10 },
  "gpt-6-luna": { in: 0.1, cin: 0.01, out: 0.5 },
  "gpt-6.1-terra": { in: 1, cin: 0.05, out: 5 },
};

export function defaultTenantSettingsCfg(tenantId) {
  return {
    provider: "openai",
    model: "gpt-6.1-sol",
    fast: "gpt-6-luna",
    prices: structuredClone(DEFAULT_PRICES),
    alerts: { a80: true, a100: true },
    overage: "block",
    globalCap: 2500,
    ws: {
      [tenantId]: { plan: "pro", topup: 0, cap: 250 },
    },
    alerted: {},
    activeWs: tenantId,
  };
}

export function normalizeTenantSettings(raw, tenantId) {
  const def = defaultTenantSettingsCfg(tenantId);
  const inCfg = raw?.cfg && typeof raw.cfg === "object" ? raw.cfg : {};
  const wsIn = inCfg.ws && typeof inCfg.ws === "object" ? inCfg.ws : {};
  const wsEntry =
    wsIn[tenantId] && typeof wsIn[tenantId] === "object"
      ? {
          plan: ["team", "pro", "ent"].includes(wsIn[tenantId].plan)
            ? wsIn[tenantId].plan
            : "pro",
          topup: Number.isFinite(Number(wsIn[tenantId].topup))
            ? Math.max(0, Number(wsIn[tenantId].topup))
            : 0,
          cap: Number.isFinite(Number(wsIn[tenantId].cap))
            ? Math.max(0, Number(wsIn[tenantId].cap))
            : 250,
        }
      : def.ws[tenantId];

  const prices = { ...structuredClone(DEFAULT_PRICES) };
  if (inCfg.prices && typeof inCfg.prices === "object") {
    for (const [m, p] of Object.entries(inCfg.prices)) {
      if (p && typeof p === "object") {
        prices[m] = {
          in: Number.isFinite(Number(p.in)) ? Math.max(0, Number(p.in)) : 0,
          cin: Number.isFinite(Number(p.cin)) ? Math.max(0, Number(p.cin)) : 0,
          out: Number.isFinite(Number(p.out)) ? Math.max(0, Number(p.out)) : 0,
        };
      }
    }
  }

  const cfg = {
    provider: "openai",
    model: typeof inCfg.model === "string" && inCfg.model.trim() ? inCfg.model.trim() : def.model,
    fast: typeof inCfg.fast === "string" && inCfg.fast.trim() ? inCfg.fast.trim() : def.fast,
    prices,
    alerts: {
      a80: inCfg.alerts?.a80 !== undefined ? Boolean(inCfg.alerts.a80) : true,
      a100: inCfg.alerts?.a100 !== undefined ? Boolean(inCfg.alerts.a100) : true,
    },
    overage: inCfg.overage === "allow" ? "allow" : "block",
    globalCap: Number.isFinite(Number(inCfg.globalCap))
      ? Math.max(0, Number(inCfg.globalCap))
      : def.globalCap,
    ws: { [tenantId]: wsEntry },
    alerted: inCfg.alerted && typeof inCfg.alerted === "object" ? inCfg.alerted : {},
    activeWs: tenantId,
  };

  const log = Array.isArray(raw?.log) ? raw.log : [];
  return { cfg, log };
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function priceOf(cfg, model) {
  return (
    cfg?.prices?.[model] ||
    cfg?.prices?.[cfg?.model] || { in: 2, cin: 0.1, out: 10 }
  );
}

function costOf(cfg, model, tin, tout, tc = 0) {
  const p = priceOf(cfg, model);
  return ((tin - (tc || 0)) * p.in + (tc || 0) * p.cin + tout * p.out) / 1e6;
}

function estimateTokens(value) {
  if (!value) return 0;
  const str = typeof value === "string" ? value : JSON.stringify(value);
  return Math.max(1, Math.ceil(str.length / 4));
}

function featureLabelForPath(urlPath = "") {
  const p = String(urlPath || "").split("?")[0].toLowerCase();
  if (p.startsWith("/generate-rfp-document") || p.startsWith("/structure-rfp-requirements") || p.startsWith("/rfp-collab")) {
    return "Drafting";
  }
  if (p.startsWith("/extract-dates") || p.startsWith("/extract-qas") || p.startsWith("/extract-structured-data")) {
    return "Solicitation reader";
  }
  if (p.startsWith("/technical-solution")) {
    return "Technical solutioning";
  }
  if (p.startsWith("/communication/ai")) {
    return "Communication AI";
  }
  if (p.startsWith("/pricing/ai")) {
    return "Pricing AI";
  }
  if (p.startsWith("/pursuit-lifecycle")) {
    return "Pursuit intelligence";
  }
  if (p.startsWith("/grants/")) {
    return "Grant intelligence";
  }
  if (p.startsWith("/company-intelligence") || p.startsWith("/competitive-intelligence") || p.startsWith("/generate-company-profile")) {
    return "Market intelligence";
  }
  if (p.startsWith("/generate-work-document") || p.startsWith("/generate-slide-deck") || p.startsWith("/export-document")) {
    return "Documents & decks";
  }
  return "Sage AI";
}

/** Express middleware: binds active tenant & user into AsyncLocalStorage for OpenAI telemetry. */
export function attachAiRequestContext(req, _res, next) {
  if (!req.tenantId) return next();
  const store = {
    tenantId: req.tenantId,
    tenantName: req.trialTenant?.name || "",
    user: req.trialUser || null,
    path: req.path || req.url || "",
  };
  return aiRequestContext.run(store, () => next());
}

/** Append a single real AI usage entry into the tenant's persisted settings store. */
export function recordTenantAiUsage({
  tenantId,
  feature,
  user,
  tin,
  tout,
  tc = 0,
  model,
  src = "actual",
}) {
  if (!tenantId) return;
  try {
    const existing = getTenantFeature(tenantId, "settings");
    const norm = normalizeTenantSettings(existing.data, tenantId);
    const usedModel = String(model || norm.cfg.model || "gpt-4o-mini");
    const safeTin = Math.max(0, Math.round(Number(tin) || 0));
    const safeTout = Math.max(0, Math.round(Number(tout) || 0));
    const safeTc = Math.max(0, Math.min(safeTin, Math.round(Number(tc) || 0)));
    const entry = {
      ws: tenantId,
      day: todayISO(),
      at: new Date().toISOString(),
      feature: feature || "Sage AI",
      user: user?.id || user?.email || "member",
      userName: user?.name || user?.email || "Team member",
      userEmail: user?.email || "",
      tin: safeTin,
      tout: safeTout,
      tc: safeTc,
      model: usedModel,
      cost: costOf(norm.cfg, usedModel, safeTin, safeTout, safeTc),
      src,
    };
    const nextLog = [...norm.log, entry];
    const trimmed = nextLog.length > 6000 ? nextLog.slice(-6000) : nextLog;
    putTenantFeature(tenantId, "settings", { cfg: norm.cfg, log: trimmed });
  } catch (err) {
    console.warn("[trial-settings] failed to record AI usage:", err?.message || err);
  }
}

/**
 * Wrap `openai.chat.completions.create` so every AI call made during a trial or
 * walkthrough request is logged in real time to that tenant's backend settings store.
 * Demo requests (no tenantId) are untouched.
 */
export function instrumentOpenAiForTrialSettings(openai) {
  if (!openai?.chat?.completions?.create || openai.chat.completions.__junoMetered) {
    return openai;
  }
  const origCreate = openai.chat.completions.create.bind(openai.chat.completions);
  openai.chat.completions.create = async function meteredCreate(params, options) {
    const store = aiRequestContext.getStore();
    const response = await origCreate(params, options);
    if (store?.tenantId && response && typeof response === "object") {
      const usage = response.usage;
      const hasUsage =
        usage && (usage.prompt_tokens != null || usage.completion_tokens != null);
      const tin = hasUsage
        ? Number(usage.prompt_tokens || 0)
        : estimateTokens(params?.messages);
      const tout = hasUsage
        ? Number(usage.completion_tokens || 0)
        : estimateTokens(response?.choices?.[0]?.message?.content);
      const tc = Number(usage?.prompt_tokens_details?.cached_tokens || 0);
      recordTenantAiUsage({
        tenantId: store.tenantId,
        feature: featureLabelForPath(store.path),
        user: store.user,
        tin,
        tout,
        tc,
        model: response.model || params?.model || "",
        src: hasUsage ? "actual" : "est",
      });
    }
    return response;
  };
  openai.chat.completions.__junoMetered = true;
  return openai;
}

/** Shared tenant settings router mounted at /trial/settings */
export const aiSettingsRouter = Router();

aiSettingsRouter.get("/", requireTrialAuth, (req, res) => {
  try {
    const existing = getTenantFeature(req.tenantId, "settings");
    const data = normalizeTenantSettings(existing.data, req.tenantId);
    const members = listUsersForTenant(req.tenantId);
    return res.json({
      ok: true,
      tenant: req.trialTenant,
      members,
      data,
      updatedAt: existing.updatedAt,
    });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Failed to load settings" });
  }
});

aiSettingsRouter.put("/", requireTrialAuth, (req, res) => {
  try {
    const existing = getTenantFeature(req.tenantId, "settings");
    const current = normalizeTenantSettings(existing.data, req.tenantId);
    const incomingCfg = req.body?.cfg && typeof req.body.cfg === "object" ? req.body.cfg : req.body;
    // Always preserve server-side usage log so concurrent AI calls are never lost.
    const next = normalizeTenantSettings(
      { cfg: incomingCfg, log: current.log },
      req.tenantId,
    );
    const saved = putTenantFeature(req.tenantId, "settings", next);
    const members = listUsersForTenant(req.tenantId);
    return res.json({
      ok: true,
      tenant: req.trialTenant,
      members,
      data: saved.data,
      updatedAt: saved.updatedAt,
    });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Failed to save settings" });
  }
});

aiSettingsRouter.delete("/", requireTrialAuth, (req, res) => {
  try {
    deleteTenantFeature(req.tenantId, "settings");
    const fresh = normalizeTenantSettings(null, req.tenantId);
    const members = listUsersForTenant(req.tenantId);
    return res.json({
      ok: true,
      tenant: req.trialTenant,
      members,
      data: fresh,
      updatedAt: null,
    });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Failed to reset settings" });
  }
});
