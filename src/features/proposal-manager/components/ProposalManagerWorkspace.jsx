import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import {
  FiFolder,
  FiFile,
  FiUpload,
  FiTrash2,
  FiEdit2,
  FiZap,
  FiMessageSquare,
  FiRefreshCw,
  FiChevronDown,
  FiCheck,
  FiUserPlus,
  FiGrid,
} from "react-icons/fi";
import { useProposalIssuer } from "./ProposalIssuerContext";
import {
  generateAnswer,
  structureRfpRequirementsWithAi,
  generateRfpDocument,
  extractStructuredRfpData,
  seedWorkspaceDocument,
  saveWorkspaceDocument,
  getWorkspaceDocument,
  exportWorkspaceDocument,
} from "../../../services/api.js";
import { rfpCollab } from "../../../services/rfpCollabApi.js";
import { ensureProposalManagerCollabSession } from "../../rfp-collaboration/rfpCollabSession.js";
import {
  buildCollabQuestionsPayload,
  mapServerQuestionsToLocalIndices,
} from "../services/workspaceCollabBridge.js";
import RichTextAnswerEditor, { toPlainTextFromHtml, toHtmlFromPlain } from "./document/RichTextAnswerEditor.jsx";

const ACCEPT = ".pdf,.doc,.docx,.txt,.xlsx,.xls";
const MAX_FILE_MB = 25;
const TEMPLATE_PREVIEW_BASE = `${(import.meta.env.BASE_URL || "/").replace(/\/$/, "")}/rfp-template-previews`;

const COLLAB_STATUS_KEYS = {
  unassigned: "rfpCollaboration.status.unassigned",
  assigned: "rfpCollaboration.status.assigned",
  in_progress: "rfpCollaboration.status.inProgress",
  submitted: "rfpCollaboration.status.submitted",
  approved: "rfpCollaboration.status.approved",
  rejected: "rfpCollaboration.status.rejected",
  changes_requested: "rfpCollaboration.status.changesRequested",
};

const TEMPLATE_OPTIONS = [
  {
    id: "standard-industry",
    labelKey: "proposalManagerWorkspace.rfpWorkspace.documentTemplates.standardIndustry",
    describeKey: "proposalManagerWorkspace.rfpWorkspace.documentTemplates.standardIndustryDescription",
    thumbVariant: "standard",
    previewSrc: `${TEMPLATE_PREVIEW_BASE}/standard-industry.svg`,
  },
  {
    id: "federal-style",
    labelKey: "proposalManagerWorkspace.rfpWorkspace.documentTemplates.federalStyle",
    describeKey: "proposalManagerWorkspace.rfpWorkspace.documentTemplates.federalStyleDescription",
    thumbVariant: "federal",
    previewSrc: `${TEMPLATE_PREVIEW_BASE}/federal-style.svg`,
  },
  {
    id: "lean-commercial",
    labelKey: "proposalManagerWorkspace.rfpWorkspace.documentTemplates.leanCommercial",
    describeKey: "proposalManagerWorkspace.rfpWorkspace.documentTemplates.leanCommercialDescription",
    thumbVariant: "lean",
    previewSrc: `${TEMPLATE_PREVIEW_BASE}/lean-commercial.svg`,
  },
];

