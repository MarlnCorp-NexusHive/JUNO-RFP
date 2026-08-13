import { WIN_LOSS_SAMPLES } from "../data/winLossSamples";

const KEY = "proposal_manager_win_loss_records";

function load(defaultValue = []) {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function save(records) {
  try {
    localStorage.setItem(KEY, JSON.stringify(records));
  } catch (e) {
    console.warn("winLossStorage save failed", e);
  }
}

export function getWinLossRecords() {
  const records = load(null);
  if (!records || !Array.isArray(records) || records.length === 0) {
    save(WIN_LOSS_SAMPLES);
    return WIN_LOSS_SAMPLES.map((r) => ({ ...r }));
  }
  return records;
}

export function saveWinLossRecords(records) {
  save(records);
}

export function upsertWinLossRecord(record) {
  const records = getWinLossRecords();
  const id = record.id || `wl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const next = {
    version: 1,
    ...record,
    id,
    updatedAt: new Date().toISOString(),
    createdAt: record.createdAt || new Date().toISOString(),
  };
  const idx = records.findIndex((r) => r.id === id);
  if (idx >= 0) records[idx] = next;
  else records.unshift(next);
  save(records);
  return next;
}

export function deleteWinLossRecord(id) {
  save(getWinLossRecords().filter((r) => r.id !== id));
}
