/**
 * Builds bundled company financial snapshots from SEC EDGAR (US-GAAP company facts).
 * Trusted source: U.S. Securities and Exchange Commission — https://www.sec.gov/edgar
 *
 * Run from repo root:
 *   node scripts/refresh-company-intelligence-samples.mjs
 *
 * Optional env:
 *   SEC_USER_AGENT="YourApp contact@yourdomain.com"  (required by SEC fair access)
 *   CI_TARGET_COUNT=1100   (default 1100)
 *   CI_MAX_ATTEMPTS=5500   (cap SEC fetches; default target*5)
 *
 * Data prep (no app backend):
 *   1. S&P 500 constituents (Symbol + GICS Sector) — public CSV on GitHub (datasets project)
 *   2. SEC company_tickers.json — full US issuer universe for backfill to reach target count
 *
 * Output: src/features/proposal-manager/data/companyIntelligenceSamplesData.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "src/features/proposal-manager/data/companyIntelligenceSamplesData.json");

const SEC_TICKERS = "https://www.sec.gov/files/company_tickers.json";
const SP500_CSV =
  "https://raw.githubusercontent.com/datasets/s-and-p-500-companies/master/data/constituents.csv";

const UA = process.env.SEC_USER_AGENT || "JUNO-RFP-SampleBuilder contact@marlncorp.com";
const HEADERS = { Accept: "application/json", "User-Agent": UA };

const TARGET = Math.max(100, Number(process.env.CI_TARGET_COUNT || 1100) || 1100);
const MAX_ATTEMPTS = Math.max(TARGET * 2, Number(process.env.CI_MAX_ATTEMPTS || TARGET * 5) || TARGET * 5);

/** Map consumer ticker → SEC listing symbol (company_tickers.json uses exchange format). */
const SEC_TICKER_LOOKUP = {
  "BRK.B": "BRK-B",
  "BF.B": "BF-B",
  "BF.A": "BF-A",
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.text();
}

function parseSp500Csv(text) {
  /** @type {{ symbol: string, sector: string }[]} */
  const rows = [];
  const lines = text.split(/\r?\n/).slice(1);
  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQ = !inQ;
        continue;
      }
      if (ch === "," && !inQ) {
        parts.push(cur);
        cur = "";
        continue;
      }
      cur += ch;
    }
    parts.push(cur);
    if (parts.length >= 3) {
      const symbol = parts[0].trim();
      const sector = parts[2].trim();
      if (/^[A-Z0-9.-]{1,8}$/i.test(symbol)) rows.push({ symbol: symbol.toUpperCase(), sector });
    }
  }
  return rows;
}

function dedupePeriods(rows) {
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    if (seen.has(r.period)) continue;
    seen.add(r.period);
    out.push(r);
  }
  return out;
}

function revenueUnits(gaap) {
  const tags = [
    gaap.Revenues,
    gaap.Revenue,
    gaap.SalesRevenueNet,
    gaap.RevenueFromContractWithCustomerExcludingAssessedTax,
  ];
  const merged = [];
  for (const tag of tags) {
    const u = tag?.units?.USD || tag?.units?.usd;
    if (Array.isArray(u) && u.length) merged.push(...u);
  }
  return merged;
}

