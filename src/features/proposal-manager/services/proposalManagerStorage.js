/**
 * Proposal Manager: localStorage-backed storage for Workspace (folders, documents, extracted data)
 * and Content Hub (Q&As with tags, response document sections).
 * Shared so Workspace-extracted Q&As appear in Content Hub.
 */

const KEYS = {
  FOLDERS: "proposal_manager_workspace_folders",
  DOCUMENTS: "proposal_manager_workspace_documents",
  CONTENT_HUB_QA: "proposal_manager_content_hub_qa",
  RESPONSE_SECTIONS: "proposal_manager_response_sections",
};

function load(key, defaultValue = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function save(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("proposalManagerStorage save failed", key, e);
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

export function updateContentHubQA(id, updates) {
  const qas = getContentHubQAs().map((q) => (q.id === id ? { ...q, ...updates } : q));
  saveContentHubQAs(qas);
}

export function deleteContentHubQA(id) {
  saveContentHubQAs(getContentHubQAs().filter((q) => q.id !== id));
}

// Append extracted Q&As from Workspace (merge tags with document-type tags)
export function appendExtractedQAs(extractedQAs, documentTypeId, sourceDocumentId, documentTypeToTags) {
  const tagFromType = documentTypeToTags[documentTypeId] || ["General"];
  const qas = getContentHubQAs();
  extractedQAs.forEach(({ question, answer }) => {
    const id = `qa_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    qas.push({
      id,
      question: question || "(No question text)",
      answer: answer || "(No answer text)",
      tags: [...new Set([...tagFromType])],
      sourceDocumentId,
      createdAt: new Date().toISOString(),
    });
  });
  saveContentHubQAs(qas);
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
