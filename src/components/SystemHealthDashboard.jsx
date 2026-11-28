import React, { useCallback, useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import API from "../services/api.js";
import { TourProvider } from "./tours/TourContext";

const superAdminFeatures = [
  { label: "Dashboard", icon: "🏠", route: "/rbac" },
  { label: "Users", icon: "👤", route: "/rbac/users" },
  { label: "Teams & Roles", icon: "👥", route: "/rbac/teams" },
  { label: "Role Templates", icon: "📄", route: "/rbac/templates" },
  { label: "Audit Logs", icon: "📝", route: "/rbac/logs" },
  { label: "System Health", icon: "📊", route: "/rbac/system-health" },
  { label: "System Settings", icon: "⚙️", route: "/rbac/settings" },
];

function formatDuration(totalSec) {
  const sec = Math.max(0, Math.floor(Number(totalSec) || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString();
  } catch {
    return iso;
  }
}

export default function SystemHealthDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await API.get("/admin/health-metrics", { timeout: 10_000 });
      setData(res.data);
      setError("");
      setLastUpdated(new Date());
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load system health metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = window.setInterval(fetchMetrics, 5000);
    return () => window.clearInterval(id);
  }, [autoRefresh, fetchMetrics]);

  const mem = data?.memory || {};
  const cpu = data?.cpu || {};
  const http = data?.http || {};
  const users = data?.users || {};
  const proc = data?.process || {};

  return (
    <TourProvider>
    <div className="flex min-h-screen bg-[#F4F6F9] dark:bg-[#0B1017] text-slate-900 dark:text-slate-100">
      <Sidebar features={superAdminFeatures} userLabel="Super Admin" />

      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-2xl font-bold tracking-tight">Application Health &amp; Usage</h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Live Node.js telemetry (Prometheus / prom-client) · Active sessions, logins, time spent &amp; memory
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer select-none rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded accent-emerald-600"
              />
              Auto-refresh (5s)
            </label>
            <button
              type="button"
              onClick={fetchMetrics}
              className="rounded-lg bg-[#243F5B] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2E4F70] transition"
            >
              Refresh Now
            </button>
            <a
              href="/metrics"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Prometheus /metrics ↗
            </a>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        {loading && !data ? (
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-10 text-center text-sm text-slate-500 shadow">
            Loading live application metrics...
          </div>
        ) : (
          <>
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <KpiCard
                label="Server Uptime"
                value={formatDuration(proc.uptimeSec)}
                sub={`Node ${proc.nodeVersion || "—"} · PID ${proc.pid || "—"}`}
                accent="emerald"
              />
              <KpiCard
                label="Active Users Now"
                value={String(users.activeNow ?? 0)}
                sub="Live single-tab sessions"
                accent="blue"
              />
              <KpiCard
                label="Total Logins"
                value={String(users.totalLogins ?? 0)}
                sub={`Today: ${users.loginsToday ?? 0}`}
                accent="indigo"
              />
              <KpiCard
                label="Avg Time Spent"
                value={formatDuration(users.avgSessionSec)}
                sub={`Total: ${formatDuration(users.totalTimeSpentSec)}`}
                accent="violet"
              />
              <KpiCard
                label="App Memory (RSS)"
                value={`${mem.rssMb ?? 0} MB`}
                sub={`Heap: ${mem.heapUsedMb ?? 0} / ${mem.heapTotalMb ?? 0} MB (${mem.heapUsedPct ?? 0}%)`}
                accent="amber"
              />
              <KpiCard
                label="API Requests"
                value={String(http.totalRequests ?? 0)}
                sub={`Avg ${http.avgLatencyMs ?? 0}ms · Err ${http.errorRatePct ?? 0}%`}
                accent={http.errorRatePct > 5 ? "red" : "teal"}
              />
            </div>

            {/* Memory, CPU & Event Loop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Memory &amp; Process Resources
                </h2>
                <ProgressRow
                  label="Node.js V8 Heap Used"
                  detail={`${mem.heapUsedMb ?? 0} MB / ${mem.heapTotalMb ?? 0} MB`}
                  pct={mem.heapUsedPct ?? 0}
                  color="bg-amber-500"
                />
                <ProgressRow
                  label="Host System RAM"
                  detail={`${mem.systemUsedMb ?? 0} MB / ${mem.systemTotalMb ?? 0} MB`}
                  pct={mem.systemUsedPct ?? 0}
                  color="bg-blue-600"
                />
                <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                  <MiniStat label="Process RSS" value={`${mem.rssMb ?? 0} MB`} />
                  <MiniStat label="External Buffers" value={`${mem.externalMb ?? 0} MB`} />
                  <MiniStat label="CPU Cores" value={String(cpu.cores ?? "—")} />
                  <MiniStat label="Load Avg (1m)" value={String(cpu.loadAvg1m ?? 0)} />
                  <MiniStat label="Event Loop p50" value={`${cpu.eventLoopDelayP50Ms ?? 0} ms`} />
                  <MiniStat label="Event Loop p95" value={`${cpu.eventLoopDelayP95Ms ?? 0} ms`} />
                </div>
              </div>

              <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  HTTP Traffic &amp; Latency
                </h2>
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <MiniStat label="2xx OK" value={String(http.status2xx ?? 0)} />
                  <MiniStat label="4xx Client" value={String(http.status4xx ?? 0)} />
                  <MiniStat label="5xx Server" value={String(http.status5xx ?? 0)} />
                  <MiniStat label="p95 Latency" value={`${http.p95LatencyMs ?? 0} ms`} />
                </div>
                <div className="overflow-x-auto max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                      <tr>
                        <th className="py-1.5 pr-3">Route</th>
                        <th className="py-1.5 px-2 text-right">Calls</th>
                        <th className="py-1.5 px-2 text-right">Errors</th>
                        <th className="py-1.5 pl-2 text-right">Avg (ms)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                      {(http.topRoutes || []).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-400">
                            No API requests recorded yet
                          </td>
                        </tr>
                      ) : (
                        http.topRoutes.map((r) => (
                          <tr key={r.route}>
                            <td className="py-1.5 pr-3 font-mono text-[11px] truncate max-w-[220px]">
                              {r.route}
                            </td>
                            <td className="py-1.5 px-2 text-right font-medium">{r.count}</td>
                            <td className="py-1.5 px-2 text-right text-red-600 dark:text-red-400">
                              {r.errors}
                            </td>
                            <td className="py-1.5 pl-2 text-right font-mono">{r.avgMs}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Active Sessions & Recent Login Events */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-slate-200/80 dark:border-slate-800">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Active User Sessions ({users.activeNow ?? 0})
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                      <tr>
                        <th className="py-2 pr-3">User</th>
                        <th className="py-2 px-2">Role</th>
                        <th className="py-2 px-2">Current Page</th>
                        <th className="py-2 pl-2 text-right">Time Spent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                      {(users.activeSessions || []).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400">
                            No active sessions reported yet
                          </td>
                        </tr>
                      ) : (
                        users.activeSessions.map((s) => (
                          <tr key={s.sessionId}>
                            <td className="py-2 pr-3 font-medium">{s.user}</td>
                            <td className="py-2 px-2 text-slate-500 dark:text-slate-400">{s.role}</td>
                            <td className="py-2 px-2 font-mono text-[11px]">{s.path}</td>
                            <td className="py-2 pl-2 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                              {formatDuration(s.durationSec)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-slate-200/80 dark:border-slate-800">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Recent Login / Session Activity
                </h2>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                      <tr>
                        <th className="py-2 pr-2">Time</th>
                        <th className="py-2 px-2">Event</th>
                        <th className="py-2 px-2">User</th>
                        <th className="py-2 pl-2 text-right">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                      {(users.recentEvents || []).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400">
                            No login/logout events yet
                          </td>
                        </tr>
                      ) : (
                        users.recentEvents.map((e, i) => (
                          <tr key={`${e.ts}-${i}`}>
                            <td className="py-2 pr-2 font-mono text-[11px] text-slate-500">
                              {formatTime(e.ts)}
                            </td>
                            <td className="py-2 px-2">
                              <span
                                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                  e.event === "login"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                }`}
                              >
                                {e.event}
                              </span>
                            </td>
                            <td className="py-2 px-2 font-medium">{e.user}</td>
                            <td className="py-2 pl-2 text-right font-mono">
                              {e.durationSec ? formatDuration(e.durationSec) : "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
    </TourProvider>
  );
}

function KpiCard({ label, value, sub, accent = "blue" }) {
  const ringMap = {
    emerald: "border-t-emerald-500",
    blue: "border-t-blue-500",
    indigo: "border-t-indigo-500",
    violet: "border-t-violet-500",
    amber: "border-t-amber-500",
    teal: "border-t-teal-500",
    red: "border-t-red-500",
  };
  return (
    <div
      className={`rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm border border-slate-200/80 dark:border-slate-800 border-t-4 ${ringMap[accent] || ringMap.blue}`}
    >
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">{sub}</div>
    </div>
  );
}

function ProgressRow({ label, detail, pct, color }) {
  const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium">{label}</span>
        <span className="font-mono text-slate-500 dark:text-slate-400">
          {detail} ({clamped}%)
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold font-mono">{value}</div>
    </div>
  );
}
