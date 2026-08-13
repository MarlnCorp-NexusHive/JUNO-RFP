/**
 * Competitive Intelligence service — curated peers + live AI enrichment.
 */

import { enrichCompetitiveIntelligence } from "./api.js";
import { COMPETITORS } from "../features/proposal-manager/data/competitiveIntelligenceSamples";

export function getCuratedCompetitor(id) {
  return COMPETITORS.find((c) => c.id === id) || null;
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

  return {
    id: base?.id || String(remote.name || "remote").toLowerCase().replace(/\s+/g, "-"),
    name: pickStr(remote.name, base?.name),
    shortName: pickStr(remote.shortName, base?.shortName || base?.name),
    hq: pickStr(remote.hq, base?.hq),
    segment: pickStr(remote.segment, base?.segment),
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
 * Fetch live competitive snapshot for a curated peer; falls back to sample on failure.
 */
export async function enrichCompetitorById(id) {
  const base = getCuratedCompetitor(id);
  if (!base) {
    return { competitor: null, error: "Unknown competitor id" };
  }

  try {
    const remote = await enrichCompetitiveIntelligence({
      companyName: base.name,
      segment: base.segment,
    });
    if (remote?.error) {
      return {
        competitor: { ...base, remote: false, liveError: remote.error },
        error: remote.error,
      };
    }
    return {
      competitor: mergeCompetitorEnrichment(base, remote),
      error: null,
    };
  } catch (err) {
    const message = err?.response?.data?.error || err?.message || "Live enrichment failed";
    return {
      competitor: { ...base, remote: false, liveError: message },
      error: message,
    };
  }
}
