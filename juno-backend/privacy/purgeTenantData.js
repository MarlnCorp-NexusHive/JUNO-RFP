import { purgeTenantFeatures } from "../trial/featureStore.js";
import { eventsByScope } from "../calendar/store.js";
import { scheduleCalendarPersist } from "../calendar/calendarPersistence.js";
import { purgeWorkspaceDocumentsMatching } from "../workspaceDocumentService.js";
import { logger } from "../utils/logger.js";

/**
 * Orchestrated Right-to-Erasure / retention purge across all known stores for a tenant.
 * Call after the tenant record itself has been removed from trial-tenants.json (or just before).
 */
export function purgeTenantSatelliteData(tenantId, reason = "erasure") {
  const id = String(tenantId || "").trim();
  if (!id) return { ok: false, reason: "missing_tenant" };

  const result = {
    tenantId: id,
    reason,
    features: false,
    calendar: false,
    workspaceDocs: 0,
  };

  try {
    result.features = Boolean(purgeTenantFeatures(id));
  } catch (err) {
    logger.warn("purge_features_failed", { tenantId: id, error: err?.message });
  }

  try {
    if (eventsByScope.has(id)) {
      eventsByScope.delete(id);
      scheduleCalendarPersist();
      result.calendar = true;
    }
  } catch (err) {
    logger.warn("purge_calendar_failed", { tenantId: id, error: err?.message });
  }

  try {
    result.workspaceDocs = purgeWorkspaceDocumentsMatching(id);
  } catch (err) {
    logger.warn("purge_workspace_docs_failed", { tenantId: id, error: err?.message });
  }

  logger.info("tenant_satellite_purged", result);
  return { ok: true, ...result };
}
