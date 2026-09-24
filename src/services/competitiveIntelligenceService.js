/**
 * Competitive Intelligence service — curated peers + live AI enrichment for any company.
 */

import { enrichCompetitiveIntelligence } from "./api.js";
import { COMPETITORS } from "../features/proposal-manager/data/competitiveIntelligenceSamples";

export function getCuratedCompetitor(id) {
  return COMPETITORS.find((c) => c.id === id) || null;
}

export function slugCompetitorId(name) {
  const base = String(name || "company")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `c-${base || "company"}`;
}

/** Match a curated peer by name / short name (case-insensitive, includes). */
export function findCuratedCompetitor({ companyName, id } = {}) {
  if (id) {
    const byId = getCuratedCompetitor(id);
    if (byId) return byId;
  }
  const n = String(companyName || "").trim().toLowerCase();
  if (!n) return null;
  const exact = COMPETITORS.find(
    (c) => c.name.toLowerCase() === n || c.shortName.toLowerCase() === n || c.id === n,
  );
  if (exact) return exact;
  return (
    COMPETITORS.find(
      (c) =>
        c.name.toLowerCase().includes(n) ||
        c.shortName.toLowerCase().includes(n) ||
        n.includes(c.shortName.toLowerCase()),
    ) || null
  );
}

/**
 * Merge live enrichment over a curated base (or stand-alone remote payload).
 * Prefer live numeric/string values when present; keep curated fields as fallback.
 */
export function mergeCompetitorEnrichment(base, remote) {
  if (!base && !remote) return null;
  if (!remote || remote.error) {
    return base
      ? { ...base, remote: false, liveError: remote?.error || null }
      : null;
  }

  const baseDs = base?.datasheet || {};
  const remDs = remote.datasheet || {};
  const pickNum = (live, fallback) =>
    live != null && Number.isFinite(Number(live)) ? Number(live) : fallback;
  const pickStr = (live, fallback) =>
    live != null && String(live).trim() ? String(live).trim() : fallback;

  const name = pickStr(remote.name, base?.name);
  return {
    id: base?.id || slugCompetitorId(name),
    name,
    shortName: pickStr(remote.shortName, base?.shortName || base?.name || name),
    hq: pickStr(remote.hq, base?.hq) || "",
    segment: pickStr(remote.segment, base?.segment) || "",
    datasheet: {
      revenueUsdB: pickNum(remDs.revenueUsdB, baseDs.revenueUsdB),
      employeesK: pickNum(remDs.employeesK, baseDs.employeesK),
      operatingMarginPct: pickNum(remDs.operatingMarginPct, baseDs.operatingMarginPct),
      publicSectorSharePct: pickNum(remDs.publicSectorSharePct, baseDs.publicSectorSharePct),
      offshoreMixPct: pickNum(remDs.offshoreMixPct, baseDs.offshoreMixPct),
      growthYoYPct: pickNum(remDs.growthYoYPct, baseDs.growthYoYPct),
      keyVehicles: pickStr(remDs.keyVehicles, baseDs.keyVehicles) || "",
    },
    valueProposition: pickStr(remote.valueProposition, base?.valueProposition) || "",
    keyDifferentiators:
      Array.isArray(remote.keyDifferentiators) && remote.keyDifferentiators.length
        ? remote.keyDifferentiators
        : base?.keyDifferentiators || [],
    typicalWinThemes:
      Array.isArray(remote.typicalWinThemes) && remote.typicalWinThemes.length
        ? remote.typicalWinThemes
        : base?.typicalWinThemes || [],
    sourceNote: pickStr(remote.source, base?.sourceNote),
    remote: true,
    liveError: null,
    enrichedAt: new Date().toISOString(),
  };
}

/**
 * Live competitive snapshot for a company name (any firm).
 * Uses curated sample as fallback base when the name matches a known peer.
 */
export async function lookupCompetitor(companyName, { segment = "", id = null } = {}) {
  const query = String(companyName || "").trim();
  if (!query && !id) {
    return { competitor: null, error: "Enter a company name" };
  }

  const curated = findCuratedCompetitor({ companyName: query, id });
  const base = curated
    ? { ...curated }
    : id
      ? { id, name: query, shortName: query, hq: "", segment: segment || "", datasheet: {} }
      : null;
  const nameForApi = curated?.name || query;

  try {
    const remote = await enrichCompetitiveIntelligence({
      companyName: nameForApi,
      segment: curated?.segment || segment || "",
    });
    if (remote?.error) {
      if (curated) {
        return {
          competitor: { ...curated, remote: false, liveError: remote.error },
          error: remote.error,
        };
      }
      return { competitor: null, error: remote.error };
    }
    const merged = mergeCompetitorEnrichment(base, remote);
    if (curated?.id) merged.id = curated.id;
    else if (id) merged.id = id;
    return { competitor: merged, error: null };
  } catch (err) {
    const message = err?.response?.data?.error || err?.message || "Live enrichment failed";
    if (curated) {
      return {
        competitor: { ...curated, remote: false, liveError: message },
        error: message,
      };
    }
    return { competitor: null, error: message };
  }
}

/**
 * Fetch live competitive snapshot for a curated peer; falls back to sample on failure.
 */
export async function enrichCompetitorById(id) {
  const base = getCuratedCompetitor(id);
  if (!base) {
    return { competitor: null, error: "Unknown competitor id" };
  }
  return lookupCompetitor(base.name, { id: base.id, segment: base.segment });
}
