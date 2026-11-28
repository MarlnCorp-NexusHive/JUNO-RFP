import os from "os";
import { monitorEventLoopDelay } from "perf_hooks";
import client from "prom-client";

const register = new client.Registry();
register.setDefaultLabels({ app: "juno-rfp-backend" });
client.collectDefaultMetrics({ register, prefix: "juno_" });

const httpRequestsTotal = new client.Counter({
  name: "juno_http_requests_total",
  help: "Total HTTP requests processed",
  labelNames: ["method", "route", "status_class"],
  registers: [register],
});

const httpRequestDurationMs = new client.Histogram({
  name: "juno_http_request_duration_ms",
  help: "HTTP request latency in milliseconds",
  labelNames: ["method", "route", "status_class"],
  buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000, 15000],
  registers: [register],
});

const loginsTotalCounter = new client.Counter({
  name: "juno_user_logins_total",
  help: "Total user logins recorded",
  labelNames: ["role"],
  registers: [register],
});

const activeSessionsGauge = new client.Gauge({
  name: "juno_active_user_sessions",
  help: "Currently active browser tab sessions",
  registers: [register],
});

const sessionTimeSpentSecondsCounter = new client.Counter({
  name: "juno_user_session_time_spent_seconds_total",
  help: "Cumulative active user session time in seconds",
  registers: [register],
});

// Event-loop delay monitor (p50 / p95 / max)
const elMonitor = monitorEventLoopDelay({ resolution: 20 });
elMonitor.enable();

const ACTIVE_SESSION_STALE_MS = 2 * 60 * 1000; // 2 minutes without heartbeat -> inactive
const MAX_RECENT_EVENTS = 50;
const MAX_ROUTE_STATS = 30;

const state = {
  startedAt: Date.now(),
  totalRequests: 0,
  status2xx: 0,
  status4xx: 0,
  status5xx: 0,
  totalLatencyMs: 0,
  recentLatencies: [], // ring buffer (last 200)
  routeStats: new Map(), // route -> { count, errors, totalMs }
  activeSessions: new Map(), // sessionId -> session record
  totalLogins: 0,
  loginsByDay: new Map(), // YYYY-MM-DD -> count
  completedSessionsCount: 0,
  completedTimeSpentSec: 0,
  recentEvents: [], // [{ ts, event, user, role, path, durationSec }]
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeRoute(req) {
  const raw = String(req.path || req.originalUrl || "/").split("?")[0];
  return raw
    .replace(/\/[0-9a-f]{8}-[0-9a-f-]{27}/gi, "/:uuid")
    .replace(/\/t_[a-z0-9_-]+/gi, "/:tenantId")
    .replace(/\/\d{3,}/g, "/:id");
}

function pushEvent(evt) {
  state.recentEvents.unshift(evt);
  if (state.recentEvents.length > MAX_RECENT_EVENTS) {
    state.recentEvents.length = MAX_RECENT_EVENTS;
  }
}

function pruneStaleSessions(now = Date.now()) {
  for (const [sid, rec] of state.activeSessions.entries()) {
    if (now - rec.lastSeenAt > ACTIVE_SESSION_STALE_MS) {
      const dur = Math.max(0, Math.round((rec.lastSeenAt - rec.startedAt) / 1000));
      state.completedSessionsCount += 1;
      state.completedTimeSpentSec += dur;
      state.activeSessions.delete(sid);
    }
  }
  activeSessionsGauge.set(state.activeSessions.size);
}

export function metricsMiddleware(req, res, next) {
  // Skip self-scraping noise
  if (req.path === "/metrics" || req.path === "/admin/health-metrics" || req.path === "/monitoring/heartbeat") {
    return next();
  }
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const status = res.statusCode || 200;
    const statusClass = `${Math.floor(status / 100)}xx`;
    const route = normalizeRoute(req);

    state.totalRequests += 1;
    state.totalLatencyMs += durationMs;
    if (status >= 500) state.status5xx += 1;
    else if (status >= 400) state.status4xx += 1;
    else state.status2xx += 1;

    state.recentLatencies.push(durationMs);
    if (state.recentLatencies.length > 200) state.recentLatencies.shift();

    const prev = state.routeStats.get(route) || { route, count: 0, errors: 0, totalMs: 0 };
    prev.count += 1;
    if (status >= 400) prev.errors += 1;
    prev.totalMs += durationMs;
    if (state.routeStats.size < MAX_ROUTE_STATS || state.routeStats.has(route)) {
      state.routeStats.set(route, prev);
    }

    httpRequestsTotal.inc({ method: req.method, route, status_class: statusClass });
    httpRequestDurationMs.observe({ method: req.method, route, status_class: statusClass }, durationMs);
  });
  return next();
}

function computePercentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return Math.round(sorted[idx] * 10) / 10;
}

export function buildHealthSnapshot() {
  const now = Date.now();
  pruneStaleSessions(now);

  const mem = process.memoryUsage();
  const totalSysMem = os.totalmem();
  const freeSysMem = os.freemem();
  const load = os.loadavg();

  const activeList = Array.from(state.activeSessions.values()).map((s) => ({
    sessionId: s.sessionId,
    user: s.user,
    role: s.role,
    path: s.path,
    startedAt: new Date(s.startedAt).toISOString(),
    lastSeenAt: new Date(s.lastSeenAt).toISOString(),
    durationSec: Math.max(0, Math.round((now - s.startedAt) / 1000)),
  }));

  const activeTimeSec = activeList.reduce((acc, s) => acc + s.durationSec, 0);
  const totalTimeSpentSec = state.completedTimeSpentSec + activeTimeSec;
  const totalSessionsSeen = state.completedSessionsCount + activeList.length;
  const avgSessionSec = totalSessionsSeen > 0 ? Math.round(totalTimeSpentSec / totalSessionsSeen) : 0;

  const topRoutes = Array.from(state.routeStats.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
    .map((r) => ({
      route: r.route,
      count: r.count,
      errors: r.errors,
      avgMs: r.count ? Math.round((r.totalMs / r.count) * 10) / 10 : 0,
    }));

  const errorRatePct =
    state.totalRequests > 0
      ? Math.round(((state.status4xx + state.status5xx) / state.totalRequests) * 1000) / 10
      : 0;

  return {
    ok: true,
    timestamp: new Date(now).toISOString(),
    process: {
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid,
      uptimeSec: Math.round(process.uptime()),
      startedAt: new Date(state.startedAt).toISOString(),
    },
    memory: {
      rssMb: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
      heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
      heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10,
      externalMb: Math.round((mem.external / 1024 / 1024) * 10) / 10,
      heapUsedPct: mem.heapTotal > 0 ? Math.round((mem.heapUsed / mem.heapTotal) * 100) : 0,
      systemTotalMb: Math.round(totalSysMem / 1024 / 1024),
      systemUsedMb: Math.round((totalSysMem - freeSysMem) / 1024 / 1024),
      systemUsedPct: totalSysMem > 0 ? Math.round(((totalSysMem - freeSysMem) / totalSysMem) * 100) : 0,
    },
    cpu: {
      cores: os.cpus().length,
      loadAvg1m: Math.round((load[0] || 0) * 100) / 100,
      loadAvg5m: Math.round((load[1] || 0) * 100) / 100,
      eventLoopDelayP50Ms: Math.round((elMonitor.percentile(50) / 1e6) * 100) / 100,
      eventLoopDelayP95Ms: Math.round((elMonitor.percentile(95) / 1e6) * 100) / 100,
    },
    http: {
      totalRequests: state.totalRequests,
      status2xx: state.status2xx,
      status4xx: state.status4xx,
      status5xx: state.status5xx,
      errorRatePct,
      avgLatencyMs:
        state.totalRequests > 0
          ? Math.round((state.totalLatencyMs / state.totalRequests) * 10) / 10
          : 0,
      p95LatencyMs: computePercentile(state.recentLatencies, 95),
      topRoutes,
    },
    users: {
      activeNow: activeList.length,
      totalLogins: state.totalLogins,
      loginsToday: state.loginsByDay.get(todayKey()) || 0,
      totalTimeSpentSec,
      avgSessionSec,
      activeSessions: activeList,
      recentEvents: state.recentEvents.slice(0, 20),
    },
  };
}

function maskPiiLabel(raw) {
  const s = String(raw || "User").trim().slice(0, 120);
  // Mask email addresses (e.g., alice@company.com -> a***@company.com) so telemetry avoids raw PII
  return s.replace(/([a-zA-Z0-9._%+-])([a-zA-Z0-9._%+-]*)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, "$1***@$3");
}

function isMetricsAuthorized(req) {
  const token = process.env.ADMIN_METRICS_TOKEN || process.env.METRICS_TOKEN || "";
  const isProd = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);
  // Production fail-closed: metrics endpoints must never be public without a token.
  if (!token) return !isProd;
  const auth = String(req.headers.authorization || "");
  return auth === `Bearer ${token}`;
}

