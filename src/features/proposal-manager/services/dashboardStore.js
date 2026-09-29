import { scopedStorageKey, isScopedStorageEventKey } from "../../../services/tenantScopedStorage.js";
import {
  canUseTrialFeatures,
  loadTrialFeatureData,
  persistTrialFeatureData,
} from "../../../services/trialFeatureApi.js";
import { listSubmissions } from "./bidVaultStore.js";
import { listShortlist } from "./shortlistStore.js";
import { getWinLossRecords } from "./winLossStorage.js";
import { getComplianceData } from "./complianceStore.js";
import { listVolumes } from "./pricingStore.js";

const BASE_KEY = "juno_trial_dashboard";
export const DASHBOARD_CHANGED_EVENT = "juno-trial-dashboard-changed";

const EMPTY_CHARTS = {
  rollingWinRate: [],
  sectionM: [],
  riskCompliance: [],
  submissionForecast: [],
  winProbabilityTrend: [],
};

const EMPTY = {
  docInsights: {},
  charts: { ...EMPTY_CHARTS },
  aiAlerts: [],
  updatedAt: null,
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function storageKey() {
  return scopedStorageKey(BASE_KEY);
}

function normalizeCharts(charts) {
  return {
    rollingWinRate: Array.isArray(charts?.rollingWinRate) ? charts.rollingWinRate : [],
    sectionM: Array.isArray(charts?.sectionM) ? charts.sectionM : [],
    riskCompliance: Array.isArray(charts?.riskCompliance) ? charts.riskCompliance : [],
    submissionForecast: Array.isArray(charts?.submissionForecast) ? charts.submissionForecast : [],
    winProbabilityTrend: Array.isArray(charts?.winProbabilityTrend) ? charts.winProbabilityTrend : [],
  };
}

function normalizeBlob(data) {
  const docInsights =
    data?.docInsights && typeof data.docInsights === "object" && !Array.isArray(data.docInsights)
      ? data.docInsights
      : {};
  return {
    docInsights,
    charts: normalizeCharts(data?.charts),
    aiAlerts: Array.isArray(data?.aiAlerts) ? data.aiAlerts.slice(0, 20) : [],
    updatedAt: data?.updatedAt ? String(data.updatedAt) : null,
  };
}

function readRaw() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return { ...EMPTY, charts: { ...EMPTY_CHARTS }, docInsights: {}, aiAlerts: [] };
    return normalizeBlob(JSON.parse(raw));
  } catch {
    return { ...EMPTY, charts: { ...EMPTY_CHARTS }, docInsights: {}, aiAlerts: [] };
  }
}

async function persistCompanyWide(data) {
  if (!canUseTrialFeatures()) return;
  await persistTrialFeatureData("dashboard", normalizeBlob(data));
}

function writeRaw(data) {
  const next = normalizeBlob(data);
  next.updatedAt = new Date().toISOString();
  localStorage.setItem(storageKey(), JSON.stringify(next));
  try {
    window.dispatchEvent(new CustomEvent(DASHBOARD_CHANGED_EVENT, { detail: next }));
  } catch {
    /* ignore */
  }
  void persistCompanyWide(next);
  return next;
}

export function getDashboardData() {
  return readRaw();
}

export function applyDocInsights(docId, insights, meta = {}) {
  if (!docId || !insights) return getDashboardData();
  const data = readRaw();
  data.docInsights[docId] = {
    ...insights,
    docId,
    docName: meta.docName || insights.docName || "",
    appliedAt: new Date().toISOString(),
  };
  const alertRows = Array.isArray(insights.alerts)
    ? insights.alerts.map((text) => ({
        id: `ai_${docId}_${String(text).slice(0, 24)}`,
        text: String(text),
        docId,
        docName: meta.docName || "",
        createdAt: new Date().toISOString(),
      }))
    : [];
  const existing = (data.aiAlerts || []).filter((a) => a.docId !== docId);
  data.aiAlerts = [...alertRows, ...existing].slice(0, 20);
  const next = writeRaw(data);
  return rebuildChartsFromCompanyData(next);
}

