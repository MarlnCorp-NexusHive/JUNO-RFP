/**
 * Company Intelligence — resolves from bundled sample data first; if no match, calls JUNO backend
 * for live Wikipedia + AI structuring (see POST /company-intelligence-remote).
 */

import { SAMPLE_COMPANIES } from "../features/proposal-manager/data/companyIntelligenceSamples";
import { fetchCompanyIntelligenceRemote } from "./api.js";

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
      remote: false,
    };
  }

  try {
    const remote = await fetchCompanyIntelligenceRemote({ query: displayName });
    if (remote && remote.error == null && remote.name) {
      const fin = remote.financials || { revenue: [], netIncome: [], assets: [] };
      const tr = remote.trends || fin;
      return {
        name: remote.name,
        ticker: remote.ticker ?? null,
        region: remote.region ?? null,
        sector: remote.sector ?? null,
        financials: {
          revenue: fin.revenue || [],
          netIncome: fin.netIncome || [],
          assets: fin.assets || [],
        },
        trends: {
          revenue: tr.revenue || [],
          netIncome: tr.netIncome || [],
          assets: tr.assets || [],
        },
        customers: remote.customers || "",
        source: remote.source || "Live lookup",
        error: null,
        remote: true,
      };
    }
  } catch (e) {
    console.warn("[Company Intelligence] Remote lookup failed:", e?.message || e);
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
    error: `No sample data for "${displayName}" and live lookup failed. Ensure juno-backend is running (port 3000) with OPENAI_API_KEY, or pick from the list (e.g. AAPL, MSFT).`,
  };
}

/**
 * Plain-text snapshot of a resolved company for AI context (JUNO backend /ask-with-context).
 */
export function formatCompanySnapshotForAi(data) {
  if (!data || data.error) return "";
  const fin = data.financials;
  const hasSeries =
    fin?.revenue?.length || fin?.netIncome?.length || fin?.assets?.length;
  const narrative = (data.customers || "").trim();
  if (!fin || (!hasSeries && !narrative)) return "";
  const fmt = (v) => {
    if (v == null || v === "") return "n/a";
    if (typeof v === "number" && !Number.isNaN(v)) {
      return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
    }
    return String(v);
  };
  const lines = [];
  lines.push(`Company: ${data.name}`);
  lines.push(`Ticker: ${data.ticker || "n/a"}`);
  lines.push(`Region: ${data.region || "n/a"}`);
  lines.push(`Sector: ${data.sector || "n/a"}`);
  lines.push(`Data source: ${data.source || "n/a"}`);
  lines.push("");
  const dump = (title, rows) => {
    if (!rows?.length) return;
    lines.push(`${title} (reporting period → value USD):`);
    for (const x of rows.slice(0, 16)) {
      lines.push(`  ${x.period}: ${fmt(x.value)}`);
    }
    lines.push("");
  };
  dump("Revenue", fin.revenue);
  dump("Net income", fin.netIncome);
  dump("Total assets", fin.assets);
  if (data.customers) {
    lines.push("Narrative / customer context:");
    lines.push(data.customers);
  }
  return lines.join("\n").trim();
}
