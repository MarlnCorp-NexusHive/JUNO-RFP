import { scopedStorageKey, isScopedStorageEventKey } from "../../../services/tenantScopedStorage.js";

const BASE_KEY = "juno_grant_rfp_shortlist";
export const SHORTLIST_CHANGED_EVENT = "juno-grant-rfp-shortlist-changed";

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
    existing.splice(idx, 1);
    writeRaw(existing);
    return { ok: true, shortlisted: false, items: listShortlist() };
  }
  const deadline = item.deadline != null ? String(item.deadline).trim() : "";
  if (!deadline) {
    return { ok: false, error: "missing_deadline", items: listShortlist() };
  }
  existing.push({
    id: String(item.id),
    source: item.source || "grants",
    title: item.title || item.number || String(item.id),
    number: item.number || "",
    agency: item.agency || "",
    deadline,
    shortlistedAt: new Date().toISOString(),
  });
  writeRaw(existing);
  return { ok: true, shortlisted: true, items: listShortlist() };
}

export function removeShortlist(id) {
  if (!id) return listShortlist();
  const next = readRaw().filter((x) => x.id !== id && `shortlist_${x.id}` !== id);
  writeRaw(next);
  return listShortlist();
}

/**
 * Update a shortlisted opportunity (used when editing its calendar deadline event).
 * @param {string} id shortlist id or `shortlist_${id}` calendar id
 */
export function updateShortlistItem(id, patch = {}) {
  if (!id) return listShortlist();
  const existing = readRaw();
  const idx = existing.findIndex((x) => x.id === id || `shortlist_${x.id}` === id);
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
  return listShortlist();
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
