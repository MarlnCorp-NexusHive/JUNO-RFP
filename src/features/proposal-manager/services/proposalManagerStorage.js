/**
 * Proposal Manager: localStorage-backed storage for Workspace (folders, documents, extracted data)
 * and Content Hub (Q&As with tags, response document sections).
 * Shared so Workspace-extracted Q&As appear in Content Hub.
 * Trial mode: keys are namespaced by tenantId via scopedStorageKey.
 */

import {
  BOILERPLATE_FOLDER_ID,
  BOILERPLATE_FOLDER_NAME,
  BOILERPLATE_PACK,
  BOILERPLATE_QAS,
  packToExtractedQAs,
  packToPlainText,
} from "../data/boilerplateCapabilities.js";
import { scopedStorageKey } from "../../../services/tenantScopedStorage.js";
import { isTrialMode } from "../../../services/trialAuthSession.js";
import { persistTrialFeatureData, canUseTrialFeatures, loadTrialFeatureData } from "../../../services/trialFeatureApi.js";

const KEYS = {
  FOLDERS: "proposal_manager_workspace_folders",
  DOCUMENTS: "proposal_manager_workspace_documents",
  CONTENT_HUB_QA: "proposal_manager_content_hub_qa",
  RESPONSE_SECTIONS: "proposal_manager_response_sections",
};

export const CONTENT_HUB_CHANGED_EVENT = "juno-content-hub-changed";

