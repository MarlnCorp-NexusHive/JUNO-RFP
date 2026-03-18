import React, { useState, useCallback } from "react";
import { useLocalization } from "../../../hooks/useLocalization";
import { fetchCompanyIntelligence } from "../../../services/companyIntelligenceService";
import { FiSearch, FiTrendingUp, FiDollarSign, FiUsers, FiGlobe, FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const STORAGE_KEY = "juno_proposal_manager_company_intelligence_saved";
const MAX_SAVED = 20;

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
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(loadSaved);

  const handleSearch = useCallback(async () => {
    const q = (query || "").trim();
    if (!q) {
      setError("Enter a company name or ticker symbol.");
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
      setResult(data);
      if (data && !data.error && data.name) {
        const id = `ci_${Date.now()}_${(data.ticker || data.name).replace(/\s/g, "_")}`;
        saveCompany({ id, name: data.name, ticker: data.ticker, region: data.region, source: data.source, financials: data.financials, trends: data.trends, customers: data.customers });
        setSaved(loadSaved());
      }
    } catch (e) {
      setError(e.message || "Failed to fetch company data.");
    } finally {
      setLoading(false);
    }
  }, [query]);

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
            Company Intelligence
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Research companies you are bidding to (RFP issuers): financials, trends, and customer context from public sources. US: SEC EDGAR (via proxy). Global: add VITE_FMP_API_KEY in .env and restart dev server (npm run dev).
          </p>
        </header>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 md:p-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company name or ticker</label>
          <div className={`flex flex-col sm:flex-row gap-2 ${isRTLMode ? "sm:flex-row-reverse" : ""}`}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g. Apple, AAPL, Microsoft"
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 font-medium"
            >
              {loading ? <FiRefreshCw className="w-5 h-5 animate-spin" /> : <FiSearch className="w-5 h-5" />}
              {loading ? "Fetching…" : "Fetch intelligence"}
            </button>
          </div>
          {error && (
            <div className="mt-2 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
              <FiAlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
        </div>

        {saved.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Recently viewed</h2>
            <ul className="flex flex-wrap gap-2">
              {saved.slice(0, 10).map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery(c.ticker || c.name);
                      setResult({ name: c.name, ticker: c.ticker, region: c.region, source: c.source, financials: c.financials, trends: c.trends, customers: c.customers });
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{result.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {result.ticker && `${result.ticker} · `}{result.region || "—"} · {result.source || "—"}
              </p>
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
                      <p className="text-sm text-gray-500 dark:text-gray-400">Latest revenue</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{formatValue(result.financials.revenue?.[0]?.value)}</p>
                      <p className="text-xs text-gray-500">{result.financials.revenue?.[0]?.period || "—"}</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center gap-3">
                    <FiTrendingUp className="w-10 h-10 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Net income</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{formatValue(result.financials.netIncome?.[0]?.value)}</p>
                      <p className="text-xs text-gray-500">{result.financials.netIncome?.[0]?.period || "—"}</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center gap-3">
                    <FiGlobe className="w-10 h-10 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total assets</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{formatValue(result.financials.assets?.[0]?.value)}</p>
                      <p className="text-xs text-gray-500">{result.financials.assets?.[0]?.period || "—"}</p>
                    </div>
                  </div>
                </div>

                {chartData.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 md:p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial trends</h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[...chartData].reverse()} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
                          <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1e9 ? `${(v / 1e9).toFixed(1)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(0)}M` : v)} />
                          <Tooltip formatter={(v) => (v != null ? formatValue(v) : "—")} />
                          <Legend />
                          {result.trends?.revenue?.length > 0 && <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} name="Revenue" dot={{ r: 3 }} />}
                          {result.trends?.netIncome?.length > 0 && <Line type="monotone" dataKey="netIncome" stroke="#6366f1" strokeWidth={2} name="Net income" dot={{ r: 3 }} />}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {result.customers && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 md:p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <FiUsers className="w-5 h-5" /> Customers & segments
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{result.customers}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
