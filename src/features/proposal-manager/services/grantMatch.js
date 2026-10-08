/**
 * Grant Match — rules-first org fit against opportunity eligibility / capacity.
 * Labels: strong | possible | unlikely | unknown
 */

import {
  getOrgMatchProfile,
  isOrgMatchProfileReady,
  resolveYearsInOperation,
} from "./orgMatchProfileStore.js";

const ENTITY_ALIASES = {
  nonprofit: [
    "nonprofit",
    "non-profit",
    "non profit",
    "501(c)(3)",
    "501c3",
    "public charity",
    "community organization",
    "community organizations",
    "ngo",
  ],
  forprofit: ["for-profit", "for profit", "forprofit", "commercial organization", "private sector"],
  small_business: [
    "small business",
    "small businesses",
    "sbir",
    "sttr",
    "small entity",
  ],
  higher_ed: [
    "higher education",
    "university",
    "universities",
    "college",
    "colleges",
    "academic institution",
    "institution of higher",
  ],
  state_local: [
    "state government",
    "local government",
    "public agency",
    "public agencies",
    "municipal",
    "county government",
    "city government",
    "state or local",
    "state/local",
  ],
  tribal: ["tribal", "tribe", "native american", "alaska native", "indian tribe"],
  individual: ["individual", "individuals", "sole proprietor"],
};

const MATCH_RANK = {
  strong: 0,
  possible: 1,
  unknown: 2,
  unlikely: 3,
};

export function matchRank(level) {
  return MATCH_RANK[level] ?? MATCH_RANK.unknown;
}