/** Raster/SVG preview with CSS mockup fallback if the image fails to load. */
function RfpTemplatePreviewImage({ src, variant, title, className = "" }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <RfpTemplateThumbnail variant={variant} className={className} />;
  }
  return (
    <div
      className={`overflow-hidden rounded-lg border border-gray-200/90 dark:border-gray-600 bg-white dark:bg-gray-950 shadow-sm ${className}`}
    >
      <img
        src={src}
        alt=""
        title={title}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover object-top block"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

/** Mini document mockup for template thumbnails (fallback only). */
function RfpTemplateThumbnail({ variant, className = "" }) {
  const cfg =
    variant === "federal"
      ? { sections: 7, accent: "bg-slate-600 dark:bg-slate-500", tight: true }
      : variant === "lean"
        ? { sections: 4, accent: "bg-emerald-600 dark:bg-emerald-500", tight: false }
        : { sections: 9, accent: "bg-indigo-500 dark:bg-indigo-500", tight: true };

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-inner ${className}`}
      aria-hidden
    >
      <div className={`h-2 w-full ${cfg.accent}`} />
      <div className={`p-2 ${cfg.tight ? "space-y-1" : "space-y-1.5"}`}>
        {Array.from({ length: cfg.sections }).map((_, i) => (
          <div key={i} className="space-y-0.5">
            <div
              className="h-1 rounded-sm bg-gray-400/90 dark:bg-gray-500"
              style={{ width: `${72 + ((i * 7) % 24)}%` }}
            />
            <div className="h-0.5 rounded-sm bg-gray-200 dark:bg-gray-600 w-full" />
            {!cfg.tight ? (
              <div className="h-0.5 rounded-sm bg-gray-100 dark:bg-gray-700 w-[88%]" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const [selectedTemplate, setSelectedTemplate] = useState("standard-industry");
  const [documentGenerating, setDocumentGenerating] = useState(false);
  const [documentGenerateError, setDocumentGenerateError] = useState("");
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const templatePickerRef = useRef(null);

  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditAuditors, setAuditAuditors] = useState([]);
  const [selectedAuditorId, setSelectedAuditorId] = useState("");
  const [auditAssignBusy, setAuditAssignBusy] = useState(false);
  const [auditAssignError, setAuditAssignError] = useState("");
  const [collabQuestionByIndex, setCollabQuestionByIndex] = useState({});
  const [structuredExtractLoading, setStructuredExtractLoading] = useState(false);
  const [structuredExtractError, setStructuredExtractError] = useState("");
  const [structuredExtractResult, setStructuredExtractResult] = useState(null);
  const [showStructuredModal, setShowStructuredModal] = useState(false);
  const [workspaceDocumentModel, setWorkspaceDocumentModel] = useState({
    title: "RFP Response",
    sections: [],
  });
  const [workspaceDocumentSyncError, setWorkspaceDocumentSyncError] = useState("");
  const [workspaceDocExporting, setWorkspaceDocExporting] = useState(false);

  useEffect(() => {
    if (!templatePickerOpen) return;
    const onMouseDown = (e) => {
      if (templatePickerRef.current && !templatePickerRef.current.contains(e.target)) {
        setTemplatePickerOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setTemplatePickerOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [templatePickerOpen]);

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
      setStructuredExtractError("");
      setStructuredExtractResult(null);
      setShowStructuredModal(false);
      return;
    }
    const d = getDocuments().find((x) => x.id === rfpId);
    setAnswers(d?.rfpWorkspaceAnswers && typeof d.rfpWorkspaceAnswers === "object" ? { ...d.rfpWorkspaceAnswers } : {});
    setSelectedQuestionIndex(null);
    setAiError("");
    setAiSplitError("");
    setStructuredExtractError("");
    setStructuredExtractResult(null);
    setShowStructuredModal(false);
  }, [rfpId]);

  const collabLinkKey = useMemo(() => {
    const d = activeRfpDoc;
    if (!d?.rfpCollabWorkspaceId) return "";
    const ids = d.rfpCollabQuestionIds;
    return `${d.rfpCollabWorkspaceId}:${Array.isArray(ids) ? ids.join(",") : ""}`;
  }, [activeRfpDoc]);

  const collabLinked =
    Boolean(activeRfpDoc?.rfpCollabWorkspaceId) &&
    Array.isArray(activeRfpDoc?.rfpCollabQuestionIds) &&
    activeRfpDoc.rfpCollabQuestionIds.length === questions.length &&
    questions.length > 0;

  const collabLinkStale =
    Boolean(activeRfpDoc?.rfpCollabWorkspaceId) &&
    questions.length > 0 &&
    (!Array.isArray(activeRfpDoc?.rfpCollabQuestionIds) ||
      activeRfpDoc.rfpCollabQuestionIds.length !== questions.length);

  useEffect(() => {
    if (!rfpId || !collabLinked) {
      setCollabQuestionByIndex({});
      return;
    }
    let cancelled = false;
    let iv;
    const tick = async () => {
      if (cancelled) return;
      const doc = getDocuments().find((d) => d.id === rfpId);
      if (!doc?.rfpCollabWorkspaceId || !Array.isArray(doc.rfpCollabQuestionIds)) return;
      if (doc.rfpCollabQuestionIds.length !== questions.length) return;
      try {
        const sess = await ensureProposalManagerCollabSession();
        const tok = sess?.token;
        if (!tok) return;
        const { data } = await rfpCollab.getWorkspace(tok, doc.rfpCollabWorkspaceId);
        if (cancelled) return;
        const sqs = data.questions || [];
        const next = {};
        doc.rfpCollabQuestionIds.forEach((id, idx) => {
          if (!id) return;
          const sq = sqs.find((q) => q.id === id);
          if (sq) next[idx] = sq;
        });
        setCollabQuestionByIndex(next);
      } catch {
        if (!cancelled) setCollabQuestionByIndex({});
      }
    };
    tick();
    iv = setInterval(tick, 12_000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [rfpId, collabLinked, collabLinkKey, questions.length, activeRfpDoc?.rfpCollabWorkspaceId]);

  useEffect(() => {
    if (!showAuditModal) return;
    let cancelled = false;
    setAuditAssignError("");
    (async () => {
      try {
        const sess = await ensureProposalManagerCollabSession();
        const tok = sess?.token;
        if (!tok) {
          if (!cancelled) {
            setAuditAssignError(t("proposalManagerWorkspace.rfpWorkspace.auditCollabRequired"));
          }
          return;
        }
        const { data } = await rfpCollab.listAuditors(tok);
        const list = data.auditors || [];
        if (cancelled) return;
        setAuditAuditors(list);
        setSelectedAuditorId((prev) => {
          if (prev && list.some((a) => a.id === prev)) return prev;
          return list[0]?.id || "";
        });
      } catch (e) {
        if (!cancelled) setAuditAssignError(await messageFromApiError(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showAuditModal, t]);

  const handleUnlinkCollab = useCallback(() => {
    if (!rfpId) return;
    updateDocument(rfpId, { rfpCollabWorkspaceId: null, rfpCollabQuestionIds: null });
    refreshDocs();
    setCollabQuestionByIndex({});
  }, [rfpId, refreshDocs]);

  const handleConfirmAssignAudit = useCallback(async () => {
    if (rfpId == null || selectedQuestionIndex == null || selectedQuestionIndex < 0 || !selectedAuditorId) return;
    setAuditAssignBusy(true);
    setAuditAssignError("");
    try {
      const sess = await ensureProposalManagerCollabSession();
      const tok = sess?.token;
      if (!tok) {
        setAuditAssignError(t("proposalManagerWorkspace.rfpWorkspace.auditCollabRequired"));
        return;
      }
      let doc = getDocuments().find((d) => d.id === rfpId);
      if (!doc) return;
      let wsId = doc.rfpCollabWorkspaceId;
      let qIds = doc.rfpCollabQuestionIds;
      const needsNew =
        !wsId ||
        !Array.isArray(qIds) ||
        qIds.length !== questions.length ||
        !qIds[selectedQuestionIndex];

      if (needsNew) {
        const title = `${doc.name || "RFP"} — audit`;
        const { data } = await rfpCollab.createWorkspace(tok, {
          title: title.slice(0, 500),
          document: (doc.rawText || "").slice(0, 500_000),
          questions: buildCollabQuestionsPayload(questions),
        });
        wsId = data.workspace.id;
        qIds = mapServerQuestionsToLocalIndices(questions, data.questions || []);
        if (!qIds.length || qIds.some((id) => !id)) {
          setAuditAssignError(t("proposalManagerWorkspace.rfpWorkspace.auditCollabMapFailed"));
          return;
        }
        updateDocument(rfpId, { rfpCollabWorkspaceId: wsId, rfpCollabQuestionIds: qIds });
        refreshDocs();
        doc = getDocuments().find((d) => d.id === rfpId) || doc;
      }

      const questionId = (qIds || doc.rfpCollabQuestionIds || [])[selectedQuestionIndex];
      if (!questionId) {
        setAuditAssignError(t("proposalManagerWorkspace.rfpWorkspace.auditCollabMapFailed"));
        return;
      }

      await rfpCollab.assignQuestion(tok, {
        workspaceId: wsId,
        questionId,
        auditorUserId: selectedAuditorId,
      });
      setShowAuditModal(false);
      const { data: wsData } = await rfpCollab.getWorkspace(tok, wsId);
      const ids = (getDocuments().find((d) => d.id === rfpId) || doc).rfpCollabQuestionIds || qIds;
      const next = {};
      const sqs = wsData.questions || [];
      ids.forEach((id, idx) => {
        if (!id) return;
        const sq = sqs.find((q) => q.id === id);
        if (sq) next[idx] = sq;
      });
      setCollabQuestionByIndex(next);
    } catch (e) {
      setAuditAssignError(await messageFromApiError(e));
    } finally {
      setAuditAssignBusy(false);
    }
  }, [
    rfpId,
    selectedQuestionIndex,
    selectedAuditorId,
    questions,
    t,
    refreshDocs,
  ]);

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
        rfpCollabWorkspaceId: null,
        rfpCollabQuestionIds: null,
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

  const handleExtractStructured = useCallback(async () => {
    const doc = getDocuments().find((d) => d.id === rfpId);
    const raw = doc?.rawText?.trim() || "";
    if (!rfpId || !doc || raw.length < 80) return;
    setStructuredExtractError("");
    setStructuredExtractLoading(true);
    try {
      const opts = { documentId: doc.id };
      if (doc.rfpCollabWorkspaceId) opts.workspaceId = doc.rfpCollabWorkspaceId;
      const data = await extractStructuredRfpData(raw, opts);
      setStructuredExtractResult(data);
      setShowStructuredModal(true);
    } catch (e) {
      setStructuredExtractError(await messageFromApiError(e));
    } finally {
      setStructuredExtractLoading(false);
    }
  }, [rfpId]);

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

  const handleInsertAuditorResponse = useCallback(() => {
    if (selectedQuestionIndex == null || selectedQuestionIndex < 0) return;
    const key = rfpQuestionKey(selectedQuestionIndex);
    const cq = collabQuestionByIndex[selectedQuestionIndex];
    const text = (cq?.submittedAnswer || "").trim();
    if (!text) return;
    const cur = (answers[key] || "").trim();
    const merged = cur ? `${cur}\n\n---\n${text}` : text;
    handleAnswerChange(key, merged);
  }, [selectedQuestionIndex, collabQuestionByIndex, answers, handleAnswerChange]);

  useEffect(() => {
    if (!rfpId || !collabLinked) return;
    setAnswers((prev) => {
      const next = { ...prev };
      let changed = false;

      Object.entries(collabQuestionByIndex).forEach(([idxStr, cq]) => {
        const idx = Number(idxStr);
        if (!Number.isInteger(idx) || idx < 0) return;
        if (cq?.status !== "approved") return;

        const approvedText = String(cq?.submittedAnswer || "").trim();
        if (!approvedText) return;

        const key = rfpQuestionKey(idx);
        const existing = String(next[key] || "").trim();
        if (existing) return;

        next[key] = approvedText;
        changed = true;
      });

      if (!changed) return prev;
      persistAnswers(rfpId, next);
      return next;
    });
  }, [rfpId, collabLinked, collabQuestionByIndex, persistAnswers]);

  const handleGenerateAiAnswer = useCallback(async () => {
    if (rfpId == null || selectedQuestionIndex == null || selectedQuestionIndex < 0) return;
    const row = questions[selectedQuestionIndex];
    if (!row?.question?.trim()) return;
    setAiError("");
    setAiLoading(true);
    const key = rfpQuestionKey(selectedQuestionIndex);
    const draftAnswer = (answers[key] || "").trim();
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
    if (draftAnswer) {
      promptParts.push(
        "",
        "The offeror has typed a short draft in the response box. Turn it into a full, submission-ready answer.",
        "Rules:",
        "- Preserve the meaning and any facts in the draft (yes/no, counts, numbers such as \"5\", refusals such as \"No\", etc.); do not contradict the draft.",
        "- If the draft is very brief, interpret it in the context of the requirement above and expand with clear, professional prose appropriate for an RFP.",
        "- Do not paste the draft alone; expand it into complete sentences and paragraphs as needed.",
        "",
        "Draft to expand:",
        draftAnswer,
      );
    }
    promptParts.push("", "Respond in clear prose. Do not repeat the question as a heading unless necessary.");
    try {
      const text = await generateAnswer(promptParts.join("\n"));
      handleAnswerChange(key, text);
      setWorkspaceDocumentModel((prev) => ({
        ...prev,
        sections: (prev.sections || []).map((s) =>
          s.id === key ? { ...s, answerHtml: toHtmlFromPlain(text) } : s,
        ),
      }));
    } catch (e) {
      setAiError(e?.response?.data?.error ?? e?.message ?? "AI request failed");
    } finally {
      setAiLoading(false);
    }
  }, [rfpId, selectedQuestionIndex, questions, answers, issuerBrief, handleAnswerChange]);

  const handleOpenGenerateModal = useCallback(() => {
    setDocumentGenerateError("");
    setShowGenerateModal(true);
  }, []);

  const selectedKey =
    selectedQuestionIndex != null && selectedQuestionIndex >= 0
      ? rfpQuestionKey(selectedQuestionIndex)
      : null;

  const workspaceDocId = useMemo(() => {
    if (!rfpId) return null;
    const collabId = activeRfpDoc?.rfpCollabWorkspaceId;
    return collabId ? `collab_${collabId}` : `pm_${rfpId}`;
  }, [rfpId, activeRfpDoc?.rfpCollabWorkspaceId]);

  const computedDocumentModel = useMemo(() => {
    const sections = questions.map((row, idx) => {
      const key = rfpQuestionKey(idx);
      const plain = answers[key] ?? "";
      const existing = workspaceDocumentModel.sections?.find((s) => s.id === key);
      const answerHtml = existing?.answerHtml?.trim() ? existing.answerHtml : toHtmlFromPlain(plain);
      return {
        id: key,
        question: (row?.question || "").trim(),
        answerHtml,
        formatting: existing?.formatting || {},
      };
    });
    return {
      title: workspaceDocumentModel.title || "RFP Response",
      sections,
    };
  }, [questions, answers, workspaceDocumentModel]);

  const handleGenerateDocument = useCallback(async () => {
    if (!rfpId) return;
    setDocumentGenerateError("");
    setDocumentGenerating(true);
    try {
      const answeredCountForExport = computedDocumentModel.sections.filter((s) =>
        String(s?.answerHtml || "").replace(/<[^>]*>/g, "").trim(),
      ).length;
      if (answeredCountForExport === 0) {
        setDocumentGenerateError(t("proposalManagerWorkspace.rfpWorkspace.generateDocumentNoAnswers"));
        return;
      }
      if (!workspaceDocId) {
        setDocumentGenerateError("Workspace document id missing");
        return;
      }

      await saveWorkspaceDocument(workspaceDocId, computedDocumentModel);
      const blob = await exportWorkspaceDocument(workspaceDocId);
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
  }, [rfpId, computedDocumentModel, workspaceDocId, selectedTemplate, t]);

  useEffect(() => {
    if (!workspaceDocId) return;
    let cancelled = false;
    (async () => {
      try {
        setWorkspaceDocumentSyncError("");
        const loaded = await getWorkspaceDocument(workspaceDocId);
        if (!cancelled && loaded?.document) {
          setWorkspaceDocumentModel(loaded.document);
          return;
        }
      } catch {
        // not found is expected on first load
      }
      try {
        const seeded = await seedWorkspaceDocument(workspaceDocId, { questions, answers });
        if (!cancelled && seeded?.document) {
          setWorkspaceDocumentModel(seeded.document);
        }
      } catch (e) {
        if (!cancelled) setWorkspaceDocumentSyncError(e?.message || "Could not initialize document model");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceDocId]);

  useEffect(() => {
    if (!workspaceDocId) return;
    const timer = setTimeout(async () => {
      try {
        setWorkspaceDocumentSyncError("");
        await saveWorkspaceDocument(workspaceDocId, computedDocumentModel);
      } catch (e) {
        setWorkspaceDocumentSyncError(e?.message || "Could not sync document model");
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [workspaceDocId, computedDocumentModel]);

  const handleDownloadWorkspaceDocument = useCallback(async () => {
    if (!workspaceDocId) return;
    setWorkspaceDocExporting(true);
    try {
      await saveWorkspaceDocument(workspaceDocId, computedDocumentModel);
      const blob = await exportWorkspaceDocument(workspaceDocId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeRfpDoc?.name || "rfp-response"}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setWorkspaceDocumentSyncError(await messageFromApiError(e));
    } finally {
      setWorkspaceDocExporting(false);
    }
  }, [workspaceDocId, computedDocumentModel, activeRfpDoc?.name]);

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
                <div className="mb-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
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
                    <button
                      type="button"
                      onClick={() => void handleExtractStructured()}
                      disabled={structuredExtractLoading || aiSplitLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 disabled:opacity-50 text-white text-sm font-medium shrink-0"
                    >
                      {structuredExtractLoading ? (
                        <FiRefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      ) : (
                        <FiGrid className="w-4 h-4 shrink-0" />
                      )}
                      {structuredExtractLoading
                        ? t("proposalManagerWorkspace.rfpWorkspace.extractStructuredRunning")
                        : t("proposalManagerWorkspace.rfpWorkspace.extractStructuredButton")}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
                    {t("proposalManagerWorkspace.rfpWorkspace.aiSplitHint")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
                    {t("proposalManagerWorkspace.rfpWorkspace.extractStructuredHint")}
                  </p>
                  {structuredExtractError ? (
                    <p className="text-sm text-red-600 dark:text-red-400">{structuredExtractError}</p>
                  ) : null}
                </div>
              )}
              <div className="mb-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
                <div className="flex flex-col gap-1 relative max-w-3xl" ref={templatePickerRef}>
                  <span
                    id="rfp-document-template-label"
                    className="text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    {t("proposalManagerWorkspace.rfpWorkspace.documentTemplateLabel")}
                  </span>
                  <button
                    type="button"
                    id="rfp-document-template"
                    aria-haspopup="listbox"
                    aria-expanded={templatePickerOpen}
                    aria-labelledby="rfp-document-template-label rfp-document-template"
                    disabled={documentGenerating}
                    onClick={() => setTemplatePickerOpen((o) => !o)}
                    className="inline-flex items-center justify-between gap-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm w-full sm:w-auto min-w-[14rem] text-left hover:bg-gray-50 dark:hover:bg-gray-600/80 disabled:opacity-50"
                  >
                    <span className="truncate">
                      {(() => {
                        const opt = TEMPLATE_OPTIONS.find((o) => o.id === selectedTemplate);
                        return opt ? t(opt.labelKey) : selectedTemplate;
                      })()}
                    </span>
                    <FiChevronDown
                      className={`w-4 h-4 shrink-0 text-gray-500 transition-transform ${templatePickerOpen ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </button>

                  {templatePickerOpen ? (
                    <div
                      role="listbox"
                      aria-label={t("proposalManagerWorkspace.rfpWorkspace.documentTemplateLabel")}
                      className="absolute left-0 top-full z-40 mt-1 w-full min-w-[min(100%,24rem)] sm:min-w-[28rem] rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl p-3"
                    >
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 px-0.5">
                        {t("proposalManagerWorkspace.rfpWorkspace.documentTemplatePickerHint")}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {TEMPLATE_OPTIONS.map((opt) => {
                          const selected = opt.id === selectedTemplate;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              role="option"
                              aria-selected={selected}
                              onClick={() => {
                                setSelectedTemplate(opt.id);
                                setTemplatePickerOpen(false);
                              }}
                              className={`flex flex-col rounded-lg border p-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                                selected
                                  ? "border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 ring-1 ring-indigo-400 dark:ring-indigo-600"
                                  : "border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                              }`}
                            >
                              <RfpTemplatePreviewImage
                                src={opt.previewSrc}
                                variant={opt.thumbVariant}
                                title={t(opt.labelKey)}
                                className="w-full aspect-[3/4] max-h-[140px] mb-2"
                              />
                              <span className="text-xs font-semibold text-gray-900 dark:text-white flex items-start gap-1.5">
                                {selected ? (
                                  <FiCheck
                                    className="w-3.5 h-3.5 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5"
                                    aria-hidden
                                  />
                                ) : (
                                  <span className="w-3.5 shrink-0" aria-hidden />
                                )}
                                <span className="leading-tight">{t(opt.labelKey)}</span>
                              </span>
                              <span className="text-[11px] leading-snug text-gray-600 dark:text-gray-400 mt-1 ps-[22px]">
                                {t(opt.describeKey)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed mt-1">
                    {t("proposalManagerWorkspace.rfpWorkspace.documentTemplateAiHint")}
                  </p>
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

                  {collabLinkStale ? (
                    <div className="mb-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/90 dark:bg-amber-950/30 px-3 py-2.5 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-amber-900 dark:text-amber-100">
                        {t("proposalManagerWorkspace.rfpWorkspace.auditLinkStale")}
                      </p>
                      <button
                        type="button"
                        onClick={handleUnlinkCollab}
                        className="text-sm font-medium text-amber-900 dark:text-amber-100 underline decoration-amber-700/60 hover:decoration-amber-900 dark:hover:decoration-amber-200"
                      >
                        {t("proposalManagerWorkspace.rfpWorkspace.auditUnlinkCollab")}
                      </button>
                    </div>
                  ) : null}

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
                          const cq = collabQuestionByIndex[index];
                          const auditStatus =
                            cq && cq.status && cq.status !== "unassigned"
                              ? t(COLLAB_STATUS_KEYS[cq.status] || COLLAB_STATUS_KEYS.unassigned)
                              : null;
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
                                    <span className="block">{qText}</span>
                                    {auditStatus ? (
                                      <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200">
                                        {t("proposalManagerWorkspace.rfpWorkspace.auditBadge")}: {auditStatus}
                                      </span>
                                    ) : null}
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

                          {collabLinked ? (
                            <div className="mb-3 rounded-lg border border-violet-200/90 dark:border-violet-800/80 bg-violet-50/60 dark:bg-violet-950/25 p-3 space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-violet-900 dark:text-violet-100 uppercase tracking-wide">
                                  {t("proposalManagerWorkspace.rfpWorkspace.auditPanelTitle")}
                                </p>
                                {activeRfpDoc?.rfpCollabWorkspaceId ? (
                                  <Link
                                    to={`/rbac/proposal-manager/rfp-collaboration/w/${activeRfpDoc.rfpCollabWorkspaceId}`}
                                    className="text-xs font-medium text-violet-700 dark:text-violet-300 hover:underline"
                                  >
                                    {t("proposalManagerWorkspace.rfpWorkspace.auditOpenHub")}
                                  </Link>
                                ) : null}
                              </div>
                              {(() => {
                                const cq = collabQuestionByIndex[selectedQuestionIndex];
                                if (!cq) {
                                  return (
                                    <p className="text-xs text-violet-800/80 dark:text-violet-200/80">
                                      {t("proposalManagerWorkspace.rfpWorkspace.auditStatusLoading")}
                                    </p>
                                  );
                                }
                                const stLabel = t(
                                  COLLAB_STATUS_KEYS[cq.status] || COLLAB_STATUS_KEYS.unassigned,
                                );
                                return (
                                  <>
                                    <p className="text-xs text-violet-900 dark:text-violet-100">
                                      <span className="font-medium text-violet-950 dark:text-violet-50">
                                        {t("rfpCollaboration.statusLabel")}:
                                      </span>{" "}
                                      {stLabel}
                                      {cq.assignedToName ? (
                                        <>
                                          {" · "}
                                          <span className="font-medium">{t("rfpCollaboration.assignee")}:</span>{" "}
                                          {cq.assignedToName}
                                        </>
                                      ) : null}
                                    </p>
                                    {cq.submittedAnswer?.trim() ? (
                                      <div className="space-y-2">
                                        <p className="text-xs font-medium text-violet-900 dark:text-violet-100">
                                          {t("proposalManagerWorkspace.rfpWorkspace.auditorSubmittedLabel")}
                                        </p>
                                        <div className="text-sm text-gray-800 dark:text-gray-200 max-h-32 overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-violet-200/80 dark:border-violet-800 bg-white/80 dark:bg-gray-900/40 p-2">
                                          {cq.submittedAnswer.trim()}
                                        </div>
                                        <button
                                          type="button"
                                          onClick={handleInsertAuditorResponse}
                                          className="text-xs font-medium text-violet-700 dark:text-violet-300 hover:underline"
                                        >
                                          {t("proposalManagerWorkspace.rfpWorkspace.insertAuditorResponse")}
                                        </button>
                                      </div>
                                    ) : cq.answerDraft?.trim() && cq.status !== "submitted" ? (
                                      <p className="text-xs text-violet-800 dark:text-violet-200/90 italic">
                                        {t("proposalManagerWorkspace.rfpWorkspace.auditDraftInProgress")}
                                      </p>
                                    ) : cq.status === "assigned" || cq.status === "in_progress" ? (
                                      <p className="text-xs text-violet-800 dark:text-violet-200/90">
                                        {t("proposalManagerWorkspace.rfpWorkspace.auditWaitingAuditor")}
                                      </p>
                                    ) : null}
                                  </>
                                );
                              })()}
                            </div>
                          ) : null}

                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                              {t("proposalManagerWorkspace.rfpWorkspace.yourAnswer")}
                            </label>
                            <RichTextAnswerEditor
                              valueHtml={
                                selectedKey
                                  ? computedDocumentModel.sections.find((s) => s.id === selectedKey)?.answerHtml || "<p></p>"
                                  : "<p></p>"
                              }
                              placeholder={t("proposalManagerWorkspace.rfpWorkspace.answerPlaceholder")}
                              onChange={(html) => {
                                if (!selectedKey) return;
                                const plain = toPlainTextFromHtml(html);
                                handleAnswerChange(selectedKey, plain);
                                setWorkspaceDocumentModel((prev) => ({
                                  ...prev,
                                  sections: (prev.sections || []).map((s) =>
                                    s.id === selectedKey ? { ...s, answerHtml: html } : s,
                                  ),
                                }));
                              }}
                            />
                          </div>
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
                            <button
                              type="button"
                              onClick={() => {
                                setAuditAssignError("");
                                setShowAuditModal(true);
                              }}
                              disabled={auditAssignBusy || collabLinkStale}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-violet-500/80 dark:border-violet-500 bg-white dark:bg-gray-800 text-violet-800 dark:text-violet-200 hover:bg-violet-50 dark:hover:bg-violet-950/40 disabled:opacity-50 text-sm font-medium"
                            >
                              <FiUserPlus className="w-4 h-4 shrink-0" />
                              {t("rfpCollaboration.askToAudit")}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDownloadWorkspaceDocument()}
                              disabled={workspaceDocExporting}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-sm font-medium"
                            >
                              {workspaceDocExporting ? "Preparing..." : "Download Document"}
                            </button>
                          </div>
                          {aiError ? (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{aiError}</p>
                          ) : null}
                          {workspaceDocumentSyncError ? (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{workspaceDocumentSyncError}</p>
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
                template: (() => {
                  const opt = TEMPLATE_OPTIONS.find((o) => o.id === selectedTemplate);
                  return opt ? t(opt.labelKey) : selectedTemplate;
                })(),
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

      {showStructuredModal && structuredExtractResult ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("proposalManagerWorkspace.rfpWorkspace.structuredModalTitle")}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t("proposalManagerWorkspace.rfpWorkspace.structuredModalSummary", {
                  tables: structuredExtractResult.tables?.length ?? 0,
                  figures: structuredExtractResult.figures?.length ?? 0,
                })}
              </p>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6 text-sm">
              {(structuredExtractResult.tables?.length ?? 0) === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">{t("proposalManagerWorkspace.rfpWorkspace.structuredNoTables")}</p>
              ) : (
                <div className="space-y-4">
                  {structuredExtractResult.tables.map((tbl) => {
                    const headers = tbl.headers || [];
                    const rows = tbl.rows || [];
                    return (
                    <div key={tbl.id} className="rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                      <p className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {tbl.id}
                        {tbl.title ? ` · ${tbl.title}` : ""}
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr>
                              {headers.map((h, i) => (
                                <th key={i} className="border border-gray-200 dark:border-gray-600 px-2 py-1 font-semibold text-gray-800 dark:text-gray-200">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row, ri) => (
                              <tr key={ri}>
                                {headers.map((_, ci) => (
                                  <td key={ci} className="border border-gray-200 dark:border-gray-600 px-2 py-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words max-w-xs">
                                    {row?.[ci] ?? ""}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
              {(structuredExtractResult.figures?.length ?? 0) === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">{t("proposalManagerWorkspace.rfpWorkspace.structuredNoFigures")}</p>
              ) : (
                <ul className="space-y-3">
                  {structuredExtractResult.figures.map((fig) => (
                    <li key={fig.id} className="rounded-lg border border-gray-200 dark:border-gray-600 p-3">
                      <p className="font-medium text-gray-900 dark:text-white">{fig.caption}</p>
                      <p className="mt-1 text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{fig.description}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowStructuredModal(false)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
              >
                {t("proposalManagerWorkspace.rfpWorkspace.structuredModalClose")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showAuditModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-5"
            role="dialog"
            aria-labelledby="audit-modal-title"
          >
            <h3 id="audit-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("proposalManagerWorkspace.rfpWorkspace.auditModalTitle")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t("proposalManagerWorkspace.rfpWorkspace.auditModalSubtitle")}
            </p>
            {auditAssignError ? (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">{auditAssignError}</p>
            ) : null}
            <label className="block mt-4 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              {t("proposalManagerWorkspace.rfpWorkspace.auditSelectAuditor")}
            </label>
            <select
              value={selectedAuditorId}
              onChange={(e) => setSelectedAuditorId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 text-sm"
            >
              {auditAuditors.length === 0 ? (
                <option value="">{t("proposalManagerWorkspace.rfpWorkspace.auditNoAuditors")}</option>
              ) : (
                auditAuditors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name || a.email}
                  </option>
                ))
              )}
            </select>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!auditAssignBusy) setShowAuditModal(false);
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm"
              >
                {t("proposalManagerWorkspace.cancel")}
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmAssignAudit()}
                disabled={auditAssignBusy || !selectedAuditorId || auditAuditors.length === 0}
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium"
              >
                {auditAssignBusy
                  ? t("proposalManagerWorkspace.rfpWorkspace.auditAssigning")
                  : t("proposalManagerWorkspace.rfpWorkspace.auditConfirmAssign")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

