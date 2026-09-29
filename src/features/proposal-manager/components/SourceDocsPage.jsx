import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { useProposalIssuer } from "./ProposalIssuerContext";
import { ensureBoilerplateLibrary } from "../services/proposalManagerStorage.js";
import { BOILERPLATE_PACK } from "../data/boilerplateCapabilities.js";
import { scopedStorageKey } from "../../../services/tenantScopedStorage.js";
import { isTrialUserSession } from "../../rfp-collaboration/useTrialCollabT.js";
import { persistTrialFeatureData, canUseTrialFeatures, loadTrialFeatureData } from "../../../services/trialFeatureApi.js";
import { isTrialMode } from "../../../services/trialAuthSession.js";
import {
  scanFileForImportantDates,
  syncSourceDocDeadlinesForDoc,
  removeSourceDocDeadlinesFromCalendar,
  isApplicationDeadlineEvent,
  ingestSourceDocQAsToLibrary,
} from "../services/sourceDocsDeadlineService.js";
import { ingestSourceDocForDashboard } from "../services/sourceDocsDashboardIngest.js";
import { extractDashboardInsightsFromDocument } from "../../../services/api.js";

const STORAGE_KEY = "proposal_manager_source_docs";
const NAME_OVERRIDES_KEY = "proposal_manager_source_docs_names";
const ACCEPT = ".pdf,.doc,.docx,.txt,.xlsx,.xls";
const MAX_FILE_MB = 25;
const MAX_PREVIEW_STORAGE_BYTES = 1.5 * 1024 * 1024;

const BOILERPLATE_FOLDER = "boilerplate";

const BOILERPLATE_FILE_META = {
  "Marln-JUNO-RFP-Capability-Statement": { docx: 9913, html: 4152, shareDocx: "Capability Statement (Word)", shareHtml: "Capability Statement (web)" },
  "Marln-JUNO-Winning-Differentiators": { docx: 9770, html: 3687, shareDocx: "Winning Differentiators (Word)", shareHtml: "Winning Differentiators (web)" },
  "Marln-JUNO-RFP-Lifecycle-Capabilities": { docx: 9556, html: 3260, shareDocx: "Pursuit Lifecycle (Word)", shareHtml: "Pursuit Lifecycle (web)" },
};

const PREUPLOADED_BOILERPLATE_DOCS = BOILERPLATE_PACK.flatMap((pack) => {
  const meta = BOILERPLATE_FILE_META[pack.fileBase] || { docx: 0, html: 0, shareDocx: pack.title, shareHtml: pack.title };
  const htmlUrl = `/documents/boilerplate/${pack.fileBase}.html`;
  return [
    {
      id: `${pack.id}-docx`,
      name: `${pack.fileBase}.docx`,
      url: `/documents/boilerplate/${pack.fileBase}.docx`,
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: meta.docx,
      uploadedAt: pack.uploadedAt,
      preUploaded: true,
      folder: BOILERPLATE_FOLDER,
      shareLabel: meta.shareDocx,
      previewUrl: htmlUrl,
    },
    {
      id: `${pack.id}-html`,
      name: `${pack.fileBase}.html`,
      url: htmlUrl,
      type: "text/html",
      size: meta.html,
      uploadedAt: pack.uploadedAt,
      preUploaded: true,
      folder: BOILERPLATE_FOLDER,
      shareLabel: meta.shareHtml,
    },
  ];
});

// Pre-uploaded documents: place files in public/documents/ and list them here. (sizes in bytes; uploadedAt ISO strings for sorting)
const PREUPLOADED_DOCS = [
  ...PREUPLOADED_BOILERPLATE_DOCS,
  { id: "pre-water-wastewater", name: "Final 2026 RFP- Water Wastewater Study.pdf", url: "/documents/Final 2026 RFP- Water Wastewater Study.pdf", type: "application/pdf", size: 310045, uploadedAt: "2026-09-10T14:22:00.000Z", preUploaded: true },
  { id: "pre-landscape-rfp", name: "CC Final-RFP for Landscape Maintenance Services 9-10-2024.pdf", url: "/documents/CC Final-RFP for Landscape Maintenance Services 9-10-2024.pdf", type: "application/pdf", size: 761095, uploadedAt: "2026-10-15T09:00:00.000Z", preUploaded: true },
  { id: "pre-balsitis-playground", name: "Balsitis Park Playground RFP.pdf", url: "/documents/Balsitis Park Playground RFP.pdf", type: "application/pdf", size: 4239018, uploadedAt: "2026-09-28T11:45:00.000Z", preUploaded: true },
  { id: "pre-surplus-tanks", name: "Surplus tanks.pdf", url: "/documents/Surplus tanks.pdf", type: "application/pdf", size: 338361, uploadedAt: "2026-10-20T16:30:00.000Z", preUploaded: true },
  { id: "pre-airport-restaurant", name: "Final RFP to Lease Restaurant Space at Airport.pdf", url: "/documents/Final RFP to Lease Restaurant Space at Airport.pdf", type: "application/pdf", size: 196310, uploadedAt: "2026-09-05T08:15:00.000Z", preUploaded: true },
];
const PREUPLOADED_IDS = new Set(PREUPLOADED_DOCS.map((d) => d.id));

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDocIcon(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("pdf")) return "📄";
  if (t.includes("html")) return "🌐";
  if (t.includes("word") || t.includes("doc")) return "📝";
  if (t.includes("sheet") || t.includes("excel") || t.includes("xls")) return "📊";
  return "📁";
}

