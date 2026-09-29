import { scopedStorageKey, isScopedStorageEventKey } from "../../../services/tenantScopedStorage.js";
import {
  canUseTrialFeatures,
  loadTrialFeatureData,
  persistTrialFeatureData,
} from "../../../services/trialFeatureApi.js";

const BASE_KEY = "juno_trial_pricing";
export const PRICING_CHANGED_EVENT = "juno-trial-pricing-changed";

const EMPTY = {
  laborRates: [],
  volumes: [],
  settings: { currency: "USD", defaultWrap: 1.2 },
};

function storageKey() {
  return scopedStorageKey(BASE_KEY);
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function hours(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n * 10) / 10);
}

function normalizeRate(row) {
  if (!row || typeof row !== "object") return null;
  const id = String(row.id || "").trim() || newId("rate");
  const role = String(row.role || "").trim();
  if (!role) return null;
  const rate = money(row.rate);
  const loaded = money(row.loaded != null ? row.loaded : rate * 1.2);
  const billable = money(row.billable != null ? row.billable : rate);
  return {
    id,
    role,
    rate,
    loaded: Math.max(rate, loaded),
    billable,
    notes: String(row.notes || "").trim(),
    updatedAt: String(row.updatedAt || new Date().toISOString()),
  };
}

function normalizeLaborLine(line, rates = []) {
  if (!line || typeof line !== "object") return null;
  const role = String(line.role || "").trim();
  if (!role) return null;
  const h = hours(line.hours);
  let rate = money(line.rate);
  const rateId = line.rateId != null ? String(line.rateId) : null;
  if (rateId) {
    const match = rates.find((r) => r.id === rateId);
    if (match) rate = match.billable ?? match.rate;
  }
  if (!rate && role) {
    const byRole = rates.find(
      (r) => String(r.role || "").toLowerCase() === role.toLowerCase(),
    );
    if (byRole) rate = byRole.billable ?? byRole.rate;
  }
  const amount = money(line.amount != null ? line.amount : h * rate);
  return {
    id: String(line.id || newId("ll")),
    role,
    hours: h,
    rateId,
    rate,
    amount,
  };
}

function computeVolumeTotals(vol, rates = []) {
  const laborLines = Array.isArray(vol.laborLines)
    ? vol.laborLines.map((l) => normalizeLaborLine(l, rates)).filter(Boolean)
    : [];
  const labor = money(laborLines.reduce((s, l) => s + l.amount, 0));
  const subcontractors = money(vol.subcontractors);
  const odc = money(vol.odc);
  const total = money(labor + subcontractors + odc);
  return { laborLines, labor, subcontractors, odc, total };
}

function normalizeVolume(vol, rates = []) {
  if (!vol || typeof vol !== "object") return null;
  const id = String(vol.id || "").trim() || newId("vol");
  const title = String(vol.title || "").trim() || "Untitled volume";
  const totals = computeVolumeTotals(vol, rates);
  return {
    id,
    title,
    opportunityId: vol.opportunityId != null ? String(vol.opportunityId) : null,
    opportunityNumber: vol.opportunityNumber != null ? String(vol.opportunityNumber) : null,
    opportunityAgency: vol.opportunityAgency != null ? String(vol.opportunityAgency) : null,
    opportunityDeadline: vol.opportunityDeadline != null ? String(vol.opportunityDeadline) : null,
    laborLines: totals.laborLines,
    labor: totals.labor,
    subcontractors: totals.subcontractors,
    odc: totals.odc,
    total: totals.total,
    bidPrice: vol.bidPrice == null || vol.bidPrice === "" ? null : money(vol.bidPrice),
    targetCost: vol.targetCost == null || vol.targetCost === "" ? null : money(vol.targetCost),
    updatedAt: String(vol.updatedAt || new Date().toISOString()),
  };
}

