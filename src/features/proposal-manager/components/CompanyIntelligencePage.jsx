import React, { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocalization } from "../../../hooks/useLocalization";
import { fetchCompanyIntelligence } from "../../../services/companyIntelligenceService";
import { SAMPLE_COMPANIES } from "../data/companyIntelligenceSamples";
import { FiSearch, FiTrendingUp, FiDollarSign, FiUsers, FiGlobe, FiRefreshCw, FiAlertCircle, FiZap } from "react-icons/fi";
import { useProposalIssuer } from "./ProposalIssuerContext";
import FinancialTrendsChart from "./FinancialTrendsChart";

const STORAGE_KEY = "juno_proposal_manager_company_intelligence_saved";
const AUTO_SYNC_KEY = "proposal_manager_ci_auto_sync_forms";
const REGION_LABEL_KEYS = {
  Argentina: "proposalManagerCompanyIntelligence.regions.Argentina",
  Brazil: "proposalManagerCompanyIntelligence.regions.Brazil",
  Canada: "proposalManagerCompanyIntelligence.regions.Canada",
  China: "proposalManagerCompanyIntelligence.regions.China",
  Denmark: "proposalManagerCompanyIntelligence.regions.Denmark",
  France: "proposalManagerCompanyIntelligence.regions.France",
  Germany: "proposalManagerCompanyIntelligence.regions.Germany",
  India: "proposalManagerCompanyIntelligence.regions.India",
  Japan: "proposalManagerCompanyIntelligence.regions.Japan",
  Netherlands: "proposalManagerCompanyIntelligence.regions.Netherlands",
  Singapore: "proposalManagerCompanyIntelligence.regions.Singapore",
  "South Korea": "proposalManagerCompanyIntelligence.regions.SouthKorea",
  Sweden: "proposalManagerCompanyIntelligence.regions.Sweden",
  Switzerland: "proposalManagerCompanyIntelligence.regions.Switzerland",
  Taiwan: "proposalManagerCompanyIntelligence.regions.Taiwan",
  UK: "proposalManagerCompanyIntelligence.regions.UK",
  US: "proposalManagerCompanyIntelligence.regions.US",
};
const SECTOR_LABEL_KEYS = {
  "Communication Services": "proposalManagerCompanyIntelligence.sectors.communicationServices",
  Consumer: "proposalManagerCompanyIntelligence.sectors.consumer",
  "Consumer Discretionary": "proposalManagerCompanyIntelligence.sectors.consumerDiscretionary",
  "Consumer Staples": "proposalManagerCompanyIntelligence.sectors.consumerStaples",
  Diversified: "proposalManagerCompanyIntelligence.sectors.diversified",
  Energy: "proposalManagerCompanyIntelligence.sectors.energy",
  Financials: "proposalManagerCompanyIntelligence.sectors.financials",
  "Financial Services": "proposalManagerCompanyIntelligence.sectors.financialServices",
  "Health Care": "proposalManagerCompanyIntelligence.sectors.healthCare",
  Healthcare: "proposalManagerCompanyIntelligence.sectors.healthcare",
  Industrials: "proposalManagerCompanyIntelligence.sectors.industrials",
  "Information Technology": "proposalManagerCompanyIntelligence.sectors.informationTechnology",
  "Media & Telecom": "proposalManagerCompanyIntelligence.sectors.mediaTelecom",
  Materials: "proposalManagerCompanyIntelligence.sectors.materials",
  "Real Estate": "proposalManagerCompanyIntelligence.sectors.realEstate",
  Technology: "proposalManagerCompanyIntelligence.sectors.technology",
  Utilities: "proposalManagerCompanyIntelligence.sectors.utilities",
};

