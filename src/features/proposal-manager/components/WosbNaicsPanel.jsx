import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiExternalLink, FiSearch } from "react-icons/fi";
import {
  WOSB_ELIGIBLE_NAICS,
  WOSB_NAICS_EFFECTIVE_DATE,
  WOSB_NAICS_SOURCE_URL,
} from "../data/wosbEligibleNaics.js";
import {
  GRANARY_CARD,
  GRANARY_CHIP,
  GRANARY_INPUT,
  GRANARY_PANEL,
} from "../../../styles/granarySurfaces.js";

const FILTERS = [
  { id: "all", labelKey: "wosbFilterAll" },
  { id: "WOSB", labelKey: "wosbFilterWosb" },
  { id: "EDWOSB", labelKey: "wosbFilterEdwosb" },
];

function formatEffectiveDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function WosbNaicsPanel() {
  const { t } = useTranslation("common");
  const [query, setQuery] = useState("");
  const [setAsideFilter, setSetAsideFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return WOSB_ELIGIBLE_NAICS.filter((row) => {
      if (setAsideFilter !== "all" && row.setAside !== setAsideFilter) return false;
      if (!q) return true;
      return row.code.includes(q) || row.title.toLowerCase().includes(q);
    });
  }, [query, setAsideFilter]);

  return (
    <section className="space-y-4" aria-label={t("proposalManagerGrants.wosbPanelLabel")}>
      <header className={`${GRANARY_PANEL} space-y-3`}>
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3D4F66] dark:text-[#B8C5D6]">
            {t("proposalManagerGrants.wosbEyebrow")}
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {t("proposalManagerGrants.wosbTitle")}
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {t("proposalManagerGrants.wosbSubtitle")}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block min-w-0 flex-1 sm:max-w-md">
            <span className="sr-only">{t("proposalManagerGrants.wosbSearchLabel")}</span>
            <FiSearch
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("proposalManagerGrants.wosbSearchPlaceholder")}
              className={`${GRANARY_INPUT} pl-9`}
              autoComplete="off"
            />
          </label>

          <div
            role="group"
            aria-label={t("proposalManagerGrants.wosbFilterLabel")}
            className="inline-flex rounded-[10px] border border-[#D8E0EA] bg-[#F4F6F9] p-1 dark:border-[#2A3548] dark:bg-[#0B1017]"
          >
            {FILTERS.map((f) => {
              const active = setAsideFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSetAsideFilter(f.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "bg-white text-slate-900 shadow-sm dark:bg-[#151D2A] dark:text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                  }`}
                >
                  {t(`proposalManagerGrants.${f.labelKey}`)}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t("proposalManagerGrants.wosbResultCount", { count: filtered.length })}
        </p>
      </header>

      <div className={`${GRANARY_CARD} overflow-hidden`}>
        <div className="max-h-[min(70vh,40rem)] overflow-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              {t("proposalManagerGrants.wosbEmpty")}
            </p>
          ) : (
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[#F4F6F9] dark:bg-[#0B1017]">
                <tr className="border-b border-[#D8E0EA] text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-[#2A3548] dark:text-slate-400">
                  <th className="px-4 py-3">{t("proposalManagerGrants.wosbColCode")}</th>
                  <th className="px-4 py-3">{t("proposalManagerGrants.wosbColTitle")}</th>
                  <th className="px-4 py-3">{t("proposalManagerGrants.wosbColSetAside")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.code}
                    className="border-b border-[#D8E0EA]/80 last:border-0 dark:border-[#2A3548]/80"
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                      {row.code}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200">{row.title}</td>
                    <td className="px-4 py-2.5">
                      <span className={GRANARY_CHIP}>{row.setAside}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        <span>
          {t("proposalManagerGrants.wosbSourceCitation", {
            date: formatEffectiveDate(WOSB_NAICS_EFFECTIVE_DATE),
          })}
        </span>
        <a
          href={WOSB_NAICS_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-[#3D4F66] hover:underline dark:text-[#B8C5D6]"
        >
          {t("proposalManagerGrants.wosbSourceLink")}
          <FiExternalLink className="h-3 w-3" aria-hidden />
        </a>
      </footer>
    </section>
  );
}
