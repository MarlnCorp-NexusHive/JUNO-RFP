/**
 * Live private-foundation (ProPublica) + state/local-eligible (Grants.gov) grant feeds.
 * No API keys required.
 */

const GRANTS_GOV_BASE = "https://api.grants.gov/v1/api";
const PROPUBLICA_BASE = "https://projects.propublica.org/nonprofits/api/v2";

/** State / local government eligibilities on Grants.gov */
const LOCAL_ELIGIBILITIES = "00|01|02|04|05|08";

const NTEE_FOCUS = {
  arts: "1",
  education: "2",
  environment: "3",
  health: "4",
  "human services": "5",
  international: "6",
  philanthropy: "7",
  "public benefit": "7",
  "civic tech": "7",
  "digital equity": "7",
  religion: "8",
};

const US_STATES = new Set(
  "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC PR VI GU AS MP"
    .split(/\s+/),
);

async function postGrantsGov(path, body) {
  const res = await fetch(`${GRANTS_GOV_BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body || {}),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Grants.gov returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    throw new Error(json?.msg || json?.error || `Grants.gov HTTP ${res.status}`);
  }
  if (json.errorcode != null && Number(json.errorcode) !== 0) {
    throw new Error(json.msg || `Grants.gov error ${json.errorcode}`);
  }
  return json;
}

function mapOppStatus(oppStatus) {
  const s = String(oppStatus || "").toLowerCase();
  if (s === "posted") return "Open";
  if (s === "forecasted") return "Forecasted";
  if (s === "closed" || s === "archived") return "Closed";
  return oppStatus || "Open";
}

function parseUsDate(value) {
  if (!value) return null;
  const m = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const iso = `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
    return Number.isFinite(Date.parse(iso)) ? iso : null;
  }
  const t = Date.parse(value);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString().slice(0, 10);
}

const SIZE_BUCKETS = {
  under1m: { min: 0, max: 1_000_000, label: "Under $1M assets" },
  "1m10m": { min: 1_000_000, max: 10_000_000, label: "$1M–$10M assets" },
  "10m100m": { min: 10_000_000, max: 100_000_000, label: "$10M–$100M assets" },
  "100m1b": { min: 100_000_000, max: 1_000_000_000, label: "$100M–$1B assets" },
  "1bplus": { min: 1_000_000_000, max: Number.POSITIVE_INFINITY, label: "$1B+ assets" },
};

function formatCompactUsd(n) {
  if (n == null || !Number.isFinite(Number(n))) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: Number(n) >= 1_000_000 ? "compact" : "standard",
  }).format(Number(n));
}

async function mapPool(items, concurrency, fn) {
  const out = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const idx = next++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  const n = Math.min(Math.max(concurrency, 1), Math.max(items.length, 1));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return out;
}

