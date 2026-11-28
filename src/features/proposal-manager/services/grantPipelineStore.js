import { scopedStorageKey, isScopedStorageEventKey } from "../../../services/tenantScopedStorage.js";
import {
  canUseTrialFeatures,
  loadTrialFeatureData,
  persistTrialFeatureData,
} from "../../../services/trialFeatureApi.js";

const BASE_KEY = "juno_grant_pipeline";
export const GRANT_PIPELINE_CHANGED_EVENT = "juno-grant-pipeline-changed";
export const TRIAL_FEATURE_KEY = "grantPipeline";

export const PIPELINE_STAGES = [
  { id: "research", label: "Researching", prob: 0.1, color: "#64748B" },
  { id: "loi", label: "Letter of intent", prob: 0.25, color: "#0EA5E9" },
  { id: "full", label: "Full application", prob: 0.4, color: "#6366F1" },
  { id: "submitted", label: "Submitted", prob: 0.55, color: "#F59E0B" },
  { id: "awarded", label: "Awarded", prob: 1, color: "#10B981" },
  { id: "declined", label: "Declined", prob: 0, color: "#EF4444" },
];

export const STAGE_BY_ID = Object.fromEntries(PIPELINE_STAGES.map((s) => [s.id, s]));

const VALID_STAGES = new Set(PIPELINE_STAGES.map((s) => s.id));
const EMPTY = { items: [] };

