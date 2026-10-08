/**
 * Applicant Profile used by Grant Match (eligibility / capacity checks).
 * Lives under Company Intelligence; tenant-scoped when trial is active.
 * Always dual-writes an unscoped fallback so the form stays filled after refresh.
 */

import { scopedStorageKey, isScopedStorageEventKey } from "../../../services/tenantScopedStorage.js";
import {
  canUseTrialFeatures,
  loadTrialFeatureData,
  persistTrialFeatureData,
} from "../../../services/trialFeatureApi.js";

const BASE_KEY = "juno_org_match_profile";
export const ORG_MATCH_PROFILE_CHANGED_EVENT = "juno-org-match-profile-changed";
export const TRIAL_FEATURE_KEY = "applicantFit";

/** @typedef {'nonprofit'|'forprofit'|'small_business'|'higher_ed'|'state_local'|'tribal'|'individual'} EntityTypeId */

/** @typedef {{
 *  entityTypes: EntityTypeId[],
 *  yearsInOperation: number|null,
 *  foundedYear: number|null,
 *  states: string[],
 *  hasSam: boolean,
 *  hasUei: boolean,
 *  revenueBand: ''|'under_100k'|'100k_1m'|'1m_10m'|'10m_50m'|'50m_plus',
 *  minAwardCapacity: number|null,
 *  maxAwardCapacity: number|null,
 *  costShareOk: boolean,
 *  naics: string,
 *  certifications: string[],
 *  missionKeywords: string,
 *  updatedAt: string|null,
 * }} OrgMatchProfile */

/** @type {OrgMatchProfile} */
export const EMPTY_ORG_MATCH_PROFILE = {
  entityTypes: [],
  yearsInOperation: null,
  foundedYear: null,
  states: [],
  hasSam: false,
  hasUei: false,
  revenueBand: "",
  minAwardCapacity: null,
  maxAwardCapacity: null,
  costShareOk: false,
  naics: "",
  certifications: [],
  missionKeywords: "",
  updatedAt: null,
};

export const ENTITY_TYPE_OPTIONS = [
  { id: "nonprofit", labelKey: "entityNonprofit" },
  { id: "forprofit", labelKey: "entityForprofit" },
  { id: "small_business", labelKey: "entitySmallBusiness" },
  { id: "higher_ed", labelKey: "entityHigherEd" },
  { id: "state_local", labelKey: "entityStateLocal" },
  { id: "tribal", labelKey: "entityTribal" },
  { id: "individual", labelKey: "entityIndividual" },
];

export const REVENUE_BAND_OPTIONS = [
  { id: "", labelKey: "revenueUnset" },
  { id: "under_100k", labelKey: "revenueUnder100k" },
  { id: "100k_1m", labelKey: "revenue100k1m" },
  { id: "1m_10m", labelKey: "revenue1m10m" },
  { id: "10m_50m", labelKey: "revenue10m50m" },
  { id: "50m_plus", labelKey: "revenue50mPlus" },
];

export const CERTIFICATION_OPTIONS = [
  { id: "8a", labelKey: "cert8a" },
  { id: "wosb", labelKey: "certWosb" },
  { id: "wbenc", labelKey: "certWbenc" },
  { id: "hubzone", labelKey: "certHubzone" },
  { id: "sdvosb", labelKey: "certSdvosb" },
  { id: "dbesbe", labelKey: "certDbeSbe" },
];

