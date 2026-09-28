import { scopedStorageKey, isScopedStorageEventKey } from "../../../services/tenantScopedStorage.js";

const BASE_KEY = "juno_trial_team";
export const TEAM_CHANGED_EVENT = "juno-trial-team-changed";

const EMPTY = { members: [], trainings: [], assignments: [] };

function storageKey() {
  return scopedStorageKey(BASE_KEY);
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeAssignmentStatus(status) {
  const s = String(status || "").toLowerCase().replace(/\s+/g, "");
  if (s === "completed" || s === "complete") return "completed";
  if (s === "inprogress" || s === "in_progress") return "inProgress";
  return "pending";
}

function normalizeProgress(progress) {
  if (progress == null || progress === "") return "0%";
  const raw = String(progress).trim();
  if (raw.endsWith("%")) return raw;
  const n = Number(raw);
  if (Number.isFinite(n)) return `${Math.max(0, Math.min(100, Math.round(n)))}%`;
  return raw;
}

function readRaw() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return { members: [], trainings: [], assignments: [] };
    const parsed = JSON.parse(raw);
    return {
      members: Array.isArray(parsed?.members) ? parsed.members : [],
      trainings: Array.isArray(parsed?.trainings) ? parsed.trainings : [],
      assignments: Array.isArray(parsed?.assignments) ? parsed.assignments : [],
    };
  } catch {
    return { members: [], trainings: [], assignments: [] };
  }
}

function writeRaw(data) {
  const next = {
    members: Array.isArray(data?.members) ? data.members : [],
    trainings: Array.isArray(data?.trainings) ? data.trainings : [],
    assignments: Array.isArray(data?.assignments) ? data.assignments : [],
  };
  localStorage.setItem(storageKey(), JSON.stringify(next));
  try {
    window.dispatchEvent(new CustomEvent(TEAM_CHANGED_EVENT, { detail: next }));
  } catch {
    /* ignore */
  }
  return next;
}

export function getTeamData() {
  return readRaw();
}

export function listAssignments() {
  return readRaw().assignments.slice().sort((a, b) => {
    const da = Date.parse(a.deadline) || 0;
    const db = Date.parse(b.deadline) || 0;
    return da - db;
  });
}

export function listMembers() {
  return readRaw().members.slice();
}

export function listTrainings() {
  return readRaw().trainings.slice();
}

export function setTeamMembers(members) {
  const data = readRaw();
  data.members = Array.isArray(members) ? members : [];
  return writeRaw(data);
}

export function addTeamMember(input = {}) {
  const data = readRaw();
  const member = {
    id: input.id || newId("member"),
    name: String(input.name || "").trim() || "Team member",
    role: String(input.role || "").trim() || "Proposal Writer",
    email: String(input.email || "").trim(),
    phone: String(input.phone || "").trim(),
    skills: Array.isArray(input.skills)
      ? input.skills
      : String(input.skills || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
    projects: Array.isArray(input.projects)
      ? input.projects
      : String(input.projects || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
    status: String(input.status || "Active"),
    permissions: Array.isArray(input.permissions) ? input.permissions : [],
  };
  data.members = [member, ...data.members];
  return writeRaw(data);
}

export function updateTeamMember(id, patch = {}) {
  const data = readRaw();
  const idx = data.members.findIndex((m) => m.id === id);
  if (idx < 0) return data;
  const cur = data.members[idx];
  data.members[idx] = {
    ...cur,
    ...patch,
    id: cur.id,
    skills:
      patch.skills != null
        ? Array.isArray(patch.skills)
          ? patch.skills
          : String(patch.skills)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
        : cur.skills,
    projects:
      patch.projects != null
        ? Array.isArray(patch.projects)
          ? patch.projects
          : String(patch.projects)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
        : cur.projects,
    permissions: patch.permissions != null ? [...patch.permissions] : cur.permissions,
  };
  return writeRaw(data);
}

export function removeTeamMember(id) {
  const data = readRaw();
  data.members = data.members.filter((m) => m.id !== id);
  return writeRaw(data);
}

export function setTeamTrainings(trainings) {
  const data = readRaw();
  data.trainings = Array.isArray(trainings) ? trainings : [];
  return writeRaw(data);
}

export function addTeamTraining(input = {}) {
  const data = readRaw();
  const training = {
    id: input.id || newId("training"),
    training: String(input.training || "").trim() || "Training",
    status: String(input.status || "certified"),
  };
  data.trainings = [training, ...data.trainings];
  return writeRaw(data);
}

export function removeTeamTraining(id) {
  const data = readRaw();
  data.trainings = data.trainings.filter((t) => t.id !== id);
  return writeRaw(data);
}

export function addTeamAssignment(input = {}) {
  const data = readRaw();
  const deadline = String(input.deadline || "").trim();
  if (!deadline) {
    return { ok: false, error: "missing_deadline", data };
  }
  const assignment = {
    id: input.id || newId("assignment"),
    task: String(input.task || "").trim() || "Untitled assignment",
    assigned: String(input.assigned || "").trim() || "Unassigned",
    status: normalizeAssignmentStatus(input.status),
    progress: normalizeProgress(input.progress),
    deadline,
  };
  data.assignments = [assignment, ...data.assignments];
  writeRaw(data);
  return { ok: true, data };
}

export function updateTeamAssignment(id, patch = {}) {
  const data = readRaw();
  const idx = data.assignments.findIndex((a) => a.id === id || `assignment_${a.id}` === id);
  if (idx < 0) return data;
  const cur = data.assignments[idx];
  data.assignments[idx] = {
    ...cur,
    task: patch.task != null ? String(patch.task).trim() || cur.task : cur.task,
    assigned: patch.assigned != null ? String(patch.assigned).trim() || cur.assigned : cur.assigned,
    status: patch.status != null ? normalizeAssignmentStatus(patch.status) : cur.status,
    progress: patch.progress != null ? normalizeProgress(patch.progress) : cur.progress,
    deadline: patch.deadline != null ? String(patch.deadline).trim() || cur.deadline : cur.deadline,
  };
  return writeRaw(data);
}

export function removeTeamAssignment(id) {
  const data = readRaw();
  data.assignments = data.assignments.filter(
    (a) => a.id !== id && `assignment_${a.id}` !== id,
  );
  return writeRaw(data);
}

/** Subscribe to team changes (same tab + cross-tab storage). Returns unsubscribe. */
export function subscribeTeam(onChange) {
  const handleCustom = () => onChange(getTeamData());
  const handleStorage = (e) => {
    if (!isScopedStorageEventKey(e.key, BASE_KEY)) return;
    onChange(getTeamData());
  };
  window.addEventListener(TEAM_CHANGED_EVENT, handleCustom);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(TEAM_CHANGED_EVENT, handleCustom);
    window.removeEventListener("storage", handleStorage);
  };
}
