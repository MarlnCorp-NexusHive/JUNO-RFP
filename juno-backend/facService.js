/**
 * Federal Audit Clearinghouse (FAC) — public API. Free, no API key.
 * https://api.fac.gov/
 */

const FAC_BASE = "https://api.fac.gov";

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

async function searchFacApi({ keyword, page, limit }) {
  const pageIndex = Math.max(0, Number(page) || 0);
  const pageSize = Math.min(50, Math.max(1, Number(limit) || 25));
  const kw = String(keyword || "").trim();

  // FAC PostgREST-style endpoints; general_search is the public search surface.
  const params = new URLSearchParams({
    limit: String(pageSize),
    offset: String(pageIndex * pageSize),
  });
  if (kw) {
    params.set("or", `(auditee_name.ilike.*${kw}*,audit_year.eq.${kw})`);
  }

  const url = `${FAC_BASE}/general?${params}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      // FAC may require Prefer for exact counts; keep simple for public access
    },
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : [];
  } catch {
    throw new Error(`FAC returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    const msg = json?.message || json?.error || `FAC HTTP ${res.status}`;
    throw new Error(msg);
  }

  const rows = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
  if (!rows.length && !kw) {
    // Empty unfiltered may mean auth/gateway change — treat as failure so we can fall back
    throw new Error("FAC returned no rows");
  }

  const results = rows.map((r, i) => {
    const name = r.auditee_name || r.auditeeName || "Auditee";
    const year = r.audit_year || r.auditYear || "";
    const uei = r.auditee_uei || r.uei || "";
    const reportId = r.report_id || r.reportId || `${uei}-${year}` || `fac-${pageIndex}-${i}`;
    const amount =
      r.total_amount_expended != null
        ? Number(r.total_amount_expended)
        : r.total_federal_expenditures != null
          ? Number(r.total_federal_expenditures)
          : null;
    return {
      id: String(reportId),
      title: `${name}${year ? ` — FY${year} Single Audit` : " — Single Audit"}`,
      number: String(reportId),
      agency: r.cognizant_agency || r.oversight_agency || "FAC",
      organization: name,
      amount: Number.isFinite(amount) ? amount : null,
      amountLabel: moneyLabel(amount),
      deadline: year ? `${year}-12-31` : null,
      status: r.is_public === false ? "Restricted" : "Public",
      summary: [
        uei ? `UEI: ${uei}` : null,
        year ? `Audit year: ${year}` : null,
        r.auditee_state ? `State: ${r.auditee_state}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      description: `Federal Audit Clearinghouse submission for ${name}.`,
      source: "Federal Audit Clearinghouse",
      url: reportId
        ? `https://app.fac.gov/dissemination/summary/${encodeURIComponent(String(reportId))}`
        : "https://www.fac.gov/",
    };
  });

  return {
    source: "Federal Audit Clearinghouse",
    sourceDetail: "Public Single Audit submissions (live)",
    hitCount: results.length < pageSize ? pageIndex * pageSize + results.length : (pageIndex + 1) * pageSize + 1,
    page: pageIndex,
    pageSize,
    hasMore: results.length >= pageSize,
    results,
  };
}

