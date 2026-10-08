/**
 * Local pursuit checklist + Workspace grant plan state for Grant Pursuit Briefs.
 * Tenant-scoped when trial is active (via scopedStorageKey).
 */

import { scopedStorageKey, isScopedStorageEventKey } from "../../../services/tenantScopedStorage.js";
import { calendarApi } from "../../../services/calendarApi.js";
import { parseDateToISO } from "./calendarDateParse.js";

const BASE_KEY = "juno_grant_pursuit_checklists";
export const PURSUIT_CHANGED_EVENT = "juno-grant-pursuit-changed";

export const PLAN_CATEGORIES = ["milestones", "deliverables", "complianceChecks", "trackables"];

function storageKey() {
  return scopedStorageKey(BASE_KEY);
}

function readAll() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(map) {
  localStorage.setItem(storageKey(), JSON.stringify(map));
  try {
    window.dispatchEvent(new CustomEvent(PURSUIT_CHANGED_EVENT, { detail: { map } }));
  } catch {
    /* ignore */
  }
}

function asText(value, max = 400) {
  const s = String(value || "").trim();
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function planItem({ id, label, detail = "", dueDate = null, category, done = false }) {
  return {
    id: String(id || `${category}-${Math.random().toString(36).slice(2, 8)}`),
    label: asText(label, 240) || "Item",
    detail: asText(detail, 500),
    dueDate: dueDate ? asText(dueDate, 80) : null,
    category,
    done: !!done,
  };
}

/** Build Workspace plan buckets from a Grant Pursuit Brief. */
export function buildPlanFromBrief(brief) {
  const milestones = [];
  const dates = Array.isArray(brief?.dates) ? brief.dates : [];
  dates.forEach((d, i) => {
    milestones.push(
      planItem({
        id: d.id || `date-${i + 1}`,
        label: d.label || "Key date",
        detail: d.type ? String(d.type) : "",
        dueDate: d.date || null,
        category: "milestones",
      }),
    );
  });
  const steps = Array.isArray(brief?.steps) ? [...brief.steps].sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
  steps.forEach((step, i) => {
    milestones.push(
      planItem({
        id: step.id || `step-${i + 1}`,
        label: step.title || `Step ${i + 1}`,
        detail: step.detail || "",
        dueDate: null,
        category: "milestones",
      }),
    );
  });

  const deliverables = (Array.isArray(brief?.documents) ? brief.documents : []).map((doc, i) =>
    planItem({
      id: doc.id || `doc-${i + 1}`,
      label: doc.name || `Document ${i + 1}`,
      detail: [doc.required === false ? "Optional" : "Required", doc.notes].filter(Boolean).join(" · "),
      dueDate: null,
      category: "deliverables",
    }),
  );

  const complianceChecks = [];
  const watchOuts = Array.isArray(brief?.eligibility?.watchOuts) ? brief.eligibility.watchOuts : [];
  watchOuts.forEach((w, i) => {
    complianceChecks.push(
      planItem({
        id: `watch-${i + 1}`,
        label: asText(w, 240),
        detail: "Eligibility watch-out",
        category: "complianceChecks",
      }),
    );
  });
  if (brief?.eligibility?.fitNotes) {
    complianceChecks.push(
      planItem({
        id: "fit-notes",
        label: "Fit notes to verify",
        detail: brief.eligibility.fitNotes,
        category: "complianceChecks",
      }),
    );
  }
  if (brief?.eligibility?.summary && !complianceChecks.length) {
    complianceChecks.push(
      planItem({
        id: "elig-summary",
        label: "Eligibility summary",
        detail: brief.eligibility.summary,
        category: "complianceChecks",
      }),
    );
  }

  const trackables = (Array.isArray(brief?.checklistTemplate) ? brief.checklistTemplate : []).map((item, i) =>
    planItem({
      id: item.id || `track-${i + 1}`,
      label: item.label || `Trackable ${i + 1}`,
      detail: "",
      category: "trackables",
    }),
  );

  return {
    milestones,
    deliverables,
    complianceChecks,
    trackables,
  };
}

export function getPursuitState(briefKey) {
  if (!briefKey) return null;
  return readAll()[briefKey] || null;
}

export function getGrantPursuit(key) {
  return getPursuitState(key);
}

/** Started pursuits newest-first. */
export function listGrantPursuits() {
  const all = readAll();
  return Object.values(all)
    .filter((p) => p && p.startedAt && p.briefKey)
    .sort((a, b) => String(b.startedAt || "").localeCompare(String(a.startedAt || "")));
}

export function upsertPursuitState(briefKey, patch = {}) {
  if (!briefKey) return null;
  const all = readAll();
  const prev = all[briefKey] || {
    briefKey,
    startedAt: null,
    checklist: [],
    plan: null,
    calendarSyncedAt: null,
  };
  const next = {
    ...prev,
    ...patch,
    briefKey,
    updatedAt: new Date().toISOString(),
  };
  all[briefKey] = next;
  writeAll(all);
  return next;
}

export function startPursuitFromBrief(brief) {
  if (!brief?.key) return null;
  const existing = getPursuitState(brief.key);
  const plan = existing?.plan?.milestones?.length || existing?.plan?.trackables?.length
    ? existing.plan
    : buildPlanFromBrief(brief);
  const checklist = (brief.checklistTemplate || []).map((item) => ({
    id: item.id,
    label: item.label,
    done: false,
  }));
  // Keep prior checklist completion if restarting same brief
  const priorChecklist = Array.isArray(existing?.checklist) ? existing.checklist : [];
  const mergedChecklist = checklist.map((item) => {
    const prev = priorChecklist.find((x) => x.id === item.id);
    return prev ? { ...item, done: !!prev.done } : item;
  });

  return upsertPursuitState(brief.key, {
    startedAt: existing?.startedAt || new Date().toISOString(),
    title: brief.title || existing?.title || brief.snapshot?.title || "Grant pursuit",
    source: brief.source || existing?.source || "",
    opportunityId: brief.opportunityId || existing?.opportunityId || "",
    documentTypeId: "grants",
    checklist: mergedChecklist.length ? mergedChecklist : (plan.trackables || []).map((t) => ({
      id: t.id,
      label: t.label,
      done: !!t.done,
    })),
    plan,
  });
}

export function togglePursuitCheckItem(briefKey, itemId) {
  const state = getPursuitState(briefKey);
  if (!state) return null;
  const checklist = (state.checklist || []).map((item) =>
    item.id === itemId ? { ...item, done: !item.done } : item,
  );
  // Keep trackables in sync when toggling from brief checklist
  let plan = state.plan;
  if (plan?.trackables?.length) {
    plan = {
      ...plan,
      trackables: plan.trackables.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item,
      ),
    };
  }
  return upsertPursuitState(briefKey, { checklist, plan });
}

