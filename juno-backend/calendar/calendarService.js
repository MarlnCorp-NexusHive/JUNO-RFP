import { store as collabStore } from "../collaboration/store.js";
import { getManualEventsMap } from "./store.js";
import { scheduleCalendarPersist } from "./calendarPersistence.js";

const TYPE_COLORS = {
  deadline: "#dc2626",
  milestone: "#ea580c",
  meeting: "#2563eb",
  assignment: "#7c3aed",
  submission: "#16a34a",
  review: "#0891b2",
  task: "#6366f1",
};

let idCounter = 0;

function generateId(prefix = "cal") {
  idCounter += 1;
  return `${prefix}_${Date.now()}_${idCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

function userName(userId) {
  return collabStore.usersById.get(userId)?.name || userId;
}

function withColor(ev) {
  return { ...ev, color: ev.color || TYPE_COLORS[ev.type] || "#4b5563" };
}

function serializeEvent(record) {
  return withColor(record);
}

/** Normalize optional tenant scope from the request (null = demo bucket). */
export function resolveCalendarScope(tenantId) {
  if (!tenantId) return null;
  const id = String(tenantId).trim();
  return id || null;
}

/** @param {import('./types.js').CalendarEventRecord} input */
function normalizeManualInput(input, existing = null) {
  const title = String(input.title || "").trim();
  if (!title) {
    const e = new Error("title is required");
    e.statusCode = 400;
    throw e;
  }
  const start = String(input.start || "").trim();
  if (!start) {
    const e = new Error("start is required");
    e.statusCode = 400;
    throw e;
  }
  const type = input.type || "meeting";
  const allowed = ["deadline", "milestone", "meeting", "assignment", "submission", "review", "task"];
  if (!allowed.includes(type)) {
    const e = new Error(`type must be one of: ${allowed.join(", ")}`);
    e.statusCode = 400;
    throw e;
  }
  const now = new Date().toISOString();
  const source =
    input.source === "rfp-deadline"
      ? "rfp-deadline"
      : input.source === "shortlist"
        ? "shortlist"
        : input.source === "assignment"
          ? "assignment"
          : input.source === "source-doc"
            ? "source-doc"
            : "manual";
  const requestedId = input.id != null ? String(input.id).trim() : "";
  const id =
    existing?.id ||
    (requestedId &&
    (source === "shortlist" ||
      source === "assignment" ||
      source === "source-doc" ||
      requestedId.startsWith("shortlist_") ||
      requestedId.startsWith("assignment_") ||
      requestedId.startsWith("srcdoc_"))
      ? requestedId.slice(0, 160)
      : generateId("manual"));
  return {
    id,
    title: title.slice(0, 300),
    start,
    end: input.end ? String(input.end) : null,
    allDay: Boolean(input.allDay),
    type,
    source,
    workspaceId: input.workspaceId || null,
    documentId: input.documentId || null,
    assigneeIds: Array.isArray(input.assigneeIds) ? input.assigneeIds : [],
    assigneeNames: Array.isArray(input.assigneeNames) ? input.assigneeNames : [],
    status: input.status || null,
    description: input.description ? String(input.description).slice(0, 5000) : null,
    location: input.location ? String(input.location).slice(0, 300) : null,
    bidName: input.bidName ? String(input.bidName).slice(0, 300) : null,
    questionNumber: Number.isFinite(Number(input.questionNumber)) ? Number(input.questionNumber) : null,
    color: input.color || null,
    shortlistId: input.shortlistId != null ? String(input.shortlistId) : existing?.shortlistId || null,
    assignmentId: input.assignmentId != null ? String(input.assignmentId) : existing?.assignmentId || null,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
}

export function listManualEvents(tenantId = null) {
  const map = getManualEventsMap(resolveCalendarScope(tenantId));
  return [...map.values()].map(serializeEvent);
}

export function createManualEvent(body, tenantId = null) {
  const map = getManualEventsMap(resolveCalendarScope(tenantId));
  const requestedId = body?.id != null ? String(body.id).trim() : "";
  const existing = requestedId ? map.get(requestedId) : null;
  const record = normalizeManualInput(body || {}, existing || (requestedId ? { id: requestedId } : null));
  map.set(record.id, record);
  scheduleCalendarPersist();
  return serializeEvent(record);
}

export function updateManualEvent(id, body, tenantId = null) {
  const map = getManualEventsMap(resolveCalendarScope(tenantId));
  const existing = map.get(id);
  if (!existing) {
    const e = new Error("Event not found");
    e.statusCode = 404;
    throw e;
  }
  if (existing.source === "rfp-deadline") {
    const record = normalizeManualInput({ ...existing, ...body, source: "rfp-deadline" }, existing);
    map.set(id, record);
    scheduleCalendarPersist();
    return serializeEvent(record);
  }
  if (existing.source === "shortlist") {
    const record = normalizeManualInput(
      { ...existing, ...body, source: "shortlist", shortlistId: existing.shortlistId || body.shortlistId },
      existing,
    );
    map.set(id, record);
    scheduleCalendarPersist();
    return serializeEvent(record);
  }
  if (existing.source === "assignment") {
    const record = normalizeManualInput(
      {
        ...existing,
        ...body,
        source: "assignment",
        assignmentId: existing.assignmentId || body.assignmentId,
      },
      existing,
    );
    map.set(id, record);
    scheduleCalendarPersist();
    return serializeEvent(record);
  }
  if (existing.source === "source-doc") {
    const record = normalizeManualInput(
      { ...existing, ...body, source: "source-doc", documentId: existing.documentId || body.documentId },
      existing,
    );
    map.set(id, record);
    scheduleCalendarPersist();
    return serializeEvent(record);
  }
  const record = normalizeManualInput({ ...existing, ...body }, existing);
  map.set(id, record);
  scheduleCalendarPersist();
  return serializeEvent(record);
}

export function deleteManualEvent(id, tenantId = null) {
  const map = getManualEventsMap(resolveCalendarScope(tenantId));
  if (!map.has(id)) {
    const e = new Error("Event not found");
    e.statusCode = 404;
    throw e;
  }
  map.delete(id);
  scheduleCalendarPersist();
  return { ok: true };
}

/** Upsert deadline events synced from the Proposal Manager browser (source docs). */
export function syncRfpDeadlines(events = [], tenantId = null) {
  if (!Array.isArray(events)) {
    const e = new Error("events array required");
    e.statusCode = 400;
    throw e;
  }
  const map = getManualEventsMap(resolveCalendarScope(tenantId));
  const incomingIds = new Set();
  const saved = [];
  for (const row of events) {
    const stableKey = String(row.stableKey || row.id || "").trim();
    if (!stableKey) continue;
    const id = `rfp_dl_${stableKey.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120)}`;
    incomingIds.add(id);
    const existing = map.get(id);
    const record = normalizeManualInput(
      {
        ...row,
        id,
        type: "deadline",
        source: "rfp-deadline",
        allDay: row.allDay !== false,
      },
      existing || { id },
    );
    map.set(id, record);
    saved.push(serializeEvent(record));
  }
  for (const [id, ev] of map) {
    if (ev.source === "rfp-deadline" && !incomingIds.has(id)) {
      map.delete(id);
    }
  }
  scheduleCalendarPersist();
  return { synced: saved.length, events: saved };
}

function workspaceTitle(workspaceId) {
  return collabStore.workspaces.get(workspaceId)?.title || "RFP workspace";
}

function synthesizeCollaborationEvents() {
  /** @type {import('./types.js').CalendarEventRecord[]} */
  const events = [];
  const actionMap = {
    "Question assigned to auditor": "assignment",
    "Submitted answer": "submission",
    "Answer approved": "review",
    "Answer rejected": "review",
    "Changes requested": "review",
    "Workspace created": "milestone",
    "Auditor asked clarification": "task",
    "Proposal Manager replied to clarification": "task",
  };

  for (const log of collabStore.logs) {
    const type = actionMap[log.action];
    if (!type) continue;
    const bid = workspaceTitle(log.workspaceId);
    const qLabel = log.question_id != null ? `Q${log.question_id}` : "";
    const title = [log.action, qLabel, bid].filter(Boolean).join(" · ");
    const id = `collab_${log.workspaceId}_${log.timestamp}_${log.question_db_id || log.question_id || "ws"}_${log.action}`;
    events.push(
      withColor({
        id,
        title: title.slice(0, 300),
        start: log.timestamp,
        end: null,
        allDay: false,
        type,
        source: "collaboration",
        workspaceId: log.workspaceId,
        assigneeNames: log.user ? [log.user] : [],
        bidName: bid,
        questionNumber: log.question_id,
        status: log.action,
        description: log.extra?.comment || null,
        createdAt: log.timestamp,
        updatedAt: log.timestamp,
      }),
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  for (const q of collabStore.questions.values()) {
    if (!q.assignedTo) continue;
    if (!["assigned", "in_progress", "submitted", "changes_requested"].includes(q.status)) continue;
    const bid = workspaceTitle(q.workspaceId);
    const assignee = userName(q.assignedTo);
    const statusLabel =
      q.status === "assigned"
        ? "Assigned"
        : q.status === "in_progress"
          ? "In progress"
          : q.status === "submitted"
            ? "Awaiting review"
            : "Changes requested";
    const assignedDay = (q.updatedAt || new Date().toISOString()).slice(0, 10);
    const base = {
      title: `${statusLabel}: Q${q.number} · ${assignee} · ${bid}`,
      end: null,
      allDay: true,
      type: "task",
      source: "collaboration",
      workspaceId: q.workspaceId,
      assigneeIds: [q.assignedTo],
      assigneeNames: [assignee],
      bidName: bid,
      questionNumber: q.number,
      status: q.status,
      description: q.text ? String(q.text).slice(0, 500) : null,
      createdAt: q.updatedAt,
      updatedAt: q.updatedAt,
    };
    events.push(
      withColor({
        ...base,
        id: `collab_open_${q.id}`,
        start: assignedDay,
      }),
    );
    if (assignedDay !== today) {
      events.push(
        withColor({
          ...base,
          id: `collab_today_${q.id}`,
          title: `Active today — Q${q.number} · ${assignee} · ${bid}`,
          start: today,
        }),
      );
    }
  }

  const unassigned = [...collabStore.questions.values()].filter((q) => q.status === "unassigned").length;
  if (unassigned > 0) {
    events.push(
      withColor({
        id: `collab_unassigned_${today}`,
        title: `${unassigned} question(s) unassigned across workspaces`,
        start: today,
        end: null,
        allDay: true,
        type: "milestone",
        source: "collaboration",
        status: "unassigned",
        description: "Assign auditors from Team Collab so work appears on their calendars.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
  }

  return events;
}

export function getTeamSummary(tenantId = null) {
  // Trial / tenant calendars do not share the demo auditor roster.
  if (resolveCalendarScope(tenantId)) {
    return {
      workspaces: 0,
      auditors: [],
      totals: { unassigned: 0, assigned: 0, submitted: 0, approved: 0 },
    };
  }

  const auditors = [...collabStore.usersById.values()].filter((u) => u.role === "auditor");
  const byAuditor = auditors.map((aud) => {
    const assigned = [...collabStore.questions.values()].filter((q) => q.assignedTo === aud.id);
    return {
      id: aud.id,
      name: aud.name,
      email: aud.email,
      assigned: assigned.filter((q) => q.status === "assigned").length,
      inProgress: assigned.filter((q) => q.status === "in_progress").length,
      submitted: assigned.filter((q) => q.status === "submitted").length,
      approved: assigned.filter((q) => q.status === "approved").length,
      changesRequested: assigned.filter((q) => q.status === "changes_requested").length,
      total: assigned.length,
    };
  });

  const questions = [...collabStore.questions.values()];
  return {
    workspaces: collabStore.workspaces.size,
    auditors: byAuditor,
    totals: {
      unassigned: questions.filter((q) => q.status === "unassigned").length,
      assigned: questions.filter((q) => q.status === "assigned" || q.status === "in_progress").length,
      submitted: questions.filter((q) => q.status === "submitted").length,
      approved: questions.filter((q) => q.status === "approved").length,
    },
  };
}

export function listAllCalendarEvents(tenantId = null) {
  const scope = resolveCalendarScope(tenantId);
  const manual = listManualEvents(scope);
  // Demo only: overlay team-collab activity. Trial tenants share only their own events.
  const team = scope ? [] : synthesizeCollaborationEvents();
  const byId = new Map();
  for (const ev of [...manual, ...team]) {
    byId.set(ev.id, ev);
  }
  return [...byId.values()].sort((a, b) => String(a.start).localeCompare(String(b.start)));
}
