import { clearTrialSession } from "./trialAuthSession.js";

/**
 * Single-tab session & timeout manager.
 *
 * Enforces:
 * 1. Per-tab session isolation: session state lives in sessionStorage (`juno_tab_session`).
 *    Copying a post-login URL into a new tab has no sessionStorage entry → redirected to /login.
 * 2. Strict single-active-tab ownership: a lock in localStorage + BroadcastChannel ensures
 *    only ONE tab can hold an active session at a time (including catching browser "Duplicate Tab").
 * 3. 60-minute absolute session timeout with a 5-minute pre-expiry warning.
 * 4. 5-minute idle timeout based on wall-clock timestamps (handles sleep & background tabs).
 */

export const SESSION_DURATION_MS = 60 * 60 * 1000; // 60 minutes
export const SESSION_WARNING_BEFORE_MS = 5 * 60 * 1000; // warn 5 minutes before 60-min expiry
export const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes idle timeout
export const IDLE_WARNING_BEFORE_MS = 60 * 1000; // warn 60 seconds before idle logout

const TAB_SESSION_KEY = "juno_tab_session";
const ACTIVE_TAB_LOCK_KEY = "juno_active_tab_lock";
const CHANNEL_NAME = "juno_single_tab_session_v1";

function generateId() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* fallback below */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

// Unique per JS window instance — never cloned even if the browser duplicates a tab's sessionStorage.
const RUNTIME_TAB_NONCE = generateId();

let broadcastChannel = null;
function getChannel() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }
  if (!broadcastChannel) {
    try {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      broadcastChannel = null;
    }
  }
  return broadcastChannel;
}

function postChannelMessage(payload) {
  const ch = getChannel();
  if (!ch) return;
  try {
    ch.postMessage({ ...payload, runtimeNonce: RUNTIME_TAB_NONCE });
  } catch {
    /* ignore closed channel */
  }
}

function readJson(storage, key) {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore storage quota / private mode errors */
  }
}

