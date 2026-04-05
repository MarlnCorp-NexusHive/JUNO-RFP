import React, { useState, useRef, useCallback, useEffect } from "react";
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
} from "../services/proposalManagerStorage";
import { extractFromFile, extractFromText } from "../services/extractFromDocument";
import { RFP_DOCUMENT_TYPES, DOCUMENT_TYPE_TO_TAGS } from "../data/documentTypes";
import { FiFolder, FiFile, FiUpload, FiTrash2, FiEdit2, FiChevronDown, FiChevronRight, FiZap } from "react-icons/fi";
import { useProposalIssuer } from "./ProposalIssuerContext";

const ACCEPT = ".pdf,.doc,.docx,.txt,.xlsx,.xls";
const MAX_FILE_MB = 25;

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
      </div>
    </div>
  );
}

