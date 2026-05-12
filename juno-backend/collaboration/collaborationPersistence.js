import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { store } from "./store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, "..", "data", "collaboration-runtime-state.json");

let persistTimer = null;
let exitHookRegistered = false;

function persistNow() {
  try {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const payload = {
      version: 1,
      savedAt: new Date().toISOString(),
      workspaces: Object.fromEntries(store.workspaces),
      questions: Object.fromEntries(store.questions),
      messages: store.messages,
      logs: store.logs,
      quarterlyByWorkspace: Object.fromEntries(store.quarterlyByWorkspace),
    };
    const tmp = `${STATE_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(payload), "utf8");
    fs.renameSync(tmp, STATE_FILE);
  } catch (e) {
    console.warn("COLLABORATION PERSIST: save failed", e?.message || e);
  }
}

/** Debounced save so bursts of updates write once. */
export function scheduleCollaborationPersist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persistNow();
  }, 400);
}

export function flushCollaborationPersist() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  persistNow();
}

export function loadCollaborationState() {
  try {
    if (!fs.existsSync(STATE_FILE)) return;
    const raw = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    if (raw.version !== 1) return;

    store.workspaces = new Map(Object.entries(raw.workspaces || {}));
    store.questions = new Map(Object.entries(raw.questions || {}));
    store.messages = Array.isArray(raw.messages) ? raw.messages : [];
    store.logs = Array.isArray(raw.logs) ? raw.logs : [];

    const qbw = raw.quarterlyByWorkspace || {};
    store.quarterlyByWorkspace = new Map(
      Object.entries(qbw).map(([k, v]) => [k, Array.isArray(v) ? v : []]),
    );

    console.log(
      `COLLABORATION PERSIST: loaded ${store.workspaces.size} workspace(s), ${store.questions.size} question(s) from disk`,
    );
  } catch (e) {
    console.warn("COLLABORATION PERSIST: load failed", e?.message || e);
  }
}

export function registerCollaborationPersistOnExit() {
  if (exitHookRegistered) return;
  exitHookRegistered = true;
  const onExit = () => flushCollaborationPersist();
  process.once("SIGINT", onExit);
  process.once("SIGTERM", onExit);
  process.once("beforeExit", onExit);
}
