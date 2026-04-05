/**
 * Company Intelligence — frontend only. Resolves companies from bundled sample data
 * (see companyIntelligenceSamples.js + companyIntelligenceSamplesData.json). No network calls.
 */

import { SAMPLE_COMPANIES } from "../features/proposal-manager/data/companyIntelligenceSamples";

function findSampleCompany({ companyName, ticker }) {
  const t = (ticker || "").trim();
  const n = (companyName || "").trim();

  if (t) {
    const byTicker = SAMPLE_COMPANIES.find((c) => c.ticker.toLowerCase() === t.toLowerCase());
    if (byTicker) return byTicker;
  }

  if (n) {
    const nLower = n.toLowerCase();
    const asTicker = SAMPLE_COMPANIES.find((c) => c.ticker.toLowerCase() === nLower);
    if (asTicker) return asTicker;

    const byName = SAMPLE_COMPANIES.find((c) => c.name.toLowerCase().includes(nLower));
    if (byName) return byName;

    const words = nLower.split(/\s+/).filter((w) => w.length >= 2);
    if (words.length) {
      let best = null;
      let bestScore = 0;
      for (const c of SAMPLE_COMPANIES) {
        const nameL = c.name.toLowerCase();
        const score = words.reduce((acc, w) => acc + (nameL.includes(w) ? 1 : 0), 0);
        if (score > bestScore) {
          bestScore = score;
          best = c;
        }
      }
      if (best && bestScore > 0) return best;
    }
  }

  return null;
}

function dedupeSecPoints(rows) {
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const k = r.period;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}

function revenueUsdUnits(gaap) {
  const candidates = [
    gaap.Revenues,
    gaap.Revenue,
    gaap.SalesRevenueNet,
    gaap.RevenueFromContractWithCustomerExcludingAssessedTax,
  ];
  const merged = [];
  for (const tag of candidates) {
    const u = tag?.units?.USD || tag?.units?.usd;
    if (Array.isArray(u) && u.length) merged.push(...u);
  }
  return merged;
}

/** True for consolidated annual facts; false for quarterly segments (some filers mark Qs as FY+10-K). */
function isSecAnnualFactPoint(x) {
  if (!x?.end || x.val == null) return false;
  const fr = x.frame != null ? String(x.frame) : "";
  if (/^CY\d{4}$/.test(fr)) return true;
  if (fr.includes("Q")) return false;
  return x.fp === "FY" || /10-K/i.test(String(x.form || ""));
}

/** Normalizes SEC company facts JSON (used by tooling/tests; not fetched in the app). */
export function normalizeSecFinancials(facts) {
  const out = { revenue: [], netIncome: [], assets: [], source: "SEC EDGAR", region: "US" };
  if (!facts?.facts) return out;
  const gaap = facts.facts["us-gaap"] || {};
  const takeLatestAnnualFirst = (arr, n = 8) => {
    if (!Array.isArray(arr)) return [];
    const annual = arr.filter(isSecAnnualFactPoint);
    const pool = annual.length >= 2 ? annual : arr.filter((x) => x.end && x.val != null);
    const mapped = pool
      .sort((a, b) => (b.end || "").localeCompare(a.end || ""))
      .slice(0, n)
      .map((x) => ({ period: x.end, value: x.val, form: x.form }));
    return dedupeSecPoints(mapped);
  };
  const revVals = revenueUsdUnits(gaap);
  if (revVals.length) out.revenue = takeLatestAnnualFirst(revVals);
  if (gaap.NetIncomeLoss) {
    const vals = gaap.NetIncomeLoss.units?.USD || gaap.NetIncomeLoss.units?.usd || [];
    out.netIncome = takeLatestAnnualFirst(vals);
  }
  if (gaap.Assets) {
    const vals = gaap.Assets.units?.USD || gaap.Assets.units?.usd || [];
    out.assets = takeLatestAnnualFirst(vals);
  }
  return out;
}

function toNum(val) {
  if (val == null) return 0;
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  const n = Number(val);
  return Number.isNaN(n) ? 0 : n;
}

/** Normalizes FMP-style payloads (used by tests / future tooling; not fetched in the app). */
export function normalizeFmpFinancials(profile, incomeStatements, balanceSheets) {
  const out = {
    revenue: [],
    netIncome: [],
    assets: [],
    source: "Financial Modeling Prep",
    region: profile?.country || "Global",
    companyName: profile?.companyName || profile?.symbol,
    industry: profile?.industry,
    sector: profile?.sector,
  };
  if (Array.isArray(incomeStatements) && incomeStatements.length > 0) {
    out.revenue = incomeStatements.map((s) => ({
      period: s.date || s.calendarYear || "",
      value: toNum(s.revenue ?? s.Revenue),
    }));
    out.netIncome = incomeStatements.map((s) => ({
      period: s.date || s.calendarYear || "",
      value: toNum(s.netIncome ?? s.NetIncome),
    }));
  }
  if (Array.isArray(balanceSheets) && balanceSheets.length > 0) {
    out.assets = balanceSheets.map((s) => ({
      period: s.date || s.calendarYear || "",
      value: toNum(s.totalAssets ?? s.total_assets),
    }));
  }
  return out;
}

/**
 * Resolve company intelligence from bundled samples only (no API or backend).
 */
export async function fetchCompanyIntelligence(options = {}) {
  const { companyName, ticker } = options;
  const displayName = (companyName || ticker || "").trim() || "Unknown";
  const match = findSampleCompany({ companyName, ticker });

  if (match) {
    const financials = {
      revenue: match.revenue,
      netIncome: match.netIncome,
      assets: match.assets,
    };
    return {
      name: match.name,
      ticker: match.ticker,
      region: match.region,
      sector: match.sector,
      financials,
      trends: {
        revenue: match.revenue,
        netIncome: match.netIncome,
        assets: match.assets,
      },
      customers: match.customers || "",
      source: match.source,
      error: null,
    };
  }

  return {
    name: displayName,
    ticker: ticker ? String(ticker).toUpperCase() : null,
    region: null,
    sector: null,
    financials: null,
    trends: null,
    customers: null,
    source: null,
    error: `No sample data for "${displayName}". Pick from the list or try a known ticker (e.g. AAPL, MSFT).`,
  };
}
