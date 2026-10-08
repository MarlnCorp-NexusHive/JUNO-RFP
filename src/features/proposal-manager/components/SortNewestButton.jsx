import React from "react";
import { useTranslation } from "react-i18next";
import { FiClock } from "react-icons/fi";

/**
 * Toggle to sort the current results list newest-first.
 * Use size="bar" inside search filter rows (matches Search button height).
 */
export default function SortNewestButton({ active, onToggle, className = "", size = "bar" }) {
  const { t } = useTranslation("common");
  const bar = size === "bar";
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      title={t("proposalManagerGrants.sortNewestTitle")}
      className={`inline-flex items-center justify-center gap-1.5 border font-semibold transition ${
        bar
          ? "min-h-[42px] rounded-xl px-3 py-2.5 text-sm"
          : "rounded-lg px-2.5 py-1.5 text-xs"
      } ${
        active
          ? "border-indigo-400 bg-indigo-50 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-100"
          : "border-slate-300 bg-white text-slate-700 hover:border-indigo-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
      } ${className}`}
    >
      <FiClock className={bar ? "h-4 w-4" : "h-3.5 w-3.5"} aria-hidden />
      {active ? t("proposalManagerGrants.sortNewestOn") : t("proposalManagerGrants.sortNewest")}
    </button>
  );
}