export function registerMonitoringRoutes(app) {
  // Prometheus scrape endpoint (open-source standard for Prometheus / Grafana)
  app.get("/metrics", async (req, res) => {
    if (!isMetricsAuthorized(req)) {
      return res.status(401).send("Unauthorized");
    }
    pruneStaleSessions();
    res.setHeader("Content-Type", register.contentType);
    res.send(await register.metrics());
  });

  // JSON snapshot for the built-in Enterprise System Health Dashboard
  app.get("/admin/health-metrics", (req, res) => {
    if (!isMetricsAuthorized(req)) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    res.json(buildHealthSnapshot());
  });

  // Frontend session heartbeat (login / ping / logout)
  app.post("/monitoring/heartbeat", (req, res) => {
    const body = req.body || {};
    const event = String(body.event || "ping").toLowerCase();
    const sessionId = String(body.sessionId || "").slice(0, 80);
    if (!sessionId) {
      return res.status(400).json({ ok: false, error: "sessionId required" });
    }

    const now = Date.now();
    const userLabel = maskPiiLabel(body.user || "Unknown User");
    const role = String(body.role || "User").slice(0, 60);
    const path = String(body.path || "/").slice(0, 160);

    if (event === "logout" || event === "expired" || event === "idle_timeout") {
      const existing = state.activeSessions.get(sessionId);
      const durationSec = existing
        ? Math.max(0, Math.round((now - existing.startedAt) / 1000))
        : Math.max(0, Number(body.durationSec) || 0);
      if (existing) {
        state.activeSessions.delete(sessionId);
        state.completedSessionsCount += 1;
        state.completedTimeSpentSec += durationSec;
      }
      if (durationSec > 0) {
        sessionTimeSpentSecondsCounter.inc(durationSec);
      }
      activeSessionsGauge.set(state.activeSessions.size);
      pushEvent({
        ts: new Date(now).toISOString(),
        event,
        user: userLabel,
        role,
        path,
        durationSec,
      });
      return res.json({ ok: true });
    }

    const existing = state.activeSessions.get(sessionId);
    if (!existing || event === "login") {
      const startedAt = existing?.startedAt || now;
      state.activeSessions.set(sessionId, {
        sessionId,
        user: userLabel,
        role,
        path,
        startedAt,
        lastSeenAt: now,
      });
      if (!existing) {
        state.totalLogins += 1;
        const day = todayKey();
        state.loginsByDay.set(day, (state.loginsByDay.get(day) || 0) + 1);
        loginsTotalCounter.inc({ role });
        pushEvent({
          ts: new Date(now).toISOString(),
          event: "login",
          user: userLabel,
          role,
          path,
          durationSec: 0,
        });
      }
    } else {
      const deltaSec = Math.max(0, Math.round((now - existing.lastSeenAt) / 1000));
      if (deltaSec > 0 && deltaSec <= 120) {
        sessionTimeSpentSecondsCounter.inc(deltaSec);
      }
      existing.lastSeenAt = now;
      existing.path = path;
    }

    activeSessionsGauge.set(state.activeSessions.size);
    return res.json({ ok: true });
  });
}