export function rebuildChartsFromCompanyData(seed = null) {
  const data = seed ? normalizeBlob(seed) : readRaw();
  const insights = Object.values(data.docInsights || {});
  const vault = listSubmissions();
  const scoring = getWinLossRecords();
  const compliance = getComplianceData();

  // Section M radar/period row — average scores from latest insights
  const factorMap = {};
  insights.forEach((ins) => {
    (ins.sectionM || []).forEach((f) => {
      if (!f?.name) return;
      const key = String(f.name);
      if (!factorMap[key]) factorMap[key] = [];
      factorMap[key].push(Number(f.score) || 0);
    });
  });
  const sectionMKeys = Object.keys(factorMap).slice(0, 7);
  const sectionMRow = { period: "Now" };
  const SECTION_ALIASES = [
    "competitiveIntelligence",
    "competitiveDifferentiation",
    "incumbentAdvantage",
    "priceTechnical",
    "bidDensity",
    "agencyWinPattern",
    "discriminatorStrength",
  ];
  if (sectionMKeys.length) {
    sectionMKeys.forEach((name, i) => {
      const vals = factorMap[name];
      const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      const alias = SECTION_ALIASES[i] || `factor${i}`;
      sectionMRow[alias] = avg;
      sectionMRow[name] = avg;
    });
    SECTION_ALIASES.forEach((alias) => {
      if (sectionMRow[alias] == null) sectionMRow[alias] = 0;
    });
    data.charts.sectionM = [sectionMRow];
  } else {
    data.charts.sectionM = [];
  }

  // Risk & compliance bars
  const riskBars = [];
  (compliance.risks || []).forEach((r) => {
    riskBars.push({ name: r.name, score: Number(r.score) || 0 });
  });
  insights.forEach((ins) => {
    (ins.risks || []).forEach((r) => {
      if (!riskBars.some((x) => x.name === r.name)) {
        riskBars.push({ name: r.name, score: Number(r.score) || 0 });
      }
    });
  });
  data.charts.riskCompliance = riskBars.slice(0, 8);

  // Rolling win rate by procurement type — from vault + insights
  const typeCounts = {};
  const typeWins = {};
  const bump = (type, won) => {
    const t = type || "Other";
    typeCounts[t] = (typeCounts[t] || 0) + 1;
    if (won) typeWins[t] = (typeWins[t] || 0) + 1;
  };
  vault.forEach((s) => {
    const ins = insights.find((i) => (i.opportunity && s.sourceDocIds?.includes(i.docId)) || i.docId === s.id);
    const pType = ins?.opportunity?.procurementType || "Other";
    bump(pType, s.stage === "won");
  });
  insights.forEach((ins) => {
    const pType = ins.opportunity?.procurementType || "Other";
    if (!vault.some((s) => (s.sourceDocIds || []).includes(ins.docId))) {
      bump(pType, false);
    }
  });
  const month = MONTHS[new Date().getMonth()];
  const row = {
    month,
    "FAR Part 15 (Best Value)": 0,
    "FAR Part 15 (LPTA)": 0,
    "FAR Part 16 (Task Orders)": 0,
    "Sole Source": 0,
    "Full & Open": 0,
  };
  Object.keys(typeCounts).forEach((t) => {
    const rate = Math.round(((typeWins[t] || 0) / typeCounts[t]) * 100);
    if (row[t] != null) row[t] = rate;
    else if (/best value/i.test(t)) row["FAR Part 15 (Best Value)"] = rate;
    else if (/lpta/i.test(t)) row["FAR Part 15 (LPTA)"] = rate;
    else if (/task order|part 16/i.test(t)) row["FAR Part 16 (Task Orders)"] = rate;
    else if (/sole/i.test(t)) row["Sole Source"] = rate;
    else row["Full & Open"] = Math.max(row["Full & Open"], rate);
  });
  // Scoring wins by outcome
  const scoredWon = scoring.filter((r) => r.outcome === "won").length;
  const scoredTotal = scoring.length;
  if (scoredTotal > 0) {
    row["Full & Open"] = Math.max(row["Full & Open"], Math.round((scoredWon / scoredTotal) * 100));
  }
  data.charts.rollingWinRate = Object.values(typeCounts).some((n) => n > 0) || scoredTotal > 0 ? [row] : [];

  // Submission forecast — count submitted by month from vault
  const monthCounts = Object.fromEntries(MONTHS.map((m) => [m, 0]));
  vault.forEach((s) => {
    const d = s.submittedAt || s.deadline || s.updatedAt;
    if (!d) return;
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return;
    const m = MONTHS[dt.getMonth()];
    monthCounts[m] += 1;
  });
  const hasSubs = Object.values(monthCounts).some((n) => n > 0);
  data.charts.submissionForecast = hasSubs
    ? MONTHS.slice(0, 6).map((monthName) => ({
        month: monthName,
        Actual: monthCounts[monthName] || 0,
        Forecast: monthCounts[monthName] || 0,
      }))
    : [];

  // Win probability trend — average from insights + vault
  const probs = insights
    .map((i) => Number(i.opportunity?.winProbability))
    .filter((n) => Number.isFinite(n));
  data.charts.winProbabilityTrend =
    probs.length > 0
      ? MONTHS.slice(0, 6).map((monthName, idx) => ({
          month: monthName,
          Rate: probs[Math.min(idx, probs.length - 1)],
        }))
      : [];

  return writeRaw(data);
}