const PREVIEW_FRAME =
  "mt-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 h-40";

function fileKind(doc) {
  const typeStr = (doc.type || "").toLowerCase();
  const name = (doc.name || "").toLowerCase();
  if (typeStr.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  if (typeStr.includes("html") || name.endsWith(".html") || name.endsWith(".htm")) return "html";
  if (typeStr.includes("word") || typeStr.includes("officedocument.wordprocessing") || name.endsWith(".docx") || name.endsWith(".doc")) return "word";
  if (typeStr.includes("sheet") || typeStr.includes("excel") || name.endsWith(".xlsx") || name.endsWith(".xls")) return "excel";
  if (typeStr.includes("text/plain") || typeStr.includes("text/") || name.endsWith(".txt")) return "text";
  return "other";
}

async function readDocBuffer(doc) {
  if (doc.dataUrl?.startsWith("data:")) {
    const base64 = doc.dataUrl.split(",")[1];
    if (!base64) return null;
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return arr.buffer;
  }
  if (!doc.url) return null;
  const res = await fetch(doc.url);
  if (!res.ok) throw new Error("fetch failed");
  return res.arrayBuffer();
}

function openHref(doc) {
  if (doc.url) return doc.url;
  if (doc.dataUrl?.startsWith("data:")) return doc.dataUrl;
  return null;
}

function FallbackPreview({ doc }) {
  const { t } = useTranslation();
  const href = openHref(doc);
  const kind = fileKind(doc);
  const label =
    kind === "word"
      ? t("proposalManagerSourceDocs.previewWord")
      : kind === "excel"
        ? t("proposalManagerSourceDocs.previewExcel")
        : t("proposalManagerSourceDocs.previewGeneric");

  return (
    <div className={`${PREVIEW_FRAME} flex flex-col items-center justify-center gap-2 px-3 text-center`}>
      <span className="text-3xl" aria-hidden>
        {getDocIcon(doc.type)}
      </span>
      <p className="text-xs font-medium text-gray-700 dark:text-gray-200">{label}</p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          download={doc.name}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          {t("proposalManagerSourceDocs.openFile")}
        </a>
      ) : null}
    </div>
  );
}

