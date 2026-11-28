import React, { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  IDLE_TIMEOUT_MS,
  IDLE_WARNING_BEFORE_MS,
  SESSION_WARNING_BEFORE_MS,
  endTabSession,
  extendTabSession,
  getTabSession,
  subscribeSingleTabEnforcement,
  touchTabActivity,
  validateTabSession,
} from "../services/tabSessionManager.js";

function sendMonitoringHeartbeat(event, pathname, sessionOverride = null) {
  try {
    const session = sessionOverride || getTabSession();
    if (!session?.sessionId) return;
    let userObj = null;
    try {
      userObj = JSON.parse(window.localStorage.getItem("rbac_current_user") || "null");
    } catch {
      userObj = null;
    }
    const payload = {
      event,
      sessionId: session.sessionId,
      user: userObj?.displayName || userObj?.name || userObj?.username || userObj?.email || session.userId || "User",
      role: userObj?.role || "User",
      path: pathname || window.location.pathname || "/",
      durationSec: Math.max(0, Math.round((Date.now() - (session.startedAt || Date.now())) / 1000)),
    };
    const body = JSON.stringify(payload);
    if (event !== "ping" && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon("/monitoring/heartbeat", new Blob([body], { type: "application/json" }));
      return;
    }
    fetch("/monitoring/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: event !== "ping",
    }).catch(() => {});
  } catch {
    /* non-blocking telemetry */
  }
}

const PUBLIC_EXACT_PATHS = new Set([
  "/",
  "/login",
  "/cookie-policy",
  "/privacy-policy",
  "/subprocessors",
  "/terms",
  "/corporate-info",
  "/unauthorized",
]);

function isPublicPath(pathname) {
  if (!pathname) return true;
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (PUBLIC_EXACT_PATHS.has(normalized)) return true;
  if (normalized === "/collaboration" || normalized.startsWith("/collaboration/")) {
    return true;
  }
  return false;
}

function formatCountdown(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function SessionManagerGuard({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const publicRoute = isPublicPath(location.pathname);

  // Warning banner state: { kind: "session" | "idle", remainingMs: number } | null
  const [warning, setWarning] = useState(null);
  const redirectingRef = useRef(false);

  // Synchronous check on every render for protected routes to avoid any flash of protected UI
  const validation = publicRoute ? { valid: true } : validateTabSession();

  const redirectToLogin = useCallback(
    (reason, clearSharedAuth) => {
      if (redirectingRef.current) return;
      redirectingRef.current = true;
      setWarning(null);
      if (reason === "session_expired" || reason === "idle_timeout" || reason === "logged_out") {
        const evt = reason === "session_expired" ? "expired" : reason === "idle_timeout" ? "idle_timeout" : "logout";
        sendMonitoringHeartbeat(evt, location.pathname);
      }
      endTabSession({ clearSharedAuth });
      const query = reason ? `?reason=${encodeURIComponent(reason)}` : "";
      navigate(`/login${query}`, { replace: true });
    },
    [navigate, location.pathname],
  );

  // Reset redirect guard whenever route changes to a valid protected session or public page
  useEffect(() => {
    redirectingRef.current = false;
    if (publicRoute) {
      setWarning(null);
    }
  }, [location.pathname, publicRoute]);

  // If synchronous validation failed on render, clean up appropriately before Navigate renders
  useEffect(() => {
    if (!publicRoute && !validation.valid) {
      const shouldClearShared =
        validation.reason === "session_expired" || validation.reason === "idle_timeout";
      endTabSession({ clearSharedAuth: shouldClearShared });
    }
  }, [publicRoute, validation.valid, validation.reason]);

  // Single-tab enforcement + 60-min session timer + 5-min idle timer
  useEffect(() => {
    if (publicRoute || !validation.valid) return undefined;

    const handleActivity = () => {
      touchTabActivity(Date.now());
      // If an idle warning was showing, user activity immediately clears it
      setWarning((prev) => (prev?.kind === "idle" ? null : prev));
    };

    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "pointerdown",
    ];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleActivity, { passive: true });
    });

    const unsubscribeCrossTab = subscribeSingleTabEnforcement((reason) => {
      redirectToLogin(reason, false);
    });

    const evaluateTimers = () => {
      const now = Date.now();
      const check = validateTabSession(now);
      if (!check.valid) {
        const shouldClearShared =
          check.reason === "session_expired" || check.reason === "idle_timeout";
        redirectToLogin(check.reason, shouldClearShared);
        return;
      }

      const { session } = check;
      const sessionRemaining = session.expiresAt - now;
      const idleRemaining = IDLE_TIMEOUT_MS - (now - session.lastActivityAt);

      // Prioritize whichever threshold is closer / active
      if (sessionRemaining <= SESSION_WARNING_BEFORE_MS) {
        setWarning({ kind: "session", remainingMs: sessionRemaining });
      } else if (idleRemaining <= IDLE_WARNING_BEFORE_MS) {
        setWarning({ kind: "idle", remainingMs: idleRemaining });
      } else {
        setWarning((prev) => (prev ? null : prev));
      }
    };

    evaluateTimers();
    sendMonitoringHeartbeat("ping", location.pathname);
    const intervalId = window.setInterval(evaluateTimers, 1000);
    const heartbeatId = window.setInterval(() => {
      sendMonitoringHeartbeat("ping", window.location.pathname);
    }, 30_000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        evaluateTimers();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    return () => {
      window.clearInterval(intervalId);
      window.clearInterval(heartbeatId);
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      unsubscribeCrossTab();
    };
  }, [publicRoute, validation.valid, redirectToLogin, location.pathname]);

  const handleContinueSession = () => {
    extendTabSession(Date.now());
    setWarning(null);
  };

  const handleSignOutNow = () => {
    redirectToLogin("logged_out", true);
  };

  if (!publicRoute && !validation.valid) {
    const reason = validation.reason || "no_session";
    return <Navigate to={`/login?reason=${encodeURIComponent(reason)}`} replace />;
  }

  return (
    <>
      {children}

      {!publicRoute && warning && (
        <div
          role="alertdialog"
          aria-live="assertive"
          aria-label="Session expiring soon"
          className="fixed top-4 right-4 z-[9999] w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-amber-300/80 bg-white/95 p-4 text-slate-900 shadow-2xl backdrop-blur-md dark:border-amber-500/40 dark:bg-slate-900/95 dark:text-slate-100"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {warning.kind === "idle" ? "Inactivity Warning" : "Session Expiring Soon"}
                </h3>
                <span className="rounded-md bg-amber-100 px-2 py-0.5 font-mono text-xs font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                  {formatCountdown(warning.remainingMs)}
                </span>
              </div>

              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {warning.kind === "idle"
                  ? "You have been inactive. Your session will expire soon — please click here to continue."
                  : "Your session will expire soon. Please click here to continue."}
              </p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleContinueSession}
                  className="flex-1 rounded-lg bg-[#243F5B] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#2E4F70] focus:outline-none focus:ring-2 focus:ring-[#4F85B5]/50 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                >
                  Click here to continue
                </button>
                <button
                  type="button"
                  onClick={handleSignOutNow}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
