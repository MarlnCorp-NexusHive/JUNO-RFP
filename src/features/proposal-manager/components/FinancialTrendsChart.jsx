import React, { useEffect, useId, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";

function useIsDarkMode() {
  const [dark, setDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    const sync = () => setDark(document.documentElement.classList.contains("dark"));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  return dark;
}

function formatPeriodLabel(p, locale) {
  if (p == null) return "";
  if (typeof p !== "string") return String(p);
  const t = Date.parse(p);
  if (!Number.isNaN(t)) {
    const d = new Date(t);
    return d.toLocaleDateString(locale, { year: "numeric", month: "short" });
  }
  return p;
}

function formatAxisCompact(v) {
  if (v == null || Number.isNaN(v)) return "";
  const abs = Math.abs(v);
  if (abs >= 1e12) return `${(v / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(Math.round(v));
}

function TrendsTooltip({ active, payload, label, formatValue, isDark, formatPeriodLabel }) {
  if (!active || !payload?.length) return null;
  const border = isDark ? "border-slate-600/80" : "border-slate-200/90";
  const bg = isDark ? "bg-slate-900/95" : "bg-white/95";
  return (
    <div
      className={`rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md ${bg} ${border}`}
    >
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {formatPeriodLabel(label)}
      </p>
      <ul className="space-y-2">
        {payload
          .filter((e) => e.value != null && typeof e.value === "number")
          .map((entry) => (
            <li key={String(entry.dataKey)} className="flex items-center justify-between gap-6 text-sm">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/80 dark:ring-slate-900/80"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}
              </span>
              <span className="font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">
                {formatValue(entry.value)}
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
}

/**
 * Financial trend visualization: dual-axis composed chart with gradient areas.
 * Expects `rows` in newest-first order (same as Company Intelligence trends); displays oldest → newest left to right.
 */
export default function FinancialTrendsChart({
  rows,
  showRevenue,
  showNetIncome,
  formatValue,
  className = "",
  title,
  subtitle,
}) {
  const { t, i18n } = useTranslation();
  const chartTitle = title ?? t("proposalManagerCompanyIntelligence.charts.title");
  const chartSubtitle = subtitle ?? t("proposalManagerCompanyIntelligence.charts.subtitle");
  const isDark = useIsDarkMode();
  const locale = String(i18n?.resolvedLanguage || i18n?.language || "").toLowerCase().startsWith("ar") ? "ar" : undefined;
  const uid = useId().replace(/:/g, "");
  const revGrad = `ftc-rev-${uid}`;
  const niGrad = `ftc-ni-${uid}`;

  const ordered = useMemo(() => [...(rows || [])].reverse(), [rows]);
  const dualAxis = Boolean(showRevenue && showNetIncome);

  const theme = isDark
    ? {
        grid: "hsl(217 19% 27%)",
        axis: "#94a3b8",
        revStroke: "#5eead4",
        revFillTop: "rgba(45, 212, 191, 0.45)",
        revFillBot: "rgba(45, 212, 191, 0)",
        niStroke: "#a5b4fc",
        niFillTop: "rgba(129, 140, 248, 0.4)",
        niFillBot: "rgba(129, 140, 248, 0)",
      }
    : {
        grid: "hsl(214 32% 91%)",
        axis: "#64748b",
        revStroke: "#0d9488",
        revFillTop: "rgba(20, 184, 166, 0.28)",
        revFillBot: "rgba(20, 184, 166, 0)",
        niStroke: "#4f46e5",
        niFillTop: "rgba(99, 102, 241, 0.22)",
        niFillBot: "rgba(99, 102, 241, 0)",
      };

  if (!ordered.length) return null;

  return (
    <div className={className}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{chartTitle}</h3>
          {chartSubtitle ? (
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{chartSubtitle}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-5">
          {showRevenue && (
            <div className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-8 rounded-full shadow-sm"
                style={{
                  background: `linear-gradient(90deg, ${theme.revStroke}, ${theme.revFillTop})`,
                }}
              />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t("proposalManagerCompanyIntelligence.charts.labels.revenue")}</span>
            </div>
          )}
          {showNetIncome && (
            <div className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-8 rounded-full shadow-sm"
                style={{
                  background: `linear-gradient(90deg, ${theme.niStroke}, ${theme.niFillTop})`,
                }}
              />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t("proposalManagerCompanyIntelligence.charts.labels.netIncome")}</span>
            </div>
          )}
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/80 to-white dark:border-slate-700/80 dark:from-slate-900/40 dark:to-slate-900/20 px-2 pt-4 pb-2 shadow-inner sm:px-4"
      >
        <div className="h-[min(22rem,55vh)] w-full min-h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={ordered}
              margin={{ top: 12, right: dualAxis ? 4 : 8, left: 4, bottom: 4 }}
            >
              <defs>
                <linearGradient id={revGrad} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.revFillTop} />
                  <stop offset="100%" stopColor={theme.revFillBot} />
                </linearGradient>
                <linearGradient id={niGrad} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.niFillTop} />
                  <stop offset="100%" stopColor={theme.niFillBot} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke={theme.grid}
                strokeOpacity={0.7}
                vertical={false}
              />
              <XAxis
                dataKey="period"
                tickFormatter={(p) => formatPeriodLabel(p, locale)}
                tick={{ fill: theme.axis, fontSize: 11, fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: theme.grid, strokeWidth: 1 }}
                dy={6}
                interval="preserveStartEnd"
              />
              {showRevenue && (
                <YAxis
                  yAxisId="revenue"
                  orientation="left"
                  width={52}
                  tickFormatter={formatAxisCompact}
                  tick={{ fill: theme.axis, fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  domain={["auto", "auto"]}
                />
              )}
              {showNetIncome && (
                <YAxis
                  yAxisId="income"
                  orientation={dualAxis ? "right" : "left"}
                  width={52}
                  tickFormatter={formatAxisCompact}
                  tick={{ fill: theme.axis, fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  domain={["auto", "auto"]}
                />
              )}
              <Tooltip
                cursor={{
                  stroke: theme.grid,
                  strokeWidth: 1,
                  strokeDasharray: "4 6",
                }}
                content={
                  <TrendsTooltip
                    formatValue={formatValue}
                    isDark={isDark}
                    formatPeriodLabel={(p) => formatPeriodLabel(p, locale)}
                  />
                }
              />
              {showRevenue && (
                <Area
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  name={t("proposalManagerCompanyIntelligence.charts.labels.revenue")}
                  stroke={theme.revStroke}
                  strokeWidth={2.5}
                  fill={`url(#${revGrad})`}
                  activeDot={{
                    r: 5,
                    strokeWidth: 2,
                    stroke: isDark ? "#0f172a" : "#fff",
                    fill: theme.revStroke,
                  }}
                  dot={false}
                  connectNulls
                />
              )}
              {showNetIncome && (
                <Area
                  yAxisId="income"
                  type="monotone"
                  dataKey="netIncome"
                  name={t("proposalManagerCompanyIntelligence.charts.labels.netIncome")}
                  stroke={theme.niStroke}
                  strokeWidth={2.5}
                  fill={`url(#${niGrad})`}
                  activeDot={{
                    r: 5,
                    strokeWidth: 2,
                    stroke: isDark ? "#0f172a" : "#fff",
                    fill: theme.niStroke,
                  }}
                  dot={false}
                  connectNulls
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
