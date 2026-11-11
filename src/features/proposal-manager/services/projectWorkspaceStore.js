/**
 * Tenant-scoped project workspace (projects, tasks, status updates) for trial / walkthrough.
 * Starts empty (fresh) and grows as the user creates projects and tasks.
 * Demo login never writes here — it uses static demo data (projectWorkspaceDemoData.js).
 */

import { scopedStorageKey, isScopedStorageEventKey } from "../../../services/tenantScopedStorage.js";
import {
  canUseTrialFeatures,
  loadTrialFeatureData,
  persistTrialFeatureData,
} from "../../../services/trialFeatureApi.js";
import { clampPct } from "./grantPulse.js";

const BASE_KEY = "juno_project_workspace";
export const PROJECT_WORKSPACE_CHANGED_EVENT = "juno-project-workspace-changed";
export const TRIAL_FEATURE_KEY = "projectWorkspace";

export const TASK_STATUSES = ["backlog", "todo", "doing", "review", "done"];
export const TASK_PRIORITIES = ["low", "med", "high", "urgent"];
export const PROJECT_KINDS = ["Award", "Proposal"];
export const UPDATE_RAGS = ["g", "y", "r"];

/** @typedef {{
 *  id: string,
 *  name: string,
 *  funder: string,
 *  amount: number,
 *  budget: number,
 *  start: string,
 *  end: string,
 *  spent: number,
 *  done: number,
 *  color: string,
 *  kind: "Award" | "Proposal",
 *  pm: string,
 * }} WorkspaceProject */

/** @typedef {{
 *  id: string,
 *  p: string,
 *  title: string,
 *  status: "backlog" | "todo" | "doing" | "review" | "done",
 *  owner: string,
 *  pri: "low" | "med" | "high" | "urgent",
 *  start: string,
 *  due: string,
 *  est: number,
 *  clause: string,
 *  line: string,
 *  deps: string[],
 *  sub: { t: string, d: boolean }[],
 *  comments: { w: string, x: string, d: number | string }[],
 *  ms?: boolean,
 *  bStart: string,
 *  bDue: string,
 *  base: boolean,
 * }} WorkspaceTask */

/** @typedef {{ id: string, p: string, rag: "g" | "y" | "r", w: string, d: string, t: string }} WorkspaceUpdate */

const EMPTY = { projects: [], tasks: [], updates: [], freshReset: true };

function emptyBlob() {
  return { projects: [], tasks: [], updates: [], freshReset: true };
}

function storageKey() {
  return scopedStorageKey(BASE_KEY);
}

export function newWorkspaceId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function isoDay(value) {
  return value ? String(value).slice(0, 10) : "";
}

export function normalizeProject(raw = {}) {
  return {
    id: String(raw.id || newWorkspaceId("proj")),
    name: String(raw.name || "").trim() || "Untitled project",
    funder: String(raw.funder || "").trim(),
    amount: Math.max(0, Math.round(Number(raw.amount) || 0)),
    budget: Math.max(0, Math.round(Number(raw.budget) || 0)),
    start: isoDay(raw.start),
    end: isoDay(raw.end),
    spent: clampPct(raw.spent),
    done: clampPct(raw.done),
    color: String(raw.color || "").trim() || "#4F6BFF",
    kind: raw.kind === "Proposal" ? "Proposal" : "Award",
    pm: String(raw.pm || "").trim(),
  };
}

function normalizeSub(raw = {}) {
  return { t: String(raw.t || "").trim(), d: Boolean(raw.d) };
}

function normalizeComment(raw = {}) {
  return {
    w: String(raw.w || "").trim(),
    x: String(raw.x || "").trim(),
    d: typeof raw.d === "number" ? raw.d : isoDay(raw.d),
  };
}

export function normalizeTask(raw = {}) {
  const start = isoDay(raw.start);
  const due = isoDay(raw.due);
  const est = Number(raw.est);
  const task = {
    id: String(raw.id || newWorkspaceId("task")),
    p: String(raw.p || ""),
    title: String(raw.title || "").trim() || "Untitled task",
    status: TASK_STATUSES.includes(raw.status) ? raw.status : "todo",
    owner: String(raw.owner || "").trim(),
    pri: TASK_PRIORITIES.includes(raw.pri) ? raw.pri : "med",
    start,
    due,
    est: Number.isFinite(est) && est > 0 ? Math.round(est * 10) / 10 : 0,
    clause: String(raw.clause || "").trim(),
    line: String(raw.line || "").trim(),
    deps: Array.isArray(raw.deps) ? raw.deps.map(String).filter(Boolean) : [],
    sub: Array.isArray(raw.sub) ? raw.sub.map(normalizeSub).filter((s) => s.t) : [],
    comments: Array.isArray(raw.comments)
      ? raw.comments.map(normalizeComment).filter((c) => c.x)
      : [],
    bStart: isoDay(raw.bStart) || start,
    bDue: isoDay(raw.bDue) || due,
    base: raw.base !== false,
  };
  if (raw.ms) task.ms = true;
  return task;
}

export function normalizeUpdate(raw = {}) {
  return {
    id: String(raw.id || newWorkspaceId("upd")),
    p: String(raw.p || ""),
    rag: UPDATE_RAGS.includes(raw.rag) ? raw.rag : "g",
    w: String(raw.w || "").trim(),
    d: isoDay(raw.d) || new Date().toISOString().slice(0, 10),
    t: String(raw.t || "").trim(),
  };
}

function isSeedId(id) {
  const s = String(id || "");
  return s.startsWith("seed-") || s.startsWith("demo-");
}

