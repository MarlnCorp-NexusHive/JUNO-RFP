/**
 * US Philanthropic Grantmakers directory + deep opportunity retrieval.
 * Crawls each funder's Opportunity/policy page (and ranked child pages),
 * then extracts currently open grants via AI + heuristics — not bare redirects.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "data", "usPhilanthropicGrantmakers.json");
const MODEL = process.env.PHILANTHROPIC_OPS_MODEL || process.env.GRANT_BRIEF_MODEL || "gpt-4.1-mini";
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4h when opens were found
const EMPTY_CACHE_TTL_MS = 30 * 60 * 1000; // re-scan empties sooner so open funders can surface
const MAX_FOLLOW_PAGES = 5;
const FETCH_TIMEOUT_MS = 22_000;
const OPEN_INDEX_PATH = path.join(__dirname, "data", "philanthropic-open-index.json");

/** In-flight background refreshes so stale caches stay instant for clients. */
const backgroundRefreshIds = new Set();

function cacheDir() {
  return path.join(__dirname, "data", "philanthropic-ops-cache");
}

function ensureCacheDir() {
  const dir = cacheDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function ensureDataDir() {
  const dir = path.dirname(OPEN_INDEX_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

let directoryCache = null;

export function loadUsGrantmakersDirectory() {
  if (directoryCache) return directoryCache;
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  directoryCache = {
    snapshot: raw.snapshot || null,
    source: raw.source || null,
    filter: raw.filter || "Base country = United States",
    count: Array.isArray(raw.grantmakers) ? raw.grantmakers.length : 0,
    grantmakers: Array.isArray(raw.grantmakers) ? raw.grantmakers : [],
  };
  return directoryCache;
}

export function findUsGrantmaker(id) {
  const dir = loadUsGrantmakersDirectory();
  const needle = String(id || "").trim().toUpperCase();
  return dir.grantmakers.find((g) => String(g.id || "").toUpperCase() === needle) || null;
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function sameRegistrableHost(a, b) {
  try {
    const ha = new URL(a).hostname.replace(/^www\./, "").toLowerCase();
    const hb = new URL(b).hostname.replace(/^www\./, "").toLowerCase();
    if (ha === hb) return true;
    // allow known grant portals linked from foundation pages
    const grantPortals = [
      "grandchallenges.org",
      "gcgh.grandchallenges.org",
      "submit.gatesfoundation.org",
      "fluxx.io",
      "foundant.com",
      "surveymonkey.com",
      "smapply.io",
      "submittable.com",
      "grantinterface.com",
    ];
    return grantPortals.some((p) => hb === p || hb.endsWith(`.${p}`));
  } catch {
    return false;
  }
}

function isAwardArchiveUrl(url) {
  const u = String(url || "").toLowerCase();
  // Grand Challenges /grants is a funded-project database, not open RFPs.
  if (/grandchallenges\.org\/grants(\/|$|\?)/.test(u) && !/grant-opportunit/.test(u)) return true;
  if (/committed-grants|awarded-grants|grant-search|our-grants\/search/.test(u)) return true;
  return false;
}

function isOpportunityHubUrl(url) {
  const u = String(url || "").toLowerCase();
  if (isAwardArchiveUrl(u)) return false;
  return /grant-opportunit|funding-opportunit|active-funding|open-call|how-to-apply|\/apply|rfp|request-for|challenge|competition|submit\./.test(
    u,
  );
}

function linkScore(label, url) {
  const blob = `${label} ${url}`.toLowerCase();
  let score = 0;
  if (isAwardArchiveUrl(url)) return -20;
  if (/grant.?opportunit|open.?call|request for proposal|\brfp\b|\brfa\b|\bloi\b|apply now|how to apply|funding opportunit|active grant|current opportunit|competition|challenge|call for proposals/.test(blob)) {
    score += 8;
  }
  if (/apply|application|submit|proposal/.test(blob)) score += 3;
  if (/grant|funding|opportunity/.test(blob)) score += 2;
  if (/deadline|due date|closes|closing/.test(blob)) score += 2;
  if (/faq|about|contact|privacy|career|news|blog|press|annual.?report|financial|committed.?grants|funded project/.test(blob)) {
    score -= 5;
  }
  if (/facebook|twitter|linkedin|instagram|youtube|mailto:/.test(blob)) score -= 10;
  return score;
}

function extractLinks(html, baseUrl) {
  const links = [];
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) && links.length < 120) {
    const href = m[1];
    const label = stripHtml(m[2]).slice(0, 180);
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("javascript:")) continue;
    let absolute = href;
    try {
      absolute = new URL(href, baseUrl).toString();
    } catch {
      continue;
    }
    const score = linkScore(label, absolute);
    if (score <= 0) continue;
    links.push({ label: label || absolute, url: absolute, score });
  }
  const seen = new Set();
  return links
    .filter((l) => {
      if (seen.has(l.url)) return false;
      seen.add(l.url);
      return true;
    })
    .sort((a, b) => b.score - a.score);
}

/** Extra seed URLs for well-known public opportunity hubs. */
function knownPortalSeeds(funder) {
  const name = String(funder.name || "").toLowerCase();
  const seeds = [];
  if (name.includes("gates foundation")) {
    seeds.push(
      "https://www.gatesfoundation.org/about/how-we-work/grant-opportunities",
      "https://gcgh.grandchallenges.org/grant-opportunities",
      "https://submit.gatesfoundation.org/",
    );
    // Do NOT seed /grants archives — those are awarded projects, not open calls.
  }
  if (name.includes("ford foundation")) {
    seeds.push("https://www.fordfoundation.org/work/our-grants/");
  }
  if (name.includes("macarthur")) {
    seeds.push("https://www.macfound.org/programs/");
  }
  if (name.includes("rockefeller foundation") && !name.includes("brothers") && !name.includes("family")) {
    seeds.push("https://www.rockefellerfoundation.org/grants/");
  }
  if (name.includes("knight foundation")) {
    seeds.push("https://knightfoundation.org/apply/");
  }
  if (name.includes("mellon")) {
    seeds.push("https://www.mellon.org/grant-programs");
  }
  if (name.includes("rwjf") || name.includes("robert wood johnson")) {
    seeds.push("https://www.rwjf.org/en/grants/active-funding-opportunities.html");
  }
  return seeds;
}

const BROWSER_HEADERS = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Upgrade-Insecure-Requests": "1",
};

