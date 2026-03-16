import React, { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "proposal_manager_source_docs";
const ACCEPT = ".pdf,.doc,.docx,.txt,.xlsx,.xls";
const MAX_FILE_MB = 25;
const MAX_PREVIEW_STORAGE_BYTES = 1.5 * 1024 * 1024;

// Pre-uploaded documents: place files in public/documents/ and list them here. (sizes in bytes; uploadedAt ISO strings for sorting)
const PREUPLOADED_DOCS = [
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
  if (t.includes("word") || t.includes("doc")) return "📝";
  if (t.includes("sheet") || t.includes("excel") || t.includes("xls")) return "📊";
  return "📁";
}

function DocPreview({ doc }) {
  const { dataUrl, url, type, name } = doc;
  const previewSrc = url || (dataUrl ? (dataUrl.startsWith("data:") ? dataUrl : null) : null);
  const isUrl = !!url;

  if (!previewSrc) {
    return (
      <div className="mt-3 rounded-lg bg-gray-100 dark:bg-gray-700/50 h-32 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
        Preview not available
      </div>
    );
  }
  const t = (type || "").toLowerCase();
  const isPdf = t.includes("pdf");
  const isText = t.includes("text/plain") || t.includes("text/") || (name && name.toLowerCase().endsWith(".txt"));

  if (isPdf || (isUrl && isText)) {
    return (
      <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 h-40">
        <iframe title={name} src={previewSrc} className="w-full h-full" />
      </div>
    );
  }
  if (isText && dataUrl) {
    try {
      const base64 = dataUrl.split(",")[1];
      const text = atob(base64);
      const lines = text.split(/\r?\n/).slice(0, 6).join("\n");
      return (
        <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-3 h-32 overflow-y-auto overflow-x-hidden overscroll-contain">
          <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">{lines}</pre>
        </div>
      );
    } catch {
      return (
        <div className="mt-3 rounded-lg bg-gray-100 dark:bg-gray-700/50 h-32 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
          Preview not available
        </div>
      );
    }
  }
  return (
    <div className="mt-3 rounded-lg bg-gray-100 dark:bg-gray-700/50 h-32 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
      Preview not available for this file type
    </div>
  );
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
  { value: "name", label: "Name" },
  { value: "date", label: "Date uploaded" },
  { value: "size", label: "File size" },
];

export default function SourceDocsPage() {
  const [docs, setDocs] = useState(() => [...PREUPLOADED_DOCS, ...loadStored().filter((d) => !PREUPLOADED_IDS.has(d.id))]);
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const inputRef = useRef(null);

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
        setUploadError(`"${file.name}" has an unsupported type. Use PDF, DOC, DOCX, TXT, or XLS/XLSX.`);
        continue;
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        setUploadError(`"${file.name}" is larger than ${MAX_FILE_MB} MB.`);
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
      body = encodeURIComponent(
        `Document: ${fileName}\nDownload: ${fullUrl}\n\n(Sent from JUNO RFP Source Docs)`
      );
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Source Docs</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Upload and manage RFP source documents. All uploaded files are listed below.
        </p>
      </div>

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
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Drag and drop RFP documents here, or click the button below.
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-colors"
        >
          <span className="text-lg">📤</span>
          Upload RFP documents
        </button>
        {uploadError && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{uploadError}</p>
        )}
      </div>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Uploaded Documents</h2>
          {docs.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm text-gray-600 dark:text-gray-400">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          )}
        </div>
        {docs.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-8 text-center text-gray-500 dark:text-gray-400">
            No documents yet. Upload PDF, Word, Excel, or text files above.
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedDocs.map((doc) => (
              <li
                key={doc.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm flex flex-col"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getDocIcon(doc.type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate" title={doc.name}>
                      {doc.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatSize(doc.size)} · {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEmail(doc)}
                      className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                      title="Email this document"
                      aria-label="Email document"
                    >
                      <span className="text-lg">✉️</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeDoc(doc.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Remove"
                      aria-label="Remove document"
                    >
                      <span className="text-lg">🗑️</span>
                    </button>
                  </div>
                </div>
                <DocPreview doc={doc} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
