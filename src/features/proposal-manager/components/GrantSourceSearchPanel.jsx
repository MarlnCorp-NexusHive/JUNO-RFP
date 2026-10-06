import React, { useCallback, useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiAlertCircle,
  FiCalendar,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiDollarSign,
  FiExternalLink,
  FiRefreshCw,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { useLocalization } from "../../../hooks/useLocalization";
import {
  GrantExpandHintBanner,
  grantExpandChevronHintClass,
  useGrantExpandCoach,
} from "./GrantExpandCoach.jsx";
import OpportunityShortlistButton from "./OpportunityShortlistButton.jsx";
import { formatDateTime24 } from "../../../utils/dateTime";

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

/**
 * Shared searchable list UI for Phase A grant/intel sources.
 *
 * @param {{
 *  ns: string,
 *  shortlistSource: string,
 *  searchFn: (params: object) => Promise<object>,
 *  extraFilters?: Array<{ key: string, labelKey: string, type?: 'text'|'select', options?: Array<{value:string,labelKey:string}>, placeholderKey?: string, className?: string }>,
 *  initialExtra?: Record<string, string>,
 *  buildParams?: (ctx: { keyword: string, page: number, extra: Record<string,string> }) => object,
 * }} props
 */
export default function GrantSourceSearchPanel({
  ns,
  shortlistSource,
  searchFn,
  extraFilters = [],
  initialExtra = {},
  buildParams,
}) {
  const { t } = useTranslation("common");
  const { isRTLMode } = useLocalization();
  const formId = useId();
  const resultsId = useId();
  const { showHint, dismiss: dismissExpandHint } = useGrantExpandCoach();

  const [draftKeyword, setDraftKeyword] = useState("");
  const [keyword, setKeyword] = useState("");
  const [extra, setExtra] = useState(() => ({ ...initialExtra }));
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const tt = useCallback((key, opts) => t(`${ns}.${key}`, opts), [t, ns]);

  const runSearch = useCallback(
    async ({ nextKeyword = keyword, nextPage = 0, nextExtra = extra } = {}) => {
      setLoading(true);
      setError("");
      try {
        const params = buildParams
          ? buildParams({ keyword: nextKeyword, page: nextPage, extra: nextExtra })
          : {
              keyword: nextKeyword,
              page: nextPage,
              rows: 25,
              ...nextExtra,
            };
        const data = await searchFn(params);
        setPayload(data);
        setKeyword(nextKeyword);
        setPage(nextPage);
        setExtra(nextExtra);
        setExpandedId(null);
      } catch (err) {
        setError(err?.response?.data?.error || err.message || tt("loadFailed"));
        setPayload(null);
      } finally {
        setLoading(false);
      }
    },
    [buildParams, extra, keyword, searchFn, tt],
  );

  useEffect(() => {
    runSearch({ nextPage: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = payload?.results || [];
  const hitCount = Number(payload?.hitCount) || results.length;
  const pageSize = Number(payload?.pageSize) || 25;
  const hasMore = Boolean(payload?.hasMore);
  const rangeStart = hitCount === 0 ? 0 : page * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize + results.length, hitCount);
  const filtersDirty =
    !!draftKeyword.trim() ||
    !!keyword.trim() ||
    extraFilters.some((f) => String(extra[f.key] || "") !== String(initialExtra[f.key] || ""));

  const clearFilters = () => {
    const cleared = { ...initialExtra };
    setDraftKeyword("");
    setKeyword("");
    setExtra(cleared);
    runSearch({ nextKeyword: "", nextPage: 0, nextExtra: cleared });
  };

  return (
    <div className="space-y-5" dir={isRTLMode ? "rtl" : "ltr"}>
      <header className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              {tt("eyebrow")}
            </p>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {tt("title")}
            </h2>
          </div>
          {payload?.fetchedAt && (
            <p className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800">
              {tt("liveFrom", {
                source: payload.source || "",
                time: formatDateTime24(payload.fetchedAt),
              })}
            </p>
          )}
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {tt("subtitle")}
        </p>
      </header>

      <section
        aria-labelledby={`${formId}-legend`}
        className="sticky top-0 z-20 -mx-1 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
      >
        <h3 id={`${formId}-legend`} className="sr-only">
          {tt("search")}
        </h3>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            runSearch({ nextKeyword: draftKeyword.trim(), nextPage: 0 });
          }}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="min-w-0 flex-1">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {tt("keyword")}
              </span>
              <div className="relative">
                <FiSearch
                  aria-hidden
                  className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 ${isRTLMode ? "right-3" : "left-3"}`}
                />
                <input
                  value={draftKeyword}
                  onChange={(e) => setDraftKeyword(e.target.value)}
                  placeholder={tt("keywordPlaceholder")}
                  className={`${inputClass} ${isRTLMode ? "pr-10 pl-10" : "pl-10 pr-10"}`}
                />
                {draftKeyword && (
                  <button
                    type="button"
                    onClick={() => setDraftKeyword("")}
                    className={`absolute top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 ${isRTLMode ? "left-2" : "right-2"}`}
                    aria-label={t("proposalManagerGrants.clearKeyword")}
                  >
                    <FiX />
                  </button>
                )}
              </div>
            </label>

            {extraFilters.map((f) => (
              <label key={f.key} className={f.className || "w-full lg:w-44"}>
                <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {tt(f.labelKey)}
                </span>
                {f.type === "select" ? (
                  <select
                    value={extra[f.key] || ""}
                    onChange={(e) => setExtra((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className={inputClass}
                  >
                    {(f.options || []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {tt(opt.labelKey)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={extra[f.key] || ""}
                    onChange={(e) => setExtra((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholderKey ? tt(f.placeholderKey) : undefined}
                    className={inputClass}
                  />
                )}
              </label>
            ))}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60 lg:flex-none"
              >
                {loading ? <FiRefreshCw className="animate-spin" aria-hidden /> : <FiSearch aria-hidden />}
                {loading ? tt("loading") : tt("search")}
              </button>
              {filtersDirty && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  {tt("clearFilters")}
                </button>
              )}
            </div>
          </div>
        </form>
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100"
        >
          <FiAlertCircle className="mt-0.5 shrink-0" aria-hidden />
          <div className="space-y-2">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => runSearch({ nextPage: page })}
              className="text-sm font-semibold underline underline-offset-2"
            >
              {tt("retry")}
            </button>
          </div>
        </div>
      )}

      <section className="space-y-3" aria-labelledby={resultsId}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 id={resultsId} className="text-sm font-semibold text-slate-900 dark:text-white">
              {tt("results", { count: hitCount })}
            </h3>
            <p className="text-xs text-slate-500">
              {tt("resultsPaged", { start: rangeStart, end: rangeEnd, count: hitCount })}
            </p>
          </div>
          <nav className="flex items-center gap-1" aria-label={t("proposalManagerGrants.pagination")}>
            <button
              type="button"
              disabled={loading || page <= 0}
              onClick={() => runSearch({ nextPage: Math.max(0, page - 1) })}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800"
              aria-label={tt("prevPage")}
            >
              {isRTLMode ? <FiChevronRight /> : <FiChevronLeft />}
            </button>
            <span className="min-w-[5rem] text-center text-xs font-medium text-slate-600 dark:text-slate-300">
              {tt("pageOf", { page: page + 1 })}
            </span>
            <button
              type="button"
              disabled={loading || !hasMore}
              onClick={() => runSearch({ nextPage: page + 1 })}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800"
              aria-label={tt("nextPage")}
            >
              {isRTLMode ? <FiChevronLeft /> : <FiChevronRight />}
            </button>
          </nav>
        </div>

        <div className="relative space-y-2" aria-busy={loading}>
          {loading && !results.length && (
            <div className="space-y-2" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-800" />
              ))}
            </div>
          )}
          {!loading && !results.length && !error && (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-600">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{tt("empty")}</p>
              <p className="mt-1 text-xs text-slate-500">{tt("emptyHint")}</p>
            </div>
          )}

          <GrantExpandHintBanner show={showHint && results.length > 0} onDismiss={dismissExpandHint} />

          <ul className="space-y-2">
            {results.map((hit, index) => {
              const open = expandedId === hit.id;
              const days = daysUntil(hit.deadline);
              const highlightExpand = showHint && index === 0 && !open;
              const canShortlist = Boolean(hit.deadline && String(hit.deadline).trim());
              return (
                <li
                  key={hit.id}
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
                        setExpandedId((cur) => (cur === hit.id ? null : hit.id));
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
                            <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-white">
                              {hit.title}
                            </p>
                            <p className="text-xs text-slate-500">
                              {hit.number ? (
                                <span className="font-medium text-slate-700 dark:text-slate-200">{hit.number}</span>
                              ) : null}
                              {hit.number && hit.agency ? " · " : null}
                              {hit.agency}
                              {hit.organization ? ` · ${hit.organization}` : ""}
                              {hit.company ? ` · ${hit.company}` : ""}
                            </p>
                          </div>
                          {hit.status && (
                            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              {hit.status}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {hit.deadline && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              <FiCalendar aria-hidden />
                              {hit.deadline}
                            </span>
                          )}
                          {days != null && (
                            <span className={`rounded-full px-2 py-1 font-semibold ${urgencyTone(days)}`}>
                              {days < 0 ? tt("pastDue") : tt("daysLeft", { count: days })}
                            </span>
                          )}
                          {(hit.amountLabel || hit.amount != null) && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                              <FiDollarSign aria-hidden className="opacity-70" />
                              {hit.amountLabel || hit.amount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                    {canShortlist && (
                      <div className="flex shrink-0 items-start border-s border-slate-100 p-3 dark:border-slate-800">
                        <OpportunityShortlistButton
                          id={`${shortlistSource}:${hit.id}`}
                          source={shortlistSource}
                          title={hit.title}
                          number={hit.number}
                          agency={hit.agency}
                          deadline={hit.deadline}
                        />
                      </div>
                    )}
                  </div>

                  {open && (
                    <div className="space-y-3 border-t border-slate-100 px-4 pb-4 pt-3 dark:border-slate-800 sm:px-5">
                      {(hit.summary || hit.description) && (
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                          {hit.summary || hit.description}
                        </p>
                      )}
                      {hit.eligibility && (
                        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/50">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            {tt("eligibility")}
                          </p>
                          <p className="mt-1 text-slate-800 dark:text-slate-100">{hit.eligibility}</p>
                        </div>
                      )}
                      {Array.isArray(hit.applicantTypes) && hit.applicantTypes.length > 0 && (
                        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/50">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            {tt("applicantTypes")}
                          </p>
                          <p className="mt-1 text-slate-800 dark:text-slate-100">
                            {hit.applicantTypes.join(", ")}
                          </p>
                        </div>
                      )}
                      {hit.pi && (
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{tt("pi")}: </span>
                          {hit.pi}
                        </p>
                      )}
                      {hit.url && (
                        <a
                          href={hit.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                        >
                          {tt("openSource")}
                          <FiExternalLink aria-hidden />
                        </a>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