function normalizeSettings(settings) {
  const wrap = Number(settings?.defaultWrap);
  return {
    currency: String(settings?.currency || "USD").trim() || "USD",
    defaultWrap: Number.isFinite(wrap) && wrap > 0 ? wrap : 1.2,
  };
}

function normalizeBlob(data) {
  const laborRates = Array.isArray(data?.laborRates)
    ? data.laborRates.map(normalizeRate).filter(Boolean)
    : [];
  const volumes = Array.isArray(data?.volumes)
    ? data.volumes.map((v) => normalizeVolume(v, laborRates)).filter(Boolean)
    : [];
  return {
    laborRates,
    volumes,
    settings: normalizeSettings(data?.settings),
  };
}

function readRaw() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return { ...EMPTY, laborRates: [], volumes: [], settings: { ...EMPTY.settings } };
    return normalizeBlob(JSON.parse(raw));
  } catch {
    return { ...EMPTY, laborRates: [], volumes: [], settings: { ...EMPTY.settings } };
  }
}

async function persistCompanyWide(data) {
  if (!canUseTrialFeatures()) return;
  await persistTrialFeatureData("pricing", normalizeBlob(data));
}

function writeRaw(data) {
  const next = normalizeBlob(data);
  localStorage.setItem(storageKey(), JSON.stringify(next));
  try {
    window.dispatchEvent(new CustomEvent(PRICING_CHANGED_EVENT, { detail: next }));
  } catch {
    /* ignore */
  }
  void persistCompanyWide(next);
  return next;
}

export function getPricingData() {
  return readRaw();
}

export function listLaborRates() {
  return readRaw().laborRates.slice().sort((a, b) => a.role.localeCompare(b.role));
}

export function listVolumes() {
  return readRaw()
    .volumes.slice()
    .sort((a, b) => (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0));
}

export function getVolume(id) {
  if (!id) return null;
  return readRaw().volumes.find((v) => v.id === id) || null;
}

export function findVolumeByOpportunityId(opportunityId) {
  if (!opportunityId) return null;
  const id = String(opportunityId);
  return readRaw().volumes.find((v) => v.opportunityId === id) || null;
}

export function addLaborRate(input = {}) {
  const data = readRaw();
  const rate = normalizeRate({
    ...input,
    id: newId("rate"),
    updatedAt: new Date().toISOString(),
  });
  if (!rate) return data;
  data.laborRates = [rate, ...data.laborRates];
  return writeRaw(data);
}

export function updateLaborRate(id, patch = {}) {
  const data = readRaw();
  const idx = data.laborRates.findIndex((r) => r.id === id);
  if (idx < 0) return data;
  data.laborRates[idx] = normalizeRate({
    ...data.laborRates[idx],
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  });
  // Recompute volumes that reference this rate
  data.volumes = data.volumes.map((v) => normalizeVolume(v, data.laborRates));
  return writeRaw(data);
}

export function removeLaborRate(id) {
  const data = readRaw();
  data.laborRates = data.laborRates.filter((r) => r.id !== id);
  data.volumes = data.volumes.map((v) =>
    normalizeVolume(
      {
        ...v,
        laborLines: (v.laborLines || []).map((l) =>
          l.rateId === id ? { ...l, rateId: null } : l,
        ),
      },
      data.laborRates,
    ),
  );
  return writeRaw(data);
}

export function replaceLaborRates(rates = []) {
  const data = readRaw();
  data.laborRates = (Array.isArray(rates) ? rates : [])
    .map((r) =>
      normalizeRate({
        ...r,
        id: r.id || newId("rate"),
        updatedAt: new Date().toISOString(),
      }),
    )
    .filter(Boolean);
  data.volumes = data.volumes.map((v) => normalizeVolume(v, data.laborRates));
  return writeRaw(data);
}

/**
 * @param {{ title?: string, opportunityId?: string, opportunityNumber?: string, opportunityAgency?: string, opportunityDeadline?: string, laborLines?: object[], subcontractors?: number, odc?: number, bidPrice?: number|null, targetCost?: number|null }} input
 */
