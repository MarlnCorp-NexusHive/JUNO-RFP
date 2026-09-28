import { scopedStorageKey, isScopedStorageEventKey } from "../../../services/tenantScopedStorage.js";

const BASE_KEY = "juno_trial_compliance";
export const COMPLIANCE_CHANGED_EVENT = "juno-trial-compliance-changed";

const EMPTY = { areas: [], logs: [], risks: [] };

function storageKey() {
  return scopedStorageKey(BASE_KEY);
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function normalizeStatus(status) {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return "pending";
  if (s === "noncompliant" || s === "non-compliant" || s === "nonCompliant") return "nonCompliant";
  return "compliant";
}

function normalizeLogStatus(status) {
  return String(status || "").toLowerCase() === "failed" ? "failed" : "success";
}

function normalizeLevel(level) {
  const s = String(level || "").toLowerCase();
  if (s === "high") return "high";
  if (s === "medium") return "medium";
  return "low";
}

function normalizePriority(priority) {
  return normalizeLevel(priority);
}

function readRaw() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return { ...EMPTY, areas: [], logs: [], risks: [] };
    const parsed = JSON.parse(raw);
    return {
      areas: Array.isArray(parsed?.areas) ? parsed.areas : [],
      logs: Array.isArray(parsed?.logs) ? parsed.logs : [],
      risks: Array.isArray(parsed?.risks) ? parsed.risks : [],
    };
  } catch {
    return { ...EMPTY, areas: [], logs: [], risks: [] };
  }
}

function writeRaw(data) {
  const next = {
    areas: Array.isArray(data?.areas) ? data.areas : [],
    logs: Array.isArray(data?.logs) ? data.logs : [],
    risks: Array.isArray(data?.risks) ? data.risks : [],
  };
  localStorage.setItem(storageKey(), JSON.stringify(next));
  try {
    window.dispatchEvent(new CustomEvent(COMPLIANCE_CHANGED_EVENT, { detail: next }));
  } catch {
    /* ignore */
  }
  return next;
}

export function getComplianceData() {
  return readRaw();
}

export function addComplianceArea(input = {}) {
  const data = readRaw();
  const area = {
    id: newId("area"),
    name: String(input.name || "").trim() || "Untitled area",
    status: normalizeStatus(input.status),
    score: clampScore(input.score),
    lastAudit: String(input.lastAudit || new Date().toISOString().slice(0, 10)),
  };
  data.areas = [area, ...data.areas];
  return writeRaw(data);
}

export function updateComplianceArea(id, patch = {}) {
  const data = readRaw();
  const idx = data.areas.findIndex((a) => a.id === id);
  if (idx < 0) return data;
  const cur = data.areas[idx];
  data.areas[idx] = {
    ...cur,
    name: patch.name != null ? String(patch.name).trim() || cur.name : cur.name,
    status: patch.status != null ? normalizeStatus(patch.status) : cur.status,
    score: patch.score != null ? clampScore(patch.score) : cur.score,
    lastAudit: patch.lastAudit != null ? String(patch.lastAudit) : cur.lastAudit,
  };
  return writeRaw(data);
}

export function removeComplianceArea(id) {
  const data = readRaw();
  data.areas = data.areas.filter((a) => a.id !== id);
  return writeRaw(data);
}

export function addComplianceLog(input = {}) {
  const data = readRaw();
  const now = new Date();
  const log = {
    id: newId("log"),
    date: String(input.date || now.toISOString().slice(0, 10)),
    time: String(input.time || now.toTimeString().slice(0, 5)),
    action: String(input.action || "").trim() || "Action recorded",
    user: String(input.user || "").trim() || "User",
    status: normalizeLogStatus(input.status),
    priority: normalizePriority(input.priority),
    details: String(input.details || "").trim(),
  };
  data.logs = [log, ...data.logs];
  return writeRaw(data);
}

export function updateComplianceLog(id, patch = {}) {
  const data = readRaw();
  const idx = data.logs.findIndex((l) => l.id === id);
  if (idx < 0) return data;
  const cur = data.logs[idx];
  data.logs[idx] = {
    ...cur,
    date: patch.date != null ? String(patch.date) : cur.date,
    time: patch.time != null ? String(patch.time) : cur.time,
    action: patch.action != null ? String(patch.action).trim() || cur.action : cur.action,
    user: patch.user != null ? String(patch.user).trim() || cur.user : cur.user,
    status: patch.status != null ? normalizeLogStatus(patch.status) : cur.status,
    priority: patch.priority != null ? normalizePriority(patch.priority) : cur.priority,
    details: patch.details != null ? String(patch.details).trim() : cur.details,
  };
  return writeRaw(data);
}