async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    let referer;
    try {
      referer = new URL(url).origin + "/";
    } catch {
      referer = undefined;
    }
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { ...BROWSER_HEADERS, ...(referer ? { Referer: referer } : {}) },
    });
    const html = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      finalUrl: res.url || url,
      html: html.slice(0, 700_000),
      blocked: res.status === 403 || res.status === 401 || res.status === 429,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      finalUrl: url,
      html: "",
      blocked: true,
      error: err?.message || "fetch_failed",
    };
  } finally {
    clearTimeout(timer);
  }
}

function cachePath(funderId) {
  const safe = String(funderId || "unknown").replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(ensureCacheDir(), `${safe}.json`);
}

function cacheTtlMs(parsed) {
  const n = Array.isArray(parsed?.opportunities) ? parsed.opportunities.length : 0;
  return n > 0 ? CACHE_TTL_MS : EMPTY_CACHE_TTL_MS;
}

function isRegistryFallbackOnly(parsed) {
  return (
    parsed?.extractionMode === "registry-fallback" &&
    !parsed.opportunities?.some((o) => o.retrieved)
  );
}

function isOpsCacheFresh(parsed) {
  if (!parsed?.fetchedAt) return false;
  if (isRegistryFallbackOnly(parsed)) return false;
  const age = Date.now() - Date.parse(parsed.fetchedAt);
  if (Number.isNaN(age) || age > cacheTtlMs(parsed)) return false;
  return true;
}

