import fs from "fs";
import path from "path";
import { getTrialDataPath } from "./tenantStore.js";
import { readJsonSafe, writeJsonAtomic, writeJsonAtomicAsync } from "../utils/atomicFile.js";

/** Allowed feature keys for PM clean-slate tabs. */
export const FEATURE_KEYS = [
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
  "grantPipeline",
  "settings",
  "activity",
];

const EMPTY_BY_KEY = {
  workspace: { folders: [], documents: [] },
  sourceDocs: { docs: [], nameOverrides: {} },
  contentHub: { qaLibrary: [] },
  techSolutioning: { assets: [], patterns: [], designs: [], settings: {} },
  scoring: { records: [] },
  winSlide: { draft: null, settings: {} },
  userManagement: { users: [] },
  communication: { channels: [], messages: [], readState: {} },
  pricing: {
    laborRates: [],
    volumes: [],
    settings: { currency: "USD", defaultWrap: 1.2 },
  },
  bidVault: { submissions: [], winLoss: [], pipeline: [] },
  teamCollab: {
    tenantId: null,
    pmUserId: null,
    workspaces: [],
    messages: [],
    logs: [],
    updatedAt: null,
  },
  shortlist: { items: [] },
  applicantFit: { profile: null },
  manageTeam: { members: [], trainings: [], assignments: [], updatedAt: null },
  compliance: { areas: [], logs: [], risks: [] },
  awardManagement: { awards: [], freshReset: true },
  projectWorkspace: { projects: [], tasks: [], updates: [], freshReset: true },
  settings: { cfg: null, log: [] },
  grantPipeline: { items: [] },
  activity: { items: [] },
  dashboard: {
    docInsights: {},
    charts: {
      rollingWinRate: [],
      sectionM: [],
      riskCompliance: [],
      submissionForecast: [],
      winProbabilityTrend: [],
    },
    aiAlerts: [],
    updatedAt: null,
  },
};

function getFeaturesDataPath() {
  const tenantsPath = getTrialDataPath();
  const dir = path.dirname(tenantsPath);
  return path.join(dir, "trial-features.json");
}

function emptyFeaturesDb() {
  return { tenants: {} };
}

