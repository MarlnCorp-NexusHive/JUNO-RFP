import { scopedStorageKey, isScopedStorageEventKey } from "../../../services/tenantScopedStorage.js";
import {
  canUseTrialFeatures,
  loadTrialFeatureData,
  persistTrialFeatureData,
} from "../../../services/trialFeatureApi.js";
import { calendarApi } from "../../../services/calendarApi.js";
import { parseDateToISO } from "./calendarDateParse.js";

const BASE_KEY = "juno_grant_rfp_shortlist";
export const SHORTLIST_CHANGED_EVENT = "juno-grant-rfp-shortlist-changed";

const SHORTLIST_DEADLINE_COLOR = "#dc2626";

function storageKey() {
  return scopedStorageKey(BASE_KEY);
}

function readRaw() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(items) {
  localStorage.setItem(storageKey(), JSON.stringify(items));
  try {
    window.dispatchEvent(new CustomEvent(SHORTLIST_CHANGED_EVENT, { detail: { items } }));
  } catch {
    /* ignore */
  }
  void persistShortlistCompanyWide(items);
}

async function persistShortlistCompanyWide(items) {
  if (!canUseTrialFeatures()) return;
  await persistTrialFeatureData("shortlist", { items: Array.isArray(items) ? items : [] });
}

function shortlistEventId(id) {
  return `shortlist_${String(id || "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 120)}`;
}

export { shortlistEventId };

function sourceLabel(source) {
  if (source === "sam") return "SAM";
  return "Grant";
}

/** Push or remove a shortlist deadline on the shared tenant calendar. */
export async function syncShortlistDeadlineToCalendar(item, shortlisted) {
  if (!canUseTrialFeatures() || !item?.id) return;
  const eventId = shortlistEventId(item.id);
  if (!shortlisted) {
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
    title: `${sourceLabel(item.source)} deadline: ${item.title || item.number || item.id}`,
    start: iso,
    end: null,
    allDay: true,
    type: "deadline",
    source: "shortlist",
    shortlistId: String(item.id),
    bidName: item.number || item.title || null,
    description: [item.agency, item.number].filter(Boolean).join(" · ") || null,
    color: SHORTLIST_DEADLINE_COLOR,
  };
  try {
    await calendarApi.updateEvent(eventId, body);
  } catch {
    try {
      await calendarApi.createEvent(body);
    } catch (err) {
      console.warn("[shortlist] calendar sync failed:", err?.message || err);
    }
  }
}

export function listShortlist() {
  return readRaw().slice().sort((a, b) => {
    const da = Date.parse(a.deadline) || 0;
    const db = Date.parse(b.deadline) || 0;
    return da - db;
  });
}

export function isShortlisted(id) {
  if (!id) return false;
  return readRaw().some((item) => item.id === id);
}

/**
 * @param {{ id: string, source: 'grants'|'alt'|'sam', title?: string, number?: string, agency?: string, deadline?: string|null }} item
 * @returns {{ ok: boolean, shortlisted?: boolean, error?: string, items: object[] }}
 */
export function toggleShortlist(item) {
  if (!item?.id) {
    return { ok: false, error: "missing_id", items: listShortlist() };
  }
  const existing = readRaw();
  const idx = existing.findIndex((x) => x.id === item.id);
  if (idx >= 0) {
    const removed = existing[idx];
    existing.splice(idx, 1);
    writeRaw(existing);
    void syncShortlistDeadlineToCalendar(removed, false);
    return { ok: true, shortlisted: false, items: listShortlist() };
  }
  const deadline = item.deadline != null ? String(item.deadline).trim() : "";
  if (!deadline) {
    return { ok: false, error: "missing_deadline", items: listShortlist() };
  }
  if (!parseDateToISO(deadline)) {
    return { ok: false, error: "missing_deadline", items: listShortlist() };
  }
  const row = {
    id: String(item.id),
    source: item.source || "grants",
    title: item.title || item.number || String(item.id),
    number: item.number || "",
    agency: item.agency || "",
    deadline,
    shortlistedAt: new Date().toISOString(),
  };
  existing.push(row);
  writeRaw(existing);
  void syncShortlistDeadlineToCalendar(row, true);
  return { ok: true, shortlisted: true, items: listShortlist() };
}

