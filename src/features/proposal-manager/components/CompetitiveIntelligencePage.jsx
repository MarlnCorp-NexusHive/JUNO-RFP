import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiSearch, FiTarget, FiCheck, FiAlertCircle, FiRefreshCw, FiZap } from "react-icons/fi";
import { useLocalization } from "../../../hooks/useLocalization";
import {
  COMPETITORS,
  DEFAULT_VISIBLE_METRICS,
  METRIC_KEYS,
  formatMetricValue,
} from "../data/competitiveIntelligenceSamples";
import {
  getCuratedCompetitor,
  lookupCompetitor,
} from "../../../services/competitiveIntelligenceService";
import { scopedStorageKey } from "../../../services/tenantScopedStorage.js";

const STORAGE_KEY = "juno_proposal_manager_competitive_intelligence";
const MAX_SELECTED = 5;

function loadPrefs() {
  try {
    const raw = localStorage.getItem(scopedStorageKey(STORAGE_KEY));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      selectedIds: Array.isArray(parsed.selectedIds) ? parsed.selectedIds : [],
      visibleMetrics: Array.isArray(parsed.visibleMetrics) ? parsed.visibleMetrics : null,
      customCompetitors: Array.isArray(parsed.customCompetitors) ? parsed.customCompetitors : [],
    };
  } catch {
    return null;
  }
}

function savePrefs(selectedIds, visibleMetrics, customCompetitors) {
  try {
    localStorage.setItem(
      scopedStorageKey(STORAGE_KEY),
      JSON.stringify({
        selectedIds,
        visibleMetrics,
        customCompetitors,
        savedAt: new Date().toISOString(),
      }),
    );
  } catch {
    /* ignore quota */
  }
}

