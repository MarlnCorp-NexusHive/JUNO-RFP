/**
 * NSF Award Search API — free, no API key.
 * GET https://api.nsf.gov/services/v1/awards.json
 */

const NSF_URL = "https://api.nsf.gov/services/v1/awards.json";

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

async function searchNsf({ keyword = "", page = 0, limit = 25 } = {}) {
  const offset = Math.max(0, Number(page) || 0) * Math.max(1, Number(limit) || 25);
  const pageSize = Math.min(50, Math.max(1, Number(limit) || 25));
  const kw = String(keyword || "").trim() || "research";

  const params = new URLSearchParams({
    keyword: kw,
    offset: String(offset),
    printFields:
      "id,title,agency,awardeeName,date,startDate,expDate,fundsObligatedAmt,piFirstName,piLastName,abstractText,fundProgramName,awardeeCity,awardeeStateCode,estimatedTotalAmt",
  });

  const res = await fetch(`${NSF_URL}?${params}`, {
    headers: { Accept: "application/json" },
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`NSF Award Search returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    throw new Error(json?.message || `NSF Award Search HTTP ${res.status}`);
  }

  const response = json.response || json;
  const rows = Array.isArray(response.award)
    ? response.award
    : Array.isArray(response.awards)
      ? response.awards
      : [];

  const results = rows.slice(0, pageSize).map((a, i) => {
    const amount = a.fundsObligatedAmt != null
      ? Number(a.fundsObligatedAmt)
      : a.estimatedTotalAmt != null
        ? Number(a.estimatedTotalAmt)
        : null;
    const pi = [a.piFirstName, a.piLastName].filter(Boolean).join(" ");
    return {
      id: String(a.id || `nsf-${offset + i}`),
      title: a.title || "NSF award",
      number: String(a.id || ""),
      agency: a.agency || "NSF",
      organization: a.awardeeName || "",
      pi,
      amount: Number.isFinite(amount) ? amount : null,
      amountLabel: moneyLabel(amount),
      deadline: a.expDate || null,
      status: a.fundProgramName || "Award",
      summary: a.abstractText
        ? String(a.abstractText).slice(0, 600)
        : [a.awardeeName, a.awardeeCity, a.awardeeStateCode].filter(Boolean).join(", "),
      description: a.abstractText || "",
      startDate: a.startDate || a.date || "",
      endDate: a.expDate || "",
      source: "NSF Award Search",
      url: a.id
        ? `https://www.nsf.gov/awardsearch/showAward?AWD_ID=${encodeURIComponent(String(a.id))}`
        : "https://www.nsf.gov/funding/award-search",
    };
  });

  return {
    source: "NSF Award Search",
    sourceDetail: "NSF-funded research awards (live)",
    hitCount: results.length < pageSize ? offset + results.length : offset + results.length + 1,
    page: Math.max(0, Number(page) || 0),
    pageSize,
    hasMore: results.length >= pageSize,
    results,
  };
}

export function registerNsfAwardsRoutes(app) {
  app.post("/grants/nsf/search", async (req, res) => {
    try {
      const { keyword = "", page = 0, rows = 25 } = req.body || {};
      const payload = await searchNsf({
        keyword: String(keyword || "").trim(),
        page,
        limit: rows,
      });
      return res.json({
        fetchedAt: new Date().toISOString(),
        live: true,
        ...payload,
      });
    } catch (err) {
      console.error("[grants/nsf/search]", err);
      return res.status(502).json({
        error: err.message || "Failed to search NSF awards",
        code: "nsf_search_failed",
      });
    }
  });
}
