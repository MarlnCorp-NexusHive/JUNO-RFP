import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiActivity, FiRefreshCw, FiSend, FiUsers, FiUser, FiX } from "react-icons/fi";
import { useLocalization } from "../../hooks/useLocalization";
import { getTrialSession } from "../../services/trialAuthSession.js";
import { isTrialUserSession } from "../rfp-collaboration/useTrialCollabT.js";
import { colorForKey, initialsOf } from "../settings/aiSettingsStore.js";
import {
  fetchTrialActivity,
  loadDemoActivity,
  postTrialActivity,
  saveDemoActivity,
} from "./activityApi.js";

const POLL_MS = 15_000;

function relativeTime(iso) {
  if (!iso) return "";
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function GlobalActivityWidget() {
  const { isRTLMode } = useLocalization();
  const isTrial = isTrialUserSession();
  const session = getTrialSession();

  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState("team"); // "team" | "mine"
  const [items, setItems] = useState(() => (isTrial ? [] : loadDemoActivity()));
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [posting, setPosting] = useState(false);

  const currentUserId = isTrial
    ? session?.user?.id || session?.user?.email || ""
    : "ana";
  const currentUserEmail = isTrial ? session?.user?.email || "" : "ana@brightfutures.org";

  const isMine = useCallback(
    (item) =>
      Boolean(
        item &&
          ((currentUserId && item.userId === currentUserId) ||
            (currentUserEmail && item.userEmail === currentUserEmail)),
      ),
    [currentUserId, currentUserEmail],
  );

  const refresh = useCallback(
    async ({ silent = false } = {}) => {
      if (!isTrial) {
        setItems(loadDemoActivity());
        return;
      }
      if (!silent) setLoading(true);
      try {
        // Always fetch full team feed so both Team and Yourself counts stay accurate.
        const res = await fetchTrialActivity("team", 100);
        setItems(Array.isArray(res?.items) ? res.items : []);
      } catch {
        /* non-blocking */
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [isTrial],
  );

  useEffect(() => {
    void refresh({ silent: true });
    const onUpdated = () => void refresh({ silent: true });
    window.addEventListener("juno:activity-updated", onUpdated);
    window.addEventListener("focus", onUpdated);
    const timer = isTrial ? window.setInterval(onUpdated, POLL_MS) : null;
    return () => {
      window.removeEventListener("juno:activity-updated", onUpdated);
      window.removeEventListener("focus", onUpdated);
      if (timer) window.clearInterval(timer);
    };
  }, [isTrial, refresh]);

  useEffect(() => {
    if (open) void refresh({ silent: false });
  }, [open, refresh]);

  const visibleItems = useMemo(() => {
    if (scope === "mine") return items.filter(isMine);
    return items;
  }, [items, scope, isMine]);

  const mineCount = useMemo(() => items.filter(isMine).length, [items, isMine]);

  const onPostNote = async (e) => {
    e.preventDefault();
    const text = note.trim();
    if (!text || posting) return;
    setPosting(true);
    try {
      if (isTrial) {
        const res = await postTrialActivity({ area: "Team update", action: text });
        if (res?.item) {
          setItems((prev) => [res.item, ...prev]);
        } else {
          await refresh({ silent: true });
        }
      } else {
        const entry = {
          id: `da_${Date.now().toString(36)}`,
          userId: "ana",
          userName: "Ana López",
          userEmail: "ana@brightfutures.org",
          area: "Team update",
          action: text,
          detail: "",
          at: new Date().toISOString(),
        };
        const next = [entry, ...items];
        setItems(next);
        saveDemoActivity(next);
      }
      setNote("");
    } catch {
      /* ignore */
    } finally {
      setPosting(false);
    }
  };

  const side = isRTLMode ? "left-5" : "right-5";

  return (
    <div className={`fixed bottom-24 ${side} z-[46] flex flex-col items-end gap-3`}>
      {open ? (
        <div
          role="dialog"
          aria-label="Organization activity log"
          className="w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FiActivity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Activity log
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void refresh({ silent: false })}
                title="Refresh activity"
                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close activity log"
                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                <FiX className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          {/* Team vs Yourself toggle */}
          <div className="flex items-center gap-1.5 border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-950/50">
            <button
              type="button"
              onClick={() => setScope("team")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                scope === "team"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-200/70 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              <FiUsers className="h-3.5 w-3.5" aria-hidden />
              Team
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  scope === "team"
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {items.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setScope("mine")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                scope === "mine"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-200/70 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              <FiUser className="h-3.5 w-3.5" aria-hidden />
              Yourself
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  scope === "mine"
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {mineCount}
              </span>
            </button>
          </div>

          {/* Quick post update */}
          <form
            onSubmit={onPostNote}
            className="flex items-center gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-800"
          >
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Post a quick team update…"
              className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={!note.trim() || posting}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              <FiSend className="h-3 w-3" aria-hidden />
              Log
            </button>
          </form>

          {/* Feed list */}
          <div className="max-h-[360px] divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
            {visibleItems.length ? (
              visibleItems.map((item) => {
                const mine = isMine(item);
                return (
                  <div key={item.id} className="flex items-start gap-2.5 px-4 py-3">
                    <span
                      className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ background: colorForKey(item.userId || item.userName) }}
                    >
                      {initialsOf(item.userName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-gray-900 dark:text-white">
                          {item.userName}
                          {mine ? (
                            <span className="ml-1.5 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                              You
                            </span>
                          ) : null}
                        </span>
                        <span className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
                          {relativeTime(item.at)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-700 dark:text-gray-200">
                        {item.action}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          {item.area}
                        </span>
                        {item.detail ? (
                          <span className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                            {item.detail}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-10 text-center text-xs text-gray-500 dark:text-gray-400">
                {scope === "mine"
                  ? "No activity from you yet. Actions you take across JUNO will appear here."
                  : "No organization activity yet. Actions by you and your teammates will appear here in real time."}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Floating trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Open activity log"
        title="Organization activity log"
        className="relative flex h-12 w-12 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-600 text-white shadow-lg transition hover:scale-105 hover:bg-indigo-700"
      >
        <FiActivity className="h-5 w-5" aria-hidden />
        {items.length > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white shadow">
            {items.length > 99 ? "99+" : items.length}
          </span>
        ) : null}
      </button>
    </div>
  );
}