function normalizeFacts(facts) {
  const out = { revenue: [], netIncome: [], assets: [] };
  if (!facts?.facts) return out;
  const gaap = facts.facts["us-gaap"] || {};
  const isAnnualPoint = (x) => {
    if (!x?.end || x.val == null) return false;
    const fr = x.frame != null ? String(x.frame) : "";
    if (/^CY\d{4}$/.test(fr)) return true;
    if (fr.includes("Q")) return false;
    return x.fp === "FY" || /10-K/i.test(String(x.form || ""));
  };
  const takeAnnual = (arr, n = 8) => {
    if (!Array.isArray(arr)) return [];
    const annual = arr.filter(isAnnualPoint);
    const pool = annual.length >= 2 ? annual : arr.filter((x) => x.end && x.val != null);
    const mapped = pool
      .sort((a, b) => (b.end || "").localeCompare(a.end || ""))
      .slice(0, n)
      .map((x) => ({ period: x.end, value: x.val }));
    return dedupePeriods(mapped);
  };
  const usd = (tag) => tag?.units?.USD || tag?.units?.usd || [];
  out.revenue = takeAnnual(revenueUnits(gaap));
  if (gaap.NetIncomeLoss) out.netIncome = takeAnnual(usd(gaap.NetIncomeLoss));
  if (gaap.Assets) out.assets = takeAnnual(usd(gaap.Assets));
  return out;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  console.log(`Target: ${TARGET} companies with usable US-GAAP USD series (max attempts ${MAX_ATTEMPTS}).`);

  /** @type {Map<string, string>} */
  const sectorBySymbol = new Map();
  try {
    const csv = await fetchText(SP500_CSV);
    for (const { symbol, sector } of parseSp500Csv(csv)) {
      sectorBySymbol.set(symbol, sector);
    }
    console.log(`Loaded ${sectorBySymbol.size} S&P 500 symbols + GICS sectors (reference CSV).`);
  } catch (e) {
    console.warn("S&P 500 CSV unavailable:", e.message || e);
  }

  console.log("Fetching SEC company tickers…");
  const raw = await fetchJson(SEC_TICKERS);
  const list = Array.isArray(raw) ? raw : Object.values(raw || {});
  const byTicker = new Map(list.map((c) => [(c.ticker || "").toUpperCase(), c]));

  const spSet = new Set(sectorBySymbol.keys());
  const priority = Array.from(spSet);

  /** Prefer ordinary common symbols when backfilling (skip warrants, units, preferred stubs). */
  function isLikelyCommonEquity(t) {
    if (!t || t.length > 8) return false;
    if (/[-+]/.test(t)) return false;
    if (/W$|WS$|WT$|U$|R$|P[ABCDEFGHIJKLMN]?$/i.test(t)) return false;
    return /^[A-Z0-9.]+$/i.test(t);
  }

  const rest = shuffle(
    list
      .map((r) => (r.ticker || "").toUpperCase())
      .filter((t) => t && !spSet.has(t) && isLikelyCommonEquity(t)),
  );
  const ordered = [...priority, ...rest];

  function toDisplayAndLookup(sym) {
    const u = String(sym || "").trim().toUpperCase();
    if (!u) return null;
    for (const [display, sec] of Object.entries(SEC_TICKER_LOOKUP)) {
      if (sec.toUpperCase() === u) return { displayTicker: display, lookup: sec.toUpperCase() };
      if (display.toUpperCase() === u) return { displayTicker: display, lookup: sec.toUpperCase() };
    }
    return { displayTicker: sym.trim(), lookup: u };
  }

  const companies = [];
  const seen = new Set();
  let attempts = 0;

  async function tryOne(symRaw) {
    if (companies.length >= TARGET || attempts >= MAX_ATTEMPTS) return;
    const parsed = toDisplayAndLookup(symRaw);
    if (!parsed) return;
    const { displayTicker, lookup } = parsed;
    const upper = displayTicker.toUpperCase();
    if (seen.has(upper)) return;
    const row = byTicker.get(lookup);
    if (!row) return;

    attempts++;
    const cik = String(row.cik_str ?? row.cik).padStart(10, "0");
    const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`;
    try {
      const facts = await fetchJson(url);
      const fin = normalizeFacts(facts);
      const usable = fin.revenue.length + fin.netIncome.length + fin.assets.length > 0;
      if (!usable) return;

      const secListed = (row.ticker || lookup).toUpperCase();
      seen.add(upper);
      companies.push({
        ticker: upper,
        name: facts.entityName || row.title || upper,
        region: "US",
        sector: sectorBySymbol.get(upper) || sectorBySymbol.get(secListed) || null,
        sourceNote:
          "SEC EDGAR US-GAAP company facts (scripts/refresh-company-intelligence-samples.mjs); verify on sec.gov.",
        revenue: fin.revenue,
        netIncome: fin.netIncome,
        assets: fin.assets,
      });
      console.log(`OK ${companies.length}/${TARGET}`, upper, (facts.entityName || "").slice(0, 42));
    } catch {
      /* skip */
    }
    await sleep(120);
  }

  for (const t of ordered) {
    if (companies.length >= TARGET || attempts >= MAX_ATTEMPTS) break;
    await tryOne(t);
  }

  companies.sort((a, b) => a.ticker.localeCompare(b.ticker));

  fs.writeFileSync(
    OUT,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        targetCount: TARGET,
        source: "SEC EDGAR (US-GAAP); S&P 500 symbols prioritized via public constituents CSV",
        companies,
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log("Wrote", OUT, `(${companies.length} companies, ${attempts} SEC requests)`);
  if (companies.length < TARGET) {
    console.warn(`Only collected ${companies.length} of ${TARGET}. Increase CI_MAX_ATTEMPTS or check network/SEC_USER_AGENT.`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