export function addVolume(input = {}) {
  const data = readRaw();
  const volume = normalizeVolume(
    {
      ...input,
      id: newId("vol"),
      title: String(input.title || "").trim() || "New cost volume",
      updatedAt: new Date().toISOString(),
    },
    data.laborRates,
  );
  data.volumes = [volume, ...data.volumes];
  writeRaw(data);
  return volume;
}

export function updateVolume(id, patch = {}) {
  const data = readRaw();
  const idx = data.volumes.findIndex((v) => v.id === id);
  if (idx < 0) return null;
  const volume = normalizeVolume(
    {
      ...data.volumes[idx],
      ...patch,
      id,
      updatedAt: new Date().toISOString(),
    },
    data.laborRates,
  );
  data.volumes[idx] = volume;
  writeRaw(data);
  return volume;
}

export function removeVolume(id) {
  const data = readRaw();
  data.volumes = data.volumes.filter((v) => v.id !== id);
  return writeRaw(data);
}

/**
 * Open existing opportunity volume or create one from shortlist item.
 * @param {{ id: string, title?: string, number?: string, agency?: string, deadline?: string|null }} item
 */
export function openOrCreateVolumeForShortlist(item) {
  if (!item?.id) return null;
  const existing = findVolumeByOpportunityId(item.id);
  if (existing) return { volume: existing, created: false };
  const title = String(item.title || item.number || item.id).trim() || "Opportunity";
  const volume = addVolume({
    title,
    opportunityId: item.id,
    opportunityNumber: item.number || null,
    opportunityAgency: item.agency || null,
    opportunityDeadline: item.deadline || null,
    laborLines: [],
    subcontractors: 0,
    odc: 0,
  });
  return { volume, created: true };
}

export function applyHourEstimatesToVolume(volumeId, lines = []) {
  const data = readRaw();
  const vol = data.volumes.find((v) => v.id === volumeId);
  if (!vol) return null;
  const laborLines = (Array.isArray(lines) ? lines : [])
    .map((l) => {
      const role = String(l.role || "").trim();
      if (!role) return null;
      const match = data.laborRates.find(
        (r) => String(r.role || "").toLowerCase() === role.toLowerCase(),
      );
      return {
        id: newId("ll"),
        role,
        hours: hours(l.hours),
        rateId: match?.id || null,
        rate: match ? match.billable ?? match.rate : money(l.rate),
      };
    })
    .filter(Boolean);
  return updateVolume(volumeId, { laborLines });
}

export function getPricingSummary(data = readRaw()) {
  const volumes = data.volumes || [];
  const active = volumes.length;
  const withBid = volumes.filter((v) => v.bidPrice != null && v.bidPrice > 0);
  const avgBid =
    withBid.length > 0
      ? money(withBid.reduce((s, v) => s + v.bidPrice, 0) / withBid.length)
      : 0;
  const withBoth = volumes.filter(
    (v) => v.bidPrice != null && v.targetCost != null && v.bidPrice > 0,
  );
  const targetRatio =
    withBoth.length > 0
      ? Math.round(
          (withBoth.reduce((s, v) => s + v.targetCost / v.bidPrice, 0) / withBoth.length) * 100,
        )
      : null;
  const totalAll = volumes.reduce((s, v) => s + (v.total || 0), 0);
  const subsAll = volumes.reduce((s, v) => s + (v.subcontractors || 0), 0);
  const subShare = totalAll > 0 ? Math.round((subsAll / totalAll) * 100) : 0;
  return {
    activeProposals: active,
    avgBidPrice: avgBid,
    targetCostRatio: targetRatio,
    subcontractorShare: subShare,
  };
}

