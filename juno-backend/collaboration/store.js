import { EventEmitter } from "events";

/** Broadcasts activity entries for SSE subscribers (same shape as log lines). */
export const activityBus = new EventEmitter();
activityBus.setMaxListeners(100);

export function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export const store = {
  /** @type {Map<string, import('./types.js').UserRecord>} */
  usersById: new Map(),
  /** @type {Map<string, string>} email lower -> userId */
  usersByEmail: new Map(),
  /** @type {Map<string, import('./types.js').Workspace>} */
  workspaces: new Map(),
  /** @type {Map<string, import('./types.js').Question>} */
  questions: new Map(),
  /** @type {import('./types.js').ClarificationMessage[]} */
  messages: [],
  /** @type {import('./types.js').ActivityLogEntry[]} */
  logs: [],
  /** @type {Map<string, import('./types.js').QuarterlyItem[]>} */
  quarterlyByWorkspace: new Map(),
};
