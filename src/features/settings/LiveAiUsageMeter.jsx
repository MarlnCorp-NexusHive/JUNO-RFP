import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiActivity } from "react-icons/fi";
import { isTrialUserSession } from "../rfp-collaboration/useTrialCollabT.js";
import {
  PLAN_AI,
  aiState,
  fetchTrialUsageSummary,
  fmtTok,
  loadAiSettings,
  usd,
} from "./aiSettingsStore.js";

const POLL_MS = 15_000;

function tone(pct) {
  if (pct >= 100) return { bar: "bg-red-500", text: "text-red-600 dark:text-red-400", label: "Over allowance" };
  if (pct >= 80) return { bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", label: "Near limit" };
  return { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", label: "On track" };
}

/**
 * Header-style live meter of this month's AI token use.
 * - Trial / walkthrough: real per-tenant totals from the backend, refreshed live
 *   (after every AI call, on focus, and every 15s so teammates' usage shows up).
 * - Demo: seeded sample usage from local settings.
 */
export default function LiveAiUsageMeter() {
  const isTrial = isTrialUserSession();
  const [state, setState] = useState(null);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    if (isTrial) {
      try {
        const s = await fetchTrialUsageSummary();
        setState({
          tokens: s.tokens || 0,
          allow: s.allowance || 0,
          pct: s.pct || 0,
          cost: s.cost || 0,
          cap: s.cap || 0,
          calls: s.calls || 0,
          blocked: s.blocked || "",
          plan: null,
          sample: false,
        });
        setError(false);
      } catch {
        setError(true);
      }
      return;
    }
    const { cfg, log } = loadAiSettings();
    const ws = cfg.activeWs || "w1";
    const st = aiState(cfg, log, ws);
    setState({
      tokens: st.tok,
      allow: st.allow,
      pct: st.pct,
      cost: st.cost,
      cap: st.cap,
      calls: st.calls,
      blocked: "",
      plan: PLAN_AI[cfg.ws?.[ws]?.plan]?.n || null,
      sample: true,
    });
    setError(false);
  }, [isTrial]);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener("juno:ai-usage-updated", onUpdate);
    window.addEventListener("focus", onUpdate);
    const storageKey = "juno-app-settings-ai-v1";
    const onStorage = (e) => {
      if (!isTrial && e.key === storageKey) refresh();
    };
    window.addEventListener("storage", onStorage);
    const timer = isTrial ? window.setInterval(refresh, POLL_MS) : null;
    return () => {
      window.removeEventListener("juno:ai-usage-updated", onUpdate);
      window.removeEventListener("focus", onUpdate);
      window.removeEventListener("storage", onStorage);
      if (timer) window.clearInterval(timer);
    };
  }, [isTrial, refresh]);

  if (!state && !error) return null;

  const pct = state ? Math.min(100, Math.max(0, state.pct)) : 0;
  const t = tone(state?.pct || 0);

  return (
    <Link
      to="/app/settings"
      title="Live AI token usage this month. Open Settings for details."
      className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm transition hover:border-indigo-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-500"
    >
      <FiActivity className={`h-4 w-4 shrink-0 ${t.text}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="font-medium text-gray-700 dark:text-gray-200">
            AI tokens this month
            {state?.sample ? (
              <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">sample data</span>
            ) : null}
          </span>
          <span className="tabular-nums text-gray-600 dark:text-gray-300">
            {error && !state ? (
              "Usage unavailable"
            ) : (
              <>
                <b className="text-gray-900 dark:text-white">{fmtTok(state.tokens)}</b>
                {" / "}
                {fmtTok(state.allow)}
                <span className={`ml-2 font-semibold ${t.text}`}>{Math.round(state.pct)}%</span>
              </>
            )}
          </span>
        </div>
        {state ? (
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${t.bar}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        ) : null}
        {state ? (
          <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-gray-500 dark:text-gray-400">
            <span className={t.text}>{t.label}</span>
            <span>{state.calls} AI calls</span>
            <span>{usd(state.cost)} spent{state.cap ? ` of ${usd(state.cap)} cap` : ""}</span>
            {state.blocked ? (
              <span className="font-semibold text-red-600 dark:text-red-400">
                {state.blocked === "cap" ? "Monthly spend cap reached" : "Monthly allowance used up"}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