function readAutoSyncPreference() {
  try {
    const v = localStorage.getItem(AUTO_SYNC_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}
const MAX_SAVED = 20;
const QUICK_PICK_TICKERS = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "JPM"];

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCompany(entry) {
  const list = loadSaved().filter((c) => c.id !== entry.id);
  const next = [{ ...entry, savedAt: new Date().toISOString() }, ...list].slice(0, MAX_SAVED);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export default function CompanyIntelligencePage() {
  const { isRTLMode } = useLocalization();
  const { t } = useTranslation();
  const { linkFromIntelligence } = useProposalIssuer();
  const [autoSyncForms, setAutoSyncForms] = useState(readAutoSyncPreference);
  const [syncNotice, setSyncNotice] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [selectedSector, setSelectedSector] = useState("All");
  const [showBrowser, setShowBrowser] = useState(false);
  const [browserQuery, setBrowserQuery] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(loadSaved);

  const regionOptions = useMemo(
    () => ["All", ...Array.from(new Set(SAMPLE_COMPANIES.map((c) => c.region))).sort()],
    [],
  );
  const sectorOptions = useMemo(
    () => ["All", ...Array.from(new Set(SAMPLE_COMPANIES.map((c) => c.sector))).sort()],
    [],
  );

  const filteredCompanies = useMemo(
    () =>
      SAMPLE_COMPANIES.filter(
        (c) => (selectedRegion === "All" || c.region === selectedRegion)
          && (selectedSector === "All" || c.sector === selectedSector),
      ),
    [selectedRegion, selectedSector],
  );

  const suggestions = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return [];
    return filteredCompanies
      .filter((c) => c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, filteredCompanies]);

  const quickPicks = useMemo(
    () =>
      QUICK_PICK_TICKERS
        .map((ticker) => SAMPLE_COMPANIES.find((c) => c.ticker === ticker))
        .filter((c) => !!c)
        .filter((c) => (selectedRegion === "All" || c.region === selectedRegion) && (selectedSector === "All" || c.sector === selectedSector)),
    [selectedRegion, selectedSector],
  );

  const regionLabel = useCallback((region) => t(REGION_LABEL_KEYS[region] || "", { defaultValue: region }), [t]);
  const sectorLabel = useCallback((sector) => t(SECTOR_LABEL_KEYS[sector] || "", { defaultValue: sector }), [t]);

  const browserRows = useMemo(() => {
    const q = browserQuery.trim().toLowerCase();
    const rows = filteredCompanies.filter((c) => {
      if (!q) return true;
      return c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.region.toLowerCase().includes(q) || c.sector.toLowerCase().includes(q);
    });
    const withRevenue = rows.map((c) => ({ ...c, latestRevenue: c.revenue?.[0]?.value ?? 0 }));
    withRevenue.sort((a, b) => {
      const direction = sortDir === "asc" ? 1 : -1;
      if (sortKey === "latestRevenue") return (a.latestRevenue - b.latestRevenue) * direction;
      return String(a[sortKey] || "").localeCompare(String(b[sortKey] || "")) * direction;
    });
    return withRevenue;
  }, [browserQuery, filteredCompanies, sortDir, sortKey]);

  const onSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  };

  const handleSearch = useCallback(async (rawQuery) => {
    const q = (rawQuery ?? query ?? "").trim();
    if (!q) {
      setError(t("proposalManagerCompanyIntelligence.errorEnterCompanyOrTicker"));
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const data = await fetchCompanyIntelligence({
        companyName: q,
        ticker: q.length <= 6 && /^[A-Z0-9.-]+$/i.test(q) ? q : undefined,
      });

      if (data?.error) {
        setResult({ ...data, error: t("proposalManagerCompanyIntelligence.errorNoSampleData", { query: q }) });
        return;
      }

      if (
        data
        && !data.error
        && ((selectedRegion !== "All" && data.region !== selectedRegion)
          || (selectedSector !== "All" && data.sector !== selectedSector))
      ) {
        setResult(null);
        const displayRegion = selectedRegion === "All" ? t("proposalManagerCompanyIntelligence.allRegions") : selectedRegion;
        const displaySector = selectedSector === "All" ? t("proposalManagerCompanyIntelligence.allSectors") : selectedSector;
        setError(
          t("proposalManagerCompanyIntelligence.errorNoCompanyMatched", {
            query: q,
            region: displayRegion,
            sector: displaySector,
          }),
        );
        return;
      }

      setResult(data);
      if (data && !data.error && data.name) {
        const id = `ci_${Date.now()}_${(data.ticker || data.name).replace(/\s/g, "_")}`;
        saveCompany({ id, name: data.name, ticker: data.ticker, region: data.region, sector: data.sector, source: data.source, financials: data.financials, trends: data.trends, customers: data.customers });
        setSaved(loadSaved());
      }
      if (data && !data.error && data.financials && autoSyncForms) {
        const ok = linkFromIntelligence(data);
        if (ok) {
          setSyncNotice(true);
          window.setTimeout(() => setSyncNotice(false), 5000);
        }
      }
    } catch (e) {
      setError(e.message || t("proposalManagerCompanyIntelligence.errorFailedToFetch"));
    } finally {
      setLoading(false);
    }
  }, [query, selectedRegion, selectedSector, autoSyncForms, linkFromIntelligence]);

  const formatValue = (v) => {
    if (v == null || typeof v !== "number") return "—";
    if (Math.abs(v) >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
    if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(2)}K`;
    return `$${v.toFixed(0)}`;
  };

  const revenueData = result?.trends?.revenue?.length ? result.trends.revenue.map((r) => ({ period: r.period, revenue: r.value, netIncome: null })) : [];
  const netIncomeData = result?.trends?.netIncome?.length ? result.trends.netIncome.map((n) => ({ period: n.period, netIncome: n.value })) : [];
  const chartData = revenueData.length
    ? revenueData.map((r, i) => ({ ...r, netIncome: netIncomeData[i]?.netIncome ?? null }))
    : netIncomeData.length
      ? netIncomeData
      : [];

  return (
    <div className={isRTLMode ? "rtl" : "ltr"} dir={isRTLMode ? "rtl" : "ltr"}>
      <div className="max-w-6xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiGlobe className="w-8 h-8 text-blue-600" />
            {t("proposalManagerCompanyIntelligence.title")}
          </h1>
          <label className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoSyncForms}
              onChange={(e) => {
                const on = e.target.checked;
                setAutoSyncForms(on);
                try {
                  localStorage.setItem(AUTO_SYNC_KEY, on ? "1" : "0");
                } catch {
                  /* ignore */
                }
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>{t("proposalManagerCompanyIntelligence.autoPushLabel")}</span>
          </label>
          {syncNotice && (
            <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              <FiZap className="w-4 h-4 shrink-0" />
              {t("proposalManagerCompanyIntelligence.syncedNotice")}
            </div>
          )}
        </header>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 md:p-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("proposalManagerCompanyIntelligence.companyNameOrTicker")}</label>
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-2 mb-3 ${isRTLMode ? "md:[direction:rtl]" : ""}`}>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {regionOptions.map((region) => (
                <option key={region} value={region}>{region === "All" ? t("proposalManagerCompanyIntelligence.allRegions") : regionLabel(region)}</option>
              ))}
            </select>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {sectorOptions.map((sector) => (
                <option key={sector} value={sector}>{sector === "All" ? t("proposalManagerCompanyIntelligence.allSectors") : sectorLabel(sector)}</option>
              ))}
            </select>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center px-1">
              {t("proposalManagerCompanyIntelligence.filtersCount", { count: filteredCompanies.length })}
            </div>
          </div>
          <div className="mb-3">
            <button
              type="button"
              onClick={() => setShowBrowser(true)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
            >
              {t("proposalManagerCompanyIntelligence.browseAllCompanies")}
            </button>
          </div>
          <div className={`flex flex-col sm:flex-row gap-2 ${isRTLMode ? "sm:flex-row-reverse" : ""}`}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={t("proposalManagerCompanyIntelligence.searchPlaceholder")}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => handleSearch()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 font-medium"
            >
              {loading ? <FiRefreshCw className="w-5 h-5 animate-spin" /> : <FiSearch className="w-5 h-5" />}
              {loading ? t("proposalManagerCompanyIntelligence.fetching") : t("proposalManagerCompanyIntelligence.fetchIntelligence")}
            </button>
          </div>
          {suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((c) => (
                <button
                  key={`${c.ticker}_suggest`}
                  type="button"
                  onClick={() => {
                    setQuery(c.ticker);
                    handleSearch(c.ticker);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm"
                >
                  {c.ticker} - {c.name}
                </button>
              ))}
            </div>
          )}
          <div className="mt-3">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">{t("proposalManagerCompanyIntelligence.popularQuickPicks")}</p>
            <div className="flex flex-wrap gap-2">
              {quickPicks.map((c) => (
                <button
                  key={`${c.ticker}_quick`}
                  type="button"
                  onClick={() => {
                    setQuery(c.ticker);
                    handleSearch(c.ticker);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  {c.ticker}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <div className="mt-2 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
              <FiAlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
        </div>

        {saved.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t("proposalManagerCompanyIntelligence.recentlyViewed")}</h2>
            <ul className="flex flex-wrap gap-2">
              {saved.slice(0, 10).map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery(c.ticker || c.name);
                      setResult({ name: c.name, ticker: c.ticker, region: c.region, sector: c.sector, source: c.source, financials: c.financials, trends: c.trends, customers: c.customers });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    {c.name} {c.ticker ? `(${c.ticker})` : ""}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{result.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {result.ticker && `${result.ticker} · `}{result.region || "—"}{result.sector ? ` · ${result.sector}` : ""} · {result.source || "—"}
                  </p>
                </div>
                {result.financials && !result.error && (
                  <button
                    type="button"
                    onClick={() => {
                      const ok = linkFromIntelligence(result);
                      if (ok) {
                        setSyncNotice(true);
                        window.setTimeout(() => setSyncNotice(false), 5000);
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-blue-500 transition-all"
                  >
                    <FiZap className="w-4 h-4" />
                      {t("proposalManagerCompanyIntelligence.syncToProposalForms")}
                  </button>
                )}
              </div>
            </div>

            {result.error && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-amber-800 dark:text-amber-200">
                {result.error}
              </div>
            )}

            {result.financials && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center gap-3">
                    <FiDollarSign className="w-10 h-10 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t("proposalManagerCompanyIntelligence.latestRevenue")}</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{formatValue(result.financials.revenue?.[0]?.value)}</p>
                      <p className="text-xs text-gray-500">{result.financials.revenue?.[0]?.period || "—"}</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center gap-3">
                    <FiTrendingUp className="w-10 h-10 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t("proposalManagerCompanyIntelligence.netIncome")}</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{formatValue(result.financials.netIncome?.[0]?.value)}</p>
                      <p className="text-xs text-gray-500">{result.financials.netIncome?.[0]?.period || "—"}</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center gap-3">
                    <FiGlobe className="w-10 h-10 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t("proposalManagerCompanyIntelligence.totalAssets")}</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{formatValue(result.financials.assets?.[0]?.value)}</p>
                      <p className="text-xs text-gray-500">{result.financials.assets?.[0]?.period || "—"}</p>
                    </div>
                  </div>
                </div>

                {chartData.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700/80 shadow-sm p-4 md:p-6">
                    <FinancialTrendsChart
                      rows={chartData}
                      showRevenue={Boolean(result.trends?.revenue?.length)}
                      showNetIncome={Boolean(result.trends?.netIncome?.length)}
                      formatValue={formatValue}
                    />
                  </div>
                )}

                {result.customers && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 md:p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <FiUsers className="w-5 h-5" /> {t("proposalManagerCompanyIntelligence.customersAndSegments")}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{result.customers}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {showBrowser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl bg-white dark:bg-gray-800 rounded-xl shadow-xl max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t("proposalManagerCompanyIntelligence.browseCompanies")}</h3>
              <button
                type="button"
                onClick={() => setShowBrowser(false)}
                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm"
              >
                {t("proposalManagerCompanyIntelligence.close")}
              </button>
            </div>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                value={browserQuery}
                onChange={(e) => setBrowserQuery(e.target.value)}
                placeholder={t("proposalManagerCompanyIntelligence.searchInListPlaceholder")}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="overflow-auto p-4">
              <table className="min-w-full text-sm">
                <thead className="text-left text-gray-600 dark:text-gray-300">
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 pr-3">
                      <button type="button" onClick={() => onSort("ticker")} className="hover:underline">{t("proposalManagerCompanyIntelligence.ticker")}</button>
                    </th>
                    <th className="py-2 pr-3">
                      <button type="button" onClick={() => onSort("name")} className="hover:underline">{t("proposalManagerCompanyIntelligence.company")}</button>
                    </th>
                    <th className="py-2 pr-3">
                      <button type="button" onClick={() => onSort("region")} className="hover:underline">{t("proposalManagerCompanyIntelligence.region")}</button>
                    </th>
                    <th className="py-2 pr-3">
                      <button type="button" onClick={() => onSort("sector")} className="hover:underline">{t("proposalManagerCompanyIntelligence.sector")}</button>
                    </th>
                    <th className="py-2 pr-3">
                      <button type="button" onClick={() => onSort("latestRevenue")} className="hover:underline">{t("proposalManagerCompanyIntelligence.latestRevenueHeader")}</button>
                    </th>
                    <th className="py-2">{t("proposalManagerCompanyIntelligence.action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {browserRows.map((c) => (
                    <tr key={`${c.ticker}_row`} className="border-b border-gray-100 dark:border-gray-700/60">
                      <td className="py-2 pr-3 text-gray-900 dark:text-gray-100">{c.ticker}</td>
                      <td className="py-2 pr-3 text-gray-900 dark:text-gray-100">{c.name}</td>
                      <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{c.region}</td>
                      <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{c.sector}</td>
                      <td className="py-2 pr-3 text-gray-900 dark:text-gray-100">{formatValue(c.latestRevenue)}</td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => {
                            setQuery(c.ticker);
                            setShowBrowser(false);
                            handleSearch(c.ticker);
                          }}
                          className="px-2.5 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                          {t("proposalManagerCompanyIntelligence.select")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {browserRows.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-6">{t("proposalManagerCompanyIntelligence.noCompaniesFound")}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
