/**
 * Trial Source Docs catalog for Bid Vault / Scoring / Win Slide.
 * Surfaces company-wide uploaded docs (+ important dates) and Content Hub Q&As.
 */
import { scopedStorageKey } from "../../../services/tenantScopedStorage.js";
import {
  canUseTrialFeatures,
  loadTrialFeatureData,
} from "../../../services/trialFeatureApi.js";
import { getContentHubQAs, hydrateContentHubFromBackend } from "./proposalManagerStorage.js";

const SOURCE_DOCS_KEY = "proposal_manager_source_docs";
const NAME_OVERRIDES_KEY = "proposal_manager_source_docs_names";

function loadOverrides() {
  try {
    const raw = localStorage.getItem(scopedStorageKey(NAME_OVERRIDES_KEY));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function loadLocalDocs() {
  try {
    const raw = localStorage.getItem(scopedStorageKey(SOURCE_DOCS_KEY));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeDoc(d, overrides = {}) {
  if (!d || typeof d !== "object") return null;
  const id = String(d.id || "").trim();
  if (!id) return null;
  // Skip Marln boilerplate pack for "your pursuits" context
  if (String(d.folder || "") === "boilerplate") {
    return null;
  }
  const name = String(overrides[id] || d.shareLabel || d.name || "Document").trim();
  const importantDates = Array.isArray(d.importantDates) ? d.importantDates : [];
  return {
    id,
    name,
    type: String(d.type || ""),
    size: Number(d.size) || 0,
    uploadedAt: String(d.uploadedAt || ""),
    folder: d.folder || null,
    importantDates,
    qaCount: Number(d.qaLibraryCount) || 0,
  };
}

/** Company source docs visible to trial (excludes boilerplate pack). */
export function listTrialSourceDocs() {
  const overrides = loadOverrides();
  return loadLocalDocs()
    .map((d) => normalizeDoc(d, overrides))
    .filter(Boolean)
    .sort((a, b) => (Date.parse(b.uploadedAt) || 0) - (Date.parse(a.uploadedAt) || 0));
}

export async function hydrateSourceDocsCatalog() {
  if (!canUseTrialFeatures()) return listTrialSourceDocs();
  try {
    const data = await loadTrialFeatureData("sourceDocs", { docs: [], nameOverrides: {} });
    const docs = Array.isArray(data?.docs) ? data.docs : [];
    const overrides =
      data?.nameOverrides && typeof data.nameOverrides === "object" ? data.nameOverrides : {};
    try {
      localStorage.setItem(scopedStorageKey(SOURCE_DOCS_KEY), JSON.stringify(docs));
      localStorage.setItem(scopedStorageKey(NAME_OVERRIDES_KEY), JSON.stringify(overrides));
    } catch {
      /* ignore */
    }
    await hydrateContentHubFromBackend().catch(() => {});
  } catch {
    /* ignore */
  }
  return listTrialSourceDocs();
}

/**
 * Compact context blob for AI prompts (source docs + Q&A snippets).
 * @param {{ maxDocs?: number, maxQas?: number }} opts
 */
export function buildSourceDocsAiContext(opts = {}) {
  const maxDocs = opts.maxDocs ?? 12;
  const maxQas = opts.maxQas ?? 20;
  const docs = listTrialSourceDocs().slice(0, maxDocs);
  const qas = (getContentHubQAs() || [])
    .filter((q) => q && (q.question || q.answer))
    .slice(0, maxQas)
    .map((q) => ({
      question: String(q.question || "").slice(0, 240),
      answer: String(q.answer || "").slice(0, 400),
      sourceDocumentId: q.sourceDocumentId || null,
      tags: Array.isArray(q.tags) ? q.tags.slice(0, 6) : [],
    }));

  return {
    documents: docs.map((d) => ({
      id: d.id,
      name: d.name,
      uploadedAt: d.uploadedAt,
      deadlines: (d.importantDates || [])
        .filter((r) => r?.date)
        .slice(0, 8)
        .map((r) => ({ event: r.event || r.label || "date", date: r.date, raw: r.raw_text || r.rawText || "" })),
      qaCount: d.qaCount,
    })),
    qaLibrary: qas,
    documentCount: docs.length,
    qaCount: qas.length,
  };
}

export function sourceDocOptionsForSelect() {
  return listTrialSourceDocs().map((d) => ({
    id: d.id,
    label: d.name,
    deadline:
      (d.importantDates || []).find((r) => /deadline|due|submission|closing/i.test(String(r.event || "")))
        ?.date || null,
  }));
}
