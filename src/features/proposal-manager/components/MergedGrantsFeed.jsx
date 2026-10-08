import React, { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiAlertCircle,
  FiCalendar,
  FiChevronDown,
  FiDollarSign,
  FiExternalLink,
  FiLoader,
  FiRefreshCw,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { useLocalization } from "../../../hooks/useLocalization";
import {
  searchAltGrants,
  searchAssistanceListings,
  searchCaGrants,
  searchFac,
  searchFederalGrants,
  searchNihReporter,
  searchNsfAwards,
  searchSbir,
  searchUsaSpending,
} from "../../../services/api.js";
import {
  buildHourlySamView,
  filterSamOpportunities,
} from "../data/samContractOpportunities.js";
import GrantSourceBadge from "./GrantSourceBadge.jsx";
import OpportunityShortlistButton from "./OpportunityShortlistButton.jsx";
import {
  GrantExpandHintBanner,
  grantExpandChevronHintClass,
  useGrantExpandCoach,
} from "./GrantExpandCoach.jsx";
import { filterOpenListings } from "../services/openListingFilter.js";
import { sortByNewest } from "../services/listingSort.js";
import SortNewestButton from "./SortNewestButton.jsx";
import { formatDateTime24 } from "../../../utils/dateTime";

/** Sources that are open pursuits (not historical award intel). */
const OPEN_PURSUIT_SOURCES = new Set([
  "grants",
  "private",
  "local",
  "contracts",
  "ca",
  "sbir",
  "assistance",
]);

const PER_SOURCE = 12;

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500";

function daysUntil(value) {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    const m = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    const d = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
    if (Number.isNaN(d.getTime())) return null;
    return Math.ceil((d.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  }
  return Math.ceil((parsed - Date.now()) / (24 * 60 * 60 * 1000));
}

function urgencyTone(days) {
  if (days == null) return "";
  if (days < 0) return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  if (days <= 7) return "bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-200";
  if (days <= 14) return "bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100";
  if (days <= 30) return "bg-yellow-100 text-yellow-950 dark:bg-yellow-950/40 dark:text-yellow-100";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
}

function shortlistSourceFor(modeId) {
  if (modeId === "contracts") return "sam";
  if (modeId === "private" || modeId === "local") return "alt";
  return modeId;
}

function normalizeItem(sourceId, hit) {
  const id = String(hit.id || hit.noticeId || hit.number || "").trim();
  if (!id) return null;
  return {
    key: `${sourceId}:${id}`,
    sourceId,
    shortlistSource: shortlistSourceFor(sourceId),
    id,
    title: hit.title || hit.name || "Untitled",
    number: hit.number || hit.noticeId || hit.id || "",
    agency: hit.agency || hit.agencyCode || hit.funder || hit.organization || hit.company || "",
    deadline: hit.deadline || hit.closeDate || hit.responseDeadline || "",
    openDate: hit.openDate || hit.postedDate || hit.postingDate || "",
    postedDate: hit.postedDate || hit.openDate || "",
    status: hit.status || hit.oppStatus || "",
    amountLabel: hit.amountLabel || hit.awardLabel || hit.awardCeilingLabel || hit.amount || hit.awardCeiling || "",
    summary: hit.summary || hit.description || "",
    url: hit.url || hit.samUrl || "",
    eligibility: hit.eligibility,
    applicantTypes: hit.applicantTypes,
    pi: hit.pi,
    raw: hit,
  };
}

/** Round-robin so sources appear interleaved (jumbled), not stacked by source. */
function interleaveBySource(groups) {
  const lists = groups.filter((g) => g.length);
  const out = [];
  const max = Math.max(0, ...lists.map((g) => g.length));
  for (let i = 0; i < max; i += 1) {
    for (const list of lists) {
      if (i < list.length) out.push(list[i]);
    }
  }
  return out;
}

async function fetchSourceResults(sourceId, keyword) {
  const kw = String(keyword || "").trim();
  try {
    switch (sourceId) {
      case "grants": {
        const data = await searchFederalGrants({
          keyword: kw,
          oppStatuses: "posted",
          rows: PER_SOURCE,
          startRecordNum: 0,
        });
        return (data.results || [])
          .map((h) =>
            normalizeItem("grants", {
              ...h,
              deadline: h.closeDate,
              status: h.oppStatus,
              agency: h.agency || h.agencyCode,
            }),
          )
          .filter(Boolean)
          .filter((h) => !/^forecasted$/i.test(String(h.status || "")));
      }
      case "private":
      case "local": {
        const data = await searchAltGrants({
          variant: sourceId,
          keyword: kw,
          status: sourceId === "local" ? "Open" : "",
          rows: PER_SOURCE,
          page: 0,
        });
        return (data.results || [])
          .map((h) =>
            normalizeItem(sourceId, {
              ...h,
              deadline: h.closeDate,
              agency: h.funder,
              amountLabel: h.awardLabel || h.awardMax,
              summary: h.description,
            }),
          )
          .filter(Boolean)
          .filter((h) => !/^forecasted$/i.test(String(h.status || "")));
      }
      case "contracts": {
        const view = buildHourlySamView();
        const filtered = filterSamOpportunities(view.opportunities, { keyword: kw });
        return filtered
          .slice(0, PER_SOURCE)
          .map((h) =>
            normalizeItem("contracts", {
              ...h,
              id: h.id || h.noticeId,
              number: h.noticeId,
              agency: h.agencyCode,
              deadline: h.responseDeadline,
              url: h.samUrl,
              amountLabel: h.awardCeilingLabel || h.awardCeiling,
              summary: h.description,
            }),
          )
          .filter(Boolean);
      }
      case "sbir": {
        const data = await searchSbir({
          kind: "topics",
          keyword: kw,
          page: 0,
          rows: PER_SOURCE,
          status: "Open",
        });
        return (data.results || []).map((h) => normalizeItem("sbir", h)).filter(Boolean);
      }
      case "ca": {
        const data = await searchCaGrants({
          keyword: kw,
          page: 0,
          rows: PER_SOURCE,
          status: "active",
        });
        return (data.results || [])
          .map((h) => normalizeItem("ca", h))
          .filter(Boolean)
          .filter((h) => !/closed|inactive|forecast/i.test(String(h.status || "")));
      }
      case "assistance": {
        const data = await searchAssistanceListings({
          keyword: kw,
          page: 0,
          rows: PER_SOURCE,
          status: "Active",
        });
        return (data.results || [])
          .map((h) => normalizeItem("assistance", h))
          .filter(Boolean)
          .filter((h) => !/inactive|closed/i.test(String(h.status || "")));
      }
      case "usaspending": {
        const data = await searchUsaSpending({
          keyword: kw,
          page: 1,
          rows: PER_SOURCE,
          awardKind: "all",
        });
        return (data.results || []).map((h) => normalizeItem("usaspending", h)).filter(Boolean);
      }
      case "nih": {
        const data = await searchNihReporter({
          keyword: kw,
          page: 0,
          rows: PER_SOURCE,
        });
        return (data.results || []).map((h) => normalizeItem("nih", h)).filter(Boolean);
      }
      case "nsf": {
        const data = await searchNsfAwards({
          keyword: kw,
          page: 0,
          rows: PER_SOURCE,
        });
        return (data.results || []).map((h) => normalizeItem("nsf", h)).filter(Boolean);
      }
      case "fac": {
        const data = await searchFac({
          keyword: kw,
          page: 0,
          rows: PER_SOURCE,
        });
        return (data.results || []).map((h) => normalizeItem("fac", h)).filter(Boolean);
      }
      default:
        return [];
    }
  } catch (err) {
    console.warn(`[merged-grants] ${sourceId} failed:`, err?.message || err);
    return [];
  }
}

/**
 * Combined feed for multi-selected Grants sources — round-robin interleaved rows.
 */
export default function MergedGrantsFeed({ selectedModes = [] }) {
  const { t } = useTranslation("common");
  const { isRTLMode } = useLocalization();
  const formId = useId();
  const { showHint, dismiss: dismissExpandHint } = useGrantExpandCoach();

  const [draftKeyword, setDraftKeyword] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);
  const [sourceCounts, setSourceCounts] = useState({});
  const [fetchedAt, setFetchedAt] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [sortNewest, setSortNewest] = useState(false);

  const modesKey = selectedModes.join("|");

  const runSearch = useCallback(
    async (nextKeyword = keyword) => {
      const modes = selectedModes.filter(Boolean);
      if (!modes.length) {
        setResults([]);
        return;
      }
      setLoading(true);
      setError("");
      setExpandedId(null);
      try {
        const settled = await Promise.all(
          modes.map(async (id) => {
            const items = await fetchSourceResults(id, nextKeyword);
            return { id, items };
          }),
        );
        const counts = {};
        const groups = settled.map(({ id, items }) => {
          const kept = OPEN_PURSUIT_SOURCES.has(id)
            ? filterOpenListings(items, {
                statusKeys: ["status"],
                deadlineKeys: ["deadline", "closeDate", "responseDeadline"],
              })
            : items;
          counts[id] = kept.length;
          return kept;
        });
        setSourceCounts(counts);
        setResults(interleaveBySource(groups));
        setKeyword(nextKeyword);
        setFetchedAt(new Date().toISOString());
      } catch (err) {
        setError(err?.message || t("proposalManagerGrants.mergedSearchFailed"));
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [keyword, selectedModes, t],
  );

  const displayResults = useMemo(
    () => (sortNewest ? sortByNewest(results) : results),
    [results, sortNewest],
  );

  useEffect(() => {
    runSearch("");
    setDraftKeyword("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modesKey]);

  const onSubmit = (e) => {
    e.preventDefault();
    runSearch(draftKeyword.trim());
  };

  return (
    <div className="space-y-5" dir={isRTLMode ? "rtl" : "ltr"}>
      <header className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              {t("proposalManagerGrants.mergedEyebrow")}
            </p>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              {t("proposalManagerGrants.mergedTitle")}
            </h2>
          </div>
          {fetchedAt ? (
            <p className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800">
              {t("proposalManagerGrants.mergedFetched", { time: formatDateTime24(fetchedAt) })}
            </p>
          ) : null}
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {t("proposalManagerGrants.mergedSubtitle", { count: selectedModes.length })}
        </p>
      </header>

      <section
        aria-labelledby={`${formId}-legend`}
        className="sticky top-0 z-20 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-1.5">
            <label htmlFor={`${formId}-kw`} id={`${formId}-legend`} className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {t("proposalManagerGrants.keyword")}
            </label>
            <div className="relative">
              <FiSearch className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                id={`${formId}-kw`}
                value={draftKeyword}
                onChange={(e) => setDraftKeyword(e.target.value)}
                placeholder={t("proposalManagerGrants.mergedKeywordPlaceholder")}
                className={`${inputClass} ps-10`}
              />
              {draftKeyword ? (
                <button
                  type="button"
                  onClick={() => setDraftKeyword("")}
                  className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                  aria-label={t("proposalManagerGrants.clearKeyword")}
                >
                  <FiX className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <SortNewestButton active={sortNewest} onToggle={() => setSortNewest((v) => !v)} />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {loading ? <FiLoader className="h-4 w-4 animate-spin" aria-hidden /> : <FiSearch className="h-4 w-4" aria-hidden />}
              {t("proposalManagerGrants.search")}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => runSearch(keyword)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <FiRefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden />
              {t("proposalManagerGrants.retry")}
            </button>
          </div>
        </form>
        {Object.keys(sourceCounts).length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            {selectedModes.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <GrantSourceBadge sourceId={id} />
                <span className="tabular-nums">{sourceCounts[id] ?? 0}</span>
              </span>
            ))}
          </div>
        ) : null}
      </section>

      {error ? (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100">
          <FiAlertCircle className="mt-0.5 shrink-0" aria-hidden />
          <p>{error}</p>
        </div>
      ) : null}

      {loading && !results.length ? (
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300" aria-busy="true">
          <FiLoader className="h-4 w-4 animate-spin" aria-hidden />
          {t("proposalManagerGrants.mergedSearching")}
        </div>
      ) : null}

      {!loading && !results.length && !error ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-600">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("proposalManagerGrants.mergedEmpty")}</p>
          <p className="mt-1 text-xs text-slate-500">{t("proposalManagerGrants.mergedEmptyHint")}</p>
        </div>
      ) : null}

      {displayResults.length > 0 ? (
        <>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t("proposalManagerGrants.mergedResults", { count: displayResults.length })}
            {keyword ? ` · “${keyword}”` : ""}
          </p>
          <GrantExpandHintBanner show={showHint && displayResults.length > 0} onDismiss={dismissExpandHint} />
          <ul className="space-y-2">
            {displayResults.map((hit, index) => {
              const open = expandedId === hit.key;
              const days = daysUntil(hit.deadline);
              const highlightExpand = showHint && index === 0 && !open;
              return (
                <li
                  key={hit.key}
                  className={`overflow-hidden rounded-xl border transition ${
                    open
                      ? "border-indigo-400 bg-white shadow-sm dark:border-indigo-500 dark:bg-slate-900"
                      : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                  }`}
                >
                  <div className="flex items-stretch">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => {
                        dismissExpandHint();
                        setExpandedId((cur) => (cur === hit.key ? null : hit.key));
                      }}
                      className="flex min-w-0 flex-1 items-start gap-3 p-4 text-start hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                    >
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 dark:border-slate-600 ${
                          highlightExpand ? grantExpandChevronHintClass : ""
                        }`}
                        aria-hidden
                      >
                        <FiChevronDown className={`transition-transform ${open ? "rotate-180" : ""}`} />
                      </span>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <GrantSourceBadge sourceId={hit.sourceId} />
                              <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-white">
                                {hit.title}
                              </p>
                            </div>
                            <p className="text-xs text-slate-500">
                              {hit.number ? (
                                <span className="font-medium text-slate-700 dark:text-slate-200">{hit.number}</span>
                              ) : null}
                              {hit.number && hit.agency ? " · " : null}
                              {hit.agency}
                            </p>
                          </div>
                          {hit.status ? (
                            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              {hit.status}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {hit.deadline ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              <FiCalendar aria-hidden />
                              {hit.deadline}
                            </span>
                          ) : null}
                          {days != null ? (
                            <span className={`rounded-full px-2 py-1 font-semibold ${urgencyTone(days)}`}>
                              {days < 0
                                ? t("proposalManagerGrants.pastDue")
                                : t("proposalManagerGrants.daysLeft", { count: days })}
                            </span>
                          ) : null}
                          {hit.amountLabel ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                              <FiDollarSign aria-hidden className="opacity-70" />
                              {hit.amountLabel}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                    <div className="flex shrink-0 items-start border-s border-slate-100 p-3 dark:border-slate-800">
                      <OpportunityShortlistButton
                        id={`${hit.shortlistSource}:${hit.id}`}
                        source={hit.shortlistSource}
                        title={hit.title}
                        number={hit.number}
                        agency={hit.agency}
                        deadline={hit.deadline}
                        opportunity={hit}
                      />
                    </div>
                  </div>
                  {open ? (
                    <div className="space-y-3 border-t border-slate-100 px-4 pb-4 pt-3 dark:border-slate-800 sm:px-5">
                      {hit.summary ? (
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                          {hit.summary}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-500">{t("proposalManagerGrants.mergedNoSummary")}</p>
                      )}
                      {hit.url ? (
                        <a
                          href={hit.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                        >
                          {t("proposalManagerGrants.briefOpenPortal")}
                          <FiExternalLink aria-hidden />
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </div>
  );
}
