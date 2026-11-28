import { Router } from "express";
import { requireTrialAuth } from "./authMiddleware.js";
import {
  deleteTenantFeature,
  getTenantFeature,
  putTenantFeature,
} from "./featureStore.js";

const MAX_ITEMS = 500;

const FEATURE_LABELS = {
  scoring: "Scoring",
  workspace: "Workspace",
  sourceDocs: "Source Docs",
  contentHub: "Content Hub",
  techSolutioning: "Technical Solutioning",
  winSlide: "Win Slide",
  userManagement: "User Management",
  communication: "Communication",
  pricing: "Pricing",
  bidVault: "Bid Vault",
  teamCollab: "RFP Collaboration",
  shortlist: "Shortlist",
  applicantFit: "Applicant Fit",
  manageTeam: "Manage Team",
  compliance: "Compliance",
  dashboard: "Dashboard",
  awardManagement: "Award Management",
  projectWorkspace: "Project Workspace",
  grantPipeline: "Grant Pipeline",
  settings: "Settings",
};

function describeRequest(method, urlPath = "") {
  const m = String(method || "").toUpperCase();
  const p = String(urlPath || "").split("?")[0];

  if (p.startsWith("/trial/auth") || p.startsWith("/trial/activity")) return null;

  const featMatch = p.match(/^\/trial\/features\/([^/]+)/);
  if (featMatch) {
    const key = featMatch[1];
    const area = FEATURE_LABELS[key] || key;
    if (m === "DELETE") return { area, action: `Reset ${area} data` };
    return { area, action: `Updated ${area}` };
  }
  if (p.startsWith("/trial/settings")) {
    if (m === "DELETE") return { area: "Settings", action: "Reset workspace settings" };
    return { area: "Settings", action: "Updated workspace settings" };
  }
  if (p.startsWith("/generate-answer") || p.startsWith("/chat")) {
    return { area: "Sage AI", action: "Asked Sage AI" };
  }
  if (p.startsWith("/generate-work-document") || p.startsWith("/export-document")) {
    return { area: "Documents", action: "Generated proposal document" };
  }
  if (p.startsWith("/generate-slide-deck") || p.startsWith("/win-slide")) {
    return { area: "Win Slide", action: "Generated slide deck" };
  }
  if (p.startsWith("/extract-questions") || p.startsWith("/analyze") || p.startsWith("/rfp")) {
    return { area: "RFP Analysis", action: "Analyzed RFP / solicitation" };
  }
  if (p.startsWith("/grants")) {
    return { area: "Grants", action: "Searched or analyzed grants" };
  }
  if (p.startsWith("/calendar")) {
    return { area: "Calendar", action: m === "DELETE" ? "Removed calendar event" : "Updated calendar" };
  }
  if (p.startsWith("/rfp-collab")) {
    return { area: "Collaboration", action: "Updated RFP collaboration" };
  }
  if (p.startsWith("/scoring")) {
    return { area: "Scoring", action: "Analyzed bid debrief" };
  }
  return { area: "Workspace", action: `${m} ${p}` };
}

export function recordTenantActivity({
  tenantId,
  user,
  area = "Workspace",
  action = "Updated workspace",
  detail = "",
  path = "",
}) {
  if (!tenantId) return null;
  try {
    const existing = getTenantFeature(tenantId, "activity");
    const items = Array.isArray(existing.data?.items) ? existing.data.items : [];
    const entry = {
      id: `act_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      tenantId,
      userId: user?.id || user?.email || "member",
      userName: user?.name || user?.email || "Team member",
      userEmail: user?.email || "",
      area: String(area || "Workspace").slice(0, 60),
      action: String(action || "Updated workspace").slice(0, 140),
      detail: String(detail || "").slice(0, 240),
      path: String(path || "").slice(0, 140),
      at: new Date().toISOString(),
    };
    const next = [entry, ...items].slice(0, MAX_ITEMS);
    putTenantFeature(tenantId, "activity", { items: next });
    return entry;
  } catch (err) {
    console.warn("[trial-activity] failed to record activity:", err?.message || err);
    return null;
  }
}

/**
 * Automatically captures meaningful mutating requests for any authenticated
 * trial/walkthrough user and writes them to that tenant's shared activity feed.
 */
export function recordTrialActivityMiddleware(req, res, next) {
  if (!req.tenantId) return next();
  const method = String(req.method || "").toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return next();

  const desc = describeRequest(method, req.originalUrl || req.url || "");
  if (!desc) return next();

  res.on("finish", () => {
    if (res.statusCode >= 400) return;
    recordTenantActivity({
      tenantId: req.tenantId,
      user: req.trialUser,
      area: desc.area,
      action: desc.action,
      path: (req.originalUrl || req.url || "").split("?")[0],
    });
  });

  return next();
}

export const activityRouter = Router();

activityRouter.get("/", requireTrialAuth, (req, res) => {
  try {
    const existing = getTenantFeature(req.tenantId, "activity");
    const allItems = Array.isArray(existing.data?.items) ? existing.data.items : [];
    const scope = String(req.query?.scope || "team").toLowerCase();
    const limit = Math.min(200, Math.max(1, Number(req.query?.limit) || 80));
    const currentUserId = req.trialUser?.id || req.trialUser?.email || "";

    const filtered =
      scope === "mine" || scope === "self" || scope === "you"
        ? allItems.filter(
            (x) =>
              x.userId === currentUserId ||
              (req.trialUser?.email && x.userEmail === req.trialUser.email),
          )
        : allItems;

    return res.json({
      ok: true,
      tenant: req.trialTenant,
      currentUserId,
      scope: scope === "mine" || scope === "self" || scope === "you" ? "mine" : "team",
      total: allItems.length,
      items: filtered.slice(0, limit),
      updatedAt: existing.updatedAt,
    });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Failed to load activity feed" });
  }
});

activityRouter.post("/", requireTrialAuth, (req, res) => {
  try {
    const { area, action, detail } = req.body || {};
    if (!action || !String(action).trim()) {
      return res.status(400).json({ error: "action is required" });
    }
    const entry = recordTenantActivity({
      tenantId: req.tenantId,
      user: req.trialUser,
      area: area || "Team update",
      action: String(action).trim(),
      detail: detail ? String(detail).trim() : "",
    });
    return res.status(201).json({ ok: true, item: entry });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Failed to log activity" });
  }
});

activityRouter.delete("/", requireTrialAuth, (req, res) => {
  try {
    deleteTenantFeature(req.tenantId, "activity");
    return res.json({ ok: true, items: [] });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Failed to clear activity feed" });
  }
});
