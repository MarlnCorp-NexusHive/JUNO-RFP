/**
 * Retrieval confidence for Grants desk listings.
 * High = rich enough to pursue; Low = thin / incomplete source payload.
 */

function textLen(...vals) {
  return vals
    .map((v) => String(v || "").trim())
    .filter(Boolean)
    .join(" ").length;
}

function hasValue(v) {
  if (v == null) return false;
  if (typeof v === "number") return Number.isFinite(v);
  const s = String(v).trim();
  return s !== "" && s !== "—" && s.toLowerCase() !== "null";
}

/**
 * @returns {{ level: 'high'|'medium'|'low', score: number, thin: boolean, reasons: string[] }}
 */
export function assessListingConfidence(row) {
  if (!row || typeof row !== "object") {
    return { level: "low", score: 0, thin: true, reasons: ["empty"] };
  }

  let score = 0;
  const reasons = [];

  if (hasValue(row.title) || hasValue(row.name)) {
    score += 15;
  } else {
    reasons.push("no_title");
  }

  if (hasValue(row.number) || hasValue(row.noticeId) || hasValue(row.id)) score += 8;
  else reasons.push("no_id");

  if (hasValue(row.agency) || hasValue(row.agencyCode) || hasValue(row.funder) || hasValue(row.organization)) {
    score += 12;
  } else {
    reasons.push("no_agency");
  }

  const summaryLen = textLen(row.summary, row.description, row.eligibility);
  if (summaryLen >= 280) score += 25;
  else if (summaryLen >= 80) score += 14;
  else if (summaryLen > 0) score += 6;
  else reasons.push("no_summary");

  if (
    hasValue(row.deadline) ||
    hasValue(row.closeDate) ||
    hasValue(row.responseDeadline) ||
    hasValue(row.openDate) ||
    hasValue(row.postedDate)
  ) {
    score += 15;
  } else {
    reasons.push("no_dates");
  }

  if (
    hasValue(row.amount) ||
    hasValue(row.amountLabel) ||
    hasValue(row.awardLabel) ||
    hasValue(row.awardCeiling) ||
    hasValue(row.awardCeilingLabel) ||
    hasValue(row.awardMax)
  ) {
    score += 12;
  } else {
    reasons.push("no_amount");
  }

  if (hasValue(row.url) || hasValue(row.samUrl) || hasValue(row.grantsGovUrl)) score += 13;
  else reasons.push("no_url");

  if (Array.isArray(row.applicantTypes) && row.applicantTypes.length) score += 5;
  if (hasValue(row.status) || hasValue(row.oppStatus)) score += 5;

  const thin = summaryLen < 40 && !(hasValue(row.url) || hasValue(row.samUrl) || hasValue(row.grantsGovUrl));
  if (thin) score = Math.min(score, 34);

  let level = "medium";
  if (score >= 70) level = "high";
  else if (score < 45 || thin) level = "low";

  return { level, score, thin, reasons };
}

export function confidenceRank(level) {
  if (level === "high") return 0;
  if (level === "medium") return 1;
  return 2;
}

/** Attach _retrievalConfidence on each row (non-enumerable optional — we use plain field). */
export function withRetrievalConfidence(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    if (!row || typeof row !== "object") return row;
    if (row._retrievalConfidence) return row;
    return { ...row, _retrievalConfidence: assessListingConfidence(row) };
  });
}
