import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiAlertCircle,
  FiCalendar,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiDollarSign,
  FiExternalLink,
  FiMapPin,
  FiRefreshCw,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { useLocalization } from "../../../hooks/useLocalization";
import { searchAltGrants } from "../../../services/api.js";
import {
  GrantExpandHintBanner,
  grantExpandChevronHintClass,
  useGrantExpandCoach,
} from "./GrantExpandCoach.jsx";
import OpportunityShortlistButton from "./OpportunityShortlistButton.jsx";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500";

const PRIVATE_SIZE_OPTIONS = [
  { value: "", labelKey: "sizeAny" },
  { value: "under1m", labelKey: "sizeUnder1m" },
  { value: "1m10m", labelKey: "size1m10m" },
  { value: "10m100m", labelKey: "size10m100m" },
  { value: "100m1b", labelKey: "size100m1b" },
  { value: "1bplus", labelKey: "size1bplus" },
];

const PRIVATE_SORT_OPTIONS = [
  { value: "relevance", labelKey: "sortRelevance" },
  { value: "assets_desc", labelKey: "sortAssetsDesc" },
  { value: "assets_asc", labelKey: "sortAssetsAsc" },
  { value: "revenue_desc", labelKey: "sortRevenueDesc" },
];

function daysUntil(iso) {
  if (!iso) return null;
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return null;
  return Math.ceil((parsed - Date.now()) / (24 * 60 * 60 * 1000));
}

function money(n, label) {
  if (label) return label;
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(n));
}

function urgencyTone(days) {
  if (days == null) return "";
  if (days < 0) return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  if (days <= 7) return "bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-200";
  if (days <= 14) return "bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100";
  if (days <= 30) return "bg-yellow-100 text-yellow-950 dark:bg-yellow-950/40 dark:text-yellow-100";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
}

function statusTone(status) {
  switch (status) {
    case "Open":
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200";
    case "Forecasted":
      return "bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200";
    case "Closed":
      return "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
  }
}

