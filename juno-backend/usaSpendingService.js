/**
 * USAspending.gov — historical federal awards (grants + contracts). Free, no API key.
 * POST https://api.usaspending.gov/api/v2/search/spending_by_award/
 *
 * Note: award_type_codes may only contain types from ONE group per request
 * (assistance/grants vs contracts). "all" runs both queries and merges.
 */

const USA_BASE = "https://api.usaspending.gov/api/v2";

const GRANT_TYPES = ["02", "03", "04", "05"];
const CONTRACT_TYPES = ["A", "B", "C", "D"];

const FIELDS = [
  "Award ID",
  "Recipient Name",
  "Award Amount",
  "Total Outlays",
  "Description",
  "Start Date",
  "End Date",
  "Awarding Agency",
  "Awarding Sub Agency",
  "Award Type",
  "Contract Award Type",
  "Funding Agency",
  "Last Modified Date",
];

function defaultTimePeriod() {
  const end = new Date();
  const start = new Date();
  start.setFullYear(end.getFullYear() - 3);
  const iso = (d) => d.toISOString().slice(0, 10);
  return [{ start_date: iso(start), end_date: iso(end) }];
}

function money(n) {
  if (n == null || n === "") return null;
  const num = Number(n);
  if (!Number.isFinite(num)) return null;
  return num;
}

function moneyLabel(n) {
  const v = money(n);
  if (v == null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);
}

function mapRows(rows, pageNum) {
  return (Array.isArray(rows) ? rows : []).map((row, i) => {
    const id = String(row["internal_id"] || row["Award ID"] || `usa-${pageNum}-${i}`);
    const amount = money(row["Award Amount"]);
    const endDate = row["End Date"] || row["Last Modified Date"] || null;
    const awardType = row["Award Type"] || row["Contract Award Type"] || "";
    return {
      id,
      title: row["Description"] || row["Recipient Name"] || row["Award ID"] || "Federal award",
      number: String(row["Award ID"] || ""),
      agency: row["Awarding Agency"] || row["Funding Agency"] || "",
      recipient: row["Recipient Name"] || "",
      amount,
      amountLabel: moneyLabel(amount),
      deadline: endDate,
      status: awardType || "Award",
      summary: [
        row["Recipient Name"] ? `Recipient: ${row["Recipient Name"]}` : null,
        row["Awarding Sub Agency"] ? `Sub-agency: ${row["Awarding Sub Agency"]}` : null,
        row["Start Date"] && row["End Date"]
          ? `Period: ${row["Start Date"]} → ${row["End Date"]}`
          : null,
      ]
        .filter(Boolean)
        .join("\n"),
      description: row["Description"] || "",
      startDate: row["Start Date"] || "",
      endDate: row["End Date"] || "",
      source: "USAspending.gov",
      url: row["Award ID"]
        ? `https://www.usaspending.gov/award/${encodeURIComponent(String(row["Award ID"]))}`
        : "https://www.usaspending.gov/",
    };
  });
}

async function queryGroup({ award_type_codes, keyword, page, limit }) {
  const filters = {
    award_type_codes,
    time_period: defaultTimePeriod(),
  };
  if (keyword) filters.keywords = [keyword];

  const res = await fetch(`${USA_BASE}/search/spending_by_award/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      filters,
      fields: FIELDS,
      page,
      limit,
      sort: "Award Amount",
      order: "desc",
    }),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`USAspending returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    const detail = Array.isArray(json?.detail)
      ? json.detail.map((d) => d.msg || d).join("; ")
      : json?.detail || json?.message;
    throw new Error(detail || `USAspending HTTP ${res.status}`);
  }

  const pageMeta = json.page_metadata || {};
  return {
    results: mapRows(json.results, page),
    hitCount: Number(pageMeta.total) || (Array.isArray(json.results) ? json.results.length : 0),
    hasMore: Boolean(pageMeta.hasNext || pageMeta.has_next_page),
  };
}

async function searchUsaSpending({
  keyword = "",
  awardKind = "all",
  page = 1,
  limit = 25,
} = {}) {
  const pageNum = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 25));
  const kw = String(keyword || "").trim();
  const kind = String(awardKind || "all").trim();

  // API forbids mixing assistance and contract type codes in one request.
  if (kind === "grants" || kind === "contracts") {
    const codes = kind === "grants" ? GRANT_TYPES : CONTRACT_TYPES;
    const payload = await queryGroup({
      award_type_codes: codes,
      keyword: kw,
      page: pageNum,
      limit: pageSize,
    });
    return {
      source: "USAspending.gov",
      sourceDetail: "Historical federal grant and contract awards (live)",
      hitCount: payload.hitCount,
      page: pageNum,
      pageSize,
      hasMore: payload.hasMore,
      results: payload.results,
    };
  }

  // "all": fetch both groups for this page, merge by amount desc, take pageSize.
  const half = Math.max(Math.ceil(pageSize / 2), pageSize);
  const [grants, contracts] = await Promise.all([
    queryGroup({
      award_type_codes: GRANT_TYPES,
      keyword: kw,
      page: pageNum,
      limit: half,
    }),
    queryGroup({
      award_type_codes: CONTRACT_TYPES,
      keyword: kw,
      page: pageNum,
      limit: half,
    }),
  ]);

  const merged = [...grants.results, ...contracts.results].sort(
    (a, b) => (b.amount ?? -1) - (a.amount ?? -1),
  );
  const results = merged.slice(0, pageSize);
  const hitCount = (grants.hitCount || 0) + (contracts.hitCount || 0);

  return {
    source: "USAspending.gov",
    sourceDetail: "Historical federal grant and contract awards (live)",
    hitCount,
    page: pageNum,
    pageSize,
    hasMore: grants.hasMore || contracts.hasMore || merged.length > pageSize,
    results,
  };
}

export function registerUsaSpendingRoutes(app) {
  app.post("/grants/usaspending/search", async (req, res) => {
    try {
      const { keyword = "", awardKind = "all", page = 1, rows = 25 } = req.body || {};
      const payload = await searchUsaSpending({
        keyword: String(keyword || "").trim(),
        awardKind: String(awardKind || "all").trim(),
        page,
        limit: rows,
      });
      return res.json({
        fetchedAt: new Date().toISOString(),
        live: true,
        ...payload,
      });
    } catch (err) {
      console.error("[grants/usaspending/search]", err);
      return res.status(502).json({
        error: err.message || "Failed to search USAspending",
        code: "usaspending_search_failed",
      });
    }
  });
}