function removeKey(storage, key) {
  try {
    storage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function getTabSession() {
  if (typeof window === "undefined") return null;
  const session = readJson(window.sessionStorage, TAB_SESSION_KEY);
  if (!session || !session.tabId || !session.sessionId) return null;
  return session;
}

export function getActiveTabLock() {
  if (typeof window === "undefined") return null;
  return readJson(window.localStorage, ACTIVE_TAB_LOCK_KEY);
}

/**
 * Call immediately after a successful login (demo or trial).
 * Claims single-tab ownership and notifies any other open tabs to sign out.
 */
export function startTabSession(user) {
  if (typeof window === "undefined") return null;
  const now = Date.now();
  const tabId = generateId();
  const sessionId = generateId();

  const session = {
    tabId,
    sessionId,
    userId: user?.id || user?.username || user?.email || "user",
    startedAt: now,
    expiresAt: now + SESSION_DURATION_MS,
    lastActivityAt: now,
  };

  writeJson(window.sessionStorage, TAB_SESSION_KEY, session);
  writeJson(window.localStorage, ACTIVE_TAB_LOCK_KEY, {
    tabId,
    sessionId,
    claimedAt: now,
  });

  postChannelMessage({
    type: "SESSION_CLAIMED",
    tabId,
    sessionId,
  });

  return session;
}

let lastActivityWriteMs = 0;

/**
 * Updates lastActivityAt in this tab's sessionStorage (throttled to 1 write/sec).
 */
export function touchTabActivity(now = Date.now(), force = false) {
  if (typeof window === "undefined") return null;
  if (!force && now - lastActivityWriteMs < 1000) {
    return getTabSession();
  }
  const session = getTabSession();
  if (!session) return null;
  lastActivityWriteMs = now;
  const updated = { ...session, lastActivityAt: now };
  writeJson(window.sessionStorage, TAB_SESSION_KEY, updated);
  return updated;
}

/**
 * Extends the 60-minute absolute session and resets idle time when the user
 * clicks "Continue" in the top-right session warning popup.
 */
export function extendTabSession(now = Date.now()) {
  if (typeof window === "undefined") return null;
  const session = getTabSession();
  if (!session) return null;
  lastActivityWriteMs = now;
  const updated = {
    ...session,
    expiresAt: now + SESSION_DURATION_MS,
    lastActivityAt: now,
  };
  writeJson(window.sessionStorage, TAB_SESSION_KEY, updated);
  return updated;
}

/**
 * Synchronously validates whether the current tab holds a live, non-expired,
 * non-idle session. Used directly during render to prevent any flash of protected UI.
 */
export function validateTabSession(now = Date.now()) {
  if (typeof window === "undefined") {
    return { valid: false, reason: "no_session" };
  }

  const session = getTabSession();
  if (!session) {
    return { valid: false, reason: "no_session" };
  }

  const currentUser = readJson(window.localStorage, "rbac_current_user");
  if (!currentUser) {
    return { valid: false, reason: "no_session" };
  }

  const lock = getActiveTabLock();
  if (!lock || lock.tabId !== session.tabId || lock.sessionId !== session.sessionId) {
    return { valid: false, reason: "another_tab" };
  }

  if (typeof session.expiresAt === "number" && now >= session.expiresAt) {
    return { valid: false, reason: "session_expired", session };
  }

  if (
    typeof session.lastActivityAt === "number" &&
    now - session.lastActivityAt >= IDLE_TIMEOUT_MS
  ) {
    return { valid: false, reason: "idle_timeout", session };
  }

  return { valid: true, session };
}

/**
 * Ends this tab's session.
 * - When `clearSharedAuth` is true (explicit logout, session expiry, idle timeout),
 *   clears shared auth keys ONLY if this tab owns the active lock (or no lock exists),
 *   so an unauthenticated new tab never disrupts an already-active tab.
 */
export function endTabSession({ clearSharedAuth = true, broadcast = false } = {}) {
  if (typeof window === "undefined") return;
  const session = getTabSession();
  const lock = getActiveTabLock();
  const ownsLock =
    !lock ||
    (session && lock.tabId === session.tabId && lock.sessionId === session.sessionId);

  removeKey(window.sessionStorage, TAB_SESSION_KEY);

  if (clearSharedAuth && ownsLock) {
    removeKey(window.localStorage, "rbac_current_user");
    removeKey(window.localStorage, ACTIVE_TAB_LOCK_KEY);
    clearTrialSession();
    try {
      window.localStorage.removeItem("juno_rfp_collab_session");
    } catch {
      /* ignore */
    }
    if (broadcast && session) {
      postChannelMessage({
        type: "SESSION_ENDED",
        tabId: session.tabId,
        sessionId: session.sessionId,
      });
    }
  }
}

/**
 * Subscribes to cross-tab signals so:
 * 1. If another tab logs in, this tab immediately signs out ("another_tab").
 * 2. If this tab was created via browser "Duplicate Tab" (cloning sessionStorage),
 *    the original tab responds to PING_ACTIVE_TAB and the duplicate signs out ("duplicate_tab").
 */
export function subscribeSingleTabEnforcement(onInvalidated) {
  if (typeof window === "undefined") return () => {};

  const ch = getChannel();

  const handleChannelMessage = (event) => {
    const msg = event?.data;
    if (!msg || msg.runtimeNonce === RUNTIME_TAB_NONCE) return;

    const current = getTabSession();
    if (!current) return;

    if (msg.type === "SESSION_CLAIMED") {
      if (msg.tabId !== current.tabId || msg.sessionId !== current.sessionId) {
        endTabSession({ clearSharedAuth: false });
        onInvalidated("another_tab");
      }
      return;
    }

    if (msg.type === "SESSION_ENDED") {
      if (msg.tabId === current.tabId && msg.sessionId === current.sessionId) {
        endTabSession({ clearSharedAuth: false });
        onInvalidated("logged_out");
      }
      return;
    }

    // Duplicate-tab detection: original tab answers PING with PONG
    if (msg.type === "PING_ACTIVE_TAB") {
      if (msg.tabId === current.tabId && msg.sessionId === current.sessionId) {
        postChannelMessage({
          type: "PONG_ACTIVE_TAB",
          tabId: current.tabId,
          sessionId: current.sessionId,
        });
      }
      return;
    }

    // The newly duplicated tab receives PONG from the already-open original tab
    if (msg.type === "PONG_ACTIVE_TAB") {
      if (msg.tabId === current.tabId && msg.sessionId === current.sessionId) {
        endTabSession({ clearSharedAuth: false });
        onInvalidated("duplicate_tab");
      }
    }
  };

  const handleStorageEvent = (event) => {
    if (event.key !== ACTIVE_TAB_LOCK_KEY && event.key !== "rbac_current_user") {
      return;
    }
    const current = getTabSession();
    if (!current) return;

    if (event.key === "rbac_current_user" && !event.newValue) {
      endTabSession({ clearSharedAuth: false });
      onInvalidated("logged_out");
      return;
    }

    if (event.key === ACTIVE_TAB_LOCK_KEY) {
      if (!event.newValue) {
        endTabSession({ clearSharedAuth: false });
        onInvalidated("logged_out");
        return;
      }
      try {
        const nextLock = JSON.parse(event.newValue);
        if (nextLock?.tabId !== current.tabId || nextLock?.sessionId !== current.sessionId) {
          endTabSession({ clearSharedAuth: false });
          onInvalidated("another_tab");
        }
      } catch {
        /* ignore */
      }
    }
  };

  if (ch) {
    ch.addEventListener("message", handleChannelMessage);
  }
  window.addEventListener("storage", handleStorageEvent);

  // Immediately probe for an already-live tab sharing our cloned tabId (browser Duplicate Tab)
  const initial = getTabSession();
  if (initial) {
    postChannelMessage({
      type: "PING_ACTIVE_TAB",
      tabId: initial.tabId,
      sessionId: initial.sessionId,
    });
  }

  return () => {
    if (ch) {
      ch.removeEventListener("message", handleChannelMessage);
    }
    window.removeEventListener("storage", handleStorageEvent);
  };
}
