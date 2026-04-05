/**
 * Persists the "linked" RFP issuer snapshot from Company Intelligence for use across Proposal Manager (Pricing, Workspace, etc.).
 */

const KEY = "proposal_manager_linked_issuer";

export function formatUsd(v) {
  if (v == null || typeof v !== "number") return "—";
  if (Math.abs(v) >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(2)}K`;
  return `$${v.toFixed(0)}`;
}

function buildNarrative(result) {
  const r = result.financials?.revenue?.[0];
  const n = result.financials?.netIncome?.[0];
  const a = result.financials?.assets?.[0];
  let s = `${result.name}${result.ticker ? ` (${result.ticker})` : ""}`;
  if (result.region) s += ` — ${result.region}`;
  if (result.sector) s += ` · ${result.sector}`;
  s += ". ";
  if (r) s += `Latest reported revenue (${r.period}): ${formatUsd(r.value)}. `;
  if (n) s += `Net income (${n.period}): ${formatUsd(n.value)}. `;
  if (a) s += `Total assets (${a.period}): ${formatUsd(a.value)}. `;
  if (result.customers) s += `\n\nCustomer / market context: ${result.customers}`;
  return s.trim();
}

export function buildSnapshotFromIntelligenceResult(result) {
  if (!result || result.error || !result.financials) return null;
  return {
    version: 1,
    linkedAt: new Date().toISOString(),
    name: result.name,
    ticker: result.ticker,
    region: result.region,
    sector: result.sector,
    customers: result.customers,
    source: result.source,
    trends: result.trends
      ? {
          revenue: result.trends.revenue || [],
          netIncome: result.trends.netIncome || [],
          assets: result.trends.assets || [],
        }
      : { revenue: [], netIncome: [], assets: [] },
    financials: {
      revenue: result.financials.revenue || [],
      netIncome: result.financials.netIncome || [],
      assets: result.financials.assets || [],
    },
    narrative: buildNarrative(result),
  };
}

export function getLinkedIssuer() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && data.version === 1 ? data : null;
  } catch {
    return null;
  }
}

export function setLinkedIssuer(snapshot) {
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch (e) {
    console.warn("proposalIssuerStorage set failed", e);
  }
}

export function clearLinkedIssuer() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