async function fetchProPublicaOrg(einDigits) {
  if (!einDigits) return null;
  try {
    const res = await fetch(`${PROPUBLICA_BASE}/organizations/${einDigits}.json`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.organization || null;
  } catch {
    return null;
  }
}

async function searchProPublicaPages({ q, state, ntee, pages }) {
  const all = [];
  let total = 0;
  let numPages = 1;
  for (let page = 0; page < pages; page += 1) {
    const params = new URLSearchParams();
    params.set("q", q);
    params.set("page", String(page));
    if (state) params.set("state[id]", state);
    if (ntee) params.set("ntee[id]", ntee);

    const res = await fetch(`${PROPUBLICA_BASE}/search.json?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`ProPublica Nonprofit Explorer HTTP ${res.status}`);
    }
    const data = await res.json();
    total = Number(data.total_results) || total;
    numPages = Number(data.num_pages) || numPages;
    const orgs = Array.isArray(data.organizations) ? data.organizations : [];
    all.push(...orgs);
    if (orgs.length === 0 || page + 1 >= numPages) break;
  }
  return { organizations: all, total_results: total, num_pages: numPages };
}

function matchesSizeBucket(assets, bucketKey) {
  if (!bucketKey) return true;
  const bucket = SIZE_BUCKETS[bucketKey];
  if (!bucket) return true;
  if (assets == null || !Number.isFinite(Number(assets))) return false;
  const n = Number(assets);
  return n >= bucket.min && n < bucket.max;
}

function extractStateCode(geography = "") {
  const raw = String(geography || "").trim().toUpperCase();
  if (US_STATES.has(raw)) return raw;
  const m = raw.match(/\b([A-Z]{2})\b/);
  if (m && US_STATES.has(m[1])) return m[1];
  return "";
}

function nteeLabel(code) {
  if (!code) return [];
  const major = String(code).charAt(0).toUpperCase();
  const map = {
    A: "Arts",
    B: "Education",
    C: "Environment",
    D: "Animals",
    E: "Health",
    F: "Mental health",
    G: "Disease",
    H: "Medical research",
    I: "Crime & legal",
    J: "Employment",
    K: "Food & agriculture",
    L: "Housing",
    M: "Public safety",
    N: "Recreation",
    O: "Youth development",
    P: "Human services",
    Q: "International",
    R: "Civil rights",
    S: "Community improvement",
    T: "Philanthropy",
    U: "Science & tech",
    V: "Social science",
    W: "Public benefit",
    X: "Religion",
    Y: "Mutual benefit",
    Z: "Unknown",
  };
  return map[major] ? [map[major]] : [];
}

async function searchLocalGrants({ keyword, geography, status, focus, rows, page = 0 }) {
  const statusMap = {
    Open: "posted",
    Forecasted: "forecasted",
    Closed: "closed",
  };
  const oppStatuses = statusMap[status] || "posted|forecasted";
  const pageSize = Math.min(Math.max(Number(rows) || 25, 1), 100);
  const pageIndex = Math.max(Number(page) || 0, 0);

  const parts = [];
  if (keyword) parts.push(keyword);
  if (geography) parts.push(geography);
  if (focus) parts.push(focus);
  const searchKeyword = parts.join(" ").trim();

  const raw = await postGrantsGov("search2", {
    keyword: searchKeyword,
    oppStatuses,
    rows: pageSize,
    startRecordNum: pageIndex * pageSize,
    eligibilities: LOCAL_ELIGIBILITIES,
    agencies: "",
    fundingCategories: "",
    fundingInstruments: "",
    aln: "",
    oppNum: "",
    sortBy: "",
  });

  const data = raw.data || {};
  const hits = Array.isArray(data.oppHits) ? data.oppHits : [];
  const hitCount = Number(data.hitCount) || hits.length;

  const results = hits.map((hit) => {
    const closeDate = parseUsDate(hit.closeDate) || hit.closeDate || null;
    const openDate = parseUsDate(hit.openDate) || hit.openDate || null;
    return {
      id: `gg-local-${hit.id}`,
      sourceType: "local",
      source: "Grants.gov",
      title: hit.title || "Untitled opportunity",
      funder: hit.agency || hit.agencyCode || "Federal agency",
      program: hit.number || hit.agencyCode || "Grants.gov opportunity",
      geography: geography || "United States (state & local eligible)",
      focusAreas: focus ? [focus] : ["State & local eligible"],
      applicantTypes: [
        "State governments",
        "County governments",
        "City / township governments",
        "Special districts",
        "School districts",
        "Public housing authorities",
      ],
      status: mapOppStatus(hit.oppStatus),
      postedDate: openDate,
      closeDate,
      awardMin: null,
      awardMax: null,
      awardLabel: null,
      description: `${hit.title || "Opportunity"} (${hit.number || hit.id}) — live from Grants.gov. Open the opportunity page for full NOFO, amounts, and eligibility detail.`,
      eligibility:
        "Listed as eligible for state, county, city/township, special district, school district, and/or public housing authorities on Grants.gov. Confirm current eligibility in the published NOFO.",
      url: hit.id
        ? `https://www.grants.gov/search-results-detail/${hit.id}`
        : "https://www.grants.gov/",
      keywords: [hit.agencyCode, hit.number, ...(Array.isArray(hit.cfdaList) ? hit.cfdaList : [])].filter(
        Boolean,
      ),
      liveMeta: {
        opportunityId: String(hit.id ?? ""),
        oppStatus: hit.oppStatus || "",
        agencyCode: hit.agencyCode || "",
      },
    };
  });

  return {
    source: "Grants.gov",
    sourceDetail: "State & local eligible opportunities (live)",
    hitCount,
    page: pageIndex,
    pageSize,
    hasMore: (pageIndex + 1) * pageSize < hitCount,
    results,
  };
}

