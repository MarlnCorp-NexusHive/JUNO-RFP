import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { manualEventsById } from "./store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, "..", "data", "calendar-runtime-state.json");

let persistTimer = null;

function persistNow() {
  try {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const payload = {
      version: 1,
      savedAt: new Date().toISOString(),
      manualEvents: Object.fromEntries(manualEventsById),
    };
    const tmp = `${STATE_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(payload, null, 2), "utf8");
    fs.renameSync(tmp, STATE_FILE);
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

export function loadCalendarState() {
  try {
    if (!fs.existsSync(STATE_FILE)) return;
    const raw = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    if (raw.version !== 1) return;
    manualEventsById.clear();
    for (const [id, ev] of Object.entries(raw.manualEvents || {})) {
      if (ev && typeof ev === "object") manualEventsById.set(id, ev);
    }
    console.log(`CALENDAR PERSIST: loaded ${manualEventsById.size} manual event(s) from disk`);
  } catch (e) {
    console.warn("CALENDAR PERSIST: load failed", e?.message || e);
  }
}
