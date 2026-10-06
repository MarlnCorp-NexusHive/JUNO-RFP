/**
 * California Grants Portal via data.ca.gov CKAN DataStore. Free, no API key.
 */

const DATASTORE_URL = "https://data.ca.gov/api/3/action/datastore_search";
/** Daily-updated Grants Offered resource */
const RESOURCE_ID = "111c8c88-21f6-453c-ae2c-b4785a0624f5";

function pick(row, keys) {
  for (const k of keys) {
    if (row[k] != null && String(row[k]).trim()) return String(row[k]).trim();
  }
  return "";
}

function moneyFromText(text) {
  if (!text) return null;
  const m = String(text).replace(/,/g, "").match(/\$?\s*([\d]+(?:\.\d+)?)\s*([KkMmBb])?/);
  if (!m) return null;
  let n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  const suf = (m[2] || "").toUpperCase();
  if (suf === "K") n *= 1_000;
  if (suf === "M") n *= 1_000_000;
  if (suf === "B") n *= 1_000_000_000;
  return n;
}

function moneyLabel(n) {
  if (n == null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

async function searchCaGrants({ keyword = "", status = "", page = 0, limit = 25 } = {}) {
  const pageIndex = Math.max(0, Number(page) || 0);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 25));
  const kw = String(keyword || "").trim();
  const st = String(status || "").trim();

  const params = new URLSearchParams({
    resource_id: RESOURCE_ID,
    limit: String(pageSize),
    offset: String(pageIndex * pageSize),
  });
  if (kw) params.set("q", kw);
  if (st) {
    params.set("filters", JSON.stringify({ Status: st }));
  }

  const res = await fetch(`${DATASTORE_URL}?${params}`, {
    headers: { Accept: "application/json" },
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`CA Grants Portal returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }
  if (!res.ok || json.success === false) {
    throw new Error(json?.error?.message || `CA Grants Portal HTTP ${res.status}`);
  }

  const result = json.result || {};
  const rows = Array.isArray(result.records) ? result.records : [];
  const total = Number(result.total) || rows.length;

  const results = rows.map((row, i) => {
    const title = pick(row, ["Grant Title", "Title", "grant_title", "title"]);
    const id =
      pick(row, ["Portal ID", "portal_id", "ID", "_id"]) || `ca-${pageIndex}-${i}`;
    const agency = pick(row, ["Agency Dept", "Agency", "Department", "agency"]);
    const close = pick(row, [
      "Applications Due",
      "Close Date",
      "Deadline",
      "Application Deadline",
      "Due Date",
    ]);
    const amtText = pick(row, [
      "Total Estimated Available Funding",
      "Award Amount",
      "Funding Amount",
      "Estimated Funding",
    ]);
    const amount = moneyFromText(amtText);
    const url = pick(row, ["Grant URL", "URL", "Link", "Webpage", "More Information"]);
    const summary = pick(row, ["Purpose", "Description", "Summary", "Grant Purpose"]);
    const statusVal = pick(row, ["Status", "Grant Status", "status"]) || "Active";

    return {
      id: String(id),
      title: title || "California grant",
      number: String(id),
      agency,
      amount,
      amountLabel: moneyLabel(amount) || (amtText || null),
      deadline: close || null,
      status: statusVal,
      summary: summary.slice(0, 600),
      description: summary,
      eligibility: pick(row, ["Applicant Type", "Eligible Applicants", "Eligibility"]),
      category: pick(row, ["Categories", "Category", "Funding Source"]),
      source: "California Grants Portal",
      url: url || "https://www.grants.ca.gov/",
    };
  });

  return {
    source: "California Grants Portal",
    sourceDetail: "State of California open grants data (live via data.ca.gov)",
    hitCount: total,
    page: pageIndex,
    pageSize,
    hasMore: (pageIndex + 1) * pageSize < total,
    results,
  };
}

export function registerCaGrantsRoutes(app) {
  app.post("/grants/ca/search", async (req, res) => {
    try {
      const { keyword = "", status = "", page = 0, rows = 25 } = req.body || {};
      const payload = await searchCaGrants({
        keyword: String(keyword || "").trim(),
        status: String(status || "").trim(),
        page,
        limit: rows,
      });
      return res.json({
        fetchedAt: new Date().toISOString(),
        live: true,
        ...payload,
      });
    } catch (err) {
      console.error("[grants/ca/search]", err);
      return res.status(502).json({
        error: err.message || "Failed to search California Grants Portal",
        code: "ca_grants_search_failed",
      });
    }
  });
}