function ConvertedOfficePreview({ doc }) {
  const { t } = useTranslation();
  const kind = fileKind(doc);
  const [html, setHtml] = useState("");
  const [rows, setRows] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const buf = await readDocBuffer(doc);
        if (!buf) {
          if (!cancelled) setStatus("fallback");
          return;
        }
        if (kind === "word") {
          const result = await mammoth.convertToHtml({ arrayBuffer: buf });
          if (!cancelled) {
            setHtml(result.value || "");
            setStatus(result.value ? "ready" : "fallback");
          }
          return;
        }
        if (kind === "excel") {
          const workbook = XLSX.read(buf, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const table = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }).slice(0, 8);
          if (!cancelled) {
            setRows(table);
            setStatus(table.length ? "ready" : "fallback");
          }
        }
      } catch {
        if (!cancelled) setStatus("fallback");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doc.id, doc.url, doc.dataUrl, kind]);

  if (status === "loading") {
    return (
      <div className={`${PREVIEW_FRAME} flex items-center justify-center text-xs text-gray-500 dark:text-gray-400`}>
        {t("proposalManagerSourceDocs.previewLoading")}
      </div>
    );
  }
  if (status === "fallback") return <FallbackPreview doc={doc} />;

  if (kind === "word") {
    return (
      <div className={PREVIEW_FRAME}>
        <iframe title={doc.name} srcDoc={html} className="w-full h-full bg-white" />
      </div>
    );
  }

  return (
    <div className={`${PREVIEW_FRAME} overflow-auto bg-white dark:bg-gray-900`}>
      <table className="min-w-full text-[10px] text-gray-700 dark:text-gray-200">
        <tbody>
          {(rows || []).map((row, i) => (
            <tr key={i} className={i === 0 ? "bg-gray-50 dark:bg-gray-800 font-semibold" : ""}>
              {(row || []).slice(0, 6).map((cell, j) => (
                <td key={j} className="border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 whitespace-nowrap">
                  {String(cell ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DocPreview({ doc }) {
  const { dataUrl, url, type, name, previewUrl } = doc;
  const kind = fileKind(doc);
  const previewSrc = previewUrl || url || (dataUrl?.startsWith("data:") ? dataUrl : null);

  if (previewUrl || kind === "pdf" || kind === "html") {
    const src = previewUrl || previewSrc;
    if (src) {
      return (
        <div className={PREVIEW_FRAME}>
          <iframe title={name} src={src} className="w-full h-full" />
        </div>
      );
    }
  }

  if (kind === "text" && dataUrl?.startsWith("data:")) {
    try {
      const base64 = dataUrl.split(",")[1];
      const text = atob(base64);
      const lines = text.split(/\r?\n/).slice(0, 6).join("\n");
      return (
        <div className={`${PREVIEW_FRAME} p-3 overflow-y-auto overflow-x-hidden overscroll-contain bg-gray-50 dark:bg-gray-800/50`}>
          <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">{lines}</pre>
        </div>
      );
    } catch {
      return <FallbackPreview doc={doc} />;
    }
  }

  if (kind === "text" && url) {
    return (
      <div className={PREVIEW_FRAME}>
        <iframe title={name} src={url} className="w-full h-full" />
      </div>
    );
  }

  if (kind === "word" || kind === "excel") {
    return <ConvertedOfficePreview doc={doc} />;
  }

  return <FallbackPreview doc={doc} />;
}

function loadStored() {
  try {
    const raw = localStorage.getItem(scopedStorageKey(STORAGE_KEY));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function persistSourceDocsSnapshot(docs, nameOverrides) {
  if (!canUseTrialFeatures()) return;
  persistTrialFeatureData("sourceDocs", {
    docs: Array.isArray(docs) ? docs : loadStored(),
    nameOverrides: nameOverrides && typeof nameOverrides === "object" ? nameOverrides : loadNameOverrides(),
  });
}

function loadNameOverrides() {
  try {
    const raw = localStorage.getItem(scopedStorageKey(NAME_OVERRIDES_KEY));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveNameOverrides(map) {
  try {
    localStorage.setItem(scopedStorageKey(NAME_OVERRIDES_KEY), JSON.stringify(map || {}));
  } catch (e) {
    console.warn("Could not persist source doc names", e);
  }
  persistSourceDocsSnapshot(undefined, map || {});
}

function applyNameOverrides(list, overrides) {
  if (!overrides || !Object.keys(overrides).length) return list;
  return list.map((d) => {
    const label = overrides[d.id];
    if (!label || typeof label !== "string") return d;
    return { ...d, shareLabel: label };
  });
}

function saveStored(list) {
  try {
    const toSave = list.map((d) => {
      const { dataUrl, size } = d;
      if (size > MAX_PREVIEW_STORAGE_BYTES && dataUrl) {
        const { dataUrl: _, ...rest } = d;
        return rest;
      }
      return d;
    });
    localStorage.setItem(scopedStorageKey(STORAGE_KEY), JSON.stringify(toSave));
    persistSourceDocsSnapshot(toSave, undefined);
  } catch (e) {
    console.warn("Could not persist source docs", e);
  }
}

const SORT_OPTIONS = [
  { value: "name", translationKey: "proposalManagerSourceDocs.sort.name" },
  { value: "date", translationKey: "proposalManagerSourceDocs.sort.dateUploaded" },
  { value: "size", translationKey: "proposalManagerSourceDocs.sort.fileSize" },
];

function UploadIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 16V5m0 0l-4 4m4-4l4 4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 16.5V18a2 2 0 002 2h10a2 2 0 002-2v-1.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UploadButton({ onClick, label, size = "md", variant = "primary" }) {
  const isSm = size === "sm";
  const base =
    "group relative inline-flex items-center justify-center gap-2.5 font-semibold tracking-wide transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-offset-gray-900 active:scale-[0.98]";
  const sizing = isSm ? "px-4 py-2 text-sm rounded-xl" : "px-6 py-3 text-sm rounded-2xl";
  const look =
    variant === "soft"
      ? "bg-white/90 dark:bg-gray-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-700/60 shadow-sm hover:border-indigo-400 hover:shadow-md hover:bg-white dark:hover:bg-gray-900"
      : "text-white bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 shadow-[0_10px_24px_-8px_rgba(79,70,229,0.65)] hover:shadow-[0_14px_28px_-8px_rgba(79,70,229,0.75)] hover:brightness-110 border border-white/10";

  return (
    <button type="button" onClick={onClick} className={`${base} ${sizing} ${look}`}>
      <span
        className={`inline-flex items-center justify-center rounded-lg ${
          variant === "soft"
            ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 w-7 h-7"
            : "bg-white/15 text-white w-8 h-8"
        } transition-transform duration-200 group-hover:-translate-y-0.5`}
      >
        <UploadIcon className={isSm ? "w-4 h-4" : "w-4.5 h-4.5 w-[18px] h-[18px]"} />
      </span>
      <span>{label}</span>
    </button>
  );
}

export default function SourceDocsPage() {
  const { t } = useTranslation();
  const { issuer } = useProposalIssuer();
  const [docs, setDocs] = useState(() => {
    const overrides = loadNameOverrides();
    const uploaded = loadStored().filter((d) => !PREUPLOADED_IDS.has(d.id));
    if (isTrialMode()) {
      return applyNameOverrides(uploaded, overrides);
    }
    return [
      ...applyNameOverrides(PREUPLOADED_DOCS, overrides),
      ...applyNameOverrides(uploaded, overrides),
    ];
  });
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [copiedId, setCopiedId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editDraft, setEditDraft] = useState("");
  const [synopsisDocId, setSynopsisDocId] = useState("");
  const inputRef = useRef(null);
  const boilerplateInputRef = useRef(null);
  const renameInputRef = useRef(null);

  useEffect(() => {
    if (isTrialMode()) {
      (async () => {
        const data = await loadTrialFeatureData("sourceDocs", { docs: [], nameOverrides: {} });
        if (Array.isArray(data?.docs)) {
          localStorage.setItem(scopedStorageKey(STORAGE_KEY), JSON.stringify(data.docs));
        }
        if (data?.nameOverrides && typeof data.nameOverrides === "object") {
          localStorage.setItem(scopedStorageKey(NAME_OVERRIDES_KEY), JSON.stringify(data.nameOverrides));
        }
        const overrides = loadNameOverrides();
        const uploaded = loadStored().filter((d) => !PREUPLOADED_IDS.has(d.id));
        setDocs(applyNameOverrides(uploaded, overrides));
      })();
      return;
    }
    ensureBoilerplateLibrary();
  }, []);

  useEffect(() => {
    if (editingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingId]);

  const sortedDocs = React.useMemo(() => {
    const list = [...docs];
    const mult = sortOrder === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortBy === "name") {
        const an = (a.shareLabel || a.name || "").toString();
        const bn = (b.shareLabel || b.name || "").toString();
        return mult * an.localeCompare(bn, undefined, { sensitivity: "base" });
      }
      if (sortBy === "date") {
        return mult * (new Date(a.uploadedAt) - new Date(b.uploadedAt));
      }
      if (sortBy === "size") {
        return mult * (a.size - b.size);
      }
      return 0;
    });
    return list;
  }, [docs, sortBy, sortOrder]);

  const boilerplateDocs = React.useMemo(
    () => sortedDocs.filter((d) => d.folder === BOILERPLATE_FOLDER),
    [sortedDocs]
  );
  const libraryDocs = React.useMemo(
    () => sortedDocs.filter((d) => d.folder !== BOILERPLATE_FOLDER),
    [sortedDocs]
  );

  useEffect(() => {
    saveStored(docs.filter((d) => !d.preUploaded));
    const overrides = {};
    docs.forEach((d) => {
      if (d.shareLabel && String(d.shareLabel).trim()) {
        overrides[d.id] = String(d.shareLabel).trim();
      }
    });
    saveNameOverrides(overrides);
  }, [docs]);

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsDataURL(file);
    });

  const addFiles = async (files, options = {}) => {
    if (!files?.length) return;
    setUploadError("");
    const allowed = ACCEPT.split(",").map((e) => e.trim().toLowerCase());
    const queued = [];
    for (const file of Array.from(files)) {
      const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
      if (!allowed.includes(ext)) {
        setUploadError(
          t("proposalManagerSourceDocs.errorUnsupportedType", {
            fileName: file.name,
          }),
        );
        continue;
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        setUploadError(
          t("proposalManagerSourceDocs.errorFileTooLarge", {
            fileName: file.name,
            maxMb: MAX_FILE_MB,
          }),
        );
        continue;
      }
      let dataUrl = null;
      try {
        dataUrl = await readFileAsDataUrl(file);
      } catch {
        // continue without preview
      }
      const doc = {
        id: crypto.randomUUID?.() ?? `${Date.now()}_${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        dataUrl,
        deadlineScanStatus: "scanning",
        synopsisStatus: "pending",
        synopsis: "",
        synopsisBullets: [],
        importantDates: [],
        qaIngestCount: 0,
        ...(options.folder ? { folder: options.folder } : {}),
      };
      queued.push({ file, doc });
    }
    if (!queued.length) return;

    setDocs((prev) => [...prev, ...queued.map((q) => q.doc)]);

    for (const { file, doc } of queued) {
      try {
        const isPdf = (file.type || "").includes("pdf") || file.name.toLowerCase().endsWith(".pdf");
        const { importantDates, qaItems, documentText } = await scanFileForImportantDates(
          file,
          isPdf ? undefined : null,
        );
        const qaAdded = ingestSourceDocQAsToLibrary(doc.id, qaItems);
        let patched = {
          ...doc,
          importantDates,
          qaIngestCount: qaAdded,
          deadlineScanStatus: "done",
          deadlineScanAt: new Date().toISOString(),
        };
        setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, ...patched } : d)));
        await syncSourceDocDeadlinesForDoc(patched);

        // Deep AI parse: synopsis (all users) + Bid Vault/Compliance/dashboard (trial)
        if (doc.folder !== "boilerplate" && (documentText || "").trim().length > 40) {
          setDocs((prev) =>
            prev.map((d) => (d.id === doc.id ? { ...d, ...patched, synopsisStatus: "scanning" } : d)),
          );
          try {
            let insights = null;
            if (canUseTrialFeatures()) {
              const dashResult = await ingestSourceDocForDashboard(patched, documentText);
              insights = dashResult?.insights || null;
            } else {
              insights = await extractDashboardInsightsFromDocument({
                document: String(documentText).slice(0, 120_000),
                documentName: patched.shareLabel || patched.name || "",
                context: {
                  importantDates: Array.isArray(patched.importantDates)
                    ? patched.importantDates.slice(0, 12)
                    : [],
                },
              });
            }
            if (insights) {
              const synopsis =
                String(insights.synopsis || insights.summary || "").trim() ||
                "";
              const synopsisBullets = Array.isArray(insights.synopsisBullets)
                ? insights.synopsisBullets.map((b) => String(b || "").trim()).filter(Boolean).slice(0, 6)
                : [];
              patched = {
                ...patched,
                dashboardInsights: insights,
                dashboardIngestAt: new Date().toISOString(),
                dashboardIngestStatus: "done",
                synopsis,
                synopsisBullets,
                synopsisStatus: synopsis ? "done" : "empty",
                synopsisAt: new Date().toISOString(),
              };
              setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, ...patched } : d)));
            } else {
              setDocs((prev) =>
                prev.map((d) =>
                  d.id === doc.id
                    ? { ...d, ...patched, synopsisStatus: "empty" }
                    : d,
                ),
              );
            }
          } catch (dashErr) {
            console.warn("[source-docs] AI synopsis/dashboard ingest failed:", file.name, dashErr);
            setDocs((prev) =>
              prev.map((d) =>
                d.id === doc.id
                  ? {
                      ...d,
                      ...patched,
                      dashboardIngestStatus: "error",
                      dashboardIngestError:
                        dashErr?.response?.data?.error || dashErr?.message || "Dashboard ingest failed",
                      synopsisStatus: "error",
                      synopsisError:
                        dashErr?.response?.data?.error || dashErr?.message || "Synopsis failed",
                    }
                  : d,
              ),
            );
          }
        }
      } catch (err) {
        console.warn("[source-docs] AI scan failed:", file.name, err);
        setDocs((prev) =>
          prev.map((d) =>
            d.id === doc.id
              ? {
                  ...d,
                  deadlineScanStatus: "error",
                  deadlineScanError: err?.response?.data?.error || err?.message || "Scan failed",
                  synopsisStatus: "error",
                }
              : d,
          ),
        );
      }
    }
  };

  const handleInputChange = (e) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  const handleBoilerplateInputChange = (e) => {
    addFiles(e.target.files, { folder: BOILERPLATE_FOLDER });
    e.target.value = "";
  };

  const removeDoc = (id) => {
    const existing = docs.find((d) => d.id === id);
    if (existing) void removeSourceDocDeadlinesFromCalendar(existing);
    setDocs((prev) => prev.filter((d) => d.id !== id));
    if (editingId === id) {
      setEditingId("");
      setEditDraft("");
    }
  };

  const startRename = (doc) => {
    setEditingId(doc.id);
    setEditDraft(doc.shareLabel || doc.name || "");
  };

  const cancelRename = () => {
    setEditingId("");
    setEditDraft("");
  };

  const commitRename = (id) => {
    const next = String(editDraft || "").trim();
    if (!next) {
      cancelRename();
      return;
    }
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, shareLabel: next } : d)));
    setEditingId("");
    setEditDraft("");
  };

  const getSafeFileName = (doc) => {
    const n = doc?.name;
    if (n != null && String(n).trim()) return String(n).trim();
    const ext = doc?.type ? (doc.type.includes("pdf") ? "pdf" : doc.type.includes("word") || doc.type.includes("msword") ? "doc" : "bin") : "bin";
    return `document_${doc?.id ?? Date.now()}.${ext}`;
  };

  const dataUrlToFile = (dataUrl, fileName) => {
    const name = (fileName != null && String(fileName).trim()) ? String(fileName).trim() : "document";
    const [header, base64] = dataUrl.split(",");
    const mime = (header.match(/:(.*?);/) || [])[1] || "application/octet-stream";
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new File([arr], name, { type: mime });
  };

  const handleEmail = async (doc) => {
    const fileName = getSafeFileName(doc);
    const subject = encodeURIComponent(`Document: ${fileName}`);
    let body = encodeURIComponent(
      `Please find the attached document: ${fileName}\n\n(Sent from JUNO RFP Source Docs)`
    );
    if (!doc.dataUrl && doc.url) {
      const fullUrl = window.location.origin + doc.url;
      const label = doc.shareLabel || fileName;
      const mailSubject = doc.folder === BOILERPLATE_FOLDER
        ? encodeURIComponent(`Marln JUNO RFP — ${label}`)
        : subject;
      body = encodeURIComponent(
        doc.folder === BOILERPLATE_FOLDER
          ? `Sharing Marln / JUNO RFP boilerplate for your review:\n\n${label}\n${fullUrl}\n\nAudit-Ready. Submission-Ready. Win-Ready.`
          : `Document: ${fileName}\nDownload: ${fullUrl}\n\n(Sent from JUNO RFP Source Docs)`
      );
      window.location.href = `mailto:?subject=${mailSubject}&body=${body}`;
      return;
    }
    const mailto = `mailto:?subject=${subject}&body=${body}`;

    if (doc.dataUrl) {
      try {
        const file = dataUrlToFile(doc.dataUrl, fileName);
        if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: fileName,
            files: [file],
          });
          return;
        }
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
      const blob = dataUrlToFile(doc.dataUrl, fileName);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
    window.location.href = mailto;
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const copyShareLink = async (doc) => {
    if (!doc.url) return;
    const fullUrl = window.location.origin + doc.url;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(doc.id);
      setTimeout(() => setCopiedId(""), 2000);
    } catch {
      window.prompt(t("proposalManagerSourceDocs.copyLink"), fullUrl);
    }
  };

  const renderDocCard = (doc) => {
    const isEditing = editingId === doc.id;
    const displayName = doc.shareLabel || doc.name;
    const synopsisText =
      String(doc.synopsis || doc.dashboardInsights?.synopsis || doc.dashboardInsights?.summary || "").trim();
    const synopsisBullets = Array.isArray(doc.synopsisBullets)
      ? doc.synopsisBullets
      : Array.isArray(doc.dashboardInsights?.synopsisBullets)
        ? doc.dashboardInsights.synopsisBullets
        : [];
    const hasSynopsis = Boolean(synopsisText) || synopsisBullets.length > 0;
    const synopsisBusy =
      doc.synopsisStatus === "scanning" ||
      doc.synopsisStatus === "pending" ||
      doc.deadlineScanStatus === "scanning";
    return (
    <li
      key={doc.id}
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm flex flex-col"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{getDocIcon(doc.type)}</span>
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <input
              ref={renameInputRef}
              type="text"
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitRename(doc.id);
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancelRename();
                }
              }}
              onBlur={() => commitRename(doc.id)}
              className="w-full rounded-lg border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-900 px-2 py-1 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label={t("proposalManagerSourceDocs.renameAriaLabel")}
            />
          ) : (
            <p className="font-medium text-gray-900 dark:text-white truncate" title={displayName}>
              {displayName}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatSize(doc.size)} · {new Date(doc.uploadedAt).toLocaleDateString()}
          </p>
          {doc.deadlineScanStatus === "scanning" && (
            <p className="mt-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
              {t("proposalManagerSourceDocs.scanningDeadlines", {
                defaultValue: "AI deep-scanning for deadlines, Q&As, and synopsis…",
              })}
            </p>
          )}
          {doc.synopsisStatus === "scanning" && doc.deadlineScanStatus !== "scanning" && (
            <p className="mt-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
              {t("proposalManagerSourceDocs.generatingSynopsis", {
                defaultValue: "AI generating document synopsis…",
              })}
            </p>
          )}
          {doc.deadlineScanStatus === "done" && (
            <div className="mt-1 space-y-0.5">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {(() => {
                  const n = (doc.importantDates || []).filter((r) =>
                    isApplicationDeadlineEvent(r.event),
                  ).length;
                  return n > 0
                    ? t("proposalManagerSourceDocs.deadlinesFound", {
                        count: n,
                        defaultValue: "{{count}} application deadline(s) found — added to calendar & alerts",
                      })
                    : t("proposalManagerSourceDocs.noDeadlinesFound", {
                        defaultValue: "No application deadlines detected in this document",
                      });
                })()}
              </p>
              <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                {(doc.qaIngestCount || 0) > 0
                  ? t("proposalManagerSourceDocs.qaLibraryIngested", {
                      count: doc.qaIngestCount,
                      defaultValue: "{{count}} Q&A(s) added to Content Hub library",
                    })
                  : t("proposalManagerSourceDocs.qaLibraryNone", {
                      defaultValue: "No reusable Q&As extracted for the library",
                    })}
              </p>
            </div>
          )}
          {doc.deadlineScanStatus === "error" && (
            <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">
              {t("proposalManagerSourceDocs.deadlineScanFailed", {
                defaultValue: "Deadline scan failed",
              })}
              {doc.deadlineScanError ? `: ${doc.deadlineScanError}` : ""}
            </p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-1">
          {!isEditing && (
            <button
              type="button"
              onClick={() => startRename(doc)}
              className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              title={t("proposalManagerSourceDocs.renameTitle")}
              aria-label={t("proposalManagerSourceDocs.renameAriaLabel")}
            >
              <span className="text-lg">✏️</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => removeDoc(doc.id)}
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title={t("proposalManagerSourceDocs.removeTitle")}
            aria-label={t("proposalManagerSourceDocs.removeAriaLabel")}
          >
            <span className="text-lg">🗑️</span>
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSynopsisDocId(doc.id)}
          disabled={!hasSynopsis && !synopsisBusy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 text-xs font-semibold text-indigo-800 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={t("proposalManagerSourceDocs.viewSynopsisTitle", {
            defaultValue: "View AI synopsis",
          })}
          aria-label={t("proposalManagerSourceDocs.viewSynopsisAriaLabel", {
            defaultValue: "View document synopsis",
          })}
        >
          {synopsisBusy
            ? t("proposalManagerSourceDocs.synopsisBusy", { defaultValue: "Synopsis…" })
            : t("proposalManagerSourceDocs.viewSynopsis", { defaultValue: "View synopsis" })}
        </button>
        {doc.synopsisStatus === "error" && (
          <span className="text-xs text-rose-600 dark:text-rose-400">
            {t("proposalManagerSourceDocs.synopsisFailed", {
              defaultValue: "Synopsis unavailable",
            })}
          </span>
        )}
      </div>
      <DocPreview doc={doc} />
    </li>
    );
  };

  const synopsisDoc = docs.find((d) => d.id === synopsisDocId) || null;
  const synopsisModalText = synopsisDoc
    ? String(
        synopsisDoc.synopsis ||
          synopsisDoc.dashboardInsights?.synopsis ||
          synopsisDoc.dashboardInsights?.summary ||
          "",
      ).trim()
    : "";
  const synopsisModalBullets = synopsisDoc
    ? Array.isArray(synopsisDoc.synopsisBullets)
      ? synopsisDoc.synopsisBullets
      : Array.isArray(synopsisDoc.dashboardInsights?.synopsisBullets)
        ? synopsisDoc.dashboardInsights.synopsisBullets
        : []
    : [];
  const synopsisModalOpp = synopsisDoc?.dashboardInsights?.opportunity || null;

  return (
    <div className="space-y-6">
      <div
        data-tour="1"
        data-tour-title-en="Source Docs overview"
        data-tour-title-ar="نظرة عامة على المستندات"
        data-tour-content-en="Upload and manage Grants/RFP source documents for your company."
        data-tour-content-ar="ارفع وأدر مستندات المنح/طلبات العروض لشركتك."
        data-tour-position="bottom"
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("proposalManagerSourceDocs.title")}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {isTrialUserSession()
            ? t("proposalManagerSourceDocs.subtitleTrial", {
                defaultValue: "Upload and manage Grants/RFP source documents.",
              })
            : t("proposalManagerSourceDocs.subtitle")}
        </p>
      </div>

      {issuer && (
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/90 dark:bg-emerald-900/25 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300">
          {t("proposalManagerSourceDocs.linkedIssuerText", {
            issuerName: issuer.name,
            issuerTicker: issuer.ticker ? ` (${issuer.ticker})` : "",
          })}
        </div>
      )}

      <div
        data-tour="2"
        data-tour-title-en="Upload zone"
        data-tour-title-ar="منطقة الرفع"
        data-tour-content-en="Drag and drop an RFP PDF or Word file. Uploads feed deadlines, dashboard insights, and workspace."
        data-tour-content-ar="اسحب وأفلت ملف PDF أو Word. يغذي الرفع المواعيد ورؤى اللوحة ومساحة العمل."
        data-tour-position="bottom"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 ${
          dragging
            ? "border-indigo-500 bg-indigo-50/90 dark:bg-indigo-950/40 scale-[1.01] shadow-lg shadow-indigo-500/10"
            : "border-gray-300/90 dark:border-gray-600 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/80 dark:to-gray-900/40 hover:border-indigo-400/70 dark:hover:border-indigo-500/50"
        }`}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.12), transparent 40%), radial-gradient(circle at 80% 0%, rgba(139,92,246,0.1), transparent 35%)",
          }}
        />
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
        <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100/80 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 ring-1 ring-indigo-200/60 dark:ring-indigo-700/50">
          <UploadIcon className="w-7 h-7" />
        </div>
        <p className="relative text-gray-600 dark:text-gray-300 mb-5 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          {t("proposalManagerSourceDocs.dragAndDrop")}
        </p>
        <div className="relative">
          <UploadButton
            onClick={() => inputRef.current?.click()}
            label={t("proposalManagerSourceDocs.uploadButton")}
          />
        </div>
        {uploadError && (
          <p className="relative mt-4 text-sm text-red-600 dark:text-red-400">{uploadError}</p>
        )}
      </div>

      <section
        className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 p-5"
        data-tour="3"
        data-tour-title-en="Boilerplate library"
        data-tour-title-ar="مكتبة القوالب"
        data-tour-content-en="Share Marln/JUNO capability boilerplate with prospects from this folder."
        data-tour-content-ar="شارك قوالب قدرات Marln/JUNO مع العملاء المحتملين من هذا المجلد."
        data-tour-position="top"
      >
        <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
              {t("proposalManagerSourceDocs.boilerplateEyebrow")}
            </p>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("proposalManagerSourceDocs.boilerplateTitle")}
            </h2>
          </div>
          <div>
            <input
              ref={boilerplateInputRef}
              type="file"
              accept={ACCEPT}
              multiple
              onChange={handleBoilerplateInputChange}
              className="hidden"
            />
            <UploadButton
              onClick={() => boilerplateInputRef.current?.click()}
              label={t("proposalManagerSourceDocs.uploadButton")}
              size="sm"
              variant="soft"
            />
          </div>
        </div>
        {boilerplateDocs.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {t("proposalManagerSourceDocs.boilerplateEmpty", {
              defaultValue: "No documents in this section yet. Upload PDF, Word, Excel, or text files.",
            })}
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            {boilerplateDocs.map((doc) => renderDocCard(doc))}
          </ul>
        )}
      </section>

      <section
        data-tour="4"
        data-tour-title-en="Uploaded documents"
        data-tour-title-ar="المستندات المرفوعة"
        data-tour-content-en="Open, rename, or remove files. Use View synopsis when AI insights are ready."
        data-tour-content-ar="افتح أو أعد تسمية أو احذف الملفات. استخدم عرض الملخص عندما تكون رؤى الذكاء جاهزة."
        data-tour-position="top"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("proposalManagerSourceDocs.uploadedDocumentsTitle")}</h2>
          {libraryDocs.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm text-gray-600 dark:text-gray-400">{t("proposalManagerSourceDocs.sortBy")}</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.translationKey)}
                  </option>
                ))}
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="asc">{t("proposalManagerSourceDocs.ascending")}</option>
                <option value="desc">{t("proposalManagerSourceDocs.descending")}</option>
              </select>
            </div>
          )}
        </div>
        {libraryDocs.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-8 text-center text-gray-500 dark:text-gray-400">
            {t("proposalManagerSourceDocs.emptyState")}
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {libraryDocs.map((doc) => renderDocCard(doc))}
          </ul>
        )}
      </section>

      {synopsisDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="source-doc-synopsis-title"
          onClick={() => setSynopsisDocId("")}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-700 p-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                  {t("proposalManagerSourceDocs.synopsisEyebrow", {
                    defaultValue: "AI synopsis",
                  })}
                </p>
                <h3
                  id="source-doc-synopsis-title"
                  className="text-lg font-semibold text-gray-900 dark:text-white truncate"
                  title={synopsisDoc.shareLabel || synopsisDoc.name}
                >
                  {synopsisDoc.shareLabel || synopsisDoc.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSynopsisDocId("")}
                className="shrink-0 rounded-lg px-2 py-1 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label={t("proposalManagerSourceDocs.closeSynopsis", {
                  defaultValue: "Close",
                })}
              >
                ✕
              </button>
            </div>

            {synopsisDoc.synopsisStatus === "scanning" || synopsisDoc.synopsisStatus === "pending" ? (
              <p className="text-sm text-indigo-600 dark:text-indigo-300">
                {t("proposalManagerSourceDocs.generatingSynopsis", {
                  defaultValue: "AI generating document synopsis…",
                })}
              </p>
            ) : synopsisModalText || synopsisModalBullets.length ? (
              <div className="space-y-3">
                {synopsisModalOpp &&
                  (synopsisModalOpp.agency ||
                    synopsisModalOpp.number ||
                    synopsisModalOpp.deadline ||
                    synopsisModalOpp.valueEstimate != null) && (
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800/80 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 space-y-1">
                      {synopsisModalOpp.agency ? (
                        <p>
                          <span className="font-semibold">
                            {t("proposalManagerSourceDocs.synopsisAgency", {
                              defaultValue: "Agency",
                            })}
                            :
                          </span>{" "}
                          {synopsisModalOpp.agency}
                        </p>
                      ) : null}
                      {synopsisModalOpp.number ? (
                        <p>
                          <span className="font-semibold">
                            {t("proposalManagerSourceDocs.synopsisNumber", {
                              defaultValue: "Solicitation #",
                            })}
                            :
                          </span>{" "}
                          {synopsisModalOpp.number}
                        </p>
                      ) : null}
                      {synopsisModalOpp.deadline ? (
                        <p>
                          <span className="font-semibold">
                            {t("proposalManagerSourceDocs.synopsisDeadline", {
                              defaultValue: "Deadline",
                            })}
                            :
                          </span>{" "}
                          {synopsisModalOpp.deadline}
                        </p>
                      ) : null}
                      {synopsisModalOpp.valueEstimate != null ? (
                        <p>
                          <span className="font-semibold">
                            {t("proposalManagerSourceDocs.synopsisValue", {
                              defaultValue: "Est. value",
                            })}
                            :
                          </span>{" "}
                          {Number(synopsisModalOpp.valueEstimate).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                  )}
                {synopsisModalText ? (
                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {synopsisModalText}
                  </p>
                ) : null}
                {synopsisModalBullets.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800 dark:text-gray-200">
                    {synopsisModalBullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("proposalManagerSourceDocs.synopsisEmpty", {
                  defaultValue: "No synopsis is available for this document yet.",
                })}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
