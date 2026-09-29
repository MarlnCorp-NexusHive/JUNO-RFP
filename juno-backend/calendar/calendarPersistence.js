import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DEMO_CALENDAR_KEY, eventsByScope, getManualEventsMap } from "./store.js";
import { getTrialDataPath } from "../trial/tenantStore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Legacy path (pre tenant-scoped). Still loaded once for migration. */
const LEGACY_STATE_FILE = path.join(__dirname, "..", "data", "calendar-runtime-state.json");

let persistTimer = null;

function getStateFile() {
  // Prefer same directory as trial-tenants.json so Render Persistent Disk keeps calendar too.
  try {
    return path.join(path.dirname(getTrialDataPath()), "calendar-runtime-state.json");
  } catch {
    return LEGACY_STATE_FILE;
  }
}

function persistNow() {
  try {
    const stateFile = getStateFile();
    const dir = path.dirname(stateFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const demo = Object.fromEntries(getManualEventsMap(null));
    const tenants = {};
    for (const [scope, map] of eventsByScope) {
      if (scope === DEMO_CALENDAR_KEY) continue;
      tenants[scope] = { manualEvents: Object.fromEntries(map) };
    }

    const payload = {
      version: 2,
      savedAt: new Date().toISOString(),
      demo: { manualEvents: demo },
      tenants,
    };
    const tmp = `${stateFile}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(payload, null, 2), "utf8");
    fs.renameSync(tmp, stateFile);
  } catch (e) {
    console.warn("CALENDAR PERSIST: save failed", e?.message || e);
  }
}

export function scheduleCalendarPersist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persistNow();
  }, 400);
}

function hydrateMap(targetMap, manualEvents) {
  targetMap.clear();
  for (const [id, ev] of Object.entries(manualEvents || {})) {
    if (ev && typeof ev === "object") targetMap.set(id, ev);
  }
}

function loadFromPayload(raw) {
  eventsByScope.clear();
  if (raw.version === 2) {
    hydrateMap(getManualEventsMap(null), raw.demo?.manualEvents || raw.manualEvents || {});
    for (const [tenantId, bucket] of Object.entries(raw.tenants || {})) {
      if (!tenantId || tenantId === DEMO_CALENDAR_KEY) continue;
      hydrateMap(getManualEventsMap(tenantId), bucket?.manualEvents || {});
    }
    return;
  }
  if (raw.version === 1) {
    // Pre-tenant file → demo bucket only (does not leak into trial tenants).
    hydrateMap(getManualEventsMap(null), raw.manualEvents || {});
  }
}

export function loadCalendarState() {
  try {
    const stateFile = getStateFile();
    let loadedFrom = null;
    if (fs.existsSync(stateFile)) {
      const raw = JSON.parse(fs.readFileSync(stateFile, "utf8"));
      loadFromPayload(raw);
      loadedFrom = stateFile;
    } else if (stateFile !== LEGACY_STATE_FILE && fs.existsSync(LEGACY_STATE_FILE)) {
      const raw = JSON.parse(fs.readFileSync(LEGACY_STATE_FILE, "utf8"));
      loadFromPayload(raw);
      loadedFrom = LEGACY_STATE_FILE;
      // Rewrite into the preferred path so future boots use tenant file.
      persistNow();
    } else {
      return;
    }

    let total = 0;
    let tenantCount = 0;
    for (const [scope, map] of eventsByScope) {
      total += map.size;
      if (scope !== DEMO_CALENDAR_KEY) tenantCount += 1;
    }
    console.log(
      `CALENDAR PERSIST: loaded ${total} manual event(s) across ${tenantCount} tenant(s) from ${loadedFrom}`,
    );
  } catch (e) {
    console.warn("CALENDAR PERSIST: load failed", e?.message || e);
  }
}
