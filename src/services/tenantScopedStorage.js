import { getTrialTenantId } from "./trialAuthSession.js";

/**
 * Namespace localStorage keys by tenant when a trial session is active.
 * Demo (no trial session) keeps original keys so existing demos are untouched.
 */
export function scopedStorageKey(baseKey) {
  const tenantId = getTrialTenantId();
  if (!tenantId) return baseKey;
  const safe = String(tenantId).replace(/[^a-zA-Z0-9_-]/g, "_");
  return `juno_tenant_${safe}__${baseKey}`;
}

export function isScopedStorageEventKey(eventKey, baseKey) {
  if (!eventKey) return false;
  if (eventKey === baseKey) return true;
  return eventKey.endsWith(`__${baseKey}`);
}
