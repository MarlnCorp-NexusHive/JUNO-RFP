/**
 * Trial feature store client.
 * Demo has no trial session → callers must not hit these endpoints for demo UI.
 */
import API from "./api.js";
import { getTrialSession, isTrialMode } from "./trialAuthSession.js";

export const TRIAL_FEATURE_KEYS = [
  "workspace",
  "sourceDocs",
  "contentHub",
  "techSolutioning",
  "scoring",
  "winSlide",
  "userManagement",
  "communication",
  "pricing",
  "bidVault",
  "teamCollab",
  "shortlist",
  "applicantFit",
  "manageTeam",
  "compliance",
  "dashboard",
  "awardManagement",
  "projectWorkspace",
];

export function canUseTrialFeatures() {
  return isTrialMode() && !!getTrialSession()?.token;
}

export async function fetchTrialFeature(key) {
  if (!canUseTrialFeatures()) {
    throw new Error("Trial authentication required");
  }
  const res = await API.get(`/trial/features/${encodeURIComponent(key)}`, { timeout: 20_000 });
  return res.data;
}

export async function saveTrialFeature(key, data) {
  if (!canUseTrialFeatures()) {
    throw new Error("Trial authentication required");
  }
  const res = await API.put(
    `/trial/features/${encodeURIComponent(key)}`,
    { data },
    { timeout: 20_000 },
  );
  return res.data;
}

export async function resetTrialFeature(key) {
  if (!canUseTrialFeatures()) {
    throw new Error("Trial authentication required");
  }
  const res = await API.delete(`/trial/features/${encodeURIComponent(key)}`, { timeout: 20_000 });
  return res.data;
}

/**
 * Load feature data or return fallbackEmpty when offline / not trial.
 */
export async function loadTrialFeatureData(key, fallbackEmpty = {}) {
  if (!canUseTrialFeatures()) return fallbackEmpty;
  try {
    const result = await fetchTrialFeature(key);
    return result?.data != null ? result.data : fallbackEmpty;
  } catch {
    return fallbackEmpty;
  }
}

/**
 * Per-key write coalescer so rapid mutations for the same feature key never race
 * out of order and overwrite newer state with older in-flight PUTs.
 */
const inFlightByKey = new Set();
const pendingDataByKey = new Map();

/**
 * Persist feature data for trial tenants. No-op when not in trial mode.
 */
export async function persistTrialFeatureData(key, data) {
  if (!canUseTrialFeatures()) return null;
  if (inFlightByKey.has(key)) {
    pendingDataByKey.set(key, data);
    return null;
  }
  inFlightByKey.add(key);
  let current = data;
  let lastResult = null;
  try {
    while (true) {
      try {
        lastResult = await saveTrialFeature(key, current);
      } catch (err) {
        console.warn(`[trial-features] save failed (${key}):`, err?.message || err);
        lastResult = null;
      }
      if (!pendingDataByKey.has(key)) break;
      current = pendingDataByKey.get(key);
      pendingDataByKey.delete(key);
      if (!canUseTrialFeatures()) break;
    }
    return lastResult;
  } finally {
    inFlightByKey.delete(key);
  }
}