function blobText(listing) {
  const parts = [
    listing?.eligibility,
    Array.isArray(listing?.applicantTypes) ? listing.applicantTypes.join(" ") : "",
    listing?.summary,
    listing?.description,
    listing?.setAside,
    listing?.setAsideDescription,
    listing?.geography,
    listing?.title,
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function parseMoney(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = String(value).replace(/,/g, "");
  const m = raw.match(/\$?\s*([\d.]+)\s*([kmb])?/i);
  if (!m) return null;
  let n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  const unit = (m[2] || "").toLowerCase();
  if (unit === "k") n *= 1e3;
  if (unit === "m") n *= 1e6;
  if (unit === "b") n *= 1e9;
  return n;
}

function listingAwardCeiling(listing) {
  const candidates = [
    listing?.awardCeiling,
    listing?.awardMax,
    listing?.amount,
    listing?.amountLabel,
    listing?.awardLabel,
    listing?.awardCeilingLabel,
    listing?.raw?.awardCeiling,
    listing?.raw?.awardMax,
  ];
  for (const c of candidates) {
    const n = parseMoney(c);
    if (n != null && n > 0) return n;
  }
  return null;
}

function extractMinYears(text) {
  if (!text) return null;
  const patterns = [
    /(\d+)\s*\+?\s*years?\s+(?:in\s+)?(?:operation|business|existence|experience)/i,
    /(?:minimum|at\s+least|must\s+have)\s+(\d+)\s*years?/i,
    /established\s+(?:for\s+)?(?:at\s+least\s+)?(\d+)\s*years?/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const n = Number(m[1]);
      if (Number.isFinite(n) && n > 0 && n < 100) return n;
    }
  }
  return null;
}

function listingMentionsEntity(text, entityId) {
  const aliases = ENTITY_ALIASES[entityId] || [];
  return aliases.some((a) => text.includes(a));
}

function listingHasAnyEntitySignal(text) {
  return Object.keys(ENTITY_ALIASES).some((id) => listingMentionsEntity(text, id));
}

function revenueBandCeiling(band) {
  switch (band) {
    case "under_100k":
      return 100_000;
    case "100k_1m":
      return 1_000_000;
    case "1m_10m":
      return 10_000_000;
    case "10m_50m":
      return 50_000_000;
    case "50m_plus":
      return 500_000_000;
    default:
      return null;
  }
}

function softKeywordHits(profile, listing) {
  const kwRaw = String(profile?.missionKeywords || "").trim();
  if (!kwRaw) return { hits: 0, total: 0 };
  const tokens = kwRaw
    .split(/[,;\n]+/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length >= 3);
  if (!tokens.length) return { hits: 0, total: 0 };
  const text = blobText(listing);
  let hits = 0;
  for (const t of tokens) {
    if (text.includes(t)) hits += 1;
  }
  return { hits, total: tokens.length };
}

/**
 * @returns {{
 *  level: 'strong'|'possible'|'unlikely'|'unknown',
 *  reasons: string[],
 *  gates: { id: string, status: 'pass'|'fail'|'unknown', detail?: string }[],
 *  profileReady: boolean,
 * }}
 */
export function assessOrgMatch(listing, profile = getOrgMatchProfile()) {
  // Matching only runs against a saved profile (entity type + updatedAt).
  if (!isOrgMatchProfileReady(profile)) {
    return {
      level: "unknown",
      reasons: ["profile_incomplete"],
      gates: [],
      profileReady: false,
    };
  }

  const text = blobText(listing);
  const reasons = [];
  const gates = [];
  let hardFail = false;
  let softPass = 0;
  let softUnknown = 0;

  // --- Entity type ---
  const hasEntitySignal = listingHasAnyEntitySignal(text) || (Array.isArray(listing?.applicantTypes) && listing.applicantTypes.length > 0);
  if (hasEntitySignal) {
    const orgOk = profile.entityTypes.some((id) => listingMentionsEntity(text, id));
    if (orgOk) {
      gates.push({ id: "entity", status: "pass" });
      softPass += 1;
      reasons.push("entity_pass");
    } else {
      // Explicit applicant types that don't include us → hard fail
      gates.push({ id: "entity", status: "fail" });
      hardFail = true;
      reasons.push("entity_fail");
    }
  } else {
    gates.push({ id: "entity", status: "unknown" });
    softUnknown += 1;
    reasons.push("entity_unknown");
  }

  // --- Years in operation ---
  const requiredYears = extractMinYears(text);
  const ourYears = resolveYearsInOperation(profile);
  if (requiredYears != null) {
    if (ourYears == null) {
      gates.push({ id: "years", status: "unknown", detail: String(requiredYears) });
      softUnknown += 1;
      reasons.push("years_unknown");
    } else if (ourYears >= requiredYears) {
      gates.push({ id: "years", status: "pass", detail: String(requiredYears) });
      softPass += 1;
      reasons.push("years_pass");
    } else {
      gates.push({ id: "years", status: "fail", detail: String(requiredYears) });
      hardFail = true;
      reasons.push("years_fail");
    }
  }

  // --- SAM / UEI ---
  if (/\bsam\.gov\b|\buei\b|unique entity|system for award management|active sam/i.test(text)) {
    if (profile.hasSam || profile.hasUei) {
      gates.push({ id: "registration", status: "pass" });
      softPass += 1;
      reasons.push("registration_pass");
    } else {
      gates.push({ id: "registration", status: "fail" });
      hardFail = true;
      reasons.push("registration_fail");
    }
  }

  // --- Cost share ---
  if (/\bcost[\s-]?shar/i.test(text) || listing?.costSharing === true || listing?.costSharing === "Yes") {
    if (profile.costShareOk) {
      gates.push({ id: "costShare", status: "pass" });
      softPass += 1;
      reasons.push("cost_share_pass");
    } else {
      gates.push({ id: "costShare", status: "fail" });
      // Soft fail — many orgs can still apply with partners
      reasons.push("cost_share_warn");
      softUnknown += 1;
    }
  }

  // --- Geography (US states) ---
  if (profile.states?.length) {
    const stateHit = profile.states.some((st) => {
      const re = new RegExp(`\\b${st}\\b`, "i");
      return re.test(text);
    });
    const geoRestricted =
      /\bonly\s+(?:in|for)\b|\brestricted\s+to\b|\bmust\s+be\s+located\b|\bplace\s+of\s+performance\b/i.test(
        text,
      );
    if (stateHit) {
      gates.push({ id: "geo", status: "pass" });
      softPass += 1;
      reasons.push("geo_pass");
    } else if (geoRestricted) {
      gates.push({ id: "geo", status: "unknown" });
      softUnknown += 1;
      reasons.push("geo_unknown");
    }
  }

  // --- Finance / award capacity ---
  const ceiling = listingAwardCeiling(listing);
  if (ceiling != null) {
    const capacity =
      profile.maxAwardCapacity != null
        ? profile.maxAwardCapacity
        : revenueBandCeiling(profile.revenueBand);
    if (capacity == null) {
      gates.push({ id: "finance", status: "unknown", detail: String(ceiling) });
      softUnknown += 1;
      reasons.push("finance_unknown");
    } else if (ceiling <= capacity * 1.25) {
      gates.push({ id: "finance", status: "pass", detail: String(ceiling) });
      softPass += 1;
      reasons.push("finance_pass");
    } else if (ceiling <= capacity * 3) {
      gates.push({ id: "finance", status: "unknown", detail: String(ceiling) });
      softUnknown += 1;
      reasons.push("finance_stretch");
    } else {
      gates.push({ id: "finance", status: "fail", detail: String(ceiling) });
      hardFail = true;
      reasons.push("finance_fail");
    }
  }

  // --- Certifications / set-asides (soft when listing mentions them) ---
  if (profile.certifications?.length) {
    const certAliases = {
      "8a": ["8(a)", "8a", "8-a"],
      wosb: ["wosb", "women-owned small business", "women owned small business"],
      wbenc: ["wbenc", "wbec", "women's business enterprise", "womens business enterprise"],
      hubzone: ["hubzone", "hub zone"],
      sdvosb: ["sdvosb", "service-disabled veteran", "service disabled veteran"],
      dbesbe: [" dbe", "dbe/", "/dbe", "sbe ", "small business enterprise", "disadvantaged business"],
    };
    const matched = profile.certifications.filter((id) => {
      const aliases = certAliases[id] || [id];
      return aliases.some((a) => text.includes(a.toLowerCase()));
    });
    if (matched.length) {
      softPass += 1;
      reasons.push("certs_pass");
      gates.push({ id: "certs", status: "pass" });
    }
  }

  // --- Soft mission keywords ---
  const soft = softKeywordHits(profile, listing);
  if (soft.total > 0) {
    if (soft.hits >= Math.ceil(soft.total / 2)) {
      softPass += 1;
      reasons.push("keywords_pass");
    } else if (soft.hits === 0) {
      softUnknown += 1;
      reasons.push("keywords_miss");
    }
  }

  let level;
  if (hardFail) {
    level = "unlikely";
  } else if (softPass >= 2 && softUnknown === 0) {
    level = "strong";
  } else if (softPass >= 1) {
    level = "possible";
  } else if (gates.every((g) => g.status === "unknown") || gates.length === 0) {
    level = "unknown";
  } else {
    level = "possible";
  }

  return {
    level,
    reasons,
    gates,
    profileReady: true,
  };
}

export function withOrgMatch(rows, profile = getOrgMatchProfile()) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => ({
    ...row,
    _orgMatch: assessOrgMatch(row, profile),
  }));
}
