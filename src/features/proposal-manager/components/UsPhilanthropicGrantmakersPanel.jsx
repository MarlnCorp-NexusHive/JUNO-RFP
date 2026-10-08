import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiAlertCircle,
  FiExternalLink,
  FiLoader,
  FiRefreshCw,
  FiSearch,
  FiTarget,
  FiX,
} from "react-icons/fi";
import {
  fetchUsPhilanthropicDirectory,
  fetchUsPhilanthropicOpportunities,
} from "../../../services/api.js";
import directoryFallback from "../data/usPhilanthropicGrantmakers.json";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white";

const PREFETCH_CONCURRENCY = 2;

/** Only show retrieved grant rows (crawl/AI/heuristic) — not bare registry redirects. */
function grantsForDisplay(opsPayload) {
  const ops = Array.isArray(opsPayload?.opportunities) ? opsPayload.opportunities : [];
  return ops
    .filter((op) => op && op.title)
    .map((op) => ({
      id: op.id,
      title: op.title,
      url: op.url || null,
      deadline: op.deadline || null,
      status: op.status || null,
    }));
}

function accessPriority(access) {
  const a = String(access || "").toLowerCase();
  if (/public calls|open application|loi and public|public competitions/.test(a)) return 0;
  if (/mixed/.test(a)) return 1;
  if (/loi|program-specific|inquiry|registration|scholarship|partner-led|selection-led/.test(a)) return 2;
  if (/needs policy verification/.test(a)) return 3;
  if (/invitation/.test(a)) return 4;
  return 3;
}

function likelyPublicAccess(access) {
  const a = String(access || "").toLowerCase();
  if (/invitation only/.test(a)) return false;
  return /public|mixed|loi|competition|open application|program-specific/.test(a);
}

