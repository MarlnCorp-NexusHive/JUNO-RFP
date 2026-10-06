/**
 * SBIR.gov awards + topics. Free public API with curated excerpt fallback.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXCERPT_PATH = path.join(__dirname, "data", "sbir-excerpt.json");
const SBIR_AWARDS = "https://api.www.sbir.gov/public/api/awards";
const SBIR_SOLICITATIONS = "https://api.www.sbir.gov/public/api/solicitations";

function loadExcerpt() {
  try {
    return JSON.parse(fs.readFileSync(EXCERPT_PATH, "utf8"));
  } catch {
    return { awards: [], topics: [], source: "SBIR excerpt" };
  }
}

function moneyLabel(n) {
  if (n == null || n === "") return null;
  const num = Number(n);
  if (!Number.isFinite(num)) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}

function matchesKw(row, kw) {
  if (!kw) return true;
  const hay = [
    row.title,
    row.number,
    row.agency,
    row.company,
    row.abstract,
    row.summary,
    row.program,
    row.phase,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(kw.toLowerCase());
}

function searchExcerpt({ kind, keyword, agency, status, page, pageSize }) {
  const excerpt = loadExcerpt();
  const kw = String(keyword || "").trim();
  const ag = String(agency || "").trim().toUpperCase();
  const st = String(status || "").trim().toLowerCase();
  const pageIndex = Math.max(0, Number(page) || 0);
  const limit = Math.min(50, Math.max(1, Number(pageSize) || 25));

  let pool =
    kind === "topics"
      ? (excerpt.topics || []).map((t) => ({
          id: t.id,
          title: t.title,
          number: t.number || "",
          agency: t.agency || "",
          status: t.status || "",
          program: t.program || "SBIR",
          deadline: t.deadline || null,
          amount: null,
          amountLabel: null,
          summary: t.summary || "",
          description: t.summary || "",
          company: "",
          phase: "",
          source: excerpt.source || "SBIR.gov (excerpt)",
          url: t.url || "https://www.sbir.gov/topics",
        }))
      : (excerpt.awards || []).map((a) => ({
          id: a.id,
          title: a.title,
          number: a.number || "",
          agency: a.agency || "",
          status: a.phase || "Award",
          program: a.program || "SBIR",
          deadline: a.awardYear ? `${a.awardYear}-12-31` : null,
          amount: a.amount ?? null,
          amountLabel: moneyLabel(a.amount),
          summary: a.abstract || "",
          description: a.abstract || "",
          company: a.company || "",
          phase: a.phase || "",
          source: excerpt.source || "SBIR.gov (excerpt)",
          url: a.url || "https://www.sbir.gov/awards",
        }));

  pool = pool.filter((row) => matchesKw(row, kw));
  if (ag) pool = pool.filter((row) => String(row.agency || "").toUpperCase().includes(ag));
  if (st && kind === "topics") {
    pool = pool.filter((row) => String(row.status || "").toLowerCase() === st);
  }

  const hitCount = pool.length;
  const start = pageIndex * limit;
  const results = pool.slice(start, start + limit);
  return {
    source: excerpt.source || "SBIR.gov (excerpt)",
    sourceDetail: "Curated public SBIR/STTR excerpt (live API unavailable or empty)",
    live: false,
    hitCount,
    page: pageIndex,
    pageSize: limit,
    hasMore: start + limit < hitCount,
    results,
  };
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`SBIR returned non-JSON (${res.status})`);
  }
  if (!res.ok) throw new Error(`SBIR HTTP ${res.status}`);
  return json;
}

async function searchLiveAwards({ keyword, agency, page, pageSize }) {
  const params = new URLSearchParams();
  if (agency) params.set("agency", agency);
  if (keyword) params.set("keyword", keyword);
  const offset = Math.max(0, Number(page) || 0) * Math.max(1, Number(pageSize) || 25);
  if (offset) params.set("offset", String(offset));
  const qs = params.toString();
  const json = await fetchJson(`${SBIR_AWARDS}${qs ? `?${qs}` : ""}`);
  const rows = Array.isArray(json) ? json : Array.isArray(json?.results) ? json.results : [];
  if (!rows.length) throw new Error("SBIR awards empty");

  const results = rows.slice(0, pageSize).map((a, i) => {
    const amount = a.award_amount != null ? Number(a.award_amount) : null;
    return {
      id: String(a.award_number || a.contract || `sbir-live-${offset + i}`),
      title: a.award_title || a.title || "SBIR award",
      number: String(a.award_number || a.contract || ""),
      agency: a.agency || "",
      status: a.phase || "Award",
      program: a.program || "SBIR",
      deadline: a.award_year ? `${a.award_year}-12-31` : null,
      amount: Number.isFinite(amount) ? amount : null,
      amountLabel: moneyLabel(amount),
      summary: a.abstract || a.firm || "",
      description: a.abstract || "",
      company: a.firm || a.company_name || "",
      phase: a.phase || "",
      source: "SBIR.gov",
      url: "https://www.sbir.gov/awards",
    };
  });

  return {
    source: "SBIR.gov",
    sourceDetail: "Live SBIR/STTR awards API",
    live: true,
    hitCount: results.length + offset,
    page: Math.max(0, Number(page) || 0),
    pageSize: Math.max(1, Number(pageSize) || 25),
    hasMore: rows.length >= pageSize,
    results,
  };
}

async function searchLiveTopics({ keyword, agency, status, page, pageSize }) {
  const params = new URLSearchParams();
  if (agency) params.set("agency", agency);
  if (keyword) params.set("keyword", keyword);
  if (status) params.set("keyword", keyword || status);
  const json = await fetchJson(`${SBIR_SOLICITATIONS}${params.toString() ? `?${params}` : ""}`);
  const rows = Array.isArray(json) ? json : Array.isArray(json?.results) ? json.results : [];
  if (!rows.length) throw new Error("SBIR topics empty");

  const kw = String(keyword || "").trim().toLowerCase();
  const ag = String(agency || "").trim().toUpperCase();
  const st = String(status || "").trim().toLowerCase();
  let filtered = rows.map((t, i) => ({
    id: String(t.solicitation_number || t.topic_number || `sbir-topic-${i}`),
    title: t.solicitation_title || t.topic_title || t.title || "SBIR topic",
    number: String(t.solicitation_number || t.topic_number || ""),
    agency: t.agency || "",
    status: t.current_status || t.status || "Open",
    program: t.program || "SBIR",
    deadline: t.close_date || t.application_due_date || null,
    amount: null,
    amountLabel: null,
    summary: t.solicitation_title || t.topic_description || "",
    description: t.topic_description || t.solicitation_title || "",
    company: "",
    phase: "",
    source: "SBIR.gov",
    url: "https://www.sbir.gov/topics",
  }));
  if (kw) filtered = filtered.filter((r) => matchesKw(r, kw));
  if (ag) filtered = filtered.filter((r) => String(r.agency || "").toUpperCase().includes(ag));
  if (st) filtered = filtered.filter((r) => String(r.status || "").toLowerCase().includes(st));

  const pageIndex = Math.max(0, Number(page) || 0);
  const limit = Math.min(50, Math.max(1, Number(pageSize) || 25));
  const start = pageIndex * limit;
  const results = filtered.slice(start, start + limit);
  return {
    source: "SBIR.gov",
    sourceDetail: "Live SBIR/STTR solicitations API",
    live: true,
    hitCount: filtered.length,
    page: pageIndex,
    pageSize: limit,
    hasMore: start + limit < filtered.length,
    results,
  };
}

async function searchSbir(params) {
  const kind = params.kind === "topics" ? "topics" : "awards";
  try {
    const live =
      kind === "topics" ? await searchLiveTopics(params) : await searchLiveAwards(params);
    if (live.results?.length) return live;
  } catch (err) {
    console.warn("[sbir] live search failed, using excerpt:", err.message);
  }
  return searchExcerpt({ ...params, kind });
}

export function registerSbirRoutes(app) {
  app.post("/grants/sbir/search", async (req, res) => {
    try {
      const {
        kind = "awards",
        keyword = "",
        agency = "",
        status = "",
        page = 0,
        rows = 25,
      } = req.body || {};
      const payload = await searchSbir({
        kind,
        keyword: String(keyword || "").trim(),
        agency: String(agency || "").trim(),
        status: String(status || "").trim(),
        page,
        pageSize: rows,
      });
      return res.json({
        kind: kind === "topics" ? "topics" : "awards",
        fetchedAt: new Date().toISOString(),
        ...payload,
      });
    } catch (err) {
      console.error("[grants/sbir/search]", err);
      return res.status(502).json({
        error: err.message || "Failed to search SBIR",
        code: "sbir_search_failed",
      });
    }
  });
}
