/**
 * Minimal append-only privacy audit log for DSAR / consent / erasure evidence.
 * Stored beside trial-tenants.json. Does not store passwords or raw document contents.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { readJsonSafe, writeJsonAtomic } from "../utils/atomicFile.js";
import { maskPiiLabel } from "../utils/piiRedact.js";

const MAX_EVENTS = 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getAuditPath() {
  const custom =
    String(process.env.TRIAL_DATA_PATH || process.env.JUNO_TRIAL_DATA_PATH || "").trim() ||
    (process.env.TRIAL_DATA_DIR
      ? path.join(String(process.env.TRIAL_DATA_DIR).trim(), "trial-tenants.json")
      : "");
  const tenantsPath = custom || path.join(__dirname, "..", "data", "trial-tenants.json");
  return path.join(path.dirname(tenantsPath), "privacy-audit-log.json");
}

function loadAudit() {
  const { data } = readJsonSafe(getAuditPath(), "privacy-audit");
  if (data && Array.isArray(data.events)) return data;
  return { events: [] };
}

function saveAudit(db) {
  const dir = path.dirname(getAuditPath());
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (db.events.length > MAX_EVENTS) {
    db.events = db.events.slice(-MAX_EVENTS);
  }
  writeJsonAtomic(getAuditPath(), db, "privacy-audit");
}

/**
 * @param {{
 *  action: string,
 *  userId?: string,
 *  tenantId?: string,
 *  email?: string,
 *  detail?: string,
 *  ip?: string,
 *  userAgent?: string,
 *  requestId?: string,
 * }} evt
 */
export function appendPrivacyAudit(evt = {}) {
  const db = loadAudit();
  db.events.push({
    id: `pa_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    ts: new Date().toISOString(),
    action: String(evt.action || "event").slice(0, 80),
    userId: evt.userId ? String(evt.userId).slice(0, 80) : null,
    tenantId: evt.tenantId ? String(evt.tenantId).slice(0, 80) : null,
    emailMasked: evt.email ? maskPiiLabel(evt.email) : null,
    detail: evt.detail ? String(evt.detail).slice(0, 300) : null,
    ip: evt.ip ? String(evt.ip).slice(0, 80) : null,
    userAgent: evt.userAgent ? String(evt.userAgent).slice(0, 180) : null,
    requestId: evt.requestId ? String(evt.requestId).slice(0, 64) : null,
  });
  saveAudit(db);
}

export function listPrivacyAudit({ limit = 100, tenantId } = {}) {
  const db = loadAudit();
  let events = [...db.events].reverse();
  if (tenantId) events = events.filter((e) => e.tenantId === tenantId);
  return events.slice(0, Math.min(500, Number(limit) || 100));
}
