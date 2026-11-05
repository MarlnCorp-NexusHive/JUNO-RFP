/**
 * Tenant-scoped award portfolio for trial / walkthrough.
 * Starts empty (fresh) and grows as the user adds / promotes awards.
 * Demo login never writes here — it uses static demo data.
 */

import { scopedStorageKey, isScopedStorageEventKey } from "../../../services/tenantScopedStorage.js";
import {
  canUseTrialFeatures,
  loadTrialFeatureData,
  persistTrialFeatureData,
} from "../../../services/trialFeatureApi.js";
import { clampPct } from "./grantPulse.js";

const BASE_KEY = "juno_award_management";
export const AWARD_MGMT_CHANGED_EVENT = "juno-award-management-changed";
export const TRIAL_FEATURE_KEY = "awardManagement";

/** @typedef {{
 *  id: string,
 *  title: string,
 *  funder: string,
 *  amount: number,
 *  timePct?: number | null,
 *  spentPct: number,
 *  donePct: number,
 *  periodStart?: string,
 *  periodEnd?: string,
 *  nextDeadlineIso?: string,
 *  nextDeadlineDisplay?: string,
 *  nextDeadlineLabel?: string,
 *  needsApproval?: boolean,
 *  approvalTitle?: string,
 *  approvalDetail?: string,
 *  sourceBidId?: string | null,
 * }} AwardRecord */

const EMPTY = { awards: [], freshReset: true };

function storageKey() {
  return scopedStorageKey(BASE_KEY);
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeAward(raw = {}) {
  return {
    id: String(raw.id || newId("award")),
    title: String(raw.title || "").trim() || "Untitled award",
    funder: String(raw.funder || "").trim() || "Funder",
    amount: Math.max(0, Math.round(Number(raw.amount) || 0)),
    timePct: raw.timePct != null && raw.timePct !== "" ? clampPct(raw.timePct) : null,
    spentPct: clampPct(raw.spentPct),
    donePct: clampPct(raw.donePct),
    periodStart: raw.periodStart ? String(raw.periodStart).slice(0, 10) : "",
    periodEnd: raw.periodEnd ? String(raw.periodEnd).slice(0, 10) : "",
    nextDeadlineIso: raw.nextDeadlineIso
      ? String(raw.nextDeadlineIso).slice(0, 10)
      : "",
    nextDeadlineDisplay: String(raw.nextDeadlineDisplay || "").trim(),
    nextDeadlineLabel: String(raw.nextDeadlineLabel || "").trim(),
    needsApproval: Boolean(raw.needsApproval),
    approvalTitle: String(raw.approvalTitle || "").trim(),
    approvalDetail: String(raw.approvalDetail || "").trim(),
    sourceBidId: raw.sourceBidId != null ? String(raw.sourceBidId) : null,
  };
}

function looksLikeLegacySampleSeed(awards) {
  if (!Array.isArray(awards) || awards.length === 0) return false;
  return awards.every(
    (a) =>
      String(a?.id || "").startsWith("seed-") ||
      String(a?.id || "").startsWith("demo-"),
  );
}

function normalizeBlob(data) {
  const awards = Array.isArray(data?.awards) ? data.awards.map(normalizeAward) : [];
  return {
    awards,
    freshReset: Boolean(data?.freshReset) || awards.length === 0,
  };
}

function readRaw() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return { ...EMPTY, awards: [] };
    return normalizeBlob(JSON.parse(raw));
  } catch {
    return { ...EMPTY, awards: [] };
  }
}

async function persistCompanyWide(data) {
  if (!canUseTrialFeatures()) return;
  await persistTrialFeatureData(TRIAL_FEATURE_KEY, normalizeBlob(data));
}

function writeRaw(data) {
  const next = normalizeBlob(data);
  try {
    localStorage.setItem(storageKey(), JSON.stringify(next));
  } catch (err) {
    console.warn("[award-management] localStorage write failed:", err?.message || err);
  }
  try {
    window.dispatchEvent(new CustomEvent(AWARD_MGMT_CHANGED_EVENT, { detail: next }));
  } catch {
    /* ignore */
  }
  void persistCompanyWide(next);
  return next;
}

export function getAwardManagementData() {
  return readRaw();
}

/**
 * One-time: clear legacy sample seed so trial/walkthrough start empty.
 * Keeps user-created awards (non seed-/demo- ids).
 */