export function togglePlanItem(briefKey, category, itemId) {
  const state = getPursuitState(briefKey);
  if (!state?.plan || !PLAN_CATEGORIES.includes(category)) return null;
  const list = Array.isArray(state.plan[category]) ? state.plan[category] : [];
  const nextList = list.map((item) =>
    item.id === itemId ? { ...item, done: !item.done } : item,
  );
  const plan = { ...state.plan, [category]: nextList };
  const patch = { plan };
  if (category === "trackables") {
    patch.checklist = (state.checklist || []).map((item) => {
      const match = nextList.find((x) => x.id === item.id);
      return match ? { ...item, done: !!match.done } : item;
    });
  }
  return upsertPursuitState(briefKey, patch);
}

function briefEventId(briefKey, dateId) {
  return `brief_${String(briefKey)}_${String(dateId || "deadline")}`
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 140);
}

/** Push brief dates to calendar (best-effort). */
export async function syncBriefDatesToCalendar(brief) {
  if (!brief?.key) return { synced: 0 };
  const dates = Array.isArray(brief.dates) ? brief.dates : [];
  let synced = 0;
  for (const d of dates) {
    const iso = parseDateToISO(d.date);
    if (!iso) continue;
    const id = briefEventId(brief.key, d.id || d.label);
    const body = {
      id,
      title: `${d.label}: ${brief.title || brief.snapshot?.number || brief.key}`,
      start: iso,
      end: null,
      allDay: true,
      type: "deadline",
      source: "grant_brief",
      briefKey: brief.key,
      description: [brief.snapshot?.agency, brief.snapshot?.number].filter(Boolean).join(" · ") || null,
      color: "#4f46e5",
    };
    try {
      await calendarApi.updateEvent(id, body);
      synced += 1;
    } catch {
      try {
        await calendarApi.createEvent(body);
        synced += 1;
      } catch (err) {
        console.warn("[grant-brief] calendar sync failed:", err?.message || err);
      }
    }
  }
  // Also sync snapshot deadline if dates empty
  if (!synced && brief.snapshot?.deadline) {
    const iso = parseDateToISO(brief.snapshot.deadline);
    if (iso) {
      const id = briefEventId(brief.key, "close");
      const body = {
        id,
        title: `Grant deadline: ${brief.title || brief.key}`,
        start: iso,
        end: null,
        allDay: true,
        type: "deadline",
        source: "grant_brief",
        briefKey: brief.key,
        color: "#dc2626",
      };
      try {
        await calendarApi.updateEvent(id, body);
        synced += 1;
      } catch {
        try {
          await calendarApi.createEvent(body);
          synced += 1;
        } catch {
          /* ignore */
        }
      }
    }
  }
  upsertPursuitState(brief.key, { calendarSyncedAt: new Date().toISOString() });
  return { synced };
}

export function subscribePursuit(onChange) {
  const handle = () => onChange(readAll());
  const handleStorage = (e) => {
    if (!isScopedStorageEventKey(e.key, BASE_KEY)) return;
    onChange(readAll());
  };
  window.addEventListener(PURSUIT_CHANGED_EVENT, handle);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(PURSUIT_CHANGED_EVENT, handle);
    window.removeEventListener("storage", handleStorage);
  };
}