function notifyContentHubChanged() {
  try {
    window.dispatchEvent(new CustomEvent(CONTENT_HUB_CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

function load(key, defaultValue = []) {
  try {
    const raw = localStorage.getItem(scopedStorageKey(key));
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function save(key, data) {
  try {
    localStorage.setItem(scopedStorageKey(key), JSON.stringify(data));
  } catch (e) {
    console.warn("proposalManagerStorage save failed", key, e);
  }
  if (canUseTrialFeatures()) {
    if (key === KEYS.FOLDERS || key === KEYS.DOCUMENTS) {
      const folders = key === KEYS.FOLDERS ? data : load(KEYS.FOLDERS, []);
      const documents = key === KEYS.DOCUMENTS ? data : load(KEYS.DOCUMENTS, []);
      void persistTrialFeatureData("workspace", { folders, documents });
    }
    if (key === KEYS.CONTENT_HUB_QA) {
      void persistTrialFeatureData("contentHub", { qaLibrary: Array.isArray(data) ? data : [] });
      notifyContentHubChanged();
    }
  } else if (key === KEYS.CONTENT_HUB_QA) {
    notifyContentHubChanged();
  }
}

// ——— Folders ———
export function getFolders() {
  return load(KEYS.FOLDERS);
}

export function saveFolders(folders) {
  save(KEYS.FOLDERS, folders);
}

export function addFolder(name, parentId = null) {
  const folders = getFolders();
  const id = `folder_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  folders.push({ id, name, parentId, createdAt: new Date().toISOString() });
  saveFolders(folders);
  return id;
}

export function updateFolder(id, name) {
  const folders = getFolders().map((f) => (f.id === id ? { ...f, name } : f));
  saveFolders(folders);
}

export function deleteFolder(id) {
  saveFolders(getFolders().filter((f) => f.id !== id));
}

// ——— Documents (Workspace) ———
export function getDocuments() {
  return load(KEYS.DOCUMENTS);
}

export function saveDocuments(docs) {
  save(KEYS.DOCUMENTS, docs);
}

export function addDocument({ folderId, name, fileType, documentTypeId, uploadedAt, extractedFacts = [], extractedQAs = [], rawText = "" }) {
  const docs = getDocuments();
  const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  docs.push({
    id,
    folderId: folderId || null,
    name,
    fileType,
    documentTypeId,
    uploadedAt: uploadedAt || new Date().toISOString(),
    extractedFacts,
    extractedQAs,
    rawText: rawText ? rawText.slice(0, 50000) : "", // cap for localStorage
  });
  saveDocuments(docs);
  return id;
}

export function updateDocument(id, updates) {
  const docs = getDocuments().map((d) => (d.id === id ? { ...d, ...updates } : d));
  saveDocuments(docs);
}

export function deleteDocument(id) {
  saveDocuments(getDocuments().filter((d) => d.id !== id));
}

// ——— Content Hub Q&As (shared with Workspace extractions) ———
export function getContentHubQAs() {
  return load(KEYS.CONTENT_HUB_QA);
}

export function saveContentHubQAs(qas) {
  save(KEYS.CONTENT_HUB_QA, qas);
}

export function addContentHubQA({ question, answer, tags = [], sourceDocumentId = null }) {
  const qas = getContentHubQAs();
  const id = `qa_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  qas.push({
    id,
    question,
    answer,
    tags: Array.isArray(tags) ? [...tags] : [],
    sourceDocumentId,
    createdAt: new Date().toISOString(),
  });
  saveContentHubQAs(qas);
  return id;
}

/**
 * Upsert a Workspace RFP response into the Content Hub Q&A library.
 * Matches by workspaceResponseKey+sourceDocumentId when available, else normalized question.
 * @returns {string|null} qa id, or null if skipped
 */
export function upsertWorkspaceAnswerInContentHub({
  question,
  answer,
  sourceDocumentId = null,
  workspaceResponseKey = null,
  tags = ["RFP Response", "Workspace"],
} = {}) {
  const qText = String(question || "").trim();
  const aText = String(answer || "").trim();
  if (!qText || aText.length < 12) return null;

  const mergedTags = [
    ...new Set(
      (Array.isArray(tags) ? tags : [])
        .map((t) => String(t).trim())
        .filter(Boolean),
    ),
  ].slice(0, 10);
  const tagList = mergedTags.length ? mergedTags : ["RFP Response", "Workspace"];
  const normQ = qText.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 240);

  const qas = getContentHubQAs();
  let idx = -1;
  if (workspaceResponseKey && sourceDocumentId) {
    idx = qas.findIndex(
      (q) =>
        q.workspaceResponseKey === workspaceResponseKey &&
        q.sourceDocumentId === sourceDocumentId,
    );
  }
  if (idx < 0) {
    idx = qas.findIndex((q) => {
      const qk = String(q.question || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 240);
      if (qk !== normQ) return false;
      if (sourceDocumentId && q.sourceDocumentId && q.sourceDocumentId !== sourceDocumentId) {
        return false;
      }
      return true;
    });
  }

  if (idx >= 0) {
    const prev = qas[idx];
    if (String(prev.answer || "").trim() === aText && String(prev.question || "").trim() === qText) {
      return prev.id;
    }
    qas[idx] = {
      ...prev,
      question: qText,
      answer: aText,
      tags: [...new Set([...(prev.tags || []), ...tagList])].slice(0, 10),
      sourceDocumentId: sourceDocumentId || prev.sourceDocumentId || null,
      workspaceResponseKey: workspaceResponseKey || prev.workspaceResponseKey || null,
      updatedAt: new Date().toISOString(),
    };
    saveContentHubQAs(qas);
    return qas[idx].id;
  }

  const id = `qa_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  qas.push({
    id,
    question: qText,
    answer: aText,
    tags: tagList,
    sourceDocumentId: sourceDocumentId || null,
    workspaceResponseKey: workspaceResponseKey || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  saveContentHubQAs(qas);
  return id;
}

export function updateContentHubQA(id, updates) {
  const qas = getContentHubQAs().map((q) => (q.id === id ? { ...q, ...updates } : q));
  saveContentHubQAs(qas);
}

export function deleteContentHubQA(id) {
  saveContentHubQAs(getContentHubQAs().filter((q) => q.id !== id));
}

// Append extracted Q&As from Workspace / Source Docs (merge tags with document-type tags)
export function appendExtractedQAs(extractedQAs, documentTypeId, sourceDocumentId, documentTypeToTags) {
  const tagFromType = documentTypeToTags?.[documentTypeId] || ["General"];
  const qas = getContentHubQAs();
  const existingKeys = new Set(
    qas.map((q) =>
      String(q.question || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 240),
    ),
  );
  let added = 0;
  (extractedQAs || []).forEach(({ question, answer, tags }) => {
    const qText = String(question || "").trim() || "(No question text)";
    const key = qText.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 240);
    if (existingKeys.has(key)) return;
    existingKeys.add(key);
    const id = `qa_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const mergedTags = [
      ...new Set([
        ...(Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : []),
        ...tagFromType,
      ]),
    ].slice(0, 10);
    qas.push({
      id,
      question: qText,
      answer: String(answer || "").trim() || "(No answer text)",
      tags: mergedTags.length ? mergedTags : ["General"],
      sourceDocumentId: sourceDocumentId || null,
      createdAt: new Date().toISOString(),
    });
    added += 1;
  });
  if (added > 0) saveContentHubQAs(qas);
  return added;
}

/** Remove prior hub rows for this source doc, then append the new list (keeps Content Hub in sync after AI re-split). */
export function replaceExtractedQAsInContentHub(sourceDocumentId, extractedQAs, documentTypeId, documentTypeToTags) {
  const without = getContentHubQAs().filter((q) => q.sourceDocumentId !== sourceDocumentId);
  saveContentHubQAs(without);
  return appendExtractedQAs(extractedQAs, documentTypeId, sourceDocumentId, documentTypeToTags);
}

/**
 * Rank Content Hub Q&As for a workspace requirement and format as AI library context.
 * @param {string} requirementText
 * @param {{ limit?: number }} [opts]
 */
export function buildQaLibraryContextForRequirement(requirementText, opts = {}) {
  const limit = Math.max(3, Math.min(Number(opts.limit) || 12, 25));
  const qas = getContentHubQAs();
  if (!qas.length) return "";
  const tokens = String(requirementText || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3);
  const uniqueTokens = [...new Set(tokens)].slice(0, 40);

  const scored = qas
    .map((qa) => {
      const hay = `${qa.question || ""} ${qa.answer || ""} ${(qa.tags || []).join(" ")}`.toLowerCase();
      let score = 0;
      for (const tok of uniqueTokens) {
        if (hay.includes(tok)) score += 1;
      }
      // Prefer tagged Q&A / Past Performance / Technical for RFP work
      const tags = (qa.tags || []).map((t) => String(t).toLowerCase());
      if (tags.some((t) => t.includes("q&a") || t.includes("clarification"))) score += 1.5;
      if (tags.some((t) => t.includes("past performance") || t.includes("technical"))) score += 0.5;
      return { qa, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  const picked = (scored.length ? scored : qas.map((qa) => ({ qa, score: 0 }))).slice(0, limit);

  return picked
    .map(({ qa }, i) => {
      const tags = (qa.tags || []).length ? ` [${(qa.tags || []).join(", ")}]` : "";
      return `Q${i + 1}${tags}: ${qa.question}\nA${i + 1}: ${qa.answer}`;
    })
    .join("\n\n")
    .slice(0, 50000);
}

/** Pull trial workspace + content hub from backend into scoped localStorage. */
export async function hydrateWorkspaceFromBackend() {
  if (!canUseTrialFeatures()) return;
  const [ws, hub] = await Promise.all([
    loadTrialFeatureData("workspace", { folders: [], documents: [] }),
    loadTrialFeatureData("contentHub", { qaLibrary: [] }),
  ]);
  if (Array.isArray(ws?.folders)) {
    localStorage.setItem(scopedStorageKey(KEYS.FOLDERS), JSON.stringify(ws.folders));
  }
  if (Array.isArray(ws?.documents)) {
    localStorage.setItem(scopedStorageKey(KEYS.DOCUMENTS), JSON.stringify(ws.documents));
  }
  if (Array.isArray(hub?.qaLibrary)) {
    localStorage.setItem(scopedStorageKey(KEYS.CONTENT_HUB_QA), JSON.stringify(hub.qaLibrary));
    notifyContentHubChanged();
  }
}

/** Trial: load Content Hub Q&A library from backend only. */
export async function hydrateContentHubFromBackend() {
  if (!canUseTrialFeatures()) return getContentHubQAs();
  const hub = await loadTrialFeatureData("contentHub", { qaLibrary: [] });
  if (Array.isArray(hub?.qaLibrary)) {
    localStorage.setItem(scopedStorageKey(KEYS.CONTENT_HUB_QA), JSON.stringify(hub.qaLibrary));
  }
  return getContentHubQAs();
}

// ——— RFP Response document sections (for auto-generate) ———
export function getResponseSections() {
  return load(KEYS.RESPONSE_SECTIONS);
}

export function saveResponseSections(sections) {
  save(KEYS.RESPONSE_SECTIONS, sections);
}

export function setResponseSectionContent(sectionId, content) {
  const sections = getResponseSections();
  const index = sections.findIndex((s) => s.id === sectionId);
  if (index >= 0) {
    sections[index] = { ...sections[index], content };
  } else {
    sections.push({ id: sectionId, title: sectionId, content });
  }
  saveResponseSections(sections);
}

/** Idempotent seed: Workspace folder + docs + Content Hub Q&As for Marln/JUNO capability boilerplate.
 *  Demo only — skipped for trial tenants (blank slate). */
export function ensureBoilerplateLibrary() {
  if (isTrialMode()) return;

  const folders = getFolders();
  if (!folders.some((f) => f.id === BOILERPLATE_FOLDER_ID)) {
    folders.unshift({
      id: BOILERPLATE_FOLDER_ID,
      name: BOILERPLATE_FOLDER_NAME,
      parentId: null,
      createdAt: "2026-09-13T08:00:00.000Z",
      seeded: true,
    });
    saveFolders(folders);
  }

  const docs = getDocuments();
  let docsChanged = false;
  for (const pack of BOILERPLATE_PACK) {
    const docId = `doc_${pack.id}`;
    if (docs.some((d) => d.id === docId)) continue;
    docs.push({
      id: docId,
      folderId: BOILERPLATE_FOLDER_ID,
      name: `${pack.fileBase}.docx`,
      fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      documentTypeId: pack.documentTypeId,
      uploadedAt: pack.uploadedAt,
      extractedFacts: [],
      extractedQAs: packToExtractedQAs(pack),
      rawText: packToPlainText(pack),
      seeded: true,
    });
    docsChanged = true;
  }
  if (docsChanged) saveDocuments(docs);

  const qas = getContentHubQAs();
  let qaChanged = false;
  for (const row of BOILERPLATE_QAS) {
    if (qas.some((q) => q.id === row.id)) continue;
    qas.push({
      id: row.id,
      question: row.question,
      answer: row.answer,
      tags: [...row.tags],
      sourceDocumentId: `doc_${BOILERPLATE_PACK[0].id}`,
      createdAt: "2026-09-13T08:00:00.000Z",
    });
    qaChanged = true;
  }
  if (qaChanged) saveContentHubQAs(qas);
}