/** Offline-friendly curated slice so the FAC tab always returns searchable results. */
const FAC_EXCERPT = [
  {
    id: "fac-ex-stanford-2023",
    title: "Leland Stanford Junior University — FY2023 Single Audit",
    number: "fac-ex-stanford-2023",
    agency: "HHS",
    organization: "Leland Stanford Junior University",
    amount: 1200000000,
    amountLabel: "$1,200,000,000",
    deadline: "2023-12-31",
    status: "Public",
    summary: "UEI: example · Audit year: 2023 · State: CA",
    description: "Illustrative FAC-style record for demonstration when the live API is gated.",
    source: "Federal Audit Clearinghouse (excerpt)",
    url: "https://www.fac.gov/",
  },
  {
    id: "fac-ex-city-la-2023",
    title: "City of Los Angeles — FY2023 Single Audit",
    number: "fac-ex-city-la-2023",
    agency: "HUD",
    organization: "City of Los Angeles",
    amount: 890000000,
    amountLabel: "$890,000,000",
    deadline: "2023-12-31",
    status: "Public",
    summary: "UEI: example · Audit year: 2023 · State: CA",
    description: "Illustrative municipal Single Audit for due-diligence workflows.",
    source: "Federal Audit Clearinghouse (excerpt)",
    url: "https://www.fac.gov/",
  },
  {
    id: "fac-ex-mit-2022",
    title: "Massachusetts Institute of Technology — FY2022 Single Audit",
    number: "fac-ex-mit-2022",
    agency: "NSF",
    organization: "Massachusetts Institute of Technology",
    amount: 750000000,
    amountLabel: "$750,000,000",
    deadline: "2022-12-31",
    status: "Public",
    summary: "UEI: example · Audit year: 2022 · State: MA",
    description: "Illustrative research university Single Audit submission.",
    source: "Federal Audit Clearinghouse (excerpt)",
    url: "https://www.fac.gov/",
  },
  {
    id: "fac-ex-united-way-2023",
    title: "United Way Worldwide — FY2023 Single Audit",
    number: "fac-ex-united-way-2023",
    agency: "HHS",
    organization: "United Way Worldwide",
    amount: 45000000,
    amountLabel: "$45,000,000",
    deadline: "2023-12-31",
    status: "Public",
    summary: "UEI: example · Audit year: 2023 · State: VA",
    description: "Illustrative nonprofit Single Audit for funder due diligence.",
    source: "Federal Audit Clearinghouse (excerpt)",
    url: "https://www.fac.gov/",
  },
  {
    id: "fac-ex-state-tx-2023",
    title: "State of Texas — FY2023 Single Audit",
    number: "fac-ex-state-tx-2023",
    agency: "HHS",
    organization: "State of Texas",
    amount: 5000000000,
    amountLabel: "$5,000,000,000",
    deadline: "2023-12-31",
    status: "Public",
    summary: "UEI: example · Audit year: 2023 · State: TX",
    description: "Illustrative statewide Single Audit submission.",
    source: "Federal Audit Clearinghouse (excerpt)",
    url: "https://www.fac.gov/",
  },
];

function searchFacExcerpt({ keyword, page, limit }) {
  const kw = String(keyword || "").trim().toLowerCase();
  const pageIndex = Math.max(0, Number(page) || 0);
  const pageSize = Math.min(50, Math.max(1, Number(limit) || 25));
  let pool = FAC_EXCERPT.slice();
  if (kw) {
    pool = pool.filter((r) =>
      [r.title, r.organization, r.agency, r.summary].join(" ").toLowerCase().includes(kw),
    );
  }
  const start = pageIndex * pageSize;
  const results = pool.slice(start, start + pageSize);
  return {
    source: "Federal Audit Clearinghouse (excerpt)",
    sourceDetail: "Searchable public-style Single Audit excerpt (live API unavailable)",
    live: false,
    hitCount: pool.length,
    page: pageIndex,
    pageSize,
    hasMore: start + pageSize < pool.length,
    results,
  };
}

async function searchFac(params) {
  try {
    const live = await searchFacApi(params);
    if (live.results?.length) return { ...live, live: true };
  } catch (err) {
    console.warn("[fac] live search failed, using excerpt:", err.message);
  }
  return searchFacExcerpt(params);
}

export function registerFacRoutes(app) {
  app.post("/grants/fac/search", async (req, res) => {
    try {
      const { keyword = "", page = 0, rows = 25 } = req.body || {};
      const payload = await searchFac({
        keyword: String(keyword || "").trim(),
        page,
        limit: rows,
      });
      return res.json({
        fetchedAt: new Date().toISOString(),
        live: payload.live !== false,
        ...payload,
      });
    } catch (err) {
      console.error("[grants/fac/search]", err);
      return res.status(502).json({
        error: err.message || "Failed to search FAC",
        code: "fac_search_failed",
      });
    }
  });
}