function formatFetchedAt(iso, locale) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(locale || undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/**
 * @param {{ variant: 'private' | 'local' }} props
 */
export default function AltGrantsPanel({ variant }) {
  const { t, i18n } = useTranslation("common");
  const { isRTLMode } = useLocalization();
  const isPrivate = variant === "private";
  const i18nRoot = isPrivate ? "proposalManagerPrivateGrants" : "proposalManagerLocalGrants";

  const [draftKeyword, setDraftKeyword] = useState("");
  const [keyword, setKeyword] = useState("");
  const [draftGeography, setDraftGeography] = useState("");
  const [geography, setGeography] = useState("");
  const [status, setStatus] = useState("");
  const [focus, setFocus] = useState("");
  const [sizeBucket, setSizeBucket] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const { showHint, dismiss: dismissExpandHint } = useGrantExpandCoach();

  const [results, setResults] = useState([]);
  const [hitCount, setHitCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(null);
  const [pageSize, setPageSize] = useState(25);
  const [hasMore, setHasMore] = useState(false);
  const [source, setSource] = useState("");
  const [fetchedAt, setFetchedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const focusOptions = useMemo(() => {
    if (isPrivate) {
      return [
        "Arts",
        "Education",
        "Environment",
        "Health",
        "Human services",
        "Philanthropy",
        "Digital equity",
        "Civic tech",
      ];
    }
    return [
      "Broadband",
      "Workforce",
      "Climate",
      "Cybersecurity",
      "Housing",
      "Health",
      "Education",
      "Infrastructure",
    ];
  }, [isPrivate]);

  const runSearch = useCallback(async () => {
    setLoading(true);
    setError("");
    setExpandedId(null);
    try {
      const data = await searchAltGrants({
        variant: isPrivate ? "private" : "local",
        keyword,
        geography,
        status: isPrivate ? "" : status,
        focus,
        rows: 25,
        page,
        sizeBucket: isPrivate ? sizeBucket : "",
        sortBy: isPrivate ? sortBy : "relevance",
      });
      setResults(Array.isArray(data.results) ? data.results : []);
      setHitCount(Number(data.hitCount) || (data.results || []).length);
      setFilteredCount(data.filteredCount == null ? null : Number(data.filteredCount));
      setPageSize(Number(data.pageSize) || 25);
      setHasMore(Boolean(data.hasMore));
      setSource(data.source || "");
      setFetchedAt(data.fetchedAt || "");
    } catch (err) {
      setResults([]);
      setHitCount(0);
      setFilteredCount(null);
      setHasMore(false);
      setError(err?.response?.data?.error || err?.message || t(`${i18nRoot}.loadFailed`));
    } finally {
      setLoading(false);
    }
  }, [focus, geography, i18nRoot, isPrivate, keyword, page, sizeBucket, sortBy, status, t]);

  useEffect(() => {
    runSearch();
  }, [runSearch, reloadToken]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setKeyword(draftKeyword.trim());
      setGeography(draftGeography.trim());
      setPage(0);
    }, 400);
    return () => clearTimeout(handle);
  }, [draftKeyword, draftGeography]);

  const filtersDirty =
    !!draftKeyword.trim() ||
    !!keyword.trim() ||
    !!draftGeography.trim() ||
    !!geography.trim() ||
    !!status ||
    !!focus ||
    !!sizeBucket ||
    sortBy !== "relevance" ||
    page > 0;

  const clearFilters = () => {
    setDraftKeyword("");
    setKeyword("");
    setDraftGeography("");
    setGeography("");
    setStatus("");
    setFocus("");
    setSizeBucket("");
    setSortBy("relevance");
    setPage(0);
    setExpandedId(null);
  };

  const displayCount = filteredCount != null ? filteredCount : hitCount;
  const rangeStart = results.length ? page * pageSize + 1 : 0;
  const rangeEnd = page * pageSize + results.length;

  return (
    <div className="space-y-5" dir={isRTLMode ? "rtl" : "ltr"}>
      <header className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div
            className="space-y-1"
            data-tour="2"
            data-tour-title-en={isPrivate ? "Private funders (live)" : "Local & state eligible (live)"}
            data-tour-title-ar={isPrivate ? "الممولون الخاصون (مباشر)" : "محلي وولائي مؤهل (مباشر)"}
            data-tour-content-en={
              isPrivate
                ? "Live IRS foundation registry via ProPublica. Filter by size (assets) and sort largest-first to focus on high-capacity funders."
                : "Live Grants.gov opportunities eligible for state, county, city, school districts, and housing authorities."
            }
            data-tour-content-ar={
              isPrivate
                ? "سجل المؤسسات من IRS مباشرة عبر ProPublica. صفِّ حسب حجم الأصول ورتّب الأكبر أولاً."
                : "فرص Grants.gov المباشرة المؤهلة للولايات والمحليات."
            }
            data-tour-position="bottom"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              {t(`${i18nRoot}.eyebrow`)}
            </p>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t(`${i18nRoot}.title`)}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {fetchedAt && source && (
              <p className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800">
                {t(`${i18nRoot}.liveFrom`, {
                  source,
                  time: formatFetchedAt(fetchedAt, i18n.language),
                })}
              </p>
            )}
            <button
              type="button"
              onClick={() => setReloadToken((n) => n + 1)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <FiRefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              {t(`${i18nRoot}.refresh`)}
            </button>
          </div>
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {t(`${i18nRoot}.subtitle`)}
        </p>
      </header>

      <section
        className="sticky top-0 z-20 -mx-1 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
        data-tour="3"
        data-tour-title-en={isPrivate ? "Size, sort & search" : "Search & filters"}
        data-tour-title-ar={isPrivate ? "الحجم والترتيب والبحث" : "البحث والمرشحات"}
        data-tour-content-en={
          isPrivate
            ? "Filter by keyword, state, focus, and funder size (IRS assets). Sort largest-first, then page through results."
            : "Filter by keyword, geography, status, and focus. Results refresh live from Grants.gov."
        }
        data-tour-content-ar={
          isPrivate
            ? "صفِّ بالكلمة والولاية والتركيز وحجم الممول (أصول IRS). رتّب الأكبر أولاً ثم تصفّح الصفحات."
            : "صفِّ بالكلمة والجغرافيا والحالة والتركيز. النتائج تتحدث مباشرة من Grants.gov."
        }
        data-tour-position="bottom"
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setKeyword(draftKeyword.trim());
            setGeography(draftGeography.trim());
            setPage(0);
            setReloadToken((n) => n + 1);
          }}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:flex-wrap">
            <label className="min-w-0 flex-1 basis-full lg:basis-64">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t(`${i18nRoot}.keyword`)}
              </span>
              <div className="relative">
                <FiSearch
                  aria-hidden
                  className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 ${isRTLMode ? "right-3" : "left-3"}`}
                />
                <input
                  value={draftKeyword}
                  onChange={(e) => setDraftKeyword(e.target.value)}
                  placeholder={t(`${i18nRoot}.keywordPlaceholder`)}
                  className={`${inputClass} ${isRTLMode ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                />
              </div>
            </label>
            <label className="w-full lg:w-36">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t(`${i18nRoot}.geography`)}
              </span>
              <input
                value={draftGeography}
                onChange={(e) => setDraftGeography(e.target.value)}
                placeholder={t(`${i18nRoot}.geographyPlaceholder`)}
                className={inputClass}
              />
            </label>
            {!isPrivate && (
              <label className="w-full lg:w-40">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {t(`${i18nRoot}.status`)}
                </span>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(0);
                  }}
                  className={inputClass}
                >
                  <option value="">{t(`${i18nRoot}.allStatuses`)}</option>
                  <option value="Open">{t(`${i18nRoot}.statusOpen`)}</option>
                  <option value="Forecasted">{t(`${i18nRoot}.statusForecasted`)}</option>
                  <option value="Closed">{t(`${i18nRoot}.statusClosed`)}</option>
                </select>
              </label>
            )}
            <label className="w-full lg:w-44">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t(`${i18nRoot}.focus`)}
              </span>
              <select
                value={focus}
                onChange={(e) => {
                  setFocus(e.target.value);
                  setPage(0);
                }}
                className={inputClass}
              >
                <option value="">{t(`${i18nRoot}.allFocus`)}</option>
                {focusOptions.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            {isPrivate && (
              <>
                <label className="w-full lg:w-48">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {t(`${i18nRoot}.size`)}
                  </span>
                  <select
                    value={sizeBucket}
                    onChange={(e) => {
                      setSizeBucket(e.target.value);
                      setPage(0);
                    }}
                    className={inputClass}
                  >
                    {PRIVATE_SIZE_OPTIONS.map((opt) => (
                      <option key={opt.value || "any"} value={opt.value}>
                        {t(`${i18nRoot}.${opt.labelKey}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="w-full lg:w-48">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {t(`${i18nRoot}.sortBy`)}
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPage(0);
                    }}
                    className={inputClass}
                  >
                    {PRIVATE_SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {t(`${i18nRoot}.${opt.labelKey}`)}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                {t(`${i18nRoot}.search`)}
              </button>
              {filtersDirty && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <FiX className="h-4 w-4" />
                  {t(`${i18nRoot}.clearFilters`)}
                </button>
              )}
            </div>
          </div>
          {isPrivate && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{t(`${i18nRoot}.sizeHint`)}</p>
          )}
        </form>
      </section>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
          <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-2">
            <p className="text-sm font-medium">{error}</p>
            <button
              type="button"
              onClick={() => setReloadToken((n) => n + 1)}
              className="text-sm font-semibold underline"
            >
              {t(`${i18nRoot}.retry`)}
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {loading
            ? t(`${i18nRoot}.loading`)
            : filteredCount != null
              ? t(`${i18nRoot}.resultsFiltered`, {
                  shown: results.length,
                  filtered: filteredCount,
                  total: hitCount,
                })
              : t(`${i18nRoot}.resultsPaged`, {
                  start: rangeStart,
                  end: rangeEnd,
                  count: displayCount,
                })}
        </p>
        {(page > 0 || hasMore) && !loading && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 0 || loading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200"
            >
              <FiChevronLeft className="h-4 w-4" />
              {t(`${i18nRoot}.prevPage`)}
            </button>
            <span className="text-xs text-slate-500">{t(`${i18nRoot}.pageOf`, { page: page + 1 })}</span>
            <button
              type="button"
              disabled={!hasMore || loading}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200"
            >
              {t(`${i18nRoot}.nextPage`)}
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {loading && !results.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-600 dark:bg-slate-900/40">
          <FiRefreshCw className="mx-auto h-6 w-6 animate-spin text-indigo-500" />
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t(`${i18nRoot}.loading`)}</p>
        </div>
      ) : !loading && results.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-600 dark:bg-slate-900/40">
          <p className="font-medium text-slate-800 dark:text-slate-100">{t(`${i18nRoot}.empty`)}</p>
          <p className="mt-1 text-sm text-slate-500">{t(`${i18nRoot}.emptyHint`)}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <GrantExpandHintBanner show={showHint && results.length > 0} onDismiss={dismissExpandHint} />
          <ul className={`space-y-3 ${loading ? "opacity-60" : ""}`}>
          {results.map((opp, index) => {
            const open = expandedId === opp.id;
            const days = daysUntil(opp.closeDate);
            const highlightExpand = showHint && index === 0 && !open;
            return (
              <li
                key={opp.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex items-stretch">
                <button
                  type="button"
                  onClick={() => {
                    dismissExpandHint();
                    setExpandedId(open ? null : opp.id);
                  }}
                  className="flex min-w-0 flex-1 items-start gap-3 p-4 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusTone(opp.status)}`}>
                        {opp.status}
                      </span>
                      {days != null && (
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${urgencyTone(days)}`}>
                          {days < 0
                            ? t(`${i18nRoot}.pastDue`)
                            : t(`${i18nRoot}.daysLeft`, { count: days })}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">{opp.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{opp.funder}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <FiMapPin className="h-3.5 w-3.5" /> {opp.geography}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FiDollarSign className="h-3.5 w-3.5" />
                        {money(opp.awardMax, opp.awardLabel)}
                      </span>
                      {opp.closeDate && (
                        <span className="inline-flex items-center gap-1">
                          <FiCalendar className="h-3.5 w-3.5" /> {opp.closeDate}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition dark:border-slate-600 dark:text-slate-300 ${
                      highlightExpand ? grantExpandChevronHintClass : ""
                    }`}
                    aria-hidden
                  >
                    <FiChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} />
                  </span>
                </button>
                <div className="flex shrink-0 items-start border-s border-slate-100 p-3 dark:border-slate-800">
                  <OpportunityShortlistButton
                    id={`alt:${opp.id}`}
                    source="alt"
                    title={opp.title}
                    number={opp.id}
                    agency={opp.funder}
                    deadline={opp.closeDate}
                  />
                </div>
                </div>

                {open && (
                  <div className="space-y-4 border-t border-slate-100 px-4 pb-4 pt-3 dark:border-slate-800">
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{opp.description}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          {t(`${i18nRoot}.program`)}
                        </p>
                        <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{opp.program}</p>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          {t(`${i18nRoot}.applicantTypes`)}
                        </p>
                        <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                          {(opp.applicantTypes || []).join(" · ")}
                        </p>
                      </div>
                    </div>
                    {isPrivate && (opp.assets != null || opp.revenue != null) && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            {t(`${i18nRoot}.assets`)}
                          </p>
                          <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                            {money(opp.assets)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            {t(`${i18nRoot}.revenue`)}
                          </p>
                          <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                            {opp.revenue != null ? money(opp.revenue) : "—"}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {t(`${i18nRoot}.eligibility`)}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-900 dark:text-slate-100">
                        {opp.eligibility}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(opp.focusAreas || []).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <a
                      href={opp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300"
                    >
                      {t(`${i18nRoot}.openSource`)} <FiExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        </div>
      )}
    </div>
  );
}
