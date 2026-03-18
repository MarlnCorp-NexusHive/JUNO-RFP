/**
 * Company Intelligence: fetch financials, trends, and customer/segment info from public sources.
 * Used by Proposal Manager only (RFP issuer / bid target research).
 */

const SEC_BASE = "https://data.sec.gov";
const SEC_COMPANY_TICKERS = "https://www.sec.gov/files/company_tickers.json";
const FMP_BASE = "https://financialmodelingprep.com/api/v3";
const CORS_PROXIES = [
  "https://api.allorigins.win/raw?url=",
  "https://corsproxy.io/?url=",
];

const SEC_HEADERS = {
  Accept: "application/json",
  "User-Agent": "JUNO-RFP-App contact@marlncorp.com",
};

const isBrowser = typeof window !== "undefined";

/** Fetch SEC URL. In browser, use CORS proxy first (SEC blocks cross-origin). */
async function secFetch(url) {
  const tryDirect = async () => {
    const res = await fetch(url, { headers: SEC_HEADERS });
    if (!res.ok) throw new Error(res.status.toString());
    return res.json();
  };

  const tryProxy = async (proxyPrefix) => {
    const proxyUrl = proxyPrefix + encodeURIComponent(url);
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error("Proxy failed");
    const text = await res.text();
    const trimmed = text.trim();
    if (!trimmed) throw new Error("Empty response");
    return JSON.parse(trimmed);
  };

  if (!isBrowser) {
    try {
      return await tryDirect();
    } catch (e) {
      for (const proxy of CORS_PROXIES) {
        try {
          return await tryProxy(proxy);
        } catch {
          continue;
        }
      }
      throw e;
    }
  }

  for (const proxy of CORS_PROXIES) {
    try {
      return await tryProxy(proxy);
    } catch {
      continue;
    }
  }
  try {
    return await tryDirect();
  } catch (e) {
    throw new Error("SEC data unavailable (CORS). Try adding VITE_FMP_API_KEY in .env and restart dev server.");
  }
}

let secTickersCache = null;
export async function getSecCompanyTickers() {
  if (secTickersCache) return secTickersCache;
  try {
    const data = await secFetch(SEC_COMPANY_TICKERS);
    secTickersCache = Array.isArray(data) ? data : Object.values(data || {});
    return secTickersCache;
  } catch (e) {
    console.warn("SEC company tickers unavailable", e);
    return [];
  }
}

export async function resolveSecCik(nameOrTicker) {
  const list = await getSecCompanyTickers();
  const q = (nameOrTicker || "").trim().toLowerCase();
  if (!q) return null;
  const byTicker = list.find((c) => (c.ticker || "").toLowerCase() === q);
  if (byTicker) return String(byTicker.cik_str ?? byTicker.cik).padStart(10, "0");
  const byName = list.find((c) => (c.title || "").toLowerCase().includes(q));
  if (byName) return String(byName.cik_str ?? byName.cik).padStart(10, "0");
  return null;
}

export async function fetchSecCompanyFacts(cik) {
  const padded = String(cik).padStart(10, "0");
  const url = `${SEC_BASE}/api/xbrl/companyfacts/CIK${padded}.json`;
  return secFetch(url);
}

export function normalizeSecFinancials(facts) {
  const out = { revenue: [], netIncome: [], assets: [], source: "SEC EDGAR", region: "US" };
  if (!facts?.facts) return out;
  const gaap = facts.facts["us-gaap"] || {};
  const takeLatest = (arr, n = 8) => {
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x.end && x.val != null)
      .sort((a, b) => (b.end || "").localeCompare(a.end || ""))
      .slice(0, n)
      .map((x) => ({ period: x.end, value: x.val, form: x.form }));
  };
  if (gaap.Revenue) {
    const vals = gaap.Revenue.units?.USD || gaap.Revenue.units?.usd || [];
    out.revenue = takeLatest(vals);
  }
  if (gaap.NetIncomeLoss) {
    const vals = gaap.NetIncomeLoss.units?.USD || gaap.NetIncomeLoss.units?.usd || [];
    out.netIncome = takeLatest(vals);
  }
  if (gaap.Assets) {
    const vals = gaap.Assets.units?.USD || gaap.Assets.units?.usd || [];
    out.assets = takeLatest(vals);
  }
  return out;
}

