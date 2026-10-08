/**
 * Keep only open / active pursuit listings — drop forecasted, closed, inactive, past-due.
 */

const CLOSED_STATUS = /^(forecasted|closed|archived|inactive|cancelled|canceled|complete|completed|awarded)$/i;

export function isPastDeadline(value) {
  if (value == null || value === "") return false;
  const raw = String(value).trim();
  let ms = Date.parse(raw);
  if (!Number.isFinite(ms)) {
    const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) ms = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]), 23, 59, 59).getTime();
  }
  if (!Number.isFinite(ms)) return false;
  return ms < Date.now();
}

export function isClosedOrForecastedStatus(status) {
  if (status == null || status === "") return false;
  return CLOSED_STATUS.test(String(status).trim());
}

/**
 * @param {object} row
 * @param {{ statusKeys?: string[], deadlineKeys?: string[] }} [opts]
 */
export function isOpenListing(row, opts = {}) {
  if (!row || typeof row !== "object") return false;
  const statusKeys = opts.statusKeys || ["status", "oppStatus"];
  const deadlineKeys = opts.deadlineKeys || [
    "deadline",
    "closeDate",
    "responseDeadline",
    "close_date",
  ];
  for (const key of statusKeys) {
    if (isClosedOrForecastedStatus(row[key])) return false;
  }
  for (const key of deadlineKeys) {
    if (row[key] != null && row[key] !== "" && isPastDeadline(row[key])) return false;
  }
  return true;
}

export function filterOpenListings(rows, opts) {
  if (!Array.isArray(rows)) return [];
  return rows.filter((row) => isOpenListing(row, opts));
}
