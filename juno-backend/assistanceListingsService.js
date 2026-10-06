/**
 * SAM.gov Assistance Listings — curated searchable catalog (no API key required).
 * A listing describes a federal program; it does not mean applications are currently open.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXCERPT_PATH = path.join(__dirname, "data", "assistance-listings-excerpt.json");

function loadListings() {
  const raw = JSON.parse(fs.readFileSync(EXCERPT_PATH, "utf8"));
  return {
    meta: raw,
    listings: Array.isArray(raw.listings) ? raw.listings : [],
  };
}

function searchAssistanceListings({
  keyword = "",
  agency = "",
  status = "Active",
  page = 0,
  limit = 25,
} = {}) {
  const { meta, listings } = loadListings();
  const kw = String(keyword || "").trim().toLowerCase();
  const ag = String(agency || "").trim().toLowerCase();
  const st = String(status || "").trim().toLowerCase();
  const pageIndex = Math.max(0, Number(page) || 0);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 25));

  let pool = listings.map((l) => ({
    id: l.id,
    title: l.title,
    number: l.aln,
    aln: l.aln,
    agency: l.agency,
    agencyCode: l.agencyCode || "",
    status: l.status || "Active",
    assistanceTypes: l.assistanceTypes || [],
    applicantTypes: l.applicantTypes || [],
    summary: l.summary || "",
    description: l.objectives || l.summary || "",
    objectives: l.objectives || "",
    deadline: null,
    amount: null,
    amountLabel: null,
    source: meta.source || "Assistance Listings",
    url: l.url || "https://sam.gov/assistance-listings",
  }));

  if (kw) {
    pool = pool.filter((r) =>
      [r.title, r.number, r.agency, r.agencyCode, r.summary, r.objectives, ...(r.assistanceTypes || [])]
        .join(" ")
        .toLowerCase()
        .includes(kw),
    );
  }
  if (ag) {
    pool = pool.filter(
      (r) =>
        String(r.agency || "").toLowerCase().includes(ag) ||
        String(r.agencyCode || "").toLowerCase().includes(ag),
    );
  }
  if (st && st !== "all") {
    pool = pool.filter((r) => String(r.status || "").toLowerCase() === st);
  }

  const hitCount = pool.length;
  const start = pageIndex * pageSize;
  const results = pool.slice(start, start + pageSize);

  return {
    source: meta.source || "SAM.gov Assistance Listings (curated)",
    sourceDetail: meta.note || "Program catalog — confirm open opportunities on Grants.gov",
    live: false,
    hitCount,
    page: pageIndex,
    pageSize,
    hasMore: start + pageSize < hitCount,
    results,
  };
}

export function registerAssistanceListingsRoutes(app) {
  app.post("/grants/assistance-listings/search", async (req, res) => {
    try {
      const {
        keyword = "",
        agency = "",
        status = "Active",
        page = 0,
        rows = 25,
      } = req.body || {};
      const payload = searchAssistanceListings({
        keyword: String(keyword || "").trim(),
        agency: String(agency || "").trim(),
        status: String(status || "Active").trim(),
        page,
        limit: rows,
      });
      return res.json({
        fetchedAt: new Date().toISOString(),
        ...payload,
      });
    } catch (err) {
      console.error("[grants/assistance-listings/search]", err);
      return res.status(502).json({
        error: err.message || "Failed to search assistance listings",
        code: "assistance_listings_search_failed",
      });
    }
  });
}