/** Chart rows for labor rates tab */
export function laborRatesChartData(data = readRaw()) {
  return (data.laborRates || []).map((r) => ({
    role: r.role,
    rate: r.rate,
    loaded: r.loaded,
    billable: r.billable,
  }));
}

/** Chart rows for cost volumes tab */
export function volumesChartData(data = readRaw()) {
  return (data.volumes || []).map((v) => ({
    proposal: v.title,
    labor: Math.round((v.labor || 0) / 1000 * 10) / 10,
    subcontractors: Math.round((v.subcontractors || 0) / 1000 * 10) / 10,
    odc: Math.round((v.odc || 0) / 1000 * 10) / 10,
    total: Math.round((v.total || 0) / 1000 * 10) / 10,
  }));
}

/** Derived bid vs target trend from volumes (not fake months) */
export function volumesTrendData(data = readRaw()) {
  return (data.volumes || [])
    .filter((v) => v.bidPrice != null || v.targetCost != null || v.total > 0)
    .map((v) => ({
      name: v.title.length > 18 ? `${v.title.slice(0, 16)}…` : v.title,
      bidPrice: v.bidPrice != null ? Math.round((v.bidPrice / 1000) * 10) / 10 : null,
      targetCost:
        v.targetCost != null
          ? Math.round((v.targetCost / 1000) * 10) / 10
          : Math.round((v.total / 1000) * 10) / 10,
    }));
}

export function buildPricingAlerts(data = getPricingData(), t) {
  const alerts = [];
  const volumes = data.volumes || [];

  volumes.forEach((v) => {
    if (!v.laborLines?.length && (v.total || 0) === 0) {
      alerts.push({
        text: t("dashboard.alerts.proposalManager.pricingVolumeIncomplete", {
          title: v.title,
        }),
        color: "text-amber-500",
      });
    }
    if (v.bidPrice != null && v.targetCost != null && v.bidPrice > 0) {
      const ratio = v.targetCost / v.bidPrice;
      if (ratio > 0.95) {
        alerts.push({
          text: t("dashboard.alerts.proposalManager.pricingTooThin", {
            title: v.title,
          }),
          color: "text-red-500",
        });
      } else if (ratio < 0.6) {
        alerts.push({
          text: t("dashboard.alerts.proposalManager.pricingTooFat", {
            title: v.title,
          }),
          color: "text-amber-500",
        });
      }
    }
    if (v.bidPrice != null && v.total > 0 && v.bidPrice < v.total) {
      alerts.push({
        text: t("dashboard.alerts.proposalManager.pricingBidBelowCost", {
          title: v.title,
        }),
        color: "text-red-500",
      });
    }
  });

  return alerts.slice(0, 6);
}

export async function hydratePricingFromServer(opts = {}) {
  const notify = opts.notify !== false;
  if (!canUseTrialFeatures()) return getPricingData();
  try {
    const data = await loadTrialFeatureData("pricing", EMPTY);
    const next = normalizeBlob(data);
    const nextJson = JSON.stringify(next);
    const prevJson = localStorage.getItem(storageKey());
    if (prevJson === nextJson) return getPricingData();
    localStorage.setItem(storageKey(), nextJson);
    if (notify) {
      try {
        window.dispatchEvent(new CustomEvent(PRICING_CHANGED_EVENT, { detail: next }));
      } catch {
        /* ignore */
      }
    }
    return getPricingData();
  } catch {
    return getPricingData();
  }
}

export function subscribePricing(onChange) {
  const handleCustom = () => onChange(getPricingData());
  const handleStorage = (e) => {
    if (!isScopedStorageEventKey(e.key, BASE_KEY)) return;
    onChange(getPricingData());
  };
  window.addEventListener(PRICING_CHANGED_EVENT, handleCustom);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(PRICING_CHANGED_EVENT, handleCustom);
    window.removeEventListener("storage", handleStorage);
  };
}

export function formatMoney(value, currency = "USD") {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${Math.round(n).toLocaleString()}`;
  }
}
