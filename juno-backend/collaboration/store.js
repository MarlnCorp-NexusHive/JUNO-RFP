import { EventEmitter } from "events";
import crypto from "crypto";

/** Broadcasts activity entries for SSE subscribers (same shape as log lines). */
export const activityBus = new EventEmitter();
activityBus.setMaxListeners(100);

export function generateId(prefix) {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
}

const MAX_COLLAB_SESSIONS = 2000;

export const store = {
  /** @type {Map<string, import('./types.js').UserRecord>} */
  usersById: new Map(),
  /** @type {Map<string, string>} email lower -> userId */
  usersByEmail: new Map(),
  /** @type {Map<string, { userId: string, createdAt: string }>} opaque session token -> user */
  sessionsByToken: new Map(),
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

/** Issue an opaque cryptographic session token bound to a collaboration userId. */
export function issueCollabToken(userId) {
  const token = `cs_${crypto.randomBytes(32).toString("hex")}`;
  store.sessionsByToken.set(token, {
    userId,
    createdAt: new Date().toISOString(),
  });
  while (store.sessionsByToken.size > MAX_COLLAB_SESSIONS) {
    const oldest = store.sessionsByToken.keys().next().value;
    if (oldest === undefined) break;
    store.sessionsByToken.delete(oldest);
  }
  return token;
}

/** Resolve an opaque session token to its UserRecord. Never accepts raw userIds. */
export function resolveCollabToken(token) {
  if (!token || typeof token !== "string") return null;
  const session = store.sessionsByToken.get(token);
  if (!session?.userId) return null;
  return store.usersById.get(session.userId) || null;
}