function isFmpError(data) {
  if (!data || typeof data !== "object") return false;
  return "Error Message" in data || ("message" in data && !Array.isArray(data));
}

export async function fetchFmpProfile(symbol) {
  const key = (import.meta.env?.VITE_FMP_API_KEY || "").trim();
  if (!key) return null;
  try {
    const res = await fetch(`${FMP_BASE}/profile/${encodeURIComponent(symbol)}?apikey=${key}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (isFmpError(data)) return null;
    return Array.isArray(data) ? data[0] : data;
  } catch {
    return null;
  }
}

export async function fetchFmpIncomeStatement(symbol, limit = 5) {
  const key = (import.meta.env?.VITE_FMP_API_KEY || "").trim();
  if (!key) return null;
  try {
    const res = await fetch(`${FMP_BASE}/income-statement/${encodeURIComponent(symbol)}?limit=${limit}&apikey=${key}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (isFmpError(data)) return null;
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

export async function searchFmpSymbol(query) {
  const key = (import.meta.env?.VITE_FMP_API_KEY || "").trim();
  if (!key || !(query || "").trim()) return [];
  try {
    const res = await fetch(`${FMP_BASE}/search?query=${encodeURIComponent(query)}&limit=15&apikey=${key}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (isFmpError(data)) return [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function normalizeFmpFinancials(profile, incomeStatements) {
  const out = {
    revenue: [],
    netIncome: [],
    assets: [],
    source: "Financial Modeling Prep",
    region: (profile?.country) || "Global",
    companyName: profile?.companyName || profile?.symbol,
    industry: profile?.industry,
    sector: profile?.sector,
  };
  if (!Array.isArray(incomeStatements) || incomeStatements.length === 0) return out;
  out.revenue = incomeStatements.map((s) => ({ period: s.date || s.calendarYear || "", value: s.revenue ?? 0 }));
  out.netIncome = incomeStatements.map((s) => ({ period: s.date || s.calendarYear || "", value: s.netIncome ?? 0 }));
  return out;
}

export async function fetchCompanyIntelligence(options = {}) {
  const { companyName, ticker } = options;
  const result = {
    name: companyName || ticker || "Unknown",
    ticker: ticker || null,
    region: null,
    financials: null,
    trends: null,
    customers: null,
    source: null,
    error: null,
  };
  const hasFmp = !!(import.meta.env?.VITE_FMP_API_KEY ?? "").trim();
  const secCik = await resolveSecCik(ticker || companyName);
  if (secCik) {
    try {
      const facts = await fetchSecCompanyFacts(secCik);
      const normalized = normalizeSecFinancials(facts);
      result.financials = normalized;
      result.trends = { revenue: normalized.revenue, netIncome: normalized.netIncome, assets: normalized.assets };
      result.source = "SEC EDGAR";
      result.region = "US";
      if (facts.entityName) result.name = facts.entityName;
      result.customers = "See 10-K filing (Item 1A Risk Factors, Customer Concentration).";
      return result;
    } catch (e) {
      result.error = e.message || "SEC fetch failed";
      if (!hasFmp) return result;
    }
  }
  if (hasFmp) {
    let symbol = ticker;
    if (!symbol && companyName) {
      const search = await searchFmpSymbol(companyName);
      symbol = search[0]?.symbol || search[0]?.name;
    }
    if (symbol) {
      try {
        const [profile, income] = await Promise.all([fetchFmpProfile(symbol), fetchFmpIncomeStatement(symbol)]);
        if (profile) result.name = profile.companyName || result.name;
        result.ticker = symbol;
        result.region = profile?.country || result.region;
        const normalized = normalizeFmpFinancials(profile, income || []);
        result.financials = normalized;
        result.trends = { revenue: normalized.revenue, netIncome: normalized.netIncome, assets: normalized.assets };
        result.source = "Financial Modeling Prep";
        result.customers = profile?.description ? "See company description and annual reports for customer/segment info." : null;
        result.error = null;
        return result;
      } catch (e) {
        if (!result.error) result.error = e.message || "FMP fetch failed";
      }
    }
  }
  if (!result.financials) {
    result.error = result.error || "Could not load company data. Try: (1) Use exact US ticker e.g. AAPL for Apple, (2) Add VITE_FMP_API_KEY in .env for global data (free key at financialmodelingprep.com).";
  }
  return result;
}
