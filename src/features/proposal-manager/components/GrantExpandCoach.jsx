import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiInfo, FiX } from "react-icons/fi";

const STORAGE_KEY = "juno_grants_expand_hint_seen";

function readDismissed() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDismissed() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** Shared coach for “click the chevron to expand” on Grants tabs. */
export function useGrantExpandCoach() {
  const [showHint, setShowHint] = useState(() => !readDismissed());

  const dismiss = useCallback(() => {
    writeDismissed();
    setShowHint(false);
  }, []);

  useEffect(() => {
    if (readDismissed()) setShowHint(false);
  }, []);

  return { showHint, dismiss };
}

/** Pulsing ring on the first row’s expand control while the hint is visible. */
export const grantExpandChevronHintClass =
  "ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 shadow-[0_0_0_4px_rgba(99,102,241,0.25)] animate-pulse";

export function GrantExpandHintBanner({ show, onDismiss }) {
  const { t } = useTranslation("common");
  if (!show) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-950 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-100"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <FiInfo className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden />
        <p className="leading-snug">{t("proposalManagerGrants.expandHintBody")}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-indigo-300 bg-white/80 px-2.5 py-1 text-xs font-semibold text-indigo-800 hover:bg-white dark:border-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-100"
        aria-label={t("proposalManagerGrants.expandHintDismiss")}
      >
        <FiX className="h-3.5 w-3.5" aria-hidden />
        {t("proposalManagerGrants.expandHintDismiss")}
      </button>
    </div>
  );
}