function stripSeed(blob) {
  const projects = blob.projects.filter((p) => !isSeedId(p.id));
  const ids = new Set(projects.map((p) => p.id));
  return {
    projects,
    tasks: blob.tasks.filter((t) => !isSeedId(t.id) && ids.has(t.p)),
    updates: blob.updates.filter((u) => !isSeedId(u.id) && ids.has(u.p)),
  };
}

function hasSeedRows(blob) {
  return (
    blob.projects.some((p) => isSeedId(p.id)) ||
    blob.tasks.some((t) => isSeedId(t.id)) ||
    blob.updates.some((u) => isSeedId(u.id))
  );
}

function normalizeBlob(data) {
  const projects = Array.isArray(data?.projects) ? data.projects.map(normalizeProject) : [];
  const tasks = Array.isArray(data?.tasks) ? data.tasks.map(normalizeTask) : [];
  const updates = Array.isArray(data?.updates) ? data.updates.map(normalizeUpdate) : [];
  return {
    projects,
    tasks,
    updates,
    freshReset: Boolean(data?.freshReset) || projects.length === 0,
  };
}

function readRaw() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return emptyBlob();
    return normalizeBlob(JSON.parse(raw));
  } catch {
    return emptyBlob();
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
    console.warn("[project-workspace] localStorage write failed:", err?.message || err);
  }
  try {
    window.dispatchEvent(new CustomEvent(PROJECT_WORKSPACE_CHANGED_EVENT, { detail: next }));
  } catch {
    /* ignore */
  }
  void persistCompanyWide(next);
  return next;
}

export function getProjectWorkspaceData() {
  return readRaw();
}

/**
 * One-time: strip demo-/seed- rows so trial/walkthrough start empty.
 * Keeps user-created projects, tasks, and updates.
 */
export function ensureProjectWorkspaceFresh() {
  const data = readRaw();
  if (data.freshReset && !hasSeedRows(data)) {
    return data;
  }
  if (hasSeedRows(data)) {
    return writeRaw({ ...stripSeed(data), freshReset: true });
  }
  return writeRaw({ ...data, freshReset: true });
}

/* ───────── Projects ───────── */

export function addProject(input = {}) {
  const data = ensureProjectWorkspaceFresh();
  const project = normalizeProject({
    ...input,
    id: newWorkspaceId("proj"),
    spent: input.spent != null ? input.spent : 0,
    done: input.done != null ? input.done : 0,
  });
  data.projects = [project, ...data.projects];
  data.freshReset = true;
  const next = writeRaw(data);
  return { ...next, created: project };
}

export function updateProject(id, patch = {}) {
  const data = readRaw();
  const idx = data.projects.findIndex((p) => p.id === id);
  if (idx < 0) return data;
  const cur = data.projects[idx];
  data.projects[idx] = normalizeProject({ ...cur, ...patch, id: cur.id });
  data.freshReset = true;
  return writeRaw(data);
}

export function removeProject(id) {
  const data = readRaw();
  data.projects = data.projects.filter((p) => p.id !== id);
  data.tasks = data.tasks.filter((t) => t.p !== id);
  data.updates = data.updates.filter((u) => u.p !== id);
  data.freshReset = true;
  return writeRaw(data);
}

/* ───────── Tasks ───────── */

export function addTask(input = {}) {
  const data = ensureProjectWorkspaceFresh();
  if (!data.projects.some((p) => p.id === input.p)) return data;
  const task = normalizeTask({ ...input, id: newWorkspaceId("task") });
  data.tasks = [...data.tasks, task];
  data.freshReset = true;
  const next = writeRaw(data);
  return { ...next, created: task };
}

export function updateTask(id, patch = {}) {
  const data = readRaw();
  const idx = data.tasks.findIndex((t) => t.id === id);
  if (idx < 0) return data;
  const cur = data.tasks[idx];
  data.tasks[idx] = normalizeTask({ ...cur, ...patch, id: cur.id, p: cur.p });
  data.freshReset = true;
  return writeRaw(data);
}

export function removeTask(id) {
  const data = readRaw();
  data.tasks = data.tasks
    .filter((t) => t.id !== id)
    .map((t) => (t.deps.includes(id) ? { ...t, deps: t.deps.filter((d) => d !== id) } : t));
  data.freshReset = true;
  return writeRaw(data);
}

/* ───────── Status updates ───────── */

export function addUpdate(input = {}) {
  const data = ensureProjectWorkspaceFresh();
  if (!data.projects.some((p) => p.id === input.p)) return data;
  const update = normalizeUpdate({ ...input, id: newWorkspaceId("upd") });
  if (!update.t) return data;
  data.updates = [update, ...data.updates];
  data.freshReset = true;
  return writeRaw(data);
}

/* ───────── Server hydrate + subscribe ───────── */

export async function hydrateProjectWorkspaceFromServer(opts = {}) {
  const notify = opts.notify !== false;
  if (!canUseTrialFeatures()) return ensureProjectWorkspaceFresh();
  try {
    const remote = await loadTrialFeatureData(TRIAL_FEATURE_KEY, EMPTY);
    let next = normalizeBlob(remote);
    if (hasSeedRows(next)) {
      next = { ...stripSeed(next), freshReset: true };
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
          window.dispatchEvent(new CustomEvent(PROJECT_WORKSPACE_CHANGED_EVENT, { detail: next }));
        } catch {
          /* ignore */
        }
      }
    }
    return ensureProjectWorkspaceFresh();
  } catch {
    return ensureProjectWorkspaceFresh();
  }
}

export function subscribeProjectWorkspace(handler) {
  const onCustom = () => handler(getProjectWorkspaceData());
  const onStorage = (e) => {
    if (!isScopedStorageEventKey(e.key, BASE_KEY)) return;
    handler(getProjectWorkspaceData());
  };
  window.addEventListener(PROJECT_WORKSPACE_CHANGED_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(PROJECT_WORKSPACE_CHANGED_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
