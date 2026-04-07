import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getFolders,
  saveFolders,
  addFolder,
  updateFolder,
  deleteFolder,
  getDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
  appendExtractedQAs,
  replaceExtractedQAsInContentHub,
} from "../services/proposalManagerStorage";
import { extractFromFile, extractFromText } from "../services/extractFromDocument";
import { RFP_DOCUMENT_TYPES, DOCUMENT_TYPE_TO_TAGS } from "../data/documentTypes";
import { FiFolder, FiFile, FiUpload, FiTrash2, FiEdit2, FiZap, FiMessageSquare, FiRefreshCw } from "react-icons/fi";
import { useProposalIssuer } from "./ProposalIssuerContext";
import { generateAnswer, structureRfpRequirementsWithAi, generateRfpDocument } from "../../../services/api.js";

const ACCEPT = ".pdf,.doc,.docx,.txt,.xlsx,.xls";
const MAX_FILE_MB = 25;
const TEMPLATE_OPTIONS = [
  { id: "classic", label: "Classic" },
  { id: "modern", label: "Modern" },
  { id: "technical", label: "Technical" },
];

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: "short" });
  } catch {
    return iso;
  }
}

function humanFactKey(key) {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function rfpQuestionKey(index) {
  return `q_${index}`;
}

/** Prefer stored answer; for requirement-only rows (empty answer) show full question text. */
function workspaceReferenceText(row) {
  if (!row) return "—";
  const a = (row.answer || "").trim();
  if (a) return a;
  const q = (row.question || "").trim();
  return q || "—";
}

async function messageFromApiError(error) {
  const data = error?.response?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed.error === "string") return parsed.error;
      } catch {
        /* not JSON */
      }
      return text || error.message;
    } catch {
      return error?.message ?? "Request failed";
    }
  }
  if (data && typeof data === "object" && typeof data.error === "string") return data.error;
  return error?.message ?? "Request failed";
}