export function removeComplianceLog(id) {
  const data = readRaw();
  data.logs = data.logs.filter((l) => l.id !== id);
  return writeRaw(data);
}

export function addComplianceRisk(input = {}) {
  const data = readRaw();
  const risk = {
    id: newId("risk"),
    name: String(input.name || "").trim() || "Untitled risk",
    level: normalizeLevel(input.level),
    score: clampScore(input.score),
    mitigation: String(input.mitigation || "").trim(),
  };
  data.risks = [risk, ...data.risks];
  return writeRaw(data);
}

export function updateComplianceRisk(id, patch = {}) {
  const data = readRaw();
  const idx = data.risks.findIndex((r) => r.id === id);
  if (idx < 0) return data;
  const cur = data.risks[idx];
  data.risks[idx] = {
    ...cur,
    name: patch.name != null ? String(patch.name).trim() || cur.name : cur.name,
    level: patch.level != null ? normalizeLevel(patch.level) : cur.level,
    score: patch.score != null ? clampScore(patch.score) : cur.score,
    mitigation: patch.mitigation != null ? String(patch.mitigation).trim() : cur.mitigation,
  };
  return writeRaw(data);
}

export function removeComplianceRisk(id) {
  const data = readRaw();
  data.risks = data.risks.filter((r) => r.id !== id);
  return writeRaw(data);
}

/** Subscribe to compliance changes (same tab + cross-tab storage). Returns unsubscribe. */
export function subscribeCompliance(onChange) {
  const handleCustom = () => onChange(getComplianceData());
  const handleStorage = (e) => {
    if (!isScopedStorageEventKey(e.key, BASE_KEY)) return;
    onChange(getComplianceData());
  };
  window.addEventListener(COMPLIANCE_CHANGED_EVENT, handleCustom);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(COMPLIANCE_CHANGED_EVENT, handleCustom);
    window.removeEventListener("storage", handleStorage);
  };
}

export function getComplianceScore(data = getComplianceData()) {
  const areas = data?.areas || [];
  if (!areas.length) return 0;
  const sum = areas.reduce((acc, a) => acc + clampScore(a.score), 0);
  return Math.round(sum / areas.length);
}

export function getActiveRiskCount(data = getComplianceData()) {
  return (data?.risks || []).filter((r) => r.level === "medium" || r.level === "high").length;
}

export function getUnaddressedClauseCount(data = getComplianceData()) {
  return (data?.areas || []).filter((a) => a.status !== "compliant").length;
}

export function getFarRiskFlag(data = getComplianceData()) {
  const risks = data?.risks || [];
  if (!risks.length) return "None";
  if (risks.some((r) => r.level === "high")) return "High";
  if (risks.some((r) => r.level === "medium")) return "Medium";
  return "Low";
}

export function getPastPerformanceScore(data = getComplianceData()) {
  const areas = data?.areas || [];
  const match = areas.find((a) => /past\s*performance/i.test(String(a.name || "")));
  if (match) return clampScore(match.score);
  return getComplianceScore(data);
}

export function buildComplianceAlerts(data = getComplianceData(), t) {
  const alerts = [];
  const areas = data?.areas || [];
  const risks = data?.risks || [];

  areas
    .filter((a) => a.status === "pending" || a.status === "nonCompliant")
    .forEach((a) => {
      const key =
        a.status === "nonCompliant"
          ? "dashboard.alerts.proposalManager.complianceAreaNonCompliant"
          : "dashboard.alerts.proposalManager.complianceAreaPending";
      alerts.push({
        text: t(key, { name: a.name }),
        color: a.status === "nonCompliant" ? "text-red-500" : "text-amber-500",
      });
    });

  risks
    .filter((r) => r.level === "high")
    .forEach((r) => {
      alerts.push({
        text: t("dashboard.alerts.proposalManager.complianceHighRisk", { name: r.name }),
        color: "text-red-500",
      });
    });

  return alerts;
}