/** US states + DC + common territories (codes stored on the profile). */
export const US_STATE_OPTIONS = [
  { id: "AL", name: "Alabama" },
  { id: "AK", name: "Alaska" },
  { id: "AZ", name: "Arizona" },
  { id: "AR", name: "Arkansas" },
  { id: "CA", name: "California" },
  { id: "CO", name: "Colorado" },
  { id: "CT", name: "Connecticut" },
  { id: "DE", name: "Delaware" },
  { id: "DC", name: "District of Columbia" },
  { id: "FL", name: "Florida" },
  { id: "GA", name: "Georgia" },
  { id: "HI", name: "Hawaii" },
  { id: "ID", name: "Idaho" },
  { id: "IL", name: "Illinois" },
  { id: "IN", name: "Indiana" },
  { id: "IA", name: "Iowa" },
  { id: "KS", name: "Kansas" },
  { id: "KY", name: "Kentucky" },
  { id: "LA", name: "Louisiana" },
  { id: "ME", name: "Maine" },
  { id: "MD", name: "Maryland" },
  { id: "MA", name: "Massachusetts" },
  { id: "MI", name: "Michigan" },
  { id: "MN", name: "Minnesota" },
  { id: "MS", name: "Mississippi" },
  { id: "MO", name: "Missouri" },
  { id: "MT", name: "Montana" },
  { id: "NE", name: "Nebraska" },
  { id: "NV", name: "Nevada" },
  { id: "NH", name: "New Hampshire" },
  { id: "NJ", name: "New Jersey" },
  { id: "NM", name: "New Mexico" },
  { id: "NY", name: "New York" },
  { id: "NC", name: "North Carolina" },
  { id: "ND", name: "North Dakota" },
  { id: "OH", name: "Ohio" },
  { id: "OK", name: "Oklahoma" },
  { id: "OR", name: "Oregon" },
  { id: "PA", name: "Pennsylvania" },
  { id: "PR", name: "Puerto Rico" },
  { id: "RI", name: "Rhode Island" },
  { id: "SC", name: "South Carolina" },
  { id: "SD", name: "South Dakota" },
  { id: "TN", name: "Tennessee" },
  { id: "TX", name: "Texas" },
  { id: "UT", name: "Utah" },
  { id: "VT", name: "Vermont" },
  { id: "VA", name: "Virginia" },
  { id: "VI", name: "U.S. Virgin Islands" },
  { id: "WA", name: "Washington" },
  { id: "WV", name: "West Virginia" },
  { id: "WI", name: "Wisconsin" },
  { id: "WY", name: "Wyoming" },
];

const VALID_STATE_IDS = new Set(US_STATE_OPTIONS.map((s) => s.id));

function storageKey() {
  return scopedStorageKey(BASE_KEY);
}

function notify(profile) {
  try {
    window.dispatchEvent(
      new CustomEvent(ORG_MATCH_PROFILE_CHANGED_EVENT, { detail: { profile } }),
    );
  } catch {
    /* ignore */
  }
}

