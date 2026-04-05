import React from "react";
import { FiDollarSign, FiTrendingUp, FiGlobe } from "react-icons/fi";
import { formatUsd } from "../services/proposalIssuerStorage";
import FinancialTrendsChart from "./FinancialTrendsChart";

export default function IssuerFinancialPanel({ snapshot, className = "" }) {
  if (!snapshot?.financials) return null;

  const { revenue, netIncome, assets } = snapshot.financials;
  const revenueData = snapshot.trends?.revenue?.length
    ? snapshot.trends.revenue.map((r) => ({ period: r.period, revenue: r.value, netIncome: null }))
    : [];
  const netIncomeData = snapshot.trends?.netIncome?.length
    ? snapshot.trends.netIncome.map((n) => ({ period: n.period, netIncome: n.value }))
    : [];
  const chartData = revenueData.length
    ? revenueData.map((r, i) => ({ ...r, netIncome: netIncomeData[i]?.netIncome ?? null }))
    : netIncomeData.length
      ? netIncomeData
      : [];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-gray-800 rounded-xl p-4 flex items-center gap-3 border border-emerald-100 dark:border-emerald-800/40 shadow-sm">
          <FiDollarSign className="w-10 h-10 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Latest revenue</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatUsd(revenue?.[0]?.value)}</p>
            <p className="text-xs text-gray-500">{revenue?.[0]?.period || "—"}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 rounded-xl p-4 flex items-center gap-3 border border-blue-100 dark:border-blue-800/40 shadow-sm">
          <FiTrendingUp className="w-10 h-10 text-blue-600 shrink-0" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Net income</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatUsd(netIncome?.[0]?.value)}</p>
            <p className="text-xs text-gray-500">{netIncome?.[0]?.period || "—"}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-900/20 dark:to-gray-800 rounded-xl p-4 flex items-center gap-3 border border-violet-100 dark:border-violet-800/40 shadow-sm">
          <FiGlobe className="w-10 h-10 text-violet-600 shrink-0" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total assets</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatUsd(assets?.[0]?.value)}</p>
            <p className="text-xs text-gray-500">{assets?.[0]?.period || "—"}</p>
          </div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow border border-gray-100 dark:border-gray-700">
          <FinancialTrendsChart
            rows={chartData}
            showRevenue={Boolean(snapshot.trends?.revenue?.length)}
            showNetIncome={Boolean(snapshot.trends?.netIncome?.length)}
            formatValue={formatUsd}
            title="Financial trends (linked issuer)"
            subtitle="Same series as Company Intelligence — auto-filled for this proposal."
          />
        </div>
      )}

      {snapshot.customers && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Customer &amp; market context</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{snapshot.customers}</p>
        </div>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500">
        Source: {snapshot.source || "Company Intelligence"} · Linked {snapshot.linkedAt ? new Date(snapshot.linkedAt).toLocaleString() : ""}
      </p>
    </div>
  );
}
