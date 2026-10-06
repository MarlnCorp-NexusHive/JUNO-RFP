/**
 * NIH RePORTER — funded research projects. Free, no API key.
 * POST https://api.reporter.nih.gov/v2/projects/search
 */

const NIH_URL = "https://api.reporter.nih.gov/v2/projects/search";

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

async function searchNih({ keyword = "", agency = "", page = 0, limit = 25 } = {}) {
  const offset = Math.max(0, Number(page) || 0) * Math.max(1, Number(limit) || 25);
  const pageSize = Math.min(50, Math.max(1, Number(limit) || 25));
  const kw = String(keyword || "").trim();
  const ag = String(agency || "").trim();

  const criteria = {};
  if (kw) {
    criteria.advanced_text_search = {
      operator: "and",
      search_field: "projecttitle,terms,abstracttext",
      search_text: kw,
    };
  }
  if (ag) {
    criteria.agencies = [ag.toUpperCase()];
  }

  const body = {
    criteria,
    offset,
    limit: pageSize,
    sort_field: "project_start_date",
    sort_order: "desc",
  };

  const res = await fetch(NIH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`NIH RePORTER returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    throw new Error(json?.error || json?.message || `NIH RePORTER HTTP ${res.status}`);
  }

  const rows = Array.isArray(json.results) ? json.results : [];
  const results = rows.map((p, i) => {
    const amount = p.award_amount != null ? Number(p.award_amount) : null;
    const applId = p.appl_id || p.project_num || `nih-${offset + i}`;
    return {
      id: String(applId),
      title: p.project_title || "NIH project",
      number: String(p.project_num || p.core_project_num || ""),
      agency: (Array.isArray(p.agency_ic_fundings) && p.agency_ic_fundings[0]?.agency)
        || p.agency_code
        || "NIH",
      organization: p.organization?.org_name || "",
      pi: Array.isArray(p.principal_investigators)
        ? p.principal_investigators.map((x) => x.full_name).filter(Boolean).join(", ")
        : "",
      amount: Number.isFinite(amount) ? amount : null,
      amountLabel: moneyLabel(amount),
      deadline: p.project_end_date || null,
      status: p.award_type || p.activity_code || "Award",
      summary: p.abstract_text
        ? String(p.abstract_text).slice(0, 600)
        : [p.organization?.org_name, p.phr_text].filter(Boolean).join(" — "),
      description: p.abstract_text || "",
      startDate: p.project_start_date || "",
      endDate: p.project_end_date || "",
      source: "NIH RePORTER",
      url: p.project_num
        ? `https://reporter.nih.gov/project-details/${encodeURIComponent(String(p.project_num))}`
        : "https://reporter.nih.gov/",
    };
  });

  const hitCount = Number(json.meta?.total) || Number(json.total) || results.length + offset;

  return {
    source: "NIH RePORTER",
    sourceDetail: "Funded NIH research projects (live)",
    hitCount,
    page: Math.max(0, Number(page) || 0),
    pageSize,
    hasMore: offset + results.length < hitCount,
    results,
  };
}

export function registerNihReporterRoutes(app) {
  app.post("/grants/nih/search", async (req, res) => {
    try {
      const { keyword = "", agency = "", page = 0, rows = 25 } = req.body || {};
      const payload = await searchNih({
        keyword: String(keyword || "").trim(),
        agency: String(agency || "").trim(),
        page,
        limit: rows,
      });
      return res.json({
        fetchedAt: new Date().toISOString(),
        live: true,
        ...payload,
      });
    } catch (err) {
      console.error("[grants/nih/search]", err);
      return res.status(502).json({
        error: err.message || "Failed to search NIH RePORTER",
        code: "nih_search_failed",
      });
    }
  });
}
