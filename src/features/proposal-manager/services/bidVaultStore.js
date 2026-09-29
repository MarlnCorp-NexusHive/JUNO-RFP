import { scopedStorageKey, isScopedStorageEventKey } from "../../../services/tenantScopedStorage.js";
import {
  canUseTrialFeatures,
  loadTrialFeatureData,
  persistTrialFeatureData,
} from "../../../services/trialFeatureApi.js";

const BASE_KEY = "juno_trial_bid_vault";
export const BID_VAULT_CHANGED_EVENT = "juno-trial-bid-vault-changed";

const STAGES = new Set(["pipeline", "capture", "proposal", "submitted", "won", "lost", "no-bid"]);

const EMPTY = { submissions: [] };

function storageKey() {
  return scopedStorageKey(BASE_KEY);
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function money(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function normalizeStage(stage) {
  const s = String(stage || "").toLowerCase().replace(/\s+/g, "-");
  if (s === "nobid" || s === "no_bid") return "no-bid";
  if (STAGES.has(s)) return s;
  return "pipeline";
}

function normalizeSubmission(row) {
  if (!row || typeof row !== "object") return null;
  const id = String(row.id || "").trim() || newId("bid");
  const title = String(row.title || "").trim();
  if (!title) return null;
  return {
    id,
    title,
    number: String(row.number || "").trim(),
    agency: String(row.agency || "").trim(),
    segment: String(row.segment || "State/Local").trim() || "State/Local",
    stage: normalizeStage(row.stage),
    value: money(row.value),
    deadline: row.deadline ? String(row.deadline).slice(0, 10) : null,
    submittedAt: row.submittedAt ? String(row.submittedAt).slice(0, 10) : null,
    owner: String(row.owner || "").trim(),
    opportunityId: row.opportunityId != null ? String(row.opportunityId) : null,
    sourceDocIds: Array.isArray(row.sourceDocIds) ? row.sourceDocIds.map(String) : [],
    scoringId: row.scoringId != null ? String(row.scoringId) : null,
    notes: String(row.notes || "").trim(),
    updatedAt: String(row.updatedAt || new Date().toISOString()),
    createdAt: String(row.createdAt || new Date().toISOString()),
  };
}

function normalizeBlob(data) {
  const submissions = Array.isArray(data?.submissions)
    ? data.submissions.map(normalizeSubmission).filter(Boolean)
    : Array.isArray(data?.pipeline)
      ? data.pipeline.map(normalizeSubmission).filter(Boolean)
      : [];
  return { submissions };
}

function readRaw() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return { submissions: [] };
    return normalizeBlob(JSON.parse(raw));
  } catch {
    return { submissions: [] };
  }
}

async function persistCompanyWide(data) {
  if (!canUseTrialFeatures()) return;
  const blob = normalizeBlob(data);
  // Keep legacy keys empty arrays so older readers don't break
  await persistTrialFeatureData("bidVault", {
    submissions: blob.submissions,
    winLoss: [],
    pipeline: blob.submissions.filter((s) =>
      ["pipeline", "capture", "proposal"].includes(s.stage),
    ),
  });
}

function writeRaw(data) {
  const next = normalizeBlob(data);
  localStorage.setItem(storageKey(), JSON.stringify(next));
  try {
    window.dispatchEvent(new CustomEvent(BID_VAULT_CHANGED_EVENT, { detail: next }));
  } catch {
    /* ignore */
  }
  void persistCompanyWide(next);
  return next;
}

export function getBidVaultData() {
  return readRaw();
}

export function listSubmissions() {
  return readRaw()
    .submissions.slice()
    .sort((a, b) => (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0));
}

export function getSubmission(id) {
  if (!id) return null;
  return readRaw().submissions.find((s) => s.id === id) || null;
}

export function findSubmissionByOpportunityId(opportunityId) {
  if (!opportunityId) return null;
  const id = String(opportunityId);
  return readRaw().submissions.find((s) => s.opportunityId === id) || null;
}