export default function CompetitiveIntelligencePage() {
  const { t } = useTranslation("common");
  const { isRTLMode } = useLocalization();
  const prefs = useMemo(() => loadPrefs(), []);

  const [search, setSearch] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [lookingUp, setLookingUp] = useState(false);

  const [customById, setCustomById] = useState(() => {
    const map = {};
    (prefs?.customCompetitors || []).forEach((c) => {
      if (c?.id && !getCuratedCompetitor(c.id)) map[c.id] = c;
    });
    return map;
  });

  const [selectedIds, setSelectedIds] = useState(() => {
    const known = new Set([
      ...COMPETITORS.map((c) => c.id),
      ...(prefs?.customCompetitors || []).map((c) => c.id),
    ]);
    const ids = (prefs?.selectedIds || []).filter((id) => known.has(id));
    return ids.slice(0, MAX_SELECTED);
  });
  const [visibleMetrics, setVisibleMetrics] = useState(() => {
    const metrics = prefs?.visibleMetrics?.filter((k) => METRIC_KEYS.includes(k));
    return metrics?.length ? metrics : [...DEFAULT_VISIBLE_METRICS];
  });
  const [selectHint, setSelectHint] = useState("");
  /** @type {Record<string, object>} */
  const [liveById, setLiveById] = useState(() => {
    const map = {};
    (prefs?.customCompetitors || []).forEach((c) => {
      if (c?.id) map[c.id] = c;
    });
    return map;
  });
  /** @type {Record<string, boolean>} */
  const [loadingById, setLoadingById] = useState({});
  const [refreshingAll, setRefreshingAll] = useState(false);
  const enrichTokenRef = useRef(0);

  const catalog = useMemo(() => {
    const custom = Object.values(customById);
    return [...custom, ...COMPETITORS];
  }, [customById]);

  const resolveCompetitor = useCallback(
    (id) => liveById[id] || customById[id] || getCuratedCompetitor(id) || null,
    [liveById, customById],
  );

  const persist = useCallback((nextIds, nextMetrics, nextCustom = customById) => {
    savePrefs(nextIds, nextMetrics, Object.values(nextCustom));
  }, [customById]);

  const enrichIds = useCallback(
    async (ids, { force = false } = {}) => {
      const toFetch = ids.filter((id) => {
        const base = resolveCompetitor(id);
        if (!base?.name && !getCuratedCompetitor(id)) return false;
        if (force) return true;
        const existing = liveById[id];
        if (existing?.remote && !existing?.liveError) return false;
        if (loadingById[id]) return false;
        return true;
      });
      if (!toFetch.length) return;

      const token = ++enrichTokenRef.current;
      setLoadingById((prev) => {
        const next = { ...prev };
        toFetch.forEach((id) => {
          next[id] = true;
        });
        return next;
      });

      await Promise.all(
        toFetch.map(async (id) => {
          const base = resolveCompetitor(id);
          const { competitor } = await lookupCompetitor(base?.name || id, {
            id,
            segment: base?.segment || "",
          });
          if (token !== enrichTokenRef.current && !force) {
            /* allow in-flight updates */
          }
          if (competitor) {
            setLiveById((prev) => ({ ...prev, [id]: competitor }));
            if (!getCuratedCompetitor(id)) {
              setCustomById((prev) => {
                const next = { ...prev, [id]: competitor };
                persist(selectedIds, visibleMetrics, next);
                return next;
              });
            }
          }
          setLoadingById((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }),
      );
    },
    [resolveCompetitor, liveById, loadingById, persist, selectedIds, visibleMetrics],
  );

  useEffect(() => {
    if (!selectedIds.length) return;
    void enrichIds(selectedIds, { force: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- enrich newly selected only when ids change
  }, [selectedIds.join("|")]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.shortName?.toLowerCase().includes(q) ||
        (c.segment || "").toLowerCase().includes(q) ||
        (c.hq || "").toLowerCase().includes(q),
    );
  }, [search, catalog]);

  const selected = useMemo(
    () => selectedIds.map((id) => resolveCompetitor(id)).filter(Boolean),
    [selectedIds, resolveCompetitor],
  );

  const anyLoading = selectedIds.some((id) => loadingById[id]) || refreshingAll || lookingUp;

  const toggleCompany = (id) => {
    setSelectHint("");
    setLookupError("");
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((x) => x !== id);
        persist(next, visibleMetrics);
        return next;
      }
      if (prev.length >= MAX_SELECTED) {
        setSelectHint(t("proposalManagerCompetitiveIntelligence.selectMax", { max: MAX_SELECTED }));
        return prev;
      }
      const next = [...prev, id];
      persist(next, visibleMetrics);
      return next;
    });
  };

  const handleLookup = async (e) => {
    e?.preventDefault?.();
    const q = search.trim();
    if (!q) {
      setLookupError(t("proposalManagerCompetitiveIntelligence.lookupEmpty"));
      return;
    }

    setLookupError("");
    setSelectHint("");
    setLookingUp(true);
    try {
      const { competitor, error } = await lookupCompetitor(q);
      if (!competitor) {
        setLookupError(
          error || t("proposalManagerCompetitiveIntelligence.lookupFailed", { query: q }),
        );
        return;
      }

      const id = competitor.id;
      setLiveById((prev) => ({ ...prev, [id]: competitor }));

      let nextCustom = customById;
      if (!getCuratedCompetitor(id)) {
        nextCustom = { ...customById, [id]: competitor };
        setCustomById(nextCustom);
      }

      setSelectedIds((prev) => {
        if (prev.includes(id)) {
          persist(prev, visibleMetrics, nextCustom);
          return prev;
        }
        if (prev.length >= MAX_SELECTED) {
          setSelectHint(
            t("proposalManagerCompetitiveIntelligence.selectMax", { max: MAX_SELECTED }),
          );
          persist(prev, visibleMetrics, nextCustom);
          return prev;
        }
        const next = [...prev, id];
        persist(next, visibleMetrics, nextCustom);
        return next;
      });
      setSearch("");
    } catch (err) {
      setLookupError(
        err?.message || t("proposalManagerCompetitiveIntelligence.lookupFailed", { query: q }),
      );
    } finally {
      setLookingUp(false);
    }
  };

  const toggleMetric = (key) => {
    setVisibleMetrics((prev) => {
      let next;
      if (prev.includes(key)) {
        if (prev.length <= 1) return prev;
        next = prev.filter((k) => k !== key);
      } else {
        next = [...prev, key];
      }
      persist(selectedIds, next);
      return next;
    });
  };

  const resetMetrics = () => {
    const next = [...DEFAULT_VISIBLE_METRICS];
    setVisibleMetrics(next);
    persist(selectedIds, next);
  };

  const clearSelection = () => {
    enrichTokenRef.current += 1;
    setSelectedIds([]);
    setSelectHint("");
    persist([], visibleMetrics);
  };

  const refreshLive = async () => {
    if (!selectedIds.length || refreshingAll) return;
    setRefreshingAll(true);
    try {
      await enrichIds(selectedIds, { force: true });
    } finally {
      setRefreshingAll(false);
    }
  };

  const dir = isRTLMode ? "rtl" : "ltr";
  const showLookupCta = search.trim() && filtered.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 lg:p-8" dir={dir}>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <FiTarget className="h-5 w-5" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-wide">
                {t("proposalManagerCompetitiveIntelligence.eyebrow")}
              </span>
            </div>
            {selectedIds.length > 0 ? (
              <button
                type="button"
                onClick={refreshLive}
                disabled={anyLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
              >
                <FiZap className={`h-3.5 w-3.5 ${anyLoading ? "animate-pulse" : ""}`} />
                {anyLoading
                  ? t("proposalManagerCompetitiveIntelligence.refreshingLive")
                  : t("proposalManagerCompetitiveIntelligence.refreshLive")}
              </button>
            ) : null}
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white md:text-3xl">
            {t("proposalManagerCompetitiveIntelligence.title")}
          </h1>
          <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-400 md:text-base">
            {t("proposalManagerCompetitiveIntelligence.subtitle")}
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-12">
          <section className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                {t("proposalManagerCompetitiveIntelligence.competitorsTitle")}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t("proposalManagerCompetitiveIntelligence.selectedCount", {
                  count: selectedIds.length,
                  max: MAX_SELECTED,
                })}
              </span>
            </div>

            <form onSubmit={handleLookup} className="mb-3 space-y-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                {t("proposalManagerCompetitiveIntelligence.lookupLabel")}
              </label>
              <div className="relative">
                <FiSearch className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setLookupError("");
                  }}
                  placeholder={t("proposalManagerCompetitiveIntelligence.searchPlaceholder")}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 ps-9 pe-3 text-sm text-slate-900 outline-none ring-indigo-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={lookingUp || !search.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {lookingUp ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <FiSearch className="h-4 w-4" />
                )}
                {lookingUp
                  ? t("proposalManagerCompetitiveIntelligence.lookingUp")
                  : t("proposalManagerCompetitiveIntelligence.lookupButton")}
              </button>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t("proposalManagerCompetitiveIntelligence.lookupHint")}
              </p>
            </form>

            {lookupError ? (
              <div className="mb-3 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                <FiAlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{lookupError}</span>
              </div>
            ) : null}

            {selectHint ? (
              <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                <FiAlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{selectHint}</span>
              </div>
            ) : null}

            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {t("proposalManagerCompetitiveIntelligence.curatedHeading")}
            </p>

            <ul className="max-h-[22rem] space-y-1 overflow-y-auto pe-1">
              {filtered.map((c) => {
                const checked = selectedIds.includes(c.id);
                const loading = !!loadingById[c.id];
                const live = liveById[c.id]?.remote || c.remote;
                const isCustom = !getCuratedCompetitor(c.id);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => toggleCompany(c.id)}
                      className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-start transition ${
                        checked
                          ? "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/40"
                          : "border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          checked
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                        aria-hidden
                      >
                        {checked ? <FiCheck className="h-3 w-3" /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="block text-sm font-medium text-slate-900 dark:text-white">
                            {c.name}
                          </span>
                          {isCustom ? (
                            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                              {t("proposalManagerCompetitiveIntelligence.lookedUpBadge")}
                            </span>
                          ) : null}
                          {loading ? (
                            <span className="text-[10px] font-medium uppercase tracking-wide text-indigo-500">
                              {t("proposalManagerCompetitiveIntelligence.liveLoading")}
                            </span>
                          ) : live ? (
                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                              {t("proposalManagerCompetitiveIntelligence.liveBadge")}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                          {[c.segment, c.hq].filter(Boolean).join(" · ") || "—"}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 ? (
                <li className="px-2 py-6 text-center text-sm text-slate-500">
                  {showLookupCta
                    ? t("proposalManagerCompetitiveIntelligence.noMatchLookup", {
                        query: search.trim(),
                      })
                    : t("proposalManagerCompetitiveIntelligence.noCompetitorsFound")}
                </li>
              ) : null}
            </ul>

            {selectedIds.length > 0 ? (
              <button
                type="button"
                onClick={clearSelection}
                className="mt-3 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                {t("proposalManagerCompetitiveIntelligence.clearSelection")}
              </button>
            ) : null}
          </section>

          <div className="lg:col-span-8 space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t("proposalManagerCompetitiveIntelligence.datasheetTitle")}
                </h2>
                <button
                  type="button"
                  onClick={resetMetrics}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                >
                  <FiRefreshCw className="h-3.5 w-3.5" />
                  {t("proposalManagerCompetitiveIntelligence.resetMetrics")}
                </button>
              </div>
              <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                {t("proposalManagerCompetitiveIntelligence.datasheetHint")}
              </p>
              <div className="flex flex-wrap gap-2">
                {METRIC_KEYS.map((key) => {
                  const on = visibleMetrics.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleMetric(key)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        on
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                      }`}
                    >
                      {t(`proposalManagerCompetitiveIntelligence.metrics.${key}`)}
                    </button>
                  );
                })}
              </div>
            </section>

            {selected.length < 2 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
                <FiTarget className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("proposalManagerCompetitiveIntelligence.emptyTitle")}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t("proposalManagerCompetitiveIntelligence.emptyHint")}
                </p>
              </div>
            ) : (
              <>
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {t("proposalManagerCompetitiveIntelligence.tableTitle")}
                    </h2>
                    {anyLoading ? (
                      <span className="text-xs text-indigo-600 dark:text-indigo-400">
                        {t("proposalManagerCompetitiveIntelligence.refreshingLive")}
                      </span>
                    ) : null}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-start text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                          <th className="sticky start-0 z-10 bg-slate-50 px-4 py-3 font-semibold dark:bg-slate-950">
                            {t("proposalManagerCompetitiveIntelligence.tableCompany")}
                          </th>
                          {visibleMetrics.map((key) => (
                            <th key={key} className="whitespace-nowrap px-4 py-3 font-semibold">
                              {t(`proposalManagerCompetitiveIntelligence.metrics.${key}`)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selected.map((c) => (
                          <tr
                            key={c.id}
                            className="border-t border-slate-100 dark:border-slate-800"
                          >
                            <td className="sticky start-0 z-10 bg-white px-4 py-3 font-medium text-slate-900 dark:bg-slate-900 dark:text-white">
                              <div className="flex items-center gap-2">
                                <span>{c.shortName}</span>
                                {loadingById[c.id] ? (
                                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                                ) : c.remote ? (
                                  <span className="rounded bg-emerald-100 px-1 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                    {t("proposalManagerCompetitiveIntelligence.liveBadge")}
                                  </span>
                                ) : null}
                              </div>
                              <div className="text-xs font-normal text-slate-500">{c.segment}</div>
                              {c.liveError ? (
                                <div className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                                  {t("proposalManagerCompetitiveIntelligence.liveFallback")}
                                </div>
                              ) : null}
                            </td>
                            {visibleMetrics.map((key) => (
                              <td
                                key={key}
                                className={`px-4 py-3 text-slate-700 dark:text-slate-300 ${
                                  key === "keyVehicles" ? "max-w-xs text-xs" : "whitespace-nowrap"
                                }`}
                              >
                                {formatMetricValue(key, c.datasheet?.[key])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t("proposalManagerCompetitiveIntelligence.differentiatorsTitle")}
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {selected.map((c) => (
                      <article
                        key={c.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                            {c.name}
                          </h3>
                          {c.remote ? (
                            <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                              {t("proposalManagerCompetitiveIntelligence.liveBadge")}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {[c.segment, c.hq].filter(Boolean).join(" · ")}
                        </p>

                        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                          {t("proposalManagerCompetitiveIntelligence.valueProposition")}
                        </h4>
                        <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                          {c.valueProposition}
                        </p>

                        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                          {t("proposalManagerCompetitiveIntelligence.keyDifferentiators")}
                        </h4>
                        <ul className="mt-1 list-disc space-y-1 ps-4 text-sm text-slate-700 dark:text-slate-300">
                          {(c.keyDifferentiators || []).map((d) => (
                            <li key={d}>{d}</li>
                          ))}
                        </ul>

                        {c.typicalWinThemes?.length ? (
                          <>
                            <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                              {t("proposalManagerCompetitiveIntelligence.typicalWinThemes")}
                            </h4>
                            <ul className="mt-1 list-disc space-y-1 ps-4 text-sm text-slate-700 dark:text-slate-300">
                              {c.typicalWinThemes.map((theme) => (
                                <li key={theme}>{theme}</li>
                              ))}
                            </ul>
                          </>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