function offIso(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getDemoGrantPipeline() {
  return [
    { id: "demo-g1", name: "Rural Digital Equity Capacity Grant", funder: "NTIA (sample)", req: 750000, awd: null, stage: "research", owner: "sam", due: offIso(34), fit: 81 },
    { id: "demo-g2", name: "Workforce Training Program (forecasted)", funder: "Dept. of Labor (sample)", req: 1000000, awd: null, stage: "research", owner: "maya", due: offIso(21), fit: 92 },
    { id: "demo-g3", name: "Small Business Innovation, Phase I", funder: "SBA (sample)", req: 275000, awd: null, stage: "loi", owner: "dev", due: offIso(12), fit: 57 },
    { id: "demo-g4", name: "Community Facilities Grant", funder: "USDA Rural Development (sample)", req: 400000, awd: null, stage: "full", owner: "ana", due: offIso(9), fit: 74 },
    { id: "demo-g5", name: "EDA AI-Ready Workforce", funder: "U.S. Economic Development Administration", req: 0, awd: null, stage: "full", owner: "ana", due: offIso(15), fit: 88, pid: "p5" },
    { id: "demo-g11", name: "Clean Energy Workforce Pilot", funder: "State Energy Office (sample)", req: 320000, awd: null, stage: "submitted", owner: "maya", due: offIso(-10), fit: 70 },
    { id: "demo-g6", name: "Youth Workforce Pathways", funder: "Dept. of Labor (sample)", req: 1250000, awd: 1200000, stage: "awarded", owner: "ana", due: offIso(-480), fit: 90, pid: "p1" },
    { id: "demo-g7", name: "Community Health Navigators", funder: "State Dept. of Health", req: 500000, awd: 480000, stage: "awarded", owner: "maya", due: offIso(-511), fit: 84, pid: "p2" },
    { id: "demo-g8", name: "After-School STEM Labs", funder: "Hartwell Foundation", req: 150000, awd: 150000, stage: "awarded", owner: "maya", due: offIso(-620), fit: 79, pid: "p3" },
    { id: "demo-g9", name: "Digital Literacy for Seniors", funder: "City of Riverside", req: 120000, awd: 95000, stage: "awarded", owner: "ana", due: offIso(-759), fit: 76, pid: "p4" },
    { id: "demo-g10", name: "Arts in Schools Expansion", funder: "Riverside Arts Council", req: 60000, awd: null, stage: "declined", owner: "rosa", due: offIso(-40), fit: 52 },
  ];
}

function newId() {
  return `gp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function normalizeOpportunity(raw = {}) {
  const req = Math.max(0, Math.round(Number(raw.req) || 0));
  const awd = raw.awd === null || raw.awd === undefined || raw.awd === "" ? null : Math.max(0, Math.round(Number(raw.awd) || 0));
  const fitNum = Number(raw.fit);
  return {
    id: String(raw.id || newId()),
    name: String(raw.name || "").trim() || "Untitled opportunity",
    funder: String(raw.funder || "").trim(),
    req,
    awd,
    stage: VALID_STAGES.has(raw.stage) ? raw.stage : "research",
    owner: String(raw.owner || "").trim(),
    due: raw.due ? String(raw.due).slice(0, 10) : offIso(30),
    fit: Number.isFinite(fitNum) ? Math.max(0, Math.min(100, Math.round(fitNum))) : 75,
    pid: raw.pid ? String(raw.pid) : "",
  };
}

function isSeedId(id) {
  const s = String(id || "");
  return s.startsWith("demo-") || s.startsWith("seed-");
}

function normalizeBlob(data) {
  const rawItems = Array.isArray(data?.items) ? data.items : [];
  const items = rawItems.filter((x) => !isSeedId(x?.id)).map(normalizeOpportunity);
  return { items };
}

function storageKey() {
  return scopedStorageKey(BASE_KEY);
}

function readRaw() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return { items: [] };
    return normalizeBlob(JSON.parse(raw));
  } catch {
    return { items: [] };
  }
}

async function persistCompanyWide(blob) {
  if (!canUseTrialFeatures()) return;
  await persistTrialFeatureData(TRIAL_FEATURE_KEY, normalizeBlob(blob));
}

function writeRaw(blob) {
  const next = normalizeBlob(blob);
  try {
    localStorage.setItem(storageKey(), JSON.stringify(next));
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent(GRANT_PIPELINE_CHANGED_EVENT, { detail: next }));
  } catch {
    /* ignore */
  }
  void persistCompanyWide(next);
  return next;
}

export function getGrantPipelineData() {
  return readRaw();
}

export function addOpportunity(input = {}) {
  const data = readRaw();
  const item = normalizeOpportunity({ ...input, id: newId() });
  const next = writeRaw({ items: [item, ...data.items] });
  return { ...next, created: item };
}

export function updateOpportunity(id, patch = {}) {
  const data = readRaw();
  const nextItems = data.items.map((x) =>
    x.id === id ? normalizeOpportunity({ ...x, ...patch, id: x.id }) : x,
  );
  return writeRaw({ items: nextItems });
}

export function removeOpportunity(id) {
  const data = readRaw();
  return writeRaw({ items: data.items.filter((x) => x.id !== id) });
}

export async function hydrateGrantPipelineFromServer(opts = {}) {
  const notify = opts.notify !== false;
  if (!canUseTrialFeatures()) return readRaw();
  try {
    const remote = await loadTrialFeatureData(TRIAL_FEATURE_KEY, EMPTY);
    const next = normalizeBlob(remote);
    const nextJson = JSON.stringify(next);
    const prevJson = localStorage.getItem(storageKey());
    if (prevJson !== nextJson) {
      localStorage.setItem(storageKey(), nextJson);
      if (notify) {
        try {
          window.dispatchEvent(new CustomEvent(GRANT_PIPELINE_CHANGED_EVENT, { detail: next }));
        } catch {
          /* ignore */
        }
      }
    }
    return next;
  } catch {
    return readRaw();
  }
}

export function subscribeGrantPipeline(handler) {
  const onCustom = () => handler(getGrantPipelineData());
  const onStorage = (e) => {
    if (!isScopedStorageEventKey(e.key, BASE_KEY)) return;
    handler(getGrantPipelineData());
  };
  window.addEventListener(GRANT_PIPELINE_CHANGED_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(GRANT_PIPELINE_CHANGED_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
