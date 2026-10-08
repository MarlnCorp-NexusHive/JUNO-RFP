/**
 * Sort opportunity rows by org match, retrieval confidence, and recency.
 * Unlikely org fits and thin listings are demoted (not hidden).
 */

import { assessListingConfidence, confidenceRank, withRetrievalConfidence } from "./listingConfidence.js";
import { assessOrgMatch, matchRank, withOrgMatch } from "./grantMatch.js";
import { getOrgMatchProfile } from "./orgMatchProfileStore.js";

function parseListingDate(value) {
  if (value == null || value === "") return null;
  const raw = String(value).trim();
  let ms = Date.parse(raw);
  if (!Number.isFinite(ms)) {
    const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) ms = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2])).getTime();
  }
  return Number.isFinite(ms) ? ms : null;
}

export function listingRecencyMs(row) {
  if (!row || typeof row !== "object") return 0;
  const primaryKeys = [
    "openDate",
    "postedDate",
    "postingDate",
    "createdDate",
    "publishedAt",
    "refreshedAt",
  ];
  for (const key of primaryKeys) {
    const ms = parseListingDate(row[key]);
    if (ms != null) return ms;
  }
  const fallbackKeys = ["closeDate", "deadline", "responseDeadline"];
  for (const key of fallbackKeys) {
    const ms = parseListingDate(row[key]);
    if (ms != null) return ms;
  }
  const idNum = Number(String(row.id || "").replace(/\D/g, ""));
  return Number.isFinite(idNum) ? idNum : 0;
}

export function sortByNewest(rows) {
  if (!Array.isArray(rows)) return [];
  return sortListings(rows, { newestFirst: true });
}

/**
 * Default Grants desk ordering:
 * 1) Org match (strong → possible → unknown → unlikely)
 * 2) Retrieval confidence (high → medium → low)
 * 3) Optional newest-first within band
 */
export function sortListings(rows, { newestFirst = false, profile = getOrgMatchProfile() } = {}) {
  if (!Array.isArray(rows)) return [];
  const enriched = withOrgMatch(withRetrievalConfidence(rows), profile);
  return [...enriched].sort((a, b) => {
    const ma = a._orgMatch || assessOrgMatch(a, profile);
    const mb = b._orgMatch || assessOrgMatch(b, profile);
    const matchDiff = matchRank(ma.level) - matchRank(mb.level);
    if (matchDiff !== 0) return matchDiff;

    const ca = a._retrievalConfidence || assessListingConfidence(a);
    const cb = b._retrievalConfidence || assessListingConfidence(b);
    const rankDiff = confidenceRank(ca.level) - confidenceRank(cb.level);
    if (rankDiff !== 0) return rankDiff;
    if (newestFirst) {
      const recencyDiff = listingRecencyMs(b) - listingRecencyMs(a);
      if (recencyDiff !== 0) return recencyDiff;
    }
    return (cb.score || 0) - (ca.score || 0);
  });
}

/** Always deprioritize thin/low confidence; preserve relative order otherwise when newestFirst is false. */
export function deprioritizeThinListings(rows) {
  return sortListings(rows, { newestFirst: false });
}