function ensureDir() {
  const dataPath = getFeaturesDataPath();
  const dir = path.dirname(dataPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

let cachedFeaturesDb = null;
let cachedFeaturesPath = null;
let featuresFlushTimer = null;
let featuresFlushInFlight = false;
let featuresFlushPending = false;
let featuresExitRegistered = false;

function registerFeaturesExitOnce() {
  if (featuresExitRegistered) return;
  featuresExitRegistered = true;
  const onExit = () => {
    try {
      flushFeaturesDbSync();
    } catch {
      /* best-effort */
    }
  };
  process.once("SIGINT", onExit);
  process.once("SIGTERM", onExit);
  process.once("beforeExit", onExit);
}

async function runFeaturesAsyncFlush() {
  if (featuresFlushInFlight || !cachedFeaturesDb || !cachedFeaturesPath) return;
  featuresFlushInFlight = true;
  try {
    do {
      featuresFlushPending = false;
      await writeJsonAtomicAsync(cachedFeaturesPath, cachedFeaturesDb, { pretty: false, backup: true });
    } while (featuresFlushPending);
  } catch (err) {
    console.error("[trial-features] async flush failed:", err?.message || err);
  } finally {
    featuresFlushInFlight = false;
  }
}

function scheduleFeaturesFlush() {
  featuresFlushPending = true;
  registerFeaturesExitOnce();
  if (featuresFlushTimer) return;
  featuresFlushTimer = setTimeout(() => {
    featuresFlushTimer = null;
    void runFeaturesAsyncFlush();
  }, 50);
  if (typeof featuresFlushTimer.unref === "function") featuresFlushTimer.unref();
}

export function flushFeaturesDbSync() {
  if (featuresFlushTimer) {
    clearTimeout(featuresFlushTimer);
    featuresFlushTimer = null;
  }
  if (!cachedFeaturesDb || !cachedFeaturesPath) return;
  featuresFlushPending = false;
  ensureDir();
  writeJsonAtomic(cachedFeaturesPath, cachedFeaturesDb, { pretty: false, dirFsync: true, backup: true });
}

export function invalidateFeaturesDbCache() {
  cachedFeaturesDb = null;
  cachedFeaturesPath = null;
}

function loadFeaturesDb() {
  const dataPath = getFeaturesDataPath();
  if (cachedFeaturesDb && cachedFeaturesPath === dataPath) {
    return cachedFeaturesDb;
  }
  const { exists, data: parsed } = readJsonSafe(dataPath, "trial-features");
  cachedFeaturesDb = !exists || !parsed
    ? emptyFeaturesDb()
    : {
        tenants:
          parsed?.tenants && typeof parsed.tenants === "object" ? parsed.tenants : {},
      };
  cachedFeaturesPath = dataPath;
  return cachedFeaturesDb;
}

function saveFeaturesDb(db) {
  const dataPath = getFeaturesDataPath();
  cachedFeaturesDb = db;
  cachedFeaturesPath = dataPath;
  scheduleFeaturesFlush();
}

export function isValidFeatureKey(key) {
  return FEATURE_KEYS.includes(String(key || ""));
}

export function getEmptyFeature(key) {
  const k = String(key || "");
  if (!isValidFeatureKey(k)) return {};
  return structuredClone
    ? structuredClone(EMPTY_BY_KEY[k])
    : JSON.parse(JSON.stringify(EMPTY_BY_KEY[k]));
}

/**
 * @returns {{ key: string, data: object, updatedAt: string|null }}
 */
export function getTenantFeature(tenantId, key) {
  if (!tenantId || !isValidFeatureKey(key)) {
    const err = new Error("Invalid tenant or feature key");
    err.code = "invalid_feature_key";
    throw err;
  }
  const db = loadFeaturesDb();
  const tenant = db.tenants[tenantId] || {};
  const entry = tenant[key];
  if (!entry) {
    return { key, data: getEmptyFeature(key), updatedAt: null };
  }
  return {
    key,
    data: entry.data != null ? entry.data : getEmptyFeature(key),
    updatedAt: entry.updatedAt || null,
  };
}

/**
 * Replace feature blob for a tenant.
 * @returns {{ key: string, data: object, updatedAt: string }}
 */
export function putTenantFeature(tenantId, key, data) {
  if (!tenantId || !isValidFeatureKey(key)) {
    const err = new Error("Invalid tenant or feature key");
    err.code = "invalid_feature_key";
    throw err;
  }
  const db = loadFeaturesDb();
  if (!db.tenants[tenantId]) db.tenants[tenantId] = {};
  const updatedAt = new Date().toISOString();
  db.tenants[tenantId][key] = {
    data: data != null ? data : getEmptyFeature(key),
    updatedAt,
  };
  saveFeaturesDb(db);
  return { key, data: db.tenants[tenantId][key].data, updatedAt };
}

/**
 * Reset a feature to empty defaults.
 */
export function deleteTenantFeature(tenantId, key) {
  if (!tenantId || !isValidFeatureKey(key)) {
    const err = new Error("Invalid tenant or feature key");
    err.code = "invalid_feature_key";
    throw err;
  }
  const db = loadFeaturesDb();
  if (db.tenants[tenantId]?.[key]) {
    delete db.tenants[tenantId][key];
    saveFeaturesDb(db);
  }
  return { key, data: getEmptyFeature(key), updatedAt: null };
}

export function exportAllTenantFeatures(tenantId) {
  if (!tenantId) return {};
  const db = loadFeaturesDb();
  const tenant = db.tenants[tenantId] || {};
  const out = {};
  for (const key of FEATURE_KEYS) {
    if (tenant[key]) {
      out[key] = tenant[key];
    }
  }
  return out;
}

export function purgeTenantFeatures(tenantId) {
  if (!tenantId) return false;
  const db = loadFeaturesDb();
  if (db.tenants[tenantId]) {
    delete db.tenants[tenantId];
    saveFeaturesDb(db);
    return true;
  }
  return false;
}

export function getFeaturesStoragePath() {
  return getFeaturesDataPath();
}