function sortGrantmakers(list, openCounts) {
  return [...list].sort((a, b) => {
    const ca = openCounts[a.id]?.count ?? a.openGrantCount ?? 0;
    const cb = openCounts[b.id]?.count ?? b.openGrantCount ?? 0;
    const aOpen = ca > 0 ? 1 : 0;
    const bOpen = cb > 0 ? 1 : 0;
    if (aOpen !== bOpen) return bOpen - aOpen;
    if (ca !== cb) return cb - ca;
    const pa = accessPriority(a.applicationAccess);
    const pb = accessPriority(b.applicationAccess);
    if (pa !== pb) return pa - pb;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

export default function UsPhilanthropicGrantmakersPanel() {
  const { t } = useTranslation("common");
  const tt = (key, opts) => t(`proposalManagerCompanyIntelligence.usGrantmakers.${key}`, opts);

  const [query, setQuery] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [grantmakers, setGrantmakers] = useState(() => directoryFallback.grantmakers || []);
  const [openCounts, setOpenCounts] = useState({});
  const [prefetching, setPrefetching] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [opsLoading, setOpsLoading] = useState(false);
  const [opsError, setOpsError] = useState("");
  const [opsPayload, setOpsPayload] = useState(null);
  const prefetchGen = useRef(0);

  const applyLocalDirectory = useCallback((q = "") => {
    const all = directoryFallback.grantmakers || [];
    const needle = String(q || "").trim().toLowerCase();
    const filtered = needle
      ? all.filter((g) => {
          const blob = `${g.name} ${g.segment} ${g.fundingFocus} ${g.fundingGeography}`.toLowerCase();
          return blob.includes(needle);
        })
      : all;
    setGrantmakers(sortGrantmakers(filtered, {}));
  }, []);

  const recordOpenCount = useCallback((funderId, count) => {
    setOpenCounts((prev) => {
      const next = {
        ...prev,
        [funderId]: { count: Number(count) || 0, checked: true },
      };
      return next;
    });
  }, []);

  const sortedGrantmakers = useMemo(
    () => sortGrantmakers(grantmakers, openCounts),
    [grantmakers, openCounts],
  );

  const openOnTopCount = useMemo(
    () => sortedGrantmakers.filter((g) => (openCounts[g.id]?.count ?? g.openGrantCount ?? 0) > 0).length,
    [sortedGrantmakers, openCounts],
  );

  const prefetchOpenCounts = useCallback(
    async (list) => {
      const gen = ++prefetchGen.current;
      // Backend already keeps counts/sort; only fill gaps for unchecked public funders.
      const queue = [...list]
        .filter((g) => likelyPublicAccess(g.applicationAccess))
        .filter((g) => !g.openChecked)
        .sort((a, b) => accessPriority(a.applicationAccess) - accessPriority(b.applicationAccess));
      if (!queue.length) {
        setPrefetching(false);
        return;
      }
      setPrefetching(true);
      let cursor = 0;
      const worker = async () => {
        while (cursor < queue.length) {
          if (prefetchGen.current !== gen) return;
          const idx = cursor;
          cursor += 1;
          const g = queue[idx];
          if (!g?.id) continue;
          try {
            const data = await fetchUsPhilanthropicOpportunities({
              funderId: g.id,
              forceRefresh: false,
            });
            if (prefetchGen.current !== gen) return;
            recordOpenCount(g.id, data?.opportunities?.length || 0);
          } catch {
            if (prefetchGen.current !== gen) return;
            recordOpenCount(g.id, 0);
          }
        }
      };
      const workers = Array.from({ length: PREFETCH_CONCURRENCY }, () => worker());
      await Promise.all(workers);
      if (prefetchGen.current === gen) setPrefetching(false);
    },
    [recordOpenCount],
  );

  const loadDirectory = useCallback(
    async (q = "") => {
      setLoadingList(true);
      applyLocalDirectory(q);
      try {
        const data = await fetchUsPhilanthropicDirectory({ q });
        const list = Array.isArray(data.grantmakers) ? data.grantmakers : [];
        const counts = {};
        for (const g of list) {
          if (g.openChecked || (g.openGrantCount != null && g.openGrantCount > 0)) {
            counts[g.id] = {
              count: Number(g.openGrantCount) || 0,
              checked: !!g.openChecked || Number(g.openGrantCount) > 0,
            };
          }
        }
        setOpenCounts(counts);
        // Backend already sorted by open grants; keep that order as the base list.
        setGrantmakers(list);
        void prefetchOpenCounts(list);
      } catch {
        applyLocalDirectory(q);
      } finally {
        setLoadingList(false);
      }
    },
    [applyLocalDirectory, prefetchOpenCounts],
  );

  useEffect(() => {
    void loadDirectory("");
    return () => {
      prefetchGen.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => sortedGrantmakers.find((g) => g.id === selectedId) || null,
    [sortedGrantmakers, selectedId],
  );

  const grants = useMemo(() => grantsForDisplay(opsPayload), [opsPayload]);

  const loadOpportunities = useCallback(
    async (funderId, forceRefresh = false) => {
      if (!funderId) return;
      setOpsLoading(true);
      setOpsError("");
      try {
        const data = await fetchUsPhilanthropicOpportunities({ funderId, forceRefresh });
        setOpsPayload(data);
        recordOpenCount(funderId, data?.opportunities?.length || 0);
      } catch (err) {
        setOpsPayload(null);
        setOpsError(err?.response?.data?.error || err?.message || tt("opsFailed"));
      } finally {
        setOpsLoading(false);
      }
    },
    [recordOpenCount, tt],
  );

  const onSelect = (g) => {
    setSelectedId(g.id);
    setOpsPayload(null);
    setOpsError("");
    void loadOpportunities(g.id, false);
  };

  const onSearch = (e) => {
    e.preventDefault();
    void loadDirectory(query);
  };

  return (
    <section
      className="rounded-xl border border-sky-200/80 bg-white p-4 shadow-sm dark:border-sky-900/40 dark:bg-gray-800 md:p-6"
      data-tour="us-grantmakers"
      data-tour-title-en="US Philanthropic Grantmakers"
      data-tour-title-ar="المانحون الأميركيون"
      data-tour-content-en="Select a US grantmaker to see its grants. Funders with open grants stay on top."
      data-tour-content-ar="اختر مانحًا أميركيًا لعرض منحه. المانحون ذوو المنح المفتوحة في الأعلى."
      data-tour-position="bottom"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
          <FiTarget className="h-5 w-5 text-sky-600" aria-hidden />
          {tt("title")}
        </h2>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{tt("countOnly", { count: sortedGrantmakers.length })}</span>
          {openOnTopCount > 0 ? (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800">
              {tt("withOpenCount", { count: openOnTopCount })}
            </span>
          ) : null}
          {prefetching ? (
            <span className="inline-flex items-center gap-1">
              <FiLoader className="h-3 w-3 animate-spin" aria-hidden />
              {tt("scanningOpen")}
            </span>
          ) : null}
        </div>
      </div>

      <form onSubmit={onSearch} className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <FiSearch className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tt("searchPlaceholder")}
            className={`${inputClass} ps-9`}
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                void loadDirectory("");
              }}
              className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label={tt("clearSearch")}
            >
              <FiX className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
        >
          {loadingList ? <FiLoader className="h-4 w-4 animate-spin" aria-hidden /> : <FiSearch className="h-4 w-4" aria-hidden />}
          {tt("search")}
        </button>
      </form>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="max-h-[28rem] overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
            {loadingList && !sortedGrantmakers.length ? (
              <div className="flex items-center gap-2 p-4 text-sm text-gray-600 dark:text-gray-300">
                <FiLoader className="h-4 w-4 animate-spin" aria-hidden />
                {tt("loadingList")}
              </div>
            ) : sortedGrantmakers.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">{tt("emptyList")}</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {sortedGrantmakers.map((g) => {
                  const active = g.id === selectedId;
                  const openCount = openCounts[g.id]?.count ?? g.openGrantCount ?? 0;
                  return (
                    <li key={g.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(g)}
                        className={`w-full px-3 py-2.5 text-start transition hover:bg-sky-50/80 dark:hover:bg-sky-950/30 ${
                          active ? "bg-sky-50 dark:bg-sky-950/40" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{g.name}</p>
                          {openCount > 0 ? (
                            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800">
                              {tt("openBadge", { count: openCount })}
                            </span>
                          ) : null}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          {!selected ? (
            <div className="flex h-full min-h-[10rem] items-center justify-center rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-600">
              {tt("pickFunder")}
            </div>
          ) : (
            <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{selected.name}</h3>
                <button
                  type="button"
                  disabled={opsLoading}
                  onClick={() => void loadOpportunities(selected.id, true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
                >
                  <FiRefreshCw className={opsLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} aria-hidden />
                  {tt("refreshOps")}
                </button>
              </div>

              {opsLoading && !opsPayload ? (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <FiLoader className="h-4 w-4 animate-spin" aria-hidden />
                  {tt("loadingOps")}
                </div>
              ) : null}

              {opsError ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100"
                >
                  <FiAlertCircle className="mt-0.5 shrink-0" aria-hidden />
                  <p>{opsError}</p>
                </div>
              ) : null}

              {opsPayload && !opsLoading ? (
                grants.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{tt("noOpenOpsShort")}</p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    {grants.map((g) => (
                      <li key={g.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{g.title}</p>
                          <p className="text-xs text-gray-500">
                            {[g.status, g.deadline].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        {g.url ? (
                          <a
                            href={g.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-sky-700 hover:underline dark:text-sky-300"
                          >
                            <FiExternalLink aria-hidden />
                            {tt("viewOpp")}
                          </a>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