/** Last-known ops payload from disk (ignores TTL) — keeps retrieval instant. */
function readOpsCacheFile(funderId) {
  try {
    const file = cachePath(funderId);
    if (!fs.existsSync(file)) return null;
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!parsed?.fetchedAt) return null;
    if (isRegistryFallbackOnly(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function readOpsCache(funderId) {
  const parsed = readOpsCacheFile(funderId);
  if (!parsed || !isOpsCacheFresh(parsed)) return null;
  return parsed;
}

function indexEntryFromPayload(payload) {
  const id = String(payload.funderId || "").toUpperCase();
  if (!id) return null;
  return {
    openGrantCount: Array.isArray(payload.opportunities) ? payload.opportunities.length : 0,
    checked: true,
    fetchedAt: payload.fetchedAt || null,
    blocked: !!payload.blocked,
    extractionMode: payload.extractionMode || null,
  };
}

function readDurableOpenIndex() {
  try {
    if (!fs.existsSync(OPEN_INDEX_PATH)) return null;
    const parsed = JSON.parse(fs.readFileSync(OPEN_INDEX_PATH, "utf8"));
    if (!parsed || typeof parsed.funders !== "object" || !parsed.funders) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeDurableOpenIndex(doc) {
  ensureDataDir();
  const tmp = `${OPEN_INDEX_PATH}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(doc, null, 2), "utf8");
  fs.renameSync(tmp, OPEN_INDEX_PATH);
}

/** Persist counts/checked flags used by directory sort — survives ops-cache TTL. */
function upsertOpenIndexEntry(payload) {
  const entry = indexEntryFromPayload(payload);
  if (!entry) return;
  const id = String(payload.funderId).toUpperCase();
  const existing = readDurableOpenIndex() || { updatedAt: null, funders: {} };
  existing.funders[id] = entry;
  existing.updatedAt = new Date().toISOString();
  writeDurableOpenIndex(existing);
}

function rebuildOpenIndexFromOpsCache() {
  const funders = {};
  try {
    const dir = ensureCacheDir();
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith(".json")) continue;
      try {
        const parsed = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
        if (!parsed?.fetchedAt || isRegistryFallbackOnly(parsed)) continue;
        const entry = indexEntryFromPayload(parsed);
        if (!entry) continue;
        const id = String(parsed.funderId || name.replace(/\.json$/i, "")).toUpperCase();
        funders[id] = entry;
      } catch {
        /* skip */
      }
    }
  } catch {
    /* no cache */
  }
  const doc = { updatedAt: new Date().toISOString(), funders };
  writeDurableOpenIndex(doc);
  return doc;
}

function writeOpsCache(payload) {
  const file = cachePath(payload.funderId);
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(payload, null, 2), "utf8");
  fs.renameSync(tmp, file);
  upsertOpenIndexEntry(payload);
}

function normalizeOpp(funder, o, i, prefix = "ext") {
  const title = String(o.title || "").trim();
  if (!title) return null;
  return {
    id: `${funder.id}-${prefix}-${i + 1}`,
    title,
    status: String(o.status || "Open").trim(),
    deadline: o.deadline || null,
    amountLabel: o.amountLabel || null,
    eligibility: o.eligibility || null,
    summary: o.summary || null,
    url: o.url || funder.opportunitySourceUrl,
    confidence: ["high", "medium", "low"].includes(o.confidence) ? o.confidence : "medium",
    retrieved: true,
  };
}

function dedupeOpportunities(list) {
  const seen = new Set();
  const out = [];
  for (const o of list) {
    if (!o?.title) continue;
    const key = `${String(o.title).toLowerCase().slice(0, 80)}|${String(o.url || "").toLowerCase().split("?")[0]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(o);
  }
  return out;
}

/** Parse Next.js __NEXT_DATA__ blobs from open-opportunity hubs only (not award archives). */
function opportunitiesFromNextData(funder, pages) {
  const out = [];
  for (const page of pages) {
    const pageUrl = page.finalUrl || "";
    if (!isOpportunityHubUrl(pageUrl) || isAwardArchiveUrl(pageUrl)) continue;
    const html = page.html || "";
    const m = html.match(
      /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i,
    );
    if (!m) continue;
    let data;
    try {
      data = JSON.parse(m[1]);
    } catch {
      continue;
    }
    const listing = data?.props?.pageProps?.initialData?.listing;
    const rows = Array.isArray(listing?.data) ? listing.data : [];
    const nested =
      rows.length > 0
        ? rows
        : Array.isArray(data?.props?.pageProps?.initialData?.opportunities)
          ? data.props.pageProps.initialData.opportunities
          : [];

    for (const row of nested) {
      if (!row || typeof row !== "object") continue;
      const title =
        row.title || row.name || row.label || row.challengeTitle || row.opportunityTitle;
      if (!title) continue;
      if (row.pi || row.principalInvestigator || row.grantee || row.awardYear) continue;
      let url =
        row.url ||
        row.link ||
        row.path ||
        row.alias ||
        (row.nid ? `https://gcgh.grandchallenges.org/challenge/${row.nid}` : null) ||
        page.finalUrl;
      try {
        url = new URL(String(url), page.finalUrl).toString();
      } catch {
        url = page.finalUrl;
      }
      if (/grandchallenges\.org\/grant\//.test(String(url))) continue;
      const deadline =
        row.deadline ||
        row.closeDate ||
        row.closingDate ||
        row.applicationDeadline ||
        row.dueDate ||
        null;
      const statusRaw = String(row.status || row.state || "Open");
      out.push({
        title: String(title).trim(),
        status: statusRaw,
        deadline: deadline ? String(deadline).slice(0, 40) : null,
        amountLabel: row.amount || row.awardAmount || row.funding || null,
        eligibility: row.eligibility || null,
        summary: row.summary || row.description || row.teaser || null,
        url,
        confidence: "high",
      });
    }
  }
  return out.map((o, i) => normalizeOpp(funder, o, i, "next")).filter(Boolean);
}

function isLowQualityOpp(o) {
  const t = String(o?.title || "").toLowerCase().trim();
  const u = String(o?.url || "").toLowerCase();
  if (t.length < 8) return true;
  if (/^(grant opportunities|grants|funding|apply|opportunities|our grants)$/.test(t)) return true;
  if (/tax-status|privacy|cookie|careers|faq$|contact$|annual-report|committed-grants/.test(u)) return true;
  if (/policies-and-resources|who-we-are\/faqs|our-approach$/.test(u) && !/challenge|rfp|apply|competition/.test(t)) {
    return true;
  }
  return false;
}

/** Pull likely open-call cards from headings + nearby text. */
function heuristicCardsFromPages(funder, pages) {
  const opportunities = [];
  for (const page of pages) {
    const html = page.html || "";
    const headingRe = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
    let m;
    while ((m = headingRe.exec(html)) && opportunities.length < 25) {
      const title = stripHtml(m[2]).slice(0, 160);
      if (title.length < 12) continue;
      const tlow = title.toLowerCase();
      if (
        !/grant opportunit|funding opportunit|request for proposal|\brfp\b|\brfa\b|grand challenge|open call|call for proposals|active funding|apply for (a )?grant|competition|challenge grant/.test(
          tlow,
        )
      ) {
        continue;
      }
      if (
        /about us|our mission|privacy|cookie|subscribe|career|press release|grantee stor|forum|remarks|faq|can i apply|received a .* grant in the past/.test(
          tlow,
        )
      ) {
        continue;
      }
      const after = html.slice(m.index, m.index + 900);
      const text = stripHtml(after);
      const openish =
        /accepting applications|apply now|deadline|applications? (are )?due|closes on|closing date|submit (an )?application|letter of intent|\bloi\b|\brfp\b|currently open/.test(
          text.toLowerCase(),
        );
      if (!openish) continue;
      let url = page.finalUrl;
      const linkInBlock = after.match(/href=["']([^"']+)["']/i);
      if (linkInBlock) {
        try {
          url = new URL(linkInBlock[1], page.finalUrl).toString();
        } catch {
          /* keep page url */
        }
      }
      const deadlineMatch = text.match(
        /(?:deadline|due|closes|closing|applications?\s+(?:due|close))\s*[:\-]?\s*([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/i,
      );
      opportunities.push({
        title,
        status: "Likely open",
        deadline: deadlineMatch ? deadlineMatch[1] : null,
        amountLabel: null,
        eligibility: null,
        summary: text.slice(0, 220),
        url,
        confidence: "medium",
      });
    }
  }
  return opportunities.map((o, i) => normalizeOpp(funder, o, i, "card")).filter(Boolean);
}

async function extractWithAi(openai, funder, pageText, links, crawledUrls) {
  if (!openai) return null;
  const linkBlock = links
    .slice(0, 50)
    .map((l, i) => `${i + 1}. ${l.label} — ${l.url}`)
    .join("\n");
  const prompt = `You extract CURRENTLY OPEN grant / funding opportunities from crawled pages of a philanthropic funder.

Funder: ${funder.name} (${funder.id})
Application access policy (from registry): ${funder.applicationAccess || "unknown"}
Funding focus: ${funder.fundingFocus || ""}
Funding geography: ${funder.fundingGeography || ""}
Pages crawled:
${(crawledUrls || []).map((u) => `- ${u}`).join("\n") || "- (none)"}

Return STRICT JSON only:
{
  "accessSummary": "short note on how applicants can approach this funder",
  "notes": "caveats",
  "opportunities": [
    {
      "title": "specific opportunity / program / challenge name",
      "status": "Open|Likely open|Closing soon|Unknown",
      "deadline": "YYYY-MM-DD or human date string or null",
      "amountLabel": "string or null",
      "eligibility": "short string or null",
      "summary": "1-2 sentences",
      "url": "best absolute URL for that opportunity",
      "confidence": "high|medium|low"
    }
  ]
}

Rules:
- Only include DISTINCT currently open / accepting applications / active competitions / open LOI-RFP windows.
- Each opportunity must be a real named call or program window — NOT generic "About grants", FAQ, annual report, or homepage.
- If invitation-only with no public open call, return opportunities: [].
- Do not invent deadlines or amounts.
- Prefer specific URLs from the link list when possible.

Relevant links:
${linkBlock || "(none)"}

Combined page text (truncated):
${pageText.slice(0, 18000)}`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You extract real open funding opportunities only. Never invent listings. Prefer an empty list over generic redirect pages.",
      },
      { role: "user", content: prompt },
    ],
  });

  const raw = response.choices?.[0]?.message?.content || "{}";
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const opportunities = Array.isArray(parsed.opportunities)
    ? parsed.opportunities.map((o, i) => normalizeOpp(funder, o, i, "ai")).filter(Boolean)
    : [];

  return {
    opportunities,
    accessSummary: parsed.accessSummary || funder.applicationAccess || "",
    notes: parsed.notes || "",
  };
}

async function crawlFunderPages(funder) {
  const seedUrls = [
    funder.opportunitySourceUrl,
    ...knownPortalSeeds(funder),
    funder.awardSourceUrl,
  ].filter(Boolean);

  const uniqueSeeds = [...new Set(seedUrls)].filter((u) => !isAwardArchiveUrl(u));
  const fetched = [];
  const allLinks = [];
  const seenUrls = new Set();

  async function ingest(url) {
    if (isAwardArchiveUrl(url)) return null;
    const key = String(url).split("#")[0];
    if (seenUrls.has(key)) return null;
    seenUrls.add(key);
    const page = await fetchPage(url);
    if (!page.ok) return page;
    fetched.push(page);
    const links = extractLinks(page.html, page.finalUrl || url);
    for (const l of links) {
      if (!isAwardArchiveUrl(l.url)) allLinks.push(l);
    }
    return page;
  }

  let anyOk = false;
  for (const seed of uniqueSeeds) {
    const page = await ingest(seed);
    if (page?.ok) anyOk = true;
  }

  if (!anyOk) {
    return { pages: [], links: [], blocked: true, pageStatus: 403 };
  }

  const base = funder.opportunitySourceUrl;
  const portalOrigins = knownPortalSeeds(funder).map((s) => {
    try {
      return new URL(s).origin;
    } catch {
      return null;
    }
  }).filter(Boolean);
  const followCandidates = allLinks
    .filter((l) => {
      try {
        const host = new URL(l.url).hostname.replace(/^www\./, "");
        const baseHost = new URL(base).hostname.replace(/^www\./, "");
        if (host === baseHost || host.endsWith(`.${baseHost}`) || baseHost.endsWith(`.${host}`)) return true;
        return portalOrigins.some((origin) => l.url.startsWith(origin));
      } catch {
        return false;
      }
    })
    .filter((l) => l.score >= 5)
    .slice(0, MAX_FOLLOW_PAGES);

  for (const cand of followCandidates) {
    if (fetched.length >= MAX_FOLLOW_PAGES + uniqueSeeds.length) break;
    await ingest(cand.url);
  }

  // de-dupe links
  const linkSeen = new Set();
  const links = allLinks
    .filter((l) => {
      if (linkSeen.has(l.url)) return false;
      linkSeen.add(l.url);
      return true;
    })
    .sort((a, b) => b.score - a.score);

  return {
    pages: fetched.filter((p) => p.ok),
    links,
    blocked: false,
    pageStatus: fetched.find((p) => p.ok)?.status || 200,
    finalUrl: fetched.find((p) => p.ok)?.finalUrl || base,
  };
}

function scheduleBackgroundRefresh(openai, funderId) {
  const id = String(funderId || "").toUpperCase();
  if (!id || backgroundRefreshIds.has(id)) return;
  backgroundRefreshIds.add(id);
  setImmediate(() => {
    getOpenOpportunitiesForFunder(openai, { funderId: id, forceRefresh: true })
      .catch((err) => console.warn("[philanthropic-ops] background refresh failed:", id, err?.message || err))
      .finally(() => backgroundRefreshIds.delete(id));
  });
}

/**
 * Deep-fetch + extract open opportunities for a US grantmaker.
 * Serves last-known disk cache immediately; refreshes in background when stale.
 */
export async function getOpenOpportunitiesForFunder(openai, { funderId, forceRefresh = false } = {}) {
  const funder = findUsGrantmaker(funderId);
  if (!funder) {
    const err = new Error(`Unknown US grantmaker id: ${funderId}`);
    err.statusCode = 404;
    throw err;
  }
  if (!funder.opportunitySourceUrl) {
    const err = new Error("No opportunity/policy source URL for this grantmaker");
    err.statusCode = 400;
    throw err;
  }

  if (!forceRefresh) {
    const fresh = readOpsCache(funder.id);
    if (fresh) return { ...fresh, cached: true, stale: false };
    const stale = readOpsCacheFile(funder.id);
    if (stale) {
      // Keep counts/sort durable and respond immediately; refresh quietly.
      upsertOpenIndexEntry(stale);
      scheduleBackgroundRefresh(openai, funder.id);
      return { ...stale, cached: true, stale: true };
    }
  }

  const crawl = await crawlFunderPages(funder);

  if (!crawl.pages.length) {
    const payload = {
      funderId: funder.id,
      grantmaker: funder.name,
      opportunitySourceUrl: funder.opportunitySourceUrl,
      applicationAccess: funder.applicationAccess,
      fundingFocus: funder.fundingFocus,
      fundingGeography: funder.fundingGeography,
      accessSummary: funder.applicationAccess || "",
      notes: "Could not retrieve live opportunity pages (blocked or unreachable).",
      opportunities: [],
      relatedLinks: [],
      crawledUrls: [],
      extractionMode: "blocked",
      contentHash: null,
      pageStatus: crawl.pageStatus || 0,
      finalUrl: funder.opportunitySourceUrl,
      blocked: true,
      fetchedAt: new Date().toISOString(),
    };
    writeOpsCache(payload);
    return { ...payload, cached: false };
  }

  const combinedText = crawl.pages
    .map((p) => `URL: ${p.finalUrl}\n${stripHtml(p.html).slice(0, 6000)}`)
    .join("\n\n---\n\n")
    .slice(0, 24000);

  const contentHash = crypto.createHash("sha256").update(combinedText.slice(0, 10000)).digest("hex").slice(0, 16);
  const crawledUrls = crawl.pages.map((p) => p.finalUrl);

  let extracted = null;
  let extractionMode = "crawl-heuristic";
  try {
    extracted = await extractWithAi(openai, funder, combinedText, crawl.links, crawledUrls);
    if (extracted) extractionMode = "crawl-ai";
  } catch (err) {
    console.warn("[philanthropic-ops] AI extract failed:", err?.message || err);
  }

  const nextOps = opportunitiesFromNextData(funder, crawl.pages);
  const cardOps = heuristicCardsFromPages(funder, crawl.pages);
  const aiOps = extracted?.opportunities || [];
  let opportunities = dedupeOpportunities([...nextOps, ...aiOps, ...cardOps]).filter(
    (o) => !isLowQualityOpp(o),
  );

  if (nextOps.length) extractionMode = "crawl-next+ai";
  else if (aiOps.length) extractionMode = "crawl-ai";
  else if (cardOps.length) extractionMode = "crawl-heuristic";

  // Do NOT invent redirect/hub rows when nothing open is listed — empty is correct.

  const payload = {
    funderId: funder.id,
    grantmaker: funder.name,
    opportunitySourceUrl: funder.opportunitySourceUrl,
    applicationAccess: funder.applicationAccess,
    fundingFocus: funder.fundingFocus,
    fundingGeography: funder.fundingGeography,
    accessSummary: extracted?.accessSummary || funder.applicationAccess || "",
    notes: extracted?.notes || "",
    opportunities,
    relatedLinks: crawl.links.slice(0, 15).map((l) => ({ label: l.label, url: l.url })),
    crawledUrls,
    extractionMode,
    contentHash,
    pageStatus: crawl.pageStatus,
    finalUrl: crawl.finalUrl,
    blocked: false,
    fetchedAt: new Date().toISOString(),
  };
  writeOpsCache(payload);
  return { ...payload, cached: false };
}

/**
 * Map funderId -> { openGrantCount, checked, fetchedAt } from durable index.
 * Falls back to rebuilding from ops-cache files once if the index file is missing.
 */
export function loadOpenGrantIndex() {
  let doc = readDurableOpenIndex();
  if (!doc || !Object.keys(doc.funders || {}).length) {
    doc = rebuildOpenIndexFromOpsCache();
  }
  const index = {};
  for (const [id, entry] of Object.entries(doc.funders || {})) {
    if (!entry || !entry.checked) continue;
    index[String(id).toUpperCase()] = {
      openGrantCount: Number(entry.openGrantCount) || 0,
      checked: true,
      fetchedAt: entry.fetchedAt || null,
      blocked: !!entry.blocked,
    };
  }
  return index;
}

function accessPriority(access) {
  const a = String(access || "").toLowerCase();
  if (/public calls|open application|loi and public|public competitions/.test(a)) return 0;
  if (/mixed/.test(a)) return 1;
  if (/loi|program-specific|inquiry|registration|scholarship|partner-led|selection-led/.test(a)) return 2;
  if (/needs policy verification/.test(a)) return 3;
  if (/invitation/.test(a)) return 4;
  return 3;
}

function sortGrantmakersForDesk(list, openIndex = {}) {
  return [...list].sort((a, b) => {
    const ia = openIndex[String(a.id || "").toUpperCase()] || {};
    const ib = openIndex[String(b.id || "").toUpperCase()] || {};
    const ca = Number(ia.openGrantCount) || 0;
    const cb = Number(ib.openGrantCount) || 0;
    const aOpen = ca > 0 ? 1 : 0;
    const bOpen = cb > 0 ? 1 : 0;
    if (aOpen !== bOpen) return bOpen - aOpen;
    if (ca !== cb) return cb - ca;
    const pa = accessPriority(a.applicationAccess);
    const pb = accessPriority(b.applicationAccess);
    if (pa !== pb) return pa - pb;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

function enrichGrantmakers(list, openIndex = {}) {
  return list.map((g) => {
    const stats = openIndex[String(g.id || "").toUpperCase()] || {};
    return {
      ...g,
      openGrantCount: Number(stats.openGrantCount) || 0,
      openChecked: !!stats.checked,
      openFetchedAt: stats.fetchedAt || null,
    };
  });
}

export function registerPhilanthropicGrantmakersRoutes(app, openai) {
  app.get("/grants/philanthropic/directory", (req, res) => {
    try {
      const dir = loadUsGrantmakersDirectory();
      const q = String(req.query.q || "").trim().toLowerCase();
      let list = dir.grantmakers;
      if (q) {
        list = list.filter((g) => {
          const blob = `${g.name} ${g.segment} ${g.fundingFocus} ${g.fundingGeography} ${g.applicationAccess}`.toLowerCase();
          return blob.includes(q);
        });
      }
      const openIndex = loadOpenGrantIndex();
      const enriched = enrichGrantmakers(list, openIndex);
      const sorted = sortGrantmakersForDesk(enriched, openIndex);
      const withOpen = sorted.filter((g) => (g.openGrantCount || 0) > 0).length;
      const checkedCount = sorted.filter((g) => g.openChecked).length;
      return res.json({
        snapshot: dir.snapshot,
        source: dir.source,
        filter: dir.filter,
        count: sorted.length,
        total: dir.count,
        withOpenGrants: withOpen,
        openIndexChecked: checkedCount,
        openIndexUpdatedAt: readDurableOpenIndex()?.updatedAt || null,
        sortedByOpenGrants: true,
        grantmakers: sorted,
      });
    } catch (err) {
      console.error("[philanthropic/directory]", err);
      return res.status(500).json({ error: err.message || "Failed to load directory" });
    }
  });

  app.get("/grants/philanthropic/:id", (req, res) => {
    const funder = findUsGrantmaker(req.params.id);
    if (!funder) return res.status(404).json({ error: "Grantmaker not found" });
    return res.json({ grantmaker: funder });
  });

  app.post("/grants/philanthropic/opportunities", async (req, res) => {
    try {
      const funderId = String(req.body?.funderId || "").trim();
      const forceRefresh = !!req.body?.forceRefresh;
      if (!funderId) return res.status(400).json({ error: "funderId is required" });
      const result = await getOpenOpportunitiesForFunder(openai, { funderId, forceRefresh });
      return res.json(result);
    } catch (err) {
      console.error("[philanthropic/opportunities]", err);
      const status = err.statusCode || 502;
      return res.status(status).json({
        error: err.message || "Failed to load open opportunities",
        code: "philanthropic_ops_failed",
      });
    }
  });
}
