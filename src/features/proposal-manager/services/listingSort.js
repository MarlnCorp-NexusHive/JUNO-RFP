/**
 * Sort opportunity rows by recency (newest first).
 * Prefers posting/open dates; falls back to close/deadline only when no open date exists.
 */

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
  return [...rows].sort((a, b) => listingRecencyMs(b) - listingRecencyMs(a));
}
