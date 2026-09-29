import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { store } from "./store.js";
import { putTenantFeature, getTenantFeature, getFeaturesStoragePath } from "../trial/featureStore.js";
import { getTrialDataPath } from "../trial/tenantStore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEGACY_STATE_FILE = path.join(__dirname, "..", "data", "collaboration-runtime-state.json");

let persistTimer = null;
let featureMirrorTimer = null;
let exitHookRegistered = false;

function getStateFile() {
  // Prefer same directory as trial-tenants.json so Render Persistent Disk keeps collab too.
  try {
    return path.join(path.dirname(getTrialDataPath()), "collaboration-runtime-state.json");
  } catch {
    return LEGACY_STATE_FILE;
  }
}

function persistNow() {
  try {
    const stateFile = getStateFile();
    const dir = path.dirname(stateFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const payload = {
      version: 1,
      savedAt: new Date().toISOString(),
      users: Object.fromEntries(store.usersById),
      workspaces: Object.fromEntries(store.workspaces),
      questions: Object.fromEntries(store.questions),
      messages: store.messages,
      logs: store.logs,
      quarterlyByWorkspace: Object.fromEntries(store.quarterlyByWorkspace),
    };
    const tmp = `${stateFile}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(payload), "utf8");
    fs.renameSync(tmp, stateFile);
  } catch (e) {
    console.warn("COLLABORATION PERSIST: save failed", e?.message || e);
  }
}

function buildTrialCollabSnapshot(pmUserId, tenantKey) {
  const workspaces = [...store.workspaces.values()]
    .filter((w) => w.createdBy === pmUserId)
    .map((w) => {
      const questions = [...store.questions.values()]
        .filter((q) => q.workspaceId === w.id)
        .sort((a, b) => a.number - b.number)
        .map((q) => ({
          id: q.id,
          number: q.number,
          text: String(q.text || "").slice(0, 2000),
          status: q.status,
          assignedTo: q.assignedTo || null,
          assigneeEmail: store.usersById.get(q.assignedTo)?.email || null,
          answerDraft: String(q.answerDraft || "").slice(0, 20_000),
          submittedAnswer: q.submittedAnswer
            ? String(q.submittedAnswer).slice(0, 20_000)
            : null,
          pmReviewComment: q.pmReviewComment || null,
          updatedAt: q.updatedAt || null,
        }));
      return {
        id: w.id,
        title: w.title,
        createdAt: w.createdAt,
        documentText: String(w.documentText || "").slice(0, 100_000),
        questionCount: questions.length,
        questions,
      };
    });

  const workspaceIds = new Set(workspaces.map((w) => w.id));
  const messages = (store.messages || []).filter((m) => workspaceIds.has(m.workspaceId));
  const logs = (store.logs || [])
    .filter((l) => workspaceIds.has(l.workspaceId))
    .slice(-500);

  return {
    tenantId: tenantKey,
    pmUserId,
    workspaces,
    messages: messages.slice(-1000),
    logs,
    updatedAt: new Date().toISOString(),
  };
}

function existingFeatureHasWorkspaces(tenantKey) {
  try {
    const feature = getTenantFeature(tenantKey, "teamCollab");
    return Array.isArray(feature?.data?.workspaces) && feature.data.workspaces.length > 0;
  } catch {
    return false;
  }
}

/** Mirror each trial tenant's collab progress into company-wide trial feature store. */
function mirrorTrialCollabFeaturesNow() {
  try {
    const trialPms = [...store.usersById.values()].filter(
      (u) => u.role === "proposal_manager" && String(u.id || "").startsWith("user_pm_trial_"),
    );
    for (const pm of trialPms) {
      const tenantKey = pm.rawTenantId || pm.tenantId;
      if (!tenantKey) continue;
      const snapshot = buildTrialCollabSnapshot(pm.id, tenantKey);
      // Never wipe a durable non-empty backup with an empty in-memory snapshot
      if (!snapshot.workspaces.length && existingFeatureHasWorkspaces(tenantKey)) {
        continue;
      }
      putTenantFeature(tenantKey, "teamCollab", snapshot);
      if (pm.tenantId && pm.tenantId !== tenantKey) {
        try {
          if (!snapshot.workspaces.length && existingFeatureHasWorkspaces(pm.tenantId)) {
            /* skip */
          } else {
            putTenantFeature(pm.tenantId, "teamCollab", snapshot);
          }
        } catch {
          /* ignore */
        }
      }
    }
  } catch (e) {
    console.warn("COLLABORATION FEATURE MIRROR: failed", e?.message || e);
  }
}

/** Debounced save so bursts of updates write once. */
export function scheduleCollaborationPersist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persistNow();
    scheduleTrialCollabFeatureMirror();
  }, 400);
}

/** Debounced company-wide trial feature mirror (teamCollab key). */
export function scheduleTrialCollabFeatureMirror() {
  if (featureMirrorTimer) clearTimeout(featureMirrorTimer);
  featureMirrorTimer = setTimeout(() => {
    featureMirrorTimer = null;
    mirrorTrialCollabFeaturesNow();
  }, 800);
}

export function flushCollaborationPersist() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  if (featureMirrorTimer) {
    clearTimeout(featureMirrorTimer);
    featureMirrorTimer = null;
  }
  persistNow();
  mirrorTrialCollabFeaturesNow();
}

/**
 * Persist progress immediately (disk + company trial feature mirror).
 * Use after create / assign / submit / review.
 */
export function persistCollaborationProgressNow() {
  flushCollaborationPersist();
}

function loadLegacyIfNeeded(stateFile) {
  if (fs.existsSync(stateFile)) return;
  if (stateFile === LEGACY_STATE_FILE) return;
  if (!fs.existsSync(LEGACY_STATE_FILE)) return;
  try {
    const dir = path.dirname(stateFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(LEGACY_STATE_FILE, stateFile);
    console.log("COLLABORATION PERSIST: migrated legacy state file to persistent disk path");
  } catch (e) {
    console.warn("COLLABORATION PERSIST: legacy migrate failed", e?.message || e);
  }
}

export function loadCollaborationState() {
  try {
    const stateFile = getStateFile();
    loadLegacyIfNeeded(stateFile);
    if (!fs.existsSync(stateFile)) return;
    const raw = JSON.parse(fs.readFileSync(stateFile, "utf8"));
    if (raw.version !== 1) return;

    store.workspaces = new Map(Object.entries(raw.workspaces || {}));
    store.questions = new Map(Object.entries(raw.questions || {}));
    store.messages = Array.isArray(raw.messages) ? raw.messages : [];
    store.logs = Array.isArray(raw.logs) ? raw.logs : [];

    const users = raw.users && typeof raw.users === "object" ? raw.users : {};
    for (const u of Object.values(users)) {
      if (!u?.id || !u?.email) continue;
      store.usersById.set(u.id, u);
      store.usersByEmail.set(String(u.email).toLowerCase(), u.id);
    }

    const qbw = raw.quarterlyByWorkspace || {};
    store.quarterlyByWorkspace = new Map(
      Object.entries(qbw).map(([k, v]) => [k, Array.isArray(v) ? v : []]),
    );

    console.log(
      `COLLABORATION PERSIST: loaded ${store.workspaces.size} workspace(s), ${store.questions.size} question(s) from disk`,
    );
  } catch (e) {
    console.warn("COLLABORATION PERSIST: load failed", e?.message || e);
  }
}

function listTeamCollabTenantKeys() {
  try {
    const featuresPath = getFeaturesStoragePath();
    if (!fs.existsSync(featuresPath)) return [];
    const parsed = JSON.parse(fs.readFileSync(featuresPath, "utf8"));
    const tenants = parsed?.tenants && typeof parsed.tenants === "object" ? parsed.tenants : {};
    return Object.keys(tenants).filter((tid) => {
      const blob = tenants[tid]?.teamCollab?.data;
      return Array.isArray(blob?.workspaces) && blob.workspaces.length > 0;
    });
  } catch {
    return [];
  }
}

function importFeatureSnapshot(pm, feature) {
  const workspaces = Array.isArray(feature?.data?.workspaces) ? feature.data.workspaces : [];
  if (!workspaces.length) return 0;

  for (const w of workspaces) {
    if (!w?.id || store.workspaces.has(w.id)) continue;
    store.workspaces.set(w.id, {
      id: w.id,
      title: w.title || "Untitled RFP",
      documentText: w.documentText || "",
      createdBy: pm.id,
      createdAt: w.createdAt || new Date().toISOString(),
    });
    for (const q of w.questions || []) {
      if (!q?.id || store.questions.has(q.id)) continue;
      store.questions.set(q.id, {
        id: q.id,
        workspaceId: w.id,
        number: q.number || 1,
        text: q.text || "",
        status: q.status || "unassigned",
        assignedTo: q.assignedTo || null,
        assigneeEmail: q.assigneeEmail || null,
        answerDraft: q.answerDraft || "",
        submittedAnswer: q.submittedAnswer || null,
        pmReviewComment: q.pmReviewComment || null,
        updatedAt: q.updatedAt || new Date().toISOString(),
      });
    }
  }

  for (const m of feature?.data?.messages || []) {
    if (m?.id && !(store.messages || []).some((x) => x.id === m.id)) {
      store.messages.push(m);
    }
  }
  for (const l of feature?.data?.logs || []) {
    store.logs.push(l);
  }
  return workspaces.length;
}

/**
 * If disk lost a trial tenant's workspaces, restore from company teamCollab feature blob.
 * Also discovers tenants from feature store when no trial PM exists yet in memory.
 * @param {{ ensurePm?: Function, ensureAuditor?: Function }} [hooks]
 */
export function hydrateTrialCollabFromFeatureStore(hooks = {}) {
  try {
    const { ensurePm, ensureAuditor } = hooks;
    const tenantKeys = new Set(listTeamCollabTenantKeys());

    // Existing in-memory trial PMs
    for (const pm of store.usersById.values()) {
      if (pm.role !== "proposal_manager" || !String(pm.id || "").startsWith("user_pm_trial_")) continue;
      const tenantKey = pm.rawTenantId || pm.tenantId;
      if (tenantKey) tenantKeys.add(tenantKey);
    }

    for (const tenantKey of tenantKeys) {
      let pm =
        [...store.usersById.values()].find(
          (u) =>
            u.role === "proposal_manager" &&
            String(u.id || "").startsWith("user_pm_trial_") &&
            (u.rawTenantId === tenantKey || u.tenantId === tenantKey),
        ) || null;

      if (!pm && typeof ensurePm === "function") {
        const out = ensurePm({ tenantId: tenantKey, name: "Proposal Manager" });
        pm = store.usersById.get(out?.user?.id || out?.token) || null;
      }
      if (!pm) continue;

      const existingCount = [...store.workspaces.values()].filter((w) => w.createdBy === pm.id).length;
      if (existingCount > 0) continue;

      let feature;
      try {
        feature = getTenantFeature(tenantKey, "teamCollab");
      } catch {
        continue;
      }
      const restored = importFeatureSnapshot(pm, feature);
      if (!restored) continue;

      // Rehydrate auditors from assignee emails / ids
      if (typeof ensureAuditor === "function") {
        for (const w of feature?.data?.workspaces || []) {
          for (const q of w.questions || []) {
            const email = q.assigneeEmail || store.usersById.get(q.assignedTo)?.email;
            if (!email || String(email).endsWith("@restored.local")) continue;
            ensureAuditor({
              tenantId: tenantKey,
              email,
              name: store.usersById.get(q.assignedTo)?.name || email.split("@")[0],
            });
          }
        }
      }

      console.log(
        `COLLABORATION PERSIST: restored trial teamCollab for tenant ${tenantKey} (${restored} workspace(s))`,
      );
      persistNow();
    }
  } catch (e) {
    console.warn("COLLABORATION FEATURE HYDRATE: failed", e?.message || e);
  }
}

/**
 * Restore workspaces for one tenant PM if empty (call from trialSession).
 */
export function hydrateTrialCollabForTenant(tenantId, hooks = {}) {
  if (!tenantId) return;
  try {
    const { ensurePm, ensureAuditor } = hooks;
    let pm =
      [...store.usersById.values()].find(
        (u) =>
          u.role === "proposal_manager" &&
          String(u.id || "").startsWith("user_pm_trial_") &&
          (u.rawTenantId === tenantId || u.tenantId === String(tenantId).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64)),
      ) || null;
    if (!pm && typeof ensurePm === "function") {
      const out = ensurePm({ tenantId, name: "Proposal Manager" });
      pm = store.usersById.get(out?.user?.id || out?.token) || null;
    }
    if (!pm) return;
    const existingCount = [...store.workspaces.values()].filter((w) => w.createdBy === pm.id).length;
    if (existingCount > 0) return;

    let feature;
    try {
      feature = getTenantFeature(tenantId, "teamCollab");
    } catch {
      return;
    }
    const restored = importFeatureSnapshot(pm, feature);
    if (!restored) return;
    if (typeof ensureAuditor === "function") {
      for (const w of feature?.data?.workspaces || []) {
        for (const q of w.questions || []) {
          const email = q.assigneeEmail || store.usersById.get(q.assignedTo)?.email;
          if (!email || String(email).endsWith("@restored.local")) continue;
          ensureAuditor({ tenantId, email, name: email.split("@")[0] });
        }
      }
    }
    persistNow();
  } catch (e) {
    console.warn("COLLABORATION FEATURE HYDRATE (tenant): failed", e?.message || e);
  }
}

export function registerCollaborationPersistOnExit() {
  if (exitHookRegistered) return;
  exitHookRegistered = true;
  const onExit = () => flushCollaborationPersist();
  process.once("SIGINT", onExit);
  process.once("SIGTERM", onExit);
  process.once("beforeExit", onExit);
}
