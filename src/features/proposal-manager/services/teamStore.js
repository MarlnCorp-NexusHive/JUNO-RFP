import { scopedStorageKey, isScopedStorageEventKey } from "../../../services/tenantScopedStorage.js";
import {
  canUseTrialFeatures,
  loadTrialFeatureData,
  persistTrialFeatureData,
} from "../../../services/trialFeatureApi.js";
import { calendarApi } from "../../../services/calendarApi.js";
import { parseDateToISO } from "./calendarDateParse.js";
import { getTrialSession } from "../../../services/trialAuthSession.js";
import { parseLocalStorageJson } from "../../../utils/safeStorage.js";

const BASE_KEY = "juno_trial_team";
export const TEAM_CHANGED_EVENT = "juno-trial-team-changed";

const ASSIGNMENT_DEADLINE_COLOR = "#2563eb";

const EMPTY = { members: [], trainings: [], assignments: [], updatedAt: null };

function storageKey() {
  return scopedStorageKey(BASE_KEY);
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeSkillsOrProjects(value, fallback = []) {
  if (Array.isArray(value)) return value.map((s) => String(s).trim()).filter(Boolean);
  if (value == null || value === "") return Array.isArray(fallback) ? [...fallback] : [];
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeMember(input = {}) {
  const performanceRaw = Number(input.performance);
  return {
    id: input.id || newId("member"),
    name: String(input.name || "").trim() || "Team member",
    role: String(input.role || "").trim() || "Proposal Writer",
    email: String(input.email || "").trim(),
    phone: String(input.phone || "").trim(),
    skills: normalizeSkillsOrProjects(input.skills),
    projects: normalizeSkillsOrProjects(input.projects),
    status: String(input.status || "Active"),
    permissions: Array.isArray(input.permissions) ? [...input.permissions] : [],
    avatar: String(input.avatar || "👤"),
    performance: Number.isFinite(performanceRaw)
      ? Math.max(0, Math.min(100, Math.round(performanceRaw)))
      : 80,
  };
}

function normalizeTraining(input = {}) {
  return {
    id: input.id || newId("training"),
    training: String(input.training || input.name || "").trim() || "Training",
    status: String(input.status || "certified"),
  };
}

function normalizeBlob(data) {
  return {
    members: Array.isArray(data?.members) ? data.members.map((m) => normalizeMember(m)) : [],
    trainings: Array.isArray(data?.trainings) ? data.trainings.map((t) => normalizeTraining(t)) : [],
    assignments: Array.isArray(data?.assignments) ? data.assignments : [],
    updatedAt: data?.updatedAt ? String(data.updatedAt) : null,
  };
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
    if (!raw) return { ...EMPTY, members: [], trainings: [], assignments: [] };
    return normalizeBlob(JSON.parse(raw));
  } catch {
    return { ...EMPTY, members: [], trainings: [], assignments: [] };
  }
}

function writeRaw(data) {
  const next = normalizeBlob(data);
  next.updatedAt = new Date().toISOString();
  localStorage.setItem(storageKey(), JSON.stringify(next));
  try {
    window.dispatchEvent(new CustomEvent(TEAM_CHANGED_EVENT, { detail: next }));
  } catch {
    /* ignore */
  }
  void persistTeamCompanyWide(next);
  return next;
}

async function persistTeamCompanyWide(data) {
  if (!canUseTrialFeatures()) return null;
  try {
    return await persistTrialFeatureData("manageTeam", {
      members: data.members || [],
      trainings: data.trainings || [],
      assignments: data.assignments || [],
      updatedAt: data.updatedAt || new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[team] company-wide persist failed:", err?.message || err);
    return null;
  }
}

export function assignmentEventId(id) {
  return `assignment_${String(id || "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 120)}`;
}

function resolveAssigneeFields(input, members = []) {
  const assigned = String(input.assigned || "").trim();
  let assignedEmail = String(input.assignedEmail || "").trim();
  if (!assignedEmail && assigned) {
    const match = members.find(
      (m) =>
        String(m.name || "").trim().toLowerCase() === assigned.toLowerCase() ||
        String(m.email || "").trim().toLowerCase() === assigned.toLowerCase(),
    );
    if (match?.email) assignedEmail = String(match.email).trim();
    if (match?.name && !assigned) return { assigned: String(match.name).trim(), assignedEmail };
  }
  return { assigned: assigned || "Unassigned", assignedEmail };
}

/** Push or remove an assignment deadline on the shared tenant calendar. */
export async function syncAssignmentDeadlineToCalendar(item, present) {
  if (!canUseTrialFeatures() || !item?.id) return;
  const eventId = assignmentEventId(item.id);
  if (!present) {
    try {
      await calendarApi.deleteEvent(eventId);
    } catch {
      /* already gone */
    }
    return;
  }
  const iso = parseDateToISO(item.deadline);
  if (!iso) return;
  const body = {
    id: eventId,
    title: `Assignment: ${item.task || "Task"}`,
    start: iso,
    end: null,
    allDay: true,
    type: "deadline",
    source: "assignment",
    assignmentId: String(item.id),
    bidName: item.assigned || item.task || null,
    description: [item.assigned, item.assignedEmail, item.status, item.progress]
      .filter(Boolean)
      .join(" · "),
    assigneeNames: item.assigned ? [item.assigned] : [],
    color: ASSIGNMENT_DEADLINE_COLOR,
    status: item.status || null,
  };
  try {
    await calendarApi.updateEvent(eventId, body);
  } catch {
    try {
      await calendarApi.createEvent(body);
    } catch (err) {
      console.warn("[team] calendar sync failed:", err?.message || err);
    }
  }
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

/** Current trial / RBAC user identity for personal alert filtering. */
export function getCurrentUserIdentity() {
  const session = getTrialSession();
  const rbac = parseLocalStorageJson("rbac_current_user") || {};
  return {
    name: String(session?.user?.name || rbac?.name || "").trim(),
    email: String(session?.user?.email || rbac?.email || "").trim().toLowerCase(),
  };
}

/** True when an assignment is for the signed-in user (name or email). */
export function assignmentBelongsToCurrentUser(item, identity = getCurrentUserIdentity()) {
  if (!item) return false;
  const myName = String(identity?.name || "")
    .trim()
    .toLowerCase();
  const myEmail = String(identity?.email || "")
    .trim()
    .toLowerCase();
  const assigned = String(item.assigned || "")
    .trim()
    .toLowerCase();
  const assignedEmail = String(item.assignedEmail || "")
    .trim()
    .toLowerCase();
  if (myEmail && assignedEmail && myEmail === assignedEmail) return true;
  if (myName && assigned && myName === assigned) return true;
  if (myEmail && assigned && myEmail === assigned) return true;
  return false;
}

/** Assignments for the current user (dashboard alerts). */
export function listMyAssignments() {
  const me = getCurrentUserIdentity();
  return listAssignments().filter((a) => assignmentBelongsToCurrentUser(a, me));
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
  const member = normalizeMember(input);
  data.members = [member, ...data.members];
  return writeRaw(data);
}

export function updateTeamMember(id, patch = {}) {
  const data = readRaw();
  const idx = data.members.findIndex((m) => m.id === id);
  if (idx < 0) return data;
  const cur = data.members[idx];
  data.members[idx] = normalizeMember({
    ...cur,
    ...patch,
    id: cur.id,
    skills: patch.skills != null ? patch.skills : cur.skills,
    projects: patch.projects != null ? patch.projects : cur.projects,
    permissions: patch.permissions != null ? patch.permissions : cur.permissions,
  });
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
  const training = normalizeTraining(input);
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
  if (!parseDateToISO(deadline)) {
    return { ok: false, error: "missing_deadline", data };
  }
  const { assigned, assignedEmail } = resolveAssigneeFields(input, data.members);
  const assignment = {
    id: input.id || newId("assignment"),
    task: String(input.task || "").trim() || "Untitled assignment",
    assigned,
    assignedEmail,
    status: normalizeAssignmentStatus(input.status),
    progress: normalizeProgress(input.progress),
    deadline,
  };
  data.assignments = [assignment, ...data.assignments];
  writeRaw(data);
  void syncAssignmentDeadlineToCalendar(assignment, true);
  return { ok: true, data: readRaw() };
}

export function updateTeamAssignment(id, patch = {}) {
  const data = readRaw();
  const idx = data.assignments.findIndex(
    (a) => a.id === id || `assignment_${a.id}` === id || assignmentEventId(a.id) === id,
  );
  if (idx < 0) return data;
  const cur = data.assignments[idx];
  const nextAssigned =
    patch.assigned != null ? String(patch.assigned).trim() || cur.assigned : cur.assigned;
  const resolved = resolveAssigneeFields(
    {
      assigned: nextAssigned,
      assignedEmail: patch.assignedEmail != null ? patch.assignedEmail : cur.assignedEmail,
    },
    data.members,
  );
  data.assignments[idx] = {
    ...cur,
    task: patch.task != null ? String(patch.task).trim() || cur.task : cur.task,
    assigned: resolved.assigned,
    assignedEmail: resolved.assignedEmail,
    status: patch.status != null ? normalizeAssignmentStatus(patch.status) : cur.status,
    progress: patch.progress != null ? normalizeProgress(patch.progress) : cur.progress,
    deadline: patch.deadline != null ? String(patch.deadline).trim() || cur.deadline : cur.deadline,
  };
  writeRaw(data);
  void syncAssignmentDeadlineToCalendar(data.assignments[idx], true);
  return readRaw();
}

export function removeTeamAssignment(id) {
  const data = readRaw();
  const removed = data.assignments.find(
    (a) => a.id === id || `assignment_${a.id}` === id || assignmentEventId(a.id) === id,
  );
  data.assignments = data.assignments.filter(
    (a) => a.id !== id && `assignment_${a.id}` !== id && assignmentEventId(a.id) !== id,
  );
  writeRaw(data);
  if (removed) void syncAssignmentDeadlineToCalendar(removed, false);
  return readRaw();
}

/** Load company-wide manage-team data into local cache (trial).
 * @param {{ notify?: boolean }} [opts] — when notify is false, skip change events (avoids refresh loops).
 */
export async function hydrateTeamFromServer(opts = {}) {
  const notify = opts.notify !== false;
  if (!canUseTrialFeatures()) return getTeamData();
  try {
    const data = await loadTrialFeatureData("manageTeam", EMPTY);
    const next = normalizeBlob(data);
    const nextJson = JSON.stringify(next);
    const prevJson = localStorage.getItem(storageKey());
    if (prevJson === nextJson) return getTeamData();
    localStorage.setItem(storageKey(), nextJson);
    if (notify) {
      try {
        window.dispatchEvent(new CustomEvent(TEAM_CHANGED_EVENT, { detail: next }));
      } catch {
        /* ignore */
      }
    }
    return getTeamData();
  } catch {
    return getTeamData();
  }
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