export default function ProposalManagerWorkspace() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { issuer } = useProposalIssuer();
  const [issuerBrief, setIssuerBrief] = useState("");
  useEffect(() => {
    if (issuer?.narrative) setIssuerBrief(issuer.narrative);
  }, [issuer?.linkedAt, issuer?.narrative]);

  const [folders, setFolders] = useState(getFolders);
  const [documents, setDocuments] = useState(getDocuments);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [documentTypeId, setDocumentTypeId] = useState("solicitation");
  const [uploading, setUploading] = useState(false);
  const [scanProgress, setScanProgress] = useState(null);
  const [scanningId, setScanningId] = useState(null);
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");
  const fileInputRef = useRef(null);
  const rfpBackfillDone = useRef(new Set());
  const [rfpId, setRfpId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSplitLoading, setAiSplitLoading] = useState(false);
  const [aiSplitError, setAiSplitError] = useState("");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("classic");
  const [documentGenerating, setDocumentGenerating] = useState(false);
  const [documentGenerateError, setDocumentGenerateError] = useState("");

  const refreshDocs = useCallback(() => setDocuments(getDocuments()));
  const refreshFolders = useCallback(() => setFolders(getFolders()));

  const handleAddFolder = () => {
    const name = newFolderName.trim() || t("proposalManagerWorkspace.newFolderDefault");
    addFolder(name, selectedFolderId);
    setNewFolderName("");
    refreshFolders();
  };

  const handleRenameFolder = (id) => {
    const name = newFolderName.trim();
    if (name) {
      updateFolder(id, name);
      setEditingFolderId(null);
      setNewFolderName("");
      refreshFolders();
    }
  };

  const handleDeleteFolder = (id) => {
    getDocuments().filter((d) => d.folderId === id).forEach((d) => updateDocument(d.id, { folderId: null }));
    deleteFolder(id);
    refreshDocs();
    refreshFolders();
    if (selectedFolderId === id) setSelectedFolderId(null);
  };

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      const isPdf = file.type?.includes("pdf") || ext === "pdf";
      const isTxt = file.type?.includes("text") || ext === "txt";
      const isDocx = file.type?.includes("word") || ext === "docx" || ext === "doc";
      const isXlsx = file.type?.includes("sheet") || file.type?.includes("excel") || ext === "xlsx" || ext === "xls";
      const supported = isPdf || isTxt || isDocx || isXlsx;
      if (!supported) continue;
      if (file.size > MAX_FILE_MB * 1024 * 1024) continue;

      const uploadedAt = new Date().toISOString();
      const docId = addDocument({
        folderId: selectedFolderId,
        name: file.name,
        fileType: file.type || "application/pdf",
        documentTypeId,
        uploadedAt,
        extractedFacts: [],
        extractedQAs: [],
        rawText: "",
      });
      refreshDocs();

      try {
        const isPdf = file.type?.includes("pdf") || (file.name || "").toLowerCase().endsWith(".pdf");
        const onProgress = isPdf
          ? (p) => setScanProgress({ ...p, fileName: file.name })
          : null;
        const { text, facts, qas } = await extractFromFile(file, onProgress);
        setScanProgress(null);
        updateDocument(docId, {
          extractedFacts: facts,
          extractedQAs: qas,
          rawText: text.slice(0, 50000),
        });
        appendExtractedQAs(qas, documentTypeId, docId, DOCUMENT_TYPE_TO_TAGS);
        refreshDocs();
        if (qas.length > 0 || text.trim().length >= 80) setRfpId(docId);
      } catch (err) {
        setScanProgress(null);
        console.warn("Extract failed for", file.name, err);
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRescan = async (doc) => {
    setScanningId(doc.id);
    try {
      if (doc.rawText) {
        const { facts, qas } = extractFromText(doc.rawText);
        updateDocument(doc.id, { extractedFacts: facts, extractedQAs: qas });
        appendExtractedQAs(qas, doc.documentTypeId, doc.id, DOCUMENT_TYPE_TO_TAGS);
        refreshDocs();
      }
    } catch (err) {
      console.warn("Rescan failed", err);
    }
    setScanningId(null);
  };

  const currentDocs =
    selectedFolderId === null
      ? documents
      : documents.filter((d) => d.folderId === selectedFolderId);
  const rootFolders = folders.filter((f) => !f.parentId);

  const docsForWorkspace = useMemo(
    () =>
      currentDocs.filter(
        (d) => (d.extractedQAs?.length ?? 0) > 0 || (d.rawText?.length ?? 0) >= 80,
      ),
    [currentDocs],
  );

  const activeRfpDoc = useMemo(
    () => (rfpId ? documents.find((d) => d.id === rfpId) : null),
    [documents, rfpId],
  );

  const questions = useMemo(() => {
    const doc = activeRfpDoc;
    if (!doc) return [];
    const stored = doc.extractedQAs ?? [];
    if (stored.length > 0) return stored;
    const raw = doc.rawText || "";
    if (raw.length < 80) return [];
    try {
      return extractFromText(raw).qas;
    } catch {
      return [];
    }
  }, [activeRfpDoc]);

  useEffect(() => {
    if (!rfpId) return;
    const d = getDocuments().find((x) => x.id === rfpId);
    if (!d || (d.extractedQAs?.length ?? 0) > 0) return;
    const raw = d.rawText || "";
    if (raw.length < 80) return;
    if (rfpBackfillDone.current.has(rfpId)) return;
    rfpBackfillDone.current.add(rfpId);
    try {
      const { facts, qas } = extractFromText(raw);
      if (qas.length > 0) {
        updateDocument(rfpId, { extractedFacts: facts, extractedQAs: qas });
        refreshDocs();
      }
    } catch {
      /* ignore */
    }
  }, [rfpId, refreshDocs]);

  useEffect(() => {
    if (rfpId && !currentDocs.some((d) => d.id === rfpId)) {
      setRfpId(null);
      setSelectedQuestionIndex(null);
      setAnswers({});
      setAiError("");
      setAiSplitError("");
    }
  }, [currentDocs, rfpId]);

  useEffect(() => {
    if (!rfpId) {
      setAnswers({});
      setSelectedQuestionIndex(null);
      setAiError("");
      return;
    }
    const d = getDocuments().find((x) => x.id === rfpId);
    setAnswers(d?.rfpWorkspaceAnswers && typeof d.rfpWorkspaceAnswers === "object" ? { ...d.rfpWorkspaceAnswers } : {});
    setSelectedQuestionIndex(null);
    setAiError("");
    setAiSplitError("");
  }, [rfpId]);

  const handleAiSplitAndNumberRequirements = useCallback(async () => {
    const doc = getDocuments().find((d) => d.id === rfpId);
    const raw = doc?.rawText?.trim() || "";
    if (!rfpId || !doc || raw.length < 80) return;
    setAiSplitError("");
    setAiSplitLoading(true);
    try {
      const { items } = await structureRfpRequirementsWithAi(raw);
      if (!Array.isArray(items) || items.length === 0) {
        setAiSplitError(t("proposalManagerWorkspace.rfpWorkspace.aiSplitEmpty"));
        return;
      }
      const qas = items.map((it, i) => {
        const n = typeof it.n === "number" && it.n >= 1 ? it.n : i + 1;
        const q = (it.q || "").trim();
        const ref = typeof it.ref === "string" ? it.ref.trim() : "";
        const question = /^\d+[\.)]\s/.test(q) ? q : `${n}. ${q}`;
        return { question, answer: ref };
      });
      updateDocument(rfpId, {
        extractedQAs: qas,
        rfpWorkspaceAnswers: {},
      });
      replaceExtractedQAsInContentHub(rfpId, qas, doc.documentTypeId, DOCUMENT_TYPE_TO_TAGS);
      rfpBackfillDone.current.add(rfpId);
      refreshDocs();
      setAnswers({});
      setSelectedQuestionIndex(null);
      setAiError("");
    } catch (e) {
      setAiSplitError(
        e?.response?.data?.error ?? e?.message ?? t("proposalManagerWorkspace.rfpWorkspace.aiSplitFailed"),
      );
    } finally {
      setAiSplitLoading(false);
    }
  }, [rfpId, t, refreshDocs]);

  const totalQuestions = questions.length;
  const answeredCount = useMemo(() => {
    if (!totalQuestions) return 0;
    let n = 0;
    for (let i = 0; i < totalQuestions; i++) {
      const v = answers[rfpQuestionKey(i)];
      if (typeof v === "string" && v.trim().length > 0) n += 1;
    }
    return n;
  }, [answers, totalQuestions]);

  const progressPercent = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const persistAnswers = useCallback(
    (docId, nextAnswers) => {
      updateDocument(docId, { rfpWorkspaceAnswers: nextAnswers });
      refreshDocs();
    },
    [refreshDocs],
  );

  const handleAnswerChange = useCallback(
    (key, value) => {
      if (!rfpId) return;
      setAnswers((prev) => {
        const next = { ...prev, [key]: value };
        persistAnswers(rfpId, next);
        return next;
      });
    },
    [rfpId, persistAnswers],
  );

  const handleGenerateAiAnswer = useCallback(async () => {
    if (rfpId == null || selectedQuestionIndex == null || selectedQuestionIndex < 0) return;
    const row = questions[selectedQuestionIndex];
    if (!row?.question?.trim()) return;
    setAiError("");
    setAiLoading(true);
    const key = rfpQuestionKey(selectedQuestionIndex);
    const context = (issuerBrief || "").trim().slice(0, 4000);
    const qLine = row.question.trim();
    const docNum = qLine.match(/^(\d+)[\.)]\s/);
    const numberingNote = docNum
      ? `This requirement is numbered ${docNum[1]} in the solicitation text. Respond to this numbered item only.`
      : `This is workspace item ${selectedQuestionIndex + 1} of ${questions.length}. Treat it as one discrete requirement.`;
    const promptParts = [
      "You are a professional proposal writer. Draft a concise, formal response suitable for an RFP submission.",
      "",
      numberingNote,
      "",
      "Requirement / question from the RFP:",
      qLine,
    ];
    if (context) {
      promptParts.push("", "Optional context (issuer / capture notes — use only if relevant):", context);
    }
    promptParts.push("", "Respond in clear prose. Do not repeat the question as a heading unless necessary.");
    try {
      const text = await generateAnswer(promptParts.join("\n"));
      handleAnswerChange(key, text);
    } catch (e) {
      setAiError(e?.response?.data?.error ?? e?.message ?? "AI request failed");
    } finally {
      setAiLoading(false);
    }
  }, [rfpId, selectedQuestionIndex, questions, issuerBrief, handleAnswerChange]);

  const handleOpenGenerateModal = useCallback(() => {
    setDocumentGenerateError("");
    setShowGenerateModal(true);
  }, []);

  const handleGenerateDocument = useCallback(async () => {
    if (!rfpId) return;
    const answeredQuestions = questions
      .map((row, index) => {
        const answer = (answers[rfpQuestionKey(index)] || "").trim();
        if (!answer) return null;
        return {
          number: index + 1,
          question: (row?.question || "").trim(),
          answer,
        };
      })
      .filter(Boolean);

    if (answeredQuestions.length === 0) {
      setDocumentGenerateError(t("proposalManagerWorkspace.rfpWorkspace.generateDocumentNoAnswers"));
      return;
    }

    setDocumentGenerateError("");
    setDocumentGenerating(true);
    try {
      const blob = await generateRfpDocument({
        answeredQuestions,
        companyName: issuer?.name || "",
        companyLogoUrl: issuer?.logoUrl || issuer?.logo || "",
        selectedTemplate,
      });
      const fileName = `rfp-response-${selectedTemplate}.docx`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setShowGenerateModal(false);
    } catch (e) {
      const msg = await messageFromApiError(e);
      setDocumentGenerateError(msg || t("proposalManagerWorkspace.rfpWorkspace.generateDocumentFailed"));
    } finally {
      setDocumentGenerating(false);
    }
  }, [rfpId, questions, answers, issuer, selectedTemplate, t]);

  const selectedKey =
    selectedQuestionIndex != null && selectedQuestionIndex >= 0
      ? rfpQuestionKey(selectedQuestionIndex)
      : null;

  return (
    <div className="min-h-screen bg-[#F6F7FA] dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("proposalManagerWorkspace.title")}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("proposalManagerWorkspace.subtitle")}
          </p>
        </div>

        {issuer && (
          <section className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-indigo-950/40 dark:via-gray-800 dark:to-blue-950/30 p-5 shadow-sm space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0">
                <FiZap className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t("proposalManagerWorkspace.issuerProfileTitle")}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {issuer.name}
                    {issuer.ticker ? ` · ${issuer.ticker}` : ""}
                    {issuer.region ? ` · ${issuer.region}` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/rbac/proposal-manager/company-intelligence")}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
              >
                {t("proposalManagerWorkspace.changeCompany")}
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t("proposalManagerWorkspace.issuerOverviewLabel")}</label>
              <textarea
                value={issuerBrief}
                onChange={(e) => setIssuerBrief(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 text-sm"
              />
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Folders */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FiFolder className="text-indigo-500" /> {t("proposalManagerWorkspace.folders")}
              </h2>
            </div>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddFolder()}
                placeholder={t("proposalManagerWorkspace.newFolderPlaceholder")}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleAddFolder}
                className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
              >
                {t("proposalManagerWorkspace.add")}
              </button>
            </div>
            <ul className="space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => setSelectedFolderId(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${selectedFolderId === null ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                >
                  {t("proposalManagerWorkspace.allDocuments")}
                </button>
              </li>
              {folders.map((f) => (
                <li key={f.id}>
                  {editingFolderId === f.id ? (
                    <div className="flex items-center gap-2 px-2 py-1">
                      <input
                        type="text"
                        value={newFolderName || f.name}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        className="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm"
                      />
                      <button type="button" onClick={() => handleRenameFolder(f.id)} className="text-green-600 text-sm">{t("proposalManagerWorkspace.save")}</button>
                      <button type="button" onClick={() => setEditingFolderId(null)} className="text-gray-500 text-sm">{t("proposalManagerWorkspace.cancel")}</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 group">
                      <button
                        type="button"
                        onClick={() => setSelectedFolderId(selectedFolderId === f.id ? null : f.id)}
                        className={`flex-1 text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${selectedFolderId === f.id ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                      >
                        <FiFolder className="text-amber-500 shrink-0" /> {f.name}
                      </button>
                      <button type="button" onClick={() => { setEditingFolderId(f.id); setNewFolderName(f.name); }} className="p-1.5 rounded text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100" title={t("proposalManagerWorkspace.rename")}><FiEdit2 size={14} /></button>
                      <button type="button" onClick={() => handleDeleteFolder(f.id)} className="p-1.5 rounded text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100" title={t("proposalManagerWorkspace.delete")}><FiTrash2 size={14} /></button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* Upload + Document list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FiUpload className="text-indigo-500" /> {t("proposalManagerWorkspace.uploadDocument")}
              </h2>
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t("proposalManagerWorkspace.documentType")}</label>
                  <select
                    value={documentTypeId}
                    onChange={(e) => setDocumentTypeId(e.target.value)}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                  >
                    {RFP_DOCUMENT_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT}
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium"
                >
                  {uploading ? t("proposalManagerWorkspace.uploading") : t("proposalManagerWorkspace.chooseFile")}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t("proposalManagerWorkspace.maxSizeNote", { maxMb: MAX_FILE_MB })}</p>
              {scanProgress && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
                  {t("proposalManagerWorkspace.scanning", { fileName: scanProgress.fileName, page: scanProgress.page, totalPages: scanProgress.totalPages })}
                  {scanProgress.phase === "ocr" ? ` ${t("proposalManagerWorkspace.ocrSuffix")}` : "…"}
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FiFile className="text-indigo-500" /> {t("proposalManagerWorkspace.documents")}
              </h2>
              {currentDocs.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t("proposalManagerWorkspace.noDocuments")}</p>
              ) : (
                <ul className="space-y-3">
                  {currentDocs.map((doc) => {
                    const typeLabel = RFP_DOCUMENT_TYPES.find((t) => t.id === doc.documentTypeId)?.label || doc.documentTypeId;
                    return (
                      <li
                        key={doc.id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{doc.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{typeLabel} · {formatDate(doc.uploadedAt)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRescan(doc)}
                            disabled={scanningId === doc.id}
                            className="shrink-0 text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                          >
                            {scanningId === doc.id ? t("proposalManagerWorkspace.scanningShort") : t("proposalManagerWorkspace.rescan")}
                          </button>
                          <button
                            type="button"
                            onClick={() => { deleteDocument(doc.id); refreshDocs(); }}
                            className="shrink-0 p-1.5 rounded text-gray-400 hover:text-red-600"
                            title={t("proposalManagerWorkspace.remove")}
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t("proposalManagerWorkspace.scanResult")}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {t("proposalManagerWorkspace.extractedSummary", { facts: doc.extractedFacts?.length ?? 0, qas: doc.extractedQAs?.length ?? 0 })}
                            {(doc.extractedQAs?.length ?? 0) > 0 && ` ${t("proposalManagerWorkspace.viewInContentHub")}`}
                          </p>
                          {doc.extractedFacts?.length > 0 && (
                            <ul className="flex flex-wrap gap-2 mt-2">
                              {doc.extractedFacts.map((f, i) => (
                                <li key={i} className="px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 text-xs">
                                  {humanFactKey(f.key)}: {String(f.value).slice(0, 40)}{String(f.value).length > 40 ? "…" : ""}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        <section className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FiMessageSquare className="text-indigo-500 shrink-0" />
                {t("proposalManagerWorkspace.rfpWorkspace.title")}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t("proposalManagerWorkspace.rfpWorkspace.subtitle")}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              {t("proposalManagerWorkspace.rfpWorkspace.selectDocument")}
            </label>
            <select
              value={rfpId || ""}
              onChange={(e) => setRfpId(e.target.value || null)}
              className="w-full max-w-xl rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
            >
              <option value="">{t("proposalManagerWorkspace.rfpWorkspace.selectPlaceholder")}</option>
              {docsForWorkspace.map((d) => {
                const n = d.extractedQAs?.length ?? 0;
                const label =
                  n > 0
                    ? t("proposalManagerWorkspace.rfpWorkspace.optionWithCount", {
                        name: d.name,
                        count: n,
                      })
                    : t("proposalManagerWorkspace.rfpWorkspace.optionTextOnly", { name: d.name });
                return (
                  <option key={d.id} value={d.id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {!rfpId ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("proposalManagerWorkspace.rfpWorkspace.emptyNoSelection")}
            </p>
          ) : (
            <>
              {(activeRfpDoc?.rawText?.length ?? 0) >= 80 && (
                <div className="mb-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => void handleAiSplitAndNumberRequirements()}
                    disabled={aiSplitLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium shrink-0"
                  >
                    {aiSplitLoading ? (
                      <FiRefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    ) : (
                      <FiZap className="w-4 h-4 shrink-0" />
                    )}
                    {aiSplitLoading
                      ? t("proposalManagerWorkspace.rfpWorkspace.aiSplitRunning")
                      : t("proposalManagerWorkspace.rfpWorkspace.aiSplitButton")}
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
                    {t("proposalManagerWorkspace.rfpWorkspace.aiSplitHint")}
                  </p>
                </div>
              )}
              <div className="mb-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="rfp-document-template"
                    className="text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    {t("proposalManagerWorkspace.rfpWorkspace.documentTemplateLabel")}
                  </label>
                  <select
                    id="rfp-document-template"
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    disabled={documentGenerating}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm w-full sm:w-auto min-w-[12rem]"
                  >
                    {TEMPLATE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenGenerateModal}
                    disabled={documentGenerating || answeredCount === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium"
                  >
                    {documentGenerating
                      ? t("proposalManagerWorkspace.rfpWorkspace.generatingDocument")
                      : t("proposalManagerWorkspace.rfpWorkspace.generateDocumentButton")}
                  </button>
                  {answeredCount === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("proposalManagerWorkspace.rfpWorkspace.generateDocumentHint")}
                    </p>
                  ) : null}
                </div>
              </div>
              {aiSplitError ? (
                <p className="text-sm text-red-600 dark:text-red-400 mb-3">{aiSplitError}</p>
              ) : null}
              {questions.length === 0 ? (
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {t("proposalManagerWorkspace.rfpWorkspace.emptyNoQuestions")}
                </p>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate pr-2" title={activeRfpDoc?.name}>
                        {t("proposalManagerWorkspace.rfpWorkspace.rfpTitleLabel")}: {activeRfpDoc?.name}
                      </h3>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 tabular-nums">
                        {t("proposalManagerWorkspace.rfpWorkspace.progressLabel", {
                          percent: progressPercent,
                          answered: answeredCount,
                          total: totalQuestions,
                        })}
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-[width] duration-300 ease-out"
                        style={{ width: `${progressPercent}%` }}
                        role="progressbar"
                        aria-valuenow={progressPercent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[min(28rem,62vh)]">
                    <div className="lg:col-span-1 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-900/30">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 py-2 border-b border-gray-200 dark:border-gray-600">
                        {t("proposalManagerWorkspace.rfpWorkspace.questionList")}
                      </p>
                      <ul className="overflow-y-auto flex-1 max-h-[min(32rem,60vh)] divide-y divide-gray-200 dark:divide-gray-600">
                        {questions.map((row, index) => {
                          const key = rfpQuestionKey(index);
                          const answered = Boolean(answers[key]?.trim());
                          const selected = selectedQuestionIndex === index;
                          const qText = row.question || t("proposalManagerWorkspace.rfpWorkspace.untitledQuestion");
                          return (
                            <li key={key}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedQuestionIndex(index);
                                  setAiError("");
                                }}
                                title={qText}
                                className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                                  selected
                                    ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-100"
                                    : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                                }`}
                              >
                                <span className="flex items-start gap-2">
                                  <span
                                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                      answered ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                                    }`}
                                    aria-hidden
                                  />
                                  <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">
                                    {qText}
                                  </span>
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div className="lg:col-span-2 flex flex-col border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50/80 dark:bg-gray-900/20 p-4">
                      {selectedQuestionIndex == null ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex-1 flex items-center justify-center min-h-[12rem]">
                          {t("proposalManagerWorkspace.rfpWorkspace.pickQuestion")}
                        </p>
                      ) : (
                        <>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            {t("proposalManagerWorkspace.rfpWorkspace.extractedStub")}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 p-3 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 max-h-[min(14rem,40vh)] min-h-[6rem] overflow-y-auto whitespace-pre-wrap break-words">
                            {workspaceReferenceText(questions[selectedQuestionIndex])}
                          </p>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            {t("proposalManagerWorkspace.rfpWorkspace.yourAnswer")}
                          </label>
                          <textarea
                            value={selectedKey ? answers[selectedKey] ?? "" : ""}
                            onChange={(e) => selectedKey && handleAnswerChange(selectedKey, e.target.value)}
                            rows={10}
                            placeholder={t("proposalManagerWorkspace.rfpWorkspace.answerPlaceholder")}
                            className="flex-1 w-full min-h-[10rem] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm resize-y mb-3"
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => void handleGenerateAiAnswer()}
                              disabled={aiLoading}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium"
                            >
                              {aiLoading ? (
                                <FiRefreshCw className="w-4 h-4 animate-spin shrink-0" />
                              ) : (
                                <FiZap className="w-4 h-4 shrink-0" />
                              )}
                              {aiLoading
                                ? t("proposalManagerWorkspace.rfpWorkspace.aiGenerating")
                                : t("proposalManagerWorkspace.rfpWorkspace.generateWithAi")}
                            </button>
                          </div>
                          {aiError ? (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{aiError}</p>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </div>
      {showGenerateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("proposalManagerWorkspace.rfpWorkspace.generateDocumentModalTitle")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t("proposalManagerWorkspace.rfpWorkspace.generateDocumentModalSubtitle")}
            </p>
            <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
              {t("proposalManagerWorkspace.rfpWorkspace.generateDocumentTemplateSummary", {
                template:
                  TEMPLATE_OPTIONS.find((o) => o.id === selectedTemplate)?.label ?? selectedTemplate,
              })}
            </p>
            {documentGenerateError ? (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">{documentGenerateError}</p>
            ) : null}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!documentGenerating) setShowGenerateModal(false);
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm"
              >
                {t("proposalManagerWorkspace.cancel")}
              </button>
              <button
                type="button"
                onClick={() => void handleGenerateDocument()}
                disabled={documentGenerating}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium"
              >
                {documentGenerating
                  ? t("proposalManagerWorkspace.rfpWorkspace.generatingDocument")
                  : t("proposalManagerWorkspace.rfpWorkspace.confirmGenerateDocument")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