export function addSubmission(input = {}) {
  const data = readRaw();
  const row = normalizeSubmission({
    ...input,
    id: newId("bid"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  if (!row) return null;
  data.submissions = [row, ...data.submissions];
  writeRaw(data);
  return row;
}

export function updateSubmission(id, patch = {}) {
  const data = readRaw();
  const idx = data.submissions.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  const row = normalizeSubmission({
    ...data.submissions[idx],
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  });
  data.submissions[idx] = row;
  writeRaw(data);
  return row;
}

export function removeSubmission(id) {
  const data = readRaw();
  data.submissions = data.submissions.filter((s) => s.id !== id);
  return writeRaw(data);
}

export function openOrCreateFromShortlist(item) {
  if (!item?.id) return null;
  const existing = findSubmissionByOpportunityId(item.id);
  if (existing) return { submission: existing, created: false };
  const submission = addSubmission({
    title: String(item.title || item.number || item.id).trim() || "Opportunity",
    number: item.number || "",
    agency: item.agency || "",
    deadline: item.deadline || null,
    opportunityId: item.id,
    stage: "pipeline",
    segment: item.source === "sam" ? "Federal" : "State/Local",
  });
  return { submission, created: true };
}

export function openOrCreateFromSourceDoc(doc) {
  if (!doc?.id) return null;
  const data = readRaw();
  const existing = data.submissions.find((s) => (s.sourceDocIds || []).includes(doc.id));
  if (existing) return { submission: existing, created: false };
  const deadline =
    (doc.importantDates || []).find((r) =>
      /deadline|due|submission|closing|application/i.test(String(r.event || "")),
    )?.date || null;
  const submission = addSubmission({
    title: String(doc.name || "Source document").replace(/\.(pdf|docx?|xlsx?|txt)$/i, ""),
    stage: "pipeline",
    deadline: deadline ? String(deadline).slice(0, 10) : null,
    sourceDocIds: [doc.id],
    notes: "Created from Source Docs",
  });
  return { submission, created: true };
}

export function deriveBidVaultCharts(data = readRaw()) {
  const subs = data.submissions || [];
  const stageOrder = ["pipeline", "capture", "proposal", "submitted", "won", "lost", "no-bid"];
  const stageLabels = {
    pipeline: "Pipeline",
    capture: "Capture",
    proposal: "Proposal",
    submitted: "Submitted",
    won: "Won",
    lost: "Lost",
    "no-bid": "No-Bid",
  };
  const pipelineByStage = stageOrder.map((stage) => ({
    stage: stageLabels[stage] || stage,
    count: subs.filter((s) => s.stage === stage).length,
    value: Math.round(
      (subs.filter((s) => s.stage === stage).reduce((a, s) => a + (s.value || 0), 0) / 1e6) * 100,
    ) / 100,
  }));

  const segments = ["Federal", "State/Local", "Commercial", "International"];
  const winLossBySegment = segments.map((segment) => ({
    segment,
    won: subs.filter((s) => s.segment === segment && s.stage === "won").length,
    lost: subs.filter((s) => s.segment === segment && s.stage === "lost").length,
  }));

  const funnelStages = [
    { key: "pipeline", label: "RFPs Identified" },
    { key: "capture", label: "Go/No-Go" },
    { key: "proposal", label: "Proposal" },
    { key: "submitted", label: "Proposal Submitted" },
    { key: "won", label: "Won" },
  ];
  const submissionFunnel = funnelStages.map((f) => ({
    stage: f.label,
    count: subs.filter((s) => {
      const order = stageOrder.indexOf(s.stage);
      const need = stageOrder.indexOf(f.key);
      if (f.key === "won") return s.stage === "won";
      return order >= need && s.stage !== "lost" && s.stage !== "no-bid";
    }).length,
  }));

  return { pipelineByStage, winLossBySegment, submissionFunnel };
}

export function buildBidVaultAlerts(data = getBidVaultData(), t) {
  const alerts = [];
  const now = Date.now();
  (data.submissions || []).forEach((s) => {
    if (s.deadline && ["pipeline", "capture", "proposal"].includes(s.stage)) {
      const due = Date.parse(s.deadline);
      if (Number.isFinite(due)) {
        const days = Math.ceil((due - now) / 86400000);
        if (days < 0) {
          alerts.push({
            text: t("dashboard.alerts.proposalManager.bidVaultPastDue", { title: s.title }),
            color: "text-red-500",
          });
        } else if (days <= 14) {
          alerts.push({
            text: t("dashboard.alerts.proposalManager.bidVaultDueSoon", {
              title: s.title,
              days,
            }),
            color: days <= 7 ? "text-red-500" : "text-amber-500",
          });
        }
      }
    }
    if ((s.stage === "won" || s.stage === "lost") && !s.scoringId) {
      alerts.push({
        text: t("dashboard.alerts.proposalManager.bidVaultNeedsScoring", { title: s.title }),
        color: "text-indigo-500",
      });
    }
  });
  return alerts.slice(0, 8);
}

export async function hydrateBidVaultFromServer(opts = {}) {
  const notify = opts.notify !== false;
  if (!canUseTrialFeatures()) return getBidVaultData();
  try {
    const data = await loadTrialFeatureData("bidVault", EMPTY);
    const next = normalizeBlob(data);
    const nextJson = JSON.stringify(next);
    const prevJson = localStorage.getItem(storageKey());
    if (prevJson === nextJson) return getBidVaultData();
    localStorage.setItem(storageKey(), nextJson);
    if (notify) {
      try {
        window.dispatchEvent(new CustomEvent(BID_VAULT_CHANGED_EVENT, { detail: next }));
      } catch {
        /* ignore */
      }
    }
    return getBidVaultData();
  } catch {
    return getBidVaultData();
  }
}

export function subscribeBidVault(onChange) {
  const handleCustom = () => onChange(getBidVaultData());
  const handleStorage = (e) => {
    if (!isScopedStorageEventKey(e.key, BASE_KEY)) return;
    onChange(getBidVaultData());
  };
  window.addEventListener(BID_VAULT_CHANGED_EVENT, handleCustom);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(BID_VAULT_CHANGED_EVENT, handleCustom);
    window.removeEventListener("storage", handleStorage);
  };
}

export function formatBidValue(value) {
  if (value == null) return "—";
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${Math.round(value).toLocaleString()}`;
}
