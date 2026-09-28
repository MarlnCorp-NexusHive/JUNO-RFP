import fs from "fs";
import path from "path";
import { getTrialDataPath } from "./tenantStore.js";

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
];

const EMPTY_BY_KEY = {
  workspace: { folders: [], documents: [] },
  sourceDocs: { docs: [], nameOverrides: {} },
  contentHub: { qaLibrary: [] },
  techSolutioning: { assets: [], patterns: [], designs: [], settings: {} },
  scoring: { records: [] },
  winSlide: { slides: [], settings: {} },
  userManagement: { users: [] },
  communication: { channels: [], messages: [] },
  pricing: { laborRates: [], volumes: [], trends: [] },
  bidVault: { submissions: [], winLoss: [], pipeline: [] },
  teamCollab: { workspaces: [] },
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

function loadFeaturesDb() {
  const dataPath = getFeaturesDataPath();
  try {
    if (!fs.existsSync(dataPath)) return emptyFeaturesDb();
    const raw = fs.readFileSync(dataPath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      tenants:
        parsed?.tenants && typeof parsed.tenants === "object" ? parsed.tenants : {},
    };
  } catch (err) {
    console.warn("[trial-features] failed to load:", dataPath, err.message);
    return emptyFeaturesDb();
  }
}

function saveFeaturesDb(db) {
  const dataPath = getFeaturesDataPath();
  ensureDir();
  const payload = JSON.stringify(db, null, 2);
  const tmp = `${dataPath}.tmp`;
  const fd = fs.openSync(tmp, "w");
  try {
    fs.writeFileSync(fd, payload, "utf8");
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmp, dataPath);
  try {
    const dirFd = fs.openSync(path.dirname(dataPath), "r");
    try {
      fs.fsyncSync(dirFd);
    } finally {
      fs.closeSync(dirFd);
    }
  } catch {
    /* best-effort */
  }
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

export function getFeaturesStoragePath() {
  return getFeaturesDataPath();
}