export function removeShortlist(id) {
  if (!id) return listShortlist();
  const existing = readRaw();
  const removed = existing.find((x) => x.id === id || `shortlist_${x.id}` === id || shortlistEventId(x.id) === id);
  const next = existing.filter(
    (x) => x.id !== id && `shortlist_${x.id}` !== id && shortlistEventId(x.id) !== id,
  );
  writeRaw(next);
  if (removed) void syncShortlistDeadlineToCalendar(removed, false);
  return listShortlist();
}

/**
 * Update a shortlisted opportunity (used when editing its calendar deadline event).
 * @param {string} id shortlist id or `shortlist_${id}` calendar id
 */
export function updateShortlistItem(id, patch = {}) {
  if (!id) return listShortlist();
  const existing = readRaw();
  const idx = existing.findIndex(
    (x) => x.id === id || `shortlist_${x.id}` === id || shortlistEventId(x.id) === id,
  );
  if (idx < 0) return listShortlist();
  const cur = existing[idx];
  const nextTitle = patch.title != null ? String(patch.title).trim() : cur.title;
  const nextDeadline =
    patch.deadline != null ? String(patch.deadline).trim() : cur.deadline;
  existing[idx] = {
    ...cur,
    title: nextTitle || cur.title,
    deadline: nextDeadline || cur.deadline,
    number: patch.number != null ? String(patch.number) : cur.number,
    agency: patch.agency != null ? String(patch.agency) : cur.agency,
  };
  writeRaw(existing);
  void syncShortlistDeadlineToCalendar(existing[idx], true);
  return listShortlist();
}

/** Load company-wide shortlist into local cache (trial).
 * @param {{ notify?: boolean }} [opts] — when notify is false, skip change events (avoids refresh loops).
 */
export async function hydrateShortlistFromServer(opts = {}) {
  const notify = opts.notify !== false;
  if (!canUseTrialFeatures()) return listShortlist();
  try {
    const data = await loadTrialFeatureData("shortlist", { items: [] });
    const items = Array.isArray(data?.items) ? data.items : [];
    const nextJson = JSON.stringify(items);
    const prevJson = localStorage.getItem(storageKey());
    if (prevJson === nextJson) return listShortlist();
    localStorage.setItem(storageKey(), nextJson);
    if (notify) {
      try {
        window.dispatchEvent(new CustomEvent(SHORTLIST_CHANGED_EVENT, { detail: { items } }));
      } catch {
        /* ignore */
      }
    }
    return listShortlist();
  } catch {
    return listShortlist();
  }
}

/** Subscribe to shortlist changes (same tab + cross-tab storage). Returns unsubscribe. */
export function subscribeShortlist(onChange) {
  const handleCustom = () => onChange(listShortlist());
  const handleStorage = (e) => {
    if (!isScopedStorageEventKey(e.key, BASE_KEY)) return;
    onChange(listShortlist());
  };
  window.addEventListener(SHORTLIST_CHANGED_EVENT, handleCustom);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(SHORTLIST_CHANGED_EVENT, handleCustom);
    window.removeEventListener("storage", handleStorage);
  };
}

export function daysUntilDeadline(deadline) {
  if (!deadline) return null;
  const parsed = Date.parse(deadline);
  if (!Number.isFinite(parsed)) {
    const m = String(deadline).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    const d = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
    if (Number.isNaN(d.getTime())) return null;
    return Math.ceil((d.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  }
  return Math.ceil((parsed - Date.now()) / (24 * 60 * 60 * 1000));
}

export function urgencyAlertColor(days) {
  if (days == null) return "text-indigo-500";
  if (days < 0) return "text-gray-500";
  if (days <= 7) return "text-red-500";
  if (days <= 14) return "text-amber-500";
  return "text-blue-500";
}