function readRawFromKey(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeRawToKey(key, profile) {
  localStorage.setItem(key, JSON.stringify(profile));
}

export function normalizeProfile(raw) {
  const base = { ...EMPTY_ORG_MATCH_PROFILE };
  if (!raw || typeof raw !== "object") return base;
  const entityTypes = Array.isArray(raw.entityTypes)
    ? raw.entityTypes.filter((id) => ENTITY_TYPE_OPTIONS.some((o) => o.id === id))
    : [];
  const certifications = Array.isArray(raw.certifications)
    ? raw.certifications.filter((id) => CERTIFICATION_OPTIONS.some((o) => o.id === id))
    : [];
  const states = Array.isArray(raw.states)
    ? raw.states
        .map((s) => String(s).trim().toUpperCase())
        .filter((s) => VALID_STATE_IDS.has(s))
    : [];
  const years =
    raw.yearsInOperation == null || raw.yearsInOperation === ""
      ? null
      : Number(raw.yearsInOperation);
  const founded =
    raw.foundedYear == null || raw.foundedYear === "" ? null : Number(raw.foundedYear);
  const minAward =
    raw.minAwardCapacity == null || raw.minAwardCapacity === ""
      ? null
      : Number(raw.minAwardCapacity);
  const maxAward =
    raw.maxAwardCapacity == null || raw.maxAwardCapacity === ""
      ? null
      : Number(raw.maxAwardCapacity);
  return {
    ...base,
    entityTypes,
    yearsInOperation: Number.isFinite(years) && years >= 0 ? years : null,
    foundedYear: Number.isFinite(founded) && founded >= 1800 ? founded : null,
    states,
    hasSam: !!raw.hasSam,
    hasUei: !!raw.hasUei,
    revenueBand: REVENUE_BAND_OPTIONS.some((o) => o.id === raw.revenueBand)
      ? raw.revenueBand
      : "",
    minAwardCapacity: Number.isFinite(minAward) && minAward >= 0 ? minAward : null,
    maxAwardCapacity: Number.isFinite(maxAward) && maxAward >= 0 ? maxAward : null,
    costShareOk: !!raw.costShareOk,
    naics: String(raw.naics || "").trim(),
    certifications,
    missionKeywords: String(raw.missionKeywords || "").trim(),
    updatedAt: raw.updatedAt || null,
  };
}

/** Read scoped key first, then unscoped fallback (and migrate into scoped). */
export function getOrgMatchProfile() {
  const scoped = storageKey();
  const fromScoped = readRawFromKey(scoped);
  if (fromScoped) return normalizeProfile(fromScoped);

  const fromBase = readRawFromKey(BASE_KEY);
  if (fromBase) {
    const normalized = normalizeProfile(fromBase);
    try {
      writeRawToKey(scoped, normalized);
    } catch {
      /* ignore */
    }
    return normalized;
  }

  return { ...EMPTY_ORG_MATCH_PROFILE };
}

function persistLocal(profile) {
  const scoped = storageKey();
  writeRawToKey(scoped, profile);
  // Unscoped mirror so demo ↔ trial scope flips still show the same form.
  if (scoped !== BASE_KEY) {
    writeRawToKey(BASE_KEY, profile);
  }
}

function removeLocal() {
  try {
    localStorage.removeItem(storageKey());
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(BASE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Replace-save the full Applicant Profile form (does not merge stale fields).
 * @returns {{ ok: true, profile: OrgMatchProfile } | { ok: false, error: string, profile: OrgMatchProfile }}
 */
export function saveOrgMatchProfile(patch = {}) {
  const next = normalizeProfile({
    ...EMPTY_ORG_MATCH_PROFILE,
    ...patch,
    updatedAt: new Date().toISOString(),
  });

  if (!next.entityTypes.length) {
    return { ok: false, error: "entity_required", profile: next };
  }

  persistLocal(next);
  notify(next);
  void persistTrialFeatureData(TRIAL_FEATURE_KEY, { profile: next });
  return { ok: true, profile: next };
}

/** Clear storage + stop matching. */
export function clearOrgMatchProfile() {
  removeLocal();
  const empty = { ...EMPTY_ORG_MATCH_PROFILE };
  notify(empty);
  void persistTrialFeatureData(TRIAL_FEATURE_KEY, { profile: empty });
  return empty;
}

/** Profile is usable for matching when entity type is set and saved. */
export function isOrgMatchProfileReady(profile = getOrgMatchProfile()) {
  return Array.isArray(profile?.entityTypes) && profile.entityTypes.length > 0 && !!profile?.updatedAt;
}

/** Effective years in operation from explicit field or founded year. */
export function resolveYearsInOperation(profile = getOrgMatchProfile()) {
  if (profile?.yearsInOperation != null && Number.isFinite(profile.yearsInOperation)) {
    return profile.yearsInOperation;
  }
  if (profile?.foundedYear != null && Number.isFinite(profile.foundedYear)) {
    const y = new Date().getFullYear() - profile.foundedYear;
    return y >= 0 ? y : null;
  }
  return null;
}

export function subscribeOrgMatchProfile(onChange) {
  const handleCustom = (e) => {
    const fromEvent = e?.detail?.profile;
    onChange(fromEvent ? normalizeProfile(fromEvent) : getOrgMatchProfile());
  };
  const handleStorage = (e) => {
    if (!isScopedStorageEventKey(e.key, BASE_KEY) && e.key !== BASE_KEY) return;
    onChange(getOrgMatchProfile());
  };
  window.addEventListener(ORG_MATCH_PROFILE_CHANGED_EVENT, handleCustom);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(ORG_MATCH_PROFILE_CHANGED_EVENT, handleCustom);
    window.removeEventListener("storage", handleStorage);
  };
}

/** Load company-wide Applicant Profile into local cache (trial). */
export async function hydrateOrgMatchProfileFromServer() {
  if (!canUseTrialFeatures()) return getOrgMatchProfile();
  try {
    const data = await loadTrialFeatureData(TRIAL_FEATURE_KEY, { profile: null });
    const remote = data?.profile;
    if (!remote || typeof remote !== "object") return getOrgMatchProfile();
    const next = normalizeProfile(remote);
    if (!next.entityTypes.length && !next.updatedAt) return getOrgMatchProfile();
    persistLocal(next);
    notify(next);
    return next;
  } catch {
    return getOrgMatchProfile();
  }
}
