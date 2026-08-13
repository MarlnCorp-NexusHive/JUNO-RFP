import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { useProposalIssuer } from "./ProposalIssuerContext";
import { ensureBoilerplateLibrary } from "../services/proposalManagerStorage.js";
import { BOILERPLATE_PACK } from "../data/boilerplateCapabilities.js";

const STORAGE_KEY = "proposal_manager_source_docs";
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
  { id: "pre-water-wastewater", name: "Final 2026 RFP- Water Wastewater Study.pdf", url: "/documents/Final 2026 RFP- Water Wastewater Study.pdf", type: "application/pdf", size: 310045, uploadedAt: "2025-02-10T14:22:00.000Z", preUploaded: true },
  { id: "pre-landscape-rfp", name: "CC Final-RFP for Landscape Maintenance Services 9-10-2024.pdf", url: "/documents/CC Final-RFP for Landscape Maintenance Services 9-10-2024.pdf", type: "application/pdf", size: 761095, uploadedAt: "2024-09-15T09:00:00.000Z", preUploaded: true },
  { id: "pre-balsitis-playground", name: "Balsitis Park Playground RFP.pdf", url: "/documents/Balsitis Park Playground RFP.pdf", type: "application/pdf", size: 4239018, uploadedAt: "2025-01-28T11:45:00.000Z", preUploaded: true },
  { id: "pre-surplus-tanks", name: "Surplus tanks.pdf", url: "/documents/Surplus tanks.pdf", type: "application/pdf", size: 338361, uploadedAt: "2024-11-20T16:30:00.000Z", preUploaded: true },
  { id: "pre-airport-restaurant", name: "Final RFP to Lease Restaurant Space at Airport.pdf", url: "/documents/Final RFP to Lease Restaurant Space at Airport.pdf", type: "application/pdf", size: 196310, uploadedAt: "2025-02-05T08:15:00.000Z", preUploaded: true },
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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn("Could not persist source docs", e);
  }
}

const SORT_OPTIONS = [
  { value: "name", translationKey: "proposalManagerSourceDocs.sort.name" },
  { value: "date", translationKey: "proposalManagerSourceDocs.sort.dateUploaded" },
  { value: "size", translationKey: "proposalManagerSourceDocs.sort.fileSize" },
];

export default function SourceDocsPage() {
  const { t } = useTranslation();
  const { issuer } = useProposalIssuer();
  const [docs, setDocs] = useState(() => [...PREUPLOADED_DOCS, ...loadStored().filter((d) => !PREUPLOADED_IDS.has(d.id))]);
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [copiedId, setCopiedId] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    ensureBoilerplateLibrary();
  }, []);

  const sortedDocs = React.useMemo(() => {
    const list = [...docs];
    const mult = sortOrder === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortBy === "name") {
        return mult * (a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
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
  }, [docs]);

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsDataURL(file);
    });

  const addFiles = async (files) => {
    if (!files?.length) return;
    setUploadError("");
    const allowed = ACCEPT.split(",").map((e) => e.trim().toLowerCase());
    const toAdd = [];
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
      toAdd.push({
        id: crypto.randomUUID?.() ?? Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        dataUrl,
      });
    }
    setDocs((prev) => [...prev, ...toAdd]);
  };

  const handleInputChange = (e) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  const removeDoc = (id) => setDocs((prev) => prev.filter((d) => d.id !== id));

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

  const emailBoilerplateFolder = () => {
    const lines = boilerplateDocs.map((d) => {
      const label = d.shareLabel || d.name;
      return `${label}\n${window.location.origin}${d.url}`;
    });
    const subject = encodeURIComponent("Marln JUNO RFP — Winning capability boilerplate");
    const body = encodeURIComponent(
      `Please find Marln Corporation / JUNO RFP winning-capability boilerplate (share with any prospect or lead):\n\n${lines.join("\n\n")}\n\nAudit-Ready. Submission-Ready. Win-Ready.`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const renderDocCard = (doc) => (
    <li
      key={doc.id}
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm flex flex-col"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{getDocIcon(doc.type)}</span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 dark:text-white truncate" title={doc.name}>
            {doc.shareLabel || doc.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatSize(doc.size)} · {new Date(doc.uploadedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1">
          {doc.url ? (
            <button
              type="button"
              onClick={() => copyShareLink(doc)}
              className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-xs font-medium"
              title={t("proposalManagerSourceDocs.copyLink")}
              aria-label={t("proposalManagerSourceDocs.copyLink")}
            >
              {copiedId === doc.id ? "✓" : "🔗"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => handleEmail(doc)}
            className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            title={t("proposalManagerSourceDocs.emailTitle")}
            aria-label={t("proposalManagerSourceDocs.emailAriaLabel")}
          >
            <span className="text-lg">✉️</span>
          </button>
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
      <DocPreview doc={doc} />
    </li>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("proposalManagerSourceDocs.title")}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t("proposalManagerSourceDocs.subtitle")}</p>
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
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
            : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
        <p className="text-gray-600 dark:text-gray-400 mb-4">{t("proposalManagerSourceDocs.dragAndDrop")}</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-colors"
        >
          <span className="text-lg">📤</span>
          {t("proposalManagerSourceDocs.uploadButton")}
        </button>
        {uploadError && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{uploadError}</p>
        )}
      </div>

      <section className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
              {t("proposalManagerSourceDocs.boilerplateEyebrow")}
            </p>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("proposalManagerSourceDocs.boilerplateTitle")}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-3xl">
              {t("proposalManagerSourceDocs.boilerplateSubtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={emailBoilerplateFolder}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 shadow-sm"
          >
            ✉️ {t("proposalManagerSourceDocs.shareFolder")}
          </button>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
          {boilerplateDocs.map(renderDocCard)}
        </ul>
      </section>

      <section>
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
            {libraryDocs.map(renderDocCard)}
          </ul>
        )}
      </section>
    </div>
  );
}