async function searchPrivateFunders({
  keyword,
  geography,
  focus,
  rows,
  page = 0,
  sizeBucket = "",
  sortBy = "relevance",
}) {
  const state = extractStateCode(geography);
  const focusKey = String(focus || "")
    .trim()
    .toLowerCase();
  const ntee = NTEE_FOCUS[focusKey] || "";
  const pageSize = Math.min(Math.max(Number(rows) || 25, 1), 50);
  const pageIndex = Math.max(Number(page) || 0, 0);
  const bucket = String(sizeBucket || "").trim();
  const sort = String(sortBy || "relevance").trim();
  const needsEnrichPool = Boolean(bucket) || sort === "assets_desc" || sort === "assets_asc" || sort === "revenue_desc";
  const largeSizeFocus = bucket === "100m1b" || bucket === "1bplus" || sort === "assets_desc" || sort === "revenue_desc";

  let q = String(keyword || "").trim();
  if (!q && focusKey) q = focusKey;
  if (!q) q = "foundation";
  if (!/\bfoundation\b/i.test(q) && !/\bgrant\b/i.test(q)) {
    q = `${q} foundation`;
  }

  // Pull enough candidates to filter/sort meaningfully (ProPublica is 25/page).
  const pagesToFetch = needsEnrichPool ? (largeSizeFocus ? 6 : 4) : Math.min(pageIndex + 1, 8);
  const search = await searchProPublicaPages({ q, state, ntee, pages: pagesToFetch });
  const byEin = new Map();
  for (const org of search.organizations) {
    const einDigits = String(org.ein || "").replace(/\D/g, "");
    if (einDigits) byEin.set(einDigits, org);
  }

  // Generic "foundation" ranking buries mega-funders; seed them when sorting/filtering by size.
  if (largeSizeFocus && (!keyword || /^foundation$/i.test(String(keyword).trim()))) {
    const megaQueries = [
      '"Ford Foundation"',
      '"Bill & Melinda Gates Foundation"',
      '"John D. and Catherine T. MacArthur Foundation"',
      '"Rockefeller Foundation"',
      '"Andrew W. Mellon Foundation"',
      '"Walton Family Foundation"',
      '"Lilly Endowment"',
      '"Robert Wood Johnson Foundation"',
      '"William and Flora Hewlett Foundation"',
      '"David and Lucile Packard Foundation"',
      '"Open Society Foundations"',
      '"Bloomberg Philanthropies"',
    ];
    await Promise.all(
      megaQueries.map(async (mq) => {
        try {
          const extra = await searchProPublicaPages({ q: mq, state, ntee: "", pages: 1 });
          for (const org of extra.organizations) {
            const einDigits = String(org.ein || "").replace(/\D/g, "");
            if (einDigits && !byEin.has(einDigits)) byEin.set(einDigits, org);
          }
        } catch {
          /* ignore supplemental miss */
        }
      }),
    );
  }

  let candidates = [...byEin.values()];

  // When only paging relevance results, take the requested page slice before enrich.
  if (!needsEnrichPool) {
    const start = pageIndex * pageSize;
    // Re-fetch exact page from original ranking rather than deduped map order.
    const paged = await searchProPublicaPages({ q, state, ntee, pages: pageIndex + 1 });
    candidates = paged.organizations.slice(start, start + pageSize);
  }

  const enriched = await mapPool(candidates, 8, async (org) => {
    const einDigits = String(org.ein || "").replace(/\D/g, "");
    const detail = await fetchProPublicaOrg(einDigits);
    const assets =
      detail?.asset_amount != null && Number.isFinite(Number(detail.asset_amount))
        ? Number(detail.asset_amount)
        : null;
    const revenue =
      detail?.revenue_amount != null && Number.isFinite(Number(detail.revenue_amount))
        ? Number(detail.revenue_amount)
        : detail?.income_amount != null && Number.isFinite(Number(detail.income_amount))
          ? Number(detail.income_amount)
          : null;
    const city = detail?.city || org.city;
    const st = detail?.state || org.state;
    const name = detail?.name || org.name || org.sub_name || "Private foundation";
    const cityState = [city, st].filter(Boolean).join(", ");
    const focusAreas = nteeLabel(detail?.ntee_code || org.ntee_code || org.raw_ntee_code);
    if (focus && !focusAreas.includes(focus)) focusAreas.push(focus);
    const assetsLabel = formatCompactUsd(assets);
    const revenueLabel = formatCompactUsd(revenue);

    return {
      id: `pp-priv-${einDigits || org.ein}`,
      sourceType: "private",
      source: "ProPublica Nonprofit Explorer",
      title: name,
      funder: name,
      program: "Private / philanthropic funder (IRS registry)",
      geography: cityState || geography || "United States",
      focusAreas: focusAreas.length ? focusAreas : ["Philanthropy"],
      applicantTypes: ["Nonprofits", "Fiscal sponsors", "Higher education (varies by funder)"],
      status: "Open",
      postedDate: null,
      closeDate: null,
      awardMin: null,
      awardMax: assets,
      awardLabel: assetsLabel
        ? `Assets ${assetsLabel}${revenueLabel ? ` · revenue ${revenueLabel}` : ""}`
        : "Assets not reported",
      assets,
      revenue,
      description: `${name} is an active US tax-exempt organization in the IRS Business Master File (via ProPublica Nonprofit Explorer). Asset figures are from the latest IRS extract — confirm current grant programs, typical award sizes, and deadlines on the foundation’s own site.`,
      eligibility:
        "Private foundations set their own eligibility and award sizes. Confirm open RFPs, LOI windows, and applicant types on the funder’s website before applying.",
      url: einDigits
        ? `https://projects.propublica.org/nonprofits/organizations/${einDigits}`
        : "https://projects.propublica.org/nonprofits/",
      keywords: [name, city, st, org.ntee_code, org.strein || einDigits].filter(Boolean),
      liveMeta: {
        ein: org.strein || einDigits,
        ntee: detail?.ntee_code || org.ntee_code || org.raw_ntee_code || "",
        state: st || "",
        assets,
        revenue,
      },
    };
  });

  let filtered = enriched.filter((row) => matchesSizeBucket(row.assets, bucket));

  if (sort === "assets_desc") {
    filtered.sort((a, b) => (b.assets ?? -1) - (a.assets ?? -1));
  } else if (sort === "assets_asc") {
    filtered.sort((a, b) => (a.assets ?? Number.POSITIVE_INFINITY) - (b.assets ?? Number.POSITIVE_INFINITY));
  } else if (sort === "revenue_desc") {
    filtered.sort((a, b) => (b.revenue ?? -1) - (a.revenue ?? -1));
  }

  const totalFiltered = needsEnrichPool ? filtered.length : Number(search.total_results) || filtered.length;
  const start = needsEnrichPool ? pageIndex * pageSize : 0;
  const results = needsEnrichPool ? filtered.slice(start, start + pageSize) : filtered;
  const enrichedPool = needsEnrichPool ? filtered.length : null;

  return {
    source: "ProPublica Nonprofit Explorer",
    sourceDetail: "US private foundations & philanthropic orgs (live IRS registry)",
    hitCount: Number(search.total_results) || totalFiltered,
    filteredCount: needsEnrichPool ? totalFiltered : null,
    enrichedPoolSize: enrichedPool,
    page: pageIndex,
    pageSize,
    hasMore: needsEnrichPool
      ? start + pageSize < totalFiltered
      : (pageIndex + 1) * pageSize < (Number(search.total_results) || 0),
    sizeBucket: bucket || null,
    sortBy: sort,
    results,
  };
}


export function registerAltGrantsRoutes(app) {
  app.post("/grants/alt/search", async (req, res) => {
    try {
      const {
        variant = "local",
        keyword = "",
        geography = "",
        status = "",
        focus = "",
        rows = 25,
        page = 0,
        sizeBucket = "",
        sortBy = "relevance",
      } = req.body || {};

      const params = {
        keyword: String(keyword || "").trim(),
        geography: String(geography || "").trim(),
        status: String(status || "").trim(),
        focus: String(focus || "").trim(),
        rows,
        page,
        sizeBucket: String(sizeBucket || "").trim(),
        sortBy: String(sortBy || "relevance").trim(),
      };

      const payload =
        variant === "private"
          ? await searchPrivateFunders(params)
          : await searchLocalGrants(params);

      return res.json({
        variant: variant === "private" ? "private" : "local",
        fetchedAt: new Date().toISOString(),
        live: true,
        ...payload,
      });
    } catch (err) {
      console.error("[grants/alt/search]", err);
      return res.status(502).json({
        error: err.message || "Failed to search alternate grants",
        code: "alt_grants_search_failed",
      });
    }
  });

  console.log("Alt grants API: POST /grants/alt/search (private + local live)");
}