export function ensureAwardManagementFresh() {
  const data = readRaw();
  if (data.freshReset && !looksLikeLegacySampleSeed(data.awards)) {
    return data;
  }
  if (looksLikeLegacySampleSeed(data.awards) || data.awards.length === 0) {
    return writeRaw({ awards: [], freshReset: true });
  }
  // Mixed or user data after old seed flag — keep awards, mark fresh
  return writeRaw({ ...data, freshReset: true });
}

export function updateAward(id, patch = {}) {
  const data = readRaw();
  const idx = data.awards.findIndex((a) => a.id === id);
  if (idx < 0) return data;
  const cur = data.awards[idx];
  data.awards[idx] = normalizeAward({
    ...cur,
    ...patch,
    id: cur.id,
    spentPct: patch.spentPct != null ? patch.spentPct : cur.spentPct,
    donePct: patch.donePct != null ? patch.donePct : cur.donePct,
    timePct: patch.timePct !== undefined ? patch.timePct : cur.timePct,
    needsApproval:
      patch.needsApproval != null ? Boolean(patch.needsApproval) : cur.needsApproval,
  });
  data.freshReset = true;
  return writeRaw(data);
}

export function addAward(input = {}) {
  const data = ensureAwardManagementFresh();
  const award = normalizeAward({
    ...input,
    id: newId("award"),
    spentPct: input.spentPct != null ? input.spentPct : 0,
    donePct: input.donePct != null ? input.donePct : 0,
    timePct: input.timePct != null ? input.timePct : 0,
  });
  data.awards = [award, ...data.awards];
  data.freshReset = true;
  return writeRaw(data);
}

/** Promote a Bid Vault "won" submission into the award portfolio. */
export function addAwardFromBidSubmission(submission) {
  if (!submission?.id) return null;
  const data = ensureAwardManagementFresh();
  const existing = data.awards.find((a) => a.sourceBidId === String(submission.id));
  if (existing) return { award: existing, created: false };

  const today = new Date();
  const start = today.toISOString().slice(0, 10);
  const end = new Date(today);
  end.setFullYear(end.getFullYear() + 1);
  const periodEnd = end.toISOString().slice(0, 10);

  const award = normalizeAward({
    id: newId("award"),
    title: String(submission.title || "").trim() || "Award",
    funder: String(submission.agency || "").trim() || "Funder",
    amount: Math.max(0, Math.round(Number(submission.value) || 0)),
    timePct: 0,
    spentPct: 0,
    donePct: 0,
    periodStart: start,
    periodEnd,
    nextDeadlineIso: submission.deadline || "",
    nextDeadlineDisplay: "",
    nextDeadlineLabel: submission.deadline ? "Award start reporting" : "",
    sourceBidId: String(submission.id),
  });
  data.awards = [award, ...data.awards];
  data.freshReset = true;
  writeRaw(data);
  return { award, created: true };
}

export function removeAward(id) {
  const data = readRaw();
  data.awards = data.awards.filter((a) => a.id !== id);
  data.freshReset = true;
  return writeRaw(data);
}

export async function hydrateAwardManagementFromServer(opts = {}) {
  const notify = opts.notify !== false;
  if (!canUseTrialFeatures()) return ensureAwardManagementFresh();
  try {
    const remote = await loadTrialFeatureData(TRIAL_FEATURE_KEY, EMPTY);
    let next = normalizeBlob(remote);
    if (looksLikeLegacySampleSeed(next.awards)) {
      next = { awards: [], freshReset: true };
    } else {
      next = { ...next, freshReset: true };
    }

    const nextJson = JSON.stringify(next);
    const prevJson = localStorage.getItem(storageKey());
    if (prevJson !== nextJson) {
      localStorage.setItem(storageKey(), nextJson);
      void persistCompanyWide(next);
      if (notify) {
        try {
          window.dispatchEvent(new CustomEvent(AWARD_MGMT_CHANGED_EVENT, { detail: next }));
        } catch {
          /* ignore */
        }
      }
    }
    return ensureAwardManagementFresh();
  } catch {
    return ensureAwardManagementFresh();
  }
}

export function subscribeAwardManagement(handler) {
  const onCustom = () => handler(getAwardManagementData());
  const onStorage = (e) => {
    if (!isScopedStorageEventKey(e.key, BASE_KEY)) return;
    handler(getAwardManagementData());
  };
  window.addEventListener(AWARD_MGMT_CHANGED_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(AWARD_MGMT_CHANGED_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