export function buildDashboardDerivedMetrics() {
  const vault = listSubmissions();
  const shortlist = listShortlist();
  const scoring = getWinLossRecords();
  const volumes = listVolumes();
  const dash = readRaw();
  const insights = Object.values(dash.docInsights || {});

  const activeStages = new Set(["pipeline", "capture", "proposal", "submitted"]);
  const active = vault.filter((s) => activeStages.has(s.stage));
  const pipelineFromVault = active.length;
  const pipelineFromShortlist = shortlist.length;
  const activePipeline = Math.max(pipelineFromVault, pipelineFromShortlist, insights.length);

  const values = [
    ...active.map((s) => Number(s.value) || 0),
    ...insights.map((i) => Number(i.opportunity?.valueEstimate) || 0),
    ...volumes.map((v) => Number(v.bidPrice || v.total) || 0),
  ].filter((n) => n > 0);
  const totalPipelineValue = values.reduce((a, b) => a + b, 0);
  const avgDealSize = values.length ? Math.round(totalPipelineValue / values.length) : 0;

  const decided = vault.filter((s) => s.stage === "won" || s.stage === "lost");
  const wonVault = vault.filter((s) => s.stage === "won").length;
  const wonScore = scoring.filter((r) => r.outcome === "won").length;
  const lostScore = scoring.filter((r) => r.outcome === "lost").length;
  const decidedScore = wonScore + lostScore;
  let winRate = 0;
  if (decided.length > 0) winRate = Math.round((wonVault / decided.length) * 100);
  else if (decidedScore > 0) winRate = Math.round((wonScore / decidedScore) * 100);

  const noBid = vault.filter((s) => s.stage === "no-bid").length;
  const bidCount = vault.filter((s) => s.stage !== "no-bid").length;
  const bidNoBidRatio = noBid > 0 ? Math.round((bidCount / noBid) * 10) / 10 : bidCount > 0 ? bidCount : 0;

  const probs = [
    ...insights.map((i) => Number(i.opportunity?.winProbability)).filter((n) => Number.isFinite(n)),
    ...active.map(() => 55),
  ];
  const weightedWinProbability = probs.length
    ? Math.round(probs.reduce((a, b) => a + b, 0) / probs.length)
    : 0;

  const submitted = vault.filter((s) => s.stage === "submitted" || s.stage === "won" || s.stage === "lost");
  const rfpsResponded = submitted.length || scoring.length;

  // Rough MTTR: average days from createdAt to submittedAt when both exist
  const mttrDays = [];
  vault.forEach((s) => {
    if (!s.submittedAt || !s.createdAt) return;
    const a = Date.parse(s.createdAt);
    const b = Date.parse(s.submittedAt);
    if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return;
    mttrDays.push(Math.round((b - a) / 86400000));
  });
  const mttr =
    mttrDays.length > 0
      ? `${Math.round(mttrDays.reduce((x, y) => x + y, 0) / mttrDays.length)} days`
      : "—";

  return {
    activePipeline,
    totalPipelineValue,
    avgDealSize,
    winRate,
    bidNoBidRatio,
    weightedWinProbability,
    rfpsResponded,
    mttr,
    insightCount: insights.length,
    hasData: activePipeline > 0 || insights.length > 0 || scoring.length > 0 || values.length > 0,
  };
}

export function buildDashboardAiAlerts(t) {
  const data = readRaw();
  return (data.aiAlerts || []).slice(0, 6).map((a) => ({
    text: t
      ? t("dashboard.alerts.proposalManager.sourceDocAiAlert", {
          title: a.docName || "Source Doc",
          message: a.text,
          defaultValue: "{{title}}: {{message}}",
        })
      : `${a.docName || "Source Doc"}: ${a.text}`,
    color: "text-rose-500",
  }));
}

export function getDashboardCharts(data = readRaw()) {
  return normalizeCharts(data.charts);
}

export async function hydrateDashboardFromServer(opts = {}) {
  const notify = opts.notify !== false;
  if (!canUseTrialFeatures()) return getDashboardData();
  try {
    const data = await loadTrialFeatureData("dashboard", EMPTY);
    const next = normalizeBlob(data);
    const nextJson = JSON.stringify(next);
    const prevJson = localStorage.getItem(storageKey());
    if (prevJson === nextJson) return getDashboardData();
    localStorage.setItem(storageKey(), nextJson);
    if (notify) {
      try {
        window.dispatchEvent(new CustomEvent(DASHBOARD_CHANGED_EVENT, { detail: next }));
      } catch {
        /* ignore */
      }
    }
    return getDashboardData();
  } catch {
    return getDashboardData();
  }
}

export function subscribeDashboard(onChange) {
  const handleCustom = () => onChange(getDashboardData());
  const handleStorage = (e) => {
    if (!isScopedStorageEventKey(e.key, BASE_KEY)) return;
    onChange(getDashboardData());
  };
  window.addEventListener(DASHBOARD_CHANGED_EVENT, handleCustom);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(DASHBOARD_CHANGED_EVENT, handleCustom);
    window.removeEventListener("storage", handleStorage);
  };
}
