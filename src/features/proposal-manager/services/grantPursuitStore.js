/**
 * Local pursuit checklist state for Grant Pursuit Briefs.
 * Tenant-scoped when trial is active (via scopedStorageKey).
 */

import { scopedStorageKey, isScopedStorageEventKey } from "../../../services/tenantScopedStorage.js";
import { calendarApi } from "../../../services/calendarApi.js";
import { parseDateToISO } from "./calendarDateParse.js";

const BASE_KEY = "juno_grant_pursuit_checklists";
export const PURSUIT_CHANGED_EVENT = "juno-grant-pursuit-changed";

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

export function getPursuitState(briefKey) {
  if (!briefKey) return null;
  return readAll()[briefKey] || null;
}

export function upsertPursuitState(briefKey, patch = {}) {
  if (!briefKey) return null;
  const all = readAll();
  const prev = all[briefKey] || {
    briefKey,
    startedAt: null,
    checklist: [],
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
  const checklist = (brief.checklistTemplate || []).map((item) => ({
    id: item.id,
    label: item.label,
    done: false,
  }));
  return upsertPursuitState(brief.key, {
    startedAt: new Date().toISOString(),
    title: brief.title,
    source: brief.source,
    opportunityId: brief.opportunityId,
    checklist,
  });
}

export function togglePursuitCheckItem(briefKey, itemId) {
  const state = getPursuitState(briefKey);
  if (!state) return null;
  const checklist = (state.checklist || []).map((item) =>
    item.id === itemId ? { ...item, done: !item.done } : item,
  );
  return upsertPursuitState(briefKey, { checklist });
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
