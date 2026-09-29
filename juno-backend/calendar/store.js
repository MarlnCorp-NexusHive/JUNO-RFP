/** Demo / unauthenticated calendar bucket (shared mock + local demo sessions). */
export const DEMO_CALENDAR_KEY = "__demo__";

/**
 * Tenant-scoped manual calendar events.
 * Key: tenantId or DEMO_CALENDAR_KEY → Map(eventId → record)
 * @type {Map<string, Map<string, import('./types.js').CalendarEventRecord>>}
 */
export const eventsByScope = new Map();

/** @returns {Map<string, import('./types.js').CalendarEventRecord>} */
export function getManualEventsMap(tenantId) {
  const key = tenantId ? String(tenantId) : DEMO_CALENDAR_KEY;
  let map = eventsByScope.get(key);
  if (!map) {
    map = new Map();
    eventsByScope.set(key, map);
  }
  return map;
}
