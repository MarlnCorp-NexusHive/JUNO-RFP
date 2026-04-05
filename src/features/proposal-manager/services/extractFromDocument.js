/**
 * Extract text from PDF (native text layer + OCR), DOCX, XLSX, and plain text; then extract facts and Q&As.
 * Used by Proposal Manager Workspace only.
 */

import * as pdfjsLib from "pdfjs-dist";
import { createWorker } from "tesseract.js";
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";

// PDF.js worker: same version as pdfjs-dist package (must match for compatibility)
const PDFJS_VERSION = "5.5.207";
let workerSrcSet = false;
function ensurePdfWorker() {
  if (workerSrcSet) return;
  if (typeof pdfjsLib.GlobalWorkerOptions !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.mjs`;
    workerSrcSet = true;
  }
}

// If a page yields less than this many characters from the text layer, treat it as image-only and use OCR.
const MIN_TEXT_PER_PAGE = 40;
const PDF_RENDER_SCALE = 2;
const PDF_OCR_RENDER_SCALE = 3; // higher scale for OCR-only pages = clearer text for Tesseract

/**
 * Render a single PDF page to a canvas and return its image as a data URL (PNG).
 * Uses higher scale for OCR so Tesseract gets clearer input.
 */
async function pdfPageToImageDataUrl(page, scaleForOcr = true) {
  const scale = scaleForOcr ? PDF_OCR_RENDER_SCALE : PDF_RENDER_SCALE;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  await page.render({
    canvasContext: ctx,
    viewport,
    intent: "display",
  }).promise;
  return canvas.toDataURL("image/png");
}

/**
 * Sort PDF text items in reading order (top-to-bottom, left-to-right).
 * Items have transform [scaleX, skewX, skewY, scaleY, translateX, translateY]; PDF y increases upward (bottom-left origin).
 */
function sortTextItemsInReadingOrder(items) {
  return [...items].sort((a, b) => {
    const tA = a.transform || [];
    const tB = b.transform || [];
    const yA = tA[5] ?? 0;
    const yB = tB[5] ?? 0;
    const xA = tA[4] ?? 0;
    const xB = tB[4] ?? 0;
    const lineTolerance = 8;
    if (Math.abs(yA - yB) > lineTolerance) return yB - yA; // higher y first (top of page)
    return xA - xB; // left to right
  });
}

/**
 * Run Tesseract OCR on an image data URL; returns extracted text.
 */
async function ocrImage(dataUrl, tesseractWorker) {
  const { data } = await tesseractWorker.recognize(dataUrl);
  return (data?.text || "").trim();
}

/**
 * Extract text from a PDF file. Uses the native text layer when present; falls back to OCR for
 * scanned/image-only pages. Optional onProgress({ page, totalPages, phase }) for UI progress.
 */
export async function extractTextFromPdf(file, onProgress = null) {
  ensurePdfWorker();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  let fullText = "";
  let tesseractWorker = null;

  try {
    for (let i = 1; i <= totalPages; i++) {
      if (onProgress) onProgress({ page: i, totalPages, phase: "text" });

      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const sorted = sortTextItemsInReadingOrder(textContent.items);
      let pageText = sorted.map((item) => item.str).join(" ").trim();

      if (pageText.length < MIN_TEXT_PER_PAGE) {
        if (onProgress) onProgress({ page: i, totalPages, phase: "ocr" });
        if (!tesseractWorker) {
          tesseractWorker = await createWorker("eng", undefined, { logger: () => {} });
        }
        const dataUrl = await pdfPageToImageDataUrl(page);
        const ocrText = await ocrImage(dataUrl, tesseractWorker);
        if (ocrText) pageText = ocrText;
      }

      fullText += pageText + "\n";
    }
  } finally {
    if (tesseractWorker) await tesseractWorker.terminate();
  }

  return fullText;
}

// Regex patterns for common RFP facts (case-insensitive where useful)
const PATTERNS = {
  solicitation_number: [
    /solicitation\s*(?:number|no\.?|#)\s*[:\s]*([A-Z0-9\-_]+)/i,
    /(?:RFP|RFQ|solicitation)\s*#?\s*([A-Z0-9\-]{5,})/i,
    /reference\s*(?:number|no\.?)\s*[:\s]*([A-Z0-9\-_]+)/i,
  ],
  proposal_due_date: [
    /(?:proposal|response|submission)\s*(?:due|deadline)\s*[:\s]*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    /due\s*(?:date|by)\s*[:\s]*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    /(\d{1,2}\/\d{1,2}\/\d{2,4})\s*(?:submission|due)/i,
    /(?:no later than|by)\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i,
  ],
  questions_due_date: [
    /questions?\s*(?:due|deadline|by)\s*[:\s]*([A-Za-z0-9\/\s,]+)/i,
    /inquiries?\s*(?:due|by)\s*[:\s]*([A-Za-z0-9\/\s,]+)/i,
  ],
  naics: [
    /NAICS\s*(?:code)?\s*[:\s]*(\d{6})/i,
    /(\d{6})\s*(?:NAICS|is the NAICS)/i,
  ],
  agency: [
    /(?:issued by|contracting office|agency)\s*[:\s]*([A-Za-z0-9\s\-&.,]+?)(?:\n|$)/i,
    /(?:Department of|DOD|GSA|NASA|DHS)\s+[A-Za-z0-9\s\-&.,]+/i,
  ],
  set_aside: [
    /set-?aside\s*[:\s]*([A-Za-z0-9\s\-]+?)(?:\n|\.|,)/i,
    /(small business|SDVOSB|HUBZone|8\(a\)|WOSB|total small business)/i,
  ],
  contract_type: [
    /contract\s*type\s*[:\s]*([A-Za-z0-9\s\-]+?)(?:\n|\.|,)/i,
    /(FFP|CPFF|CPAF|T&M|IDIQ|BPA|fixed-price|cost-plus)/i,
  ],
  page_limits: [
    /page\s*limit\s*[:\s]*(\d+)/i,
    /(\d+)\s*pages?\s*(?:maximum|max|limit)/i,
    /(?:no more than|maximum of)\s*(\d+)\s*pages?/i,
  ],
  evaluation_criteria: [
    /evaluation\s*(?:factor|criteria)\s*[:\s]*([^\n]+)/i,
    /(?:technical|past performance|cost|price)\s*(?:\d+%|\d+\s*percent)/gi,
  ],
  period_of_performance: [
    /period\s*of\s*performance\s*[:\s]*([^\n]+)/i,
    /(?:base\s*period|option\s*years?)\s*[:\s]*([^\n]+)/i,
  ],
};

function extractFacts(text) {
  const facts = [];
  const seen = new Set();

  Object.entries(PATTERNS).forEach(([key, patterns]) => {
    for (const re of patterns) {
      const m = text.match(re);
      if (m && m[1]) {
        const value = m[1].trim().slice(0, 200);
        const dedupe = `${key}:${value}`;
        if (!seen.has(dedupe)) {
          seen.add(dedupe);
          facts.push({ key, value });
        }
        break;
      }
    }
  });

  return facts;
}

/** Return true if text looks like real sentences (not OCR garbage or random letters). Exported for Content Hub. */
export function looksLikeRealText(str, minLength = 15) {
  if (!str || typeof str !== "string") return false;
  const t = str.trim();
  if (t.length < minLength) return false;
  if (!/\s/.test(t)) return false; // must have at least one space
  const letters = (t.match(/[a-zA-Z]/g) || []).length;
  const letterRatio = letters / t.length;
  if (letterRatio < 0.35) return false; // mostly symbols/numbers
  const words = t.split(/\s+/).filter((w) => w.length > 1);
  if (words.length < 2) return false; // at least two words
  const sameCharRepeated = /^(.)\1{10,}$/;
  if (sameCharRepeated.test(t.replace(/\s/g, ""))) return false;
  return true;
}

/**
 * Questionnaires often put "8. Foo … 9. Bar" in one paragraph. Split before each new list number.
 */
function splitInlineNumberedItems(block) {
  const t = block.trim();
  if (!t) return [];
  const pieces = t.split(/\s+(?=\d{1,2}[\.)]\s+[A-Za-z"(])/);
  return pieces.map((p) => p.trim()).filter((p) => p.length >= 12);
}

/** Drop OCR/page-break junk like "naire" before "8. References:" */
function trimLeadingBeforeFirstListMarker(s) {
  const t = s.trim();
  if (/^\d{1,2}[\.)]\s/.test(t)) return t;
  const m = t.match(/\d{1,2}[\.)]\s+[A-Za-z"(]/);
  if (m && m.index > 0 && m.index < 120) return t.slice(m.index).trim();
  return t;
}

/**
 * Typical RFPs use numbered requirements / shall / must — not "Q:" / "A:" pairs.
 * Turn requirement-like paragraphs into { question, answer } rows (empty answer = draft in UI).
 */
function extractRfpRequirementSnippets(text) {
  const trimmed = text.trim();
  if (trimmed.length < 120) return [];

  const paragraphs = trimmed
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter((b) => b.length >= 35 && b.length <= 4000);

  /** @type {string[]} */
  const chunks = [];
  for (const p of paragraphs) {
    const parts = splitInlineNumberedItems(p);
    const use = parts.length > 0 ? parts : [p];
    for (const raw of use) {
      const cleaned = trimLeadingBeforeFirstListMarker(raw);
      if (cleaned.length >= 20) chunks.push(cleaned);
    }
  }

  const out = [];
  const seen = new Set();

  const add = (p, requireSignal) => {
    const q = p.slice(0, 2000);
    const sig = q.slice(0, 96);
    if (seen.has(sig)) return;
    if (!looksLikeRealText(q, 10)) return;
    if (requireSignal) {
      const isLikely =
        /\?/.test(q) ||
        /\b(shall|must\s+be|must\s+not|is\s+required|are\s+required|offeror|proposer|vendor|contractor|bidder|responding\s+offeror|evaluation\s+criteria|technical\s+approach)\b/i.test(
          q,
        ) ||
        /^\d+[\.)]\s+\S/.test(q) ||
        /^[•*▪▫◦\-–—]\s+\S/.test(q) ||
        /^(section|attachment|exhibit|appendix|volume|part)\s+[A-Z0-9.\-]+/im.test(q);
      if (!isLikely) return;
    }
    seen.add(sig);
    out.push({ question: q, answer: "" });
  };

  for (const p of chunks) {
    add(p, true);
    if (out.length >= 80) break;
  }

  if (out.length === 0) {
    for (const p of chunks) {
      if (p.length < 65 || p.length > 2000) continue;
      add(p, false);
      if (out.length >= 18) break;
    }
  }

  return out;
}

// Q&A: look for Q: / A: or Question / Answer or numbered Q1, A1, etc.
function extractQAs(text) {
  const qas = [];
  const blocks = text.split(/\n\s*\n/);

  let currentQ = null;
  let currentA = null;

  const flush = () => {
    if (currentQ && currentA) {
      const q = currentQ.trim().slice(0, 2000);
      const a = currentA.trim().slice(0, 2000);
      if (looksLikeRealText(q, 8) && looksLikeRealText(a, 8)) {
        qas.push({ question: q, answer: a });
      }
    }
    currentQ = null;
    currentA = null;
  };

  const qStart = /^\s*(?:Q(?:uestion)?\.?\s*\d*\.?|Q:)\s*(.*)/i;
  const aStart = /^\s*(?:A(?:nswer)?\.?\s*\d*\.?|A:)\s*(.*)/i;

  for (const block of blocks) {
    const line = block.trim();
    if (!line) continue;

    const qMatch = line.match(qStart);
    const aMatch = line.match(aStart);

    if (qMatch) {
      flush();
      currentQ = qMatch[1] || line;
      currentA = null;
    } else if (aMatch) {
      if (currentQ) currentA = (currentA ? currentA + "\n" : "") + (aMatch[1] || line);
      else currentA = aMatch[1] || line;
    } else {
      if (currentQ && !currentA) currentQ += "\n" + line;
      else if (currentA) currentA += "\n" + line;
      else if (currentQ) currentA = line;
    }
  }
  flush();

  // Fallback: split on "Question" and "Answer" as section headers
  if (qas.length === 0 && /question|answer/i.test(text)) {
    const parts = text.split(/(?=question\s*\d*|answer\s*\d*)/gi);
    for (let i = 0; i < parts.length - 1; i += 2) {
      const q = parts[i].replace(/^question\s*\d*\s*[.:]?\s*/i, "").trim().slice(0, 2000);
      const a = parts[i + 1].replace(/^answer\s*\d*\s*[.:]?\s*/i, "").trim().slice(0, 2000);
      if (looksLikeRealText(q, 8) && looksLikeRealText(a, 8)) {
        qas.push({ question: q || "(Question)", answer: a || "(Answer)" });
      }
    }
  }

  // Fallback: "Inquiry" / "Response" or "Clarification" / "Response"
  if (qas.length === 0 && /inquiry|response|clarification/i.test(text)) {
    const parts = text.split(/(?=inquiry\s*\d*|response\s*\d*|clarification\s*\d*)/gi);
    for (let i = 0; i < parts.length - 1; i += 2) {
      const q = parts[i].replace(/^(inquiry|clarification)\s*\d*\s*[.:]?\s*/i, "").trim().slice(0, 2000);
      const a = parts[i + 1].replace(/^response\s*\d*\s*[.:]?\s*/i, "").trim().slice(0, 2000);
      if (looksLikeRealText(q, 8) && looksLikeRealText(a, 8)) {
        qas.push({ question: q || "Inquiry", answer: a || "Response" });
      }
    }
  }

  const trimmed = text.trim();

  // RFP-style requirements (numbered / shall / must / Section L, etc.)
  if (qas.length === 0 && trimmed.length > 120) {
    const reqSnippets = extractRfpRequirementSnippets(trimmed);
    if (reqSnippets.length > 0) return reqSnippets;
  }

  // Fallback: one block so workspace always has something when text exists
  if (qas.length === 0 && trimmed.length > 100 && looksLikeRealText(trimmed, 25)) {
    qas.push({
      question: "Document content (no structured requirements detected — draft below)",
      answer: trimmed.slice(0, 2000) + (trimmed.length > 2000 ? "…" : ""),
    });
  }

  return qas;
}

/**
 * @param {File} file - PDF file
 * @param {((e: { page: number, totalPages: number, phase: 'text'|'ocr' }) => void)|null} onProgress
 * @returns {{ text: string, facts: Array<{key, value}>, qas: Array<{question, answer}>}}
 */
export async function extractFromPdfFile(file, onProgress = null) {
  const text = await extractTextFromPdf(file, onProgress);
  const facts = extractFacts(text);
  const qas = extractQAs(text);
  return { text, facts, qas };
}

/**
 * For plain text (.txt): use file text and same heuristics.
 */
export async function extractFromTextFile(file) {
  const text = await file.text();
  const facts = extractFacts(text);
  const qas = extractQAs(text);
  return { text, facts, qas };
}

/**
 * DOCX: extract raw text via mammoth, then facts and Q&As.
 */
export async function extractFromDocxFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = (result?.value) ? result.value : "";
  const facts = extractFacts(text);
  const qas = extractQAs(text);
  return { text, facts, qas };
}

/**
 * XLSX/XLS: all sheets to text (CSV), then facts and Q&As.
 */
export async function extractFromXlsxFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
  const parts = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false, strip: true });
    if (csv.trim()) parts.push(csv);
  }
  const text = parts.join("\n\n");
  const facts = extractFacts(text);
  const qas = extractQAs(text);
  return { text, facts, qas };
}

/**
 * @param {File} file
 * @param {((e: { page: number, totalPages: number, phase: 'text'|'ocr' }) => void)|null} onProgress - only for PDFs
 */
export async function extractFromFile(file, onProgress = null) {
  const type = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  const isPdf = type.includes("pdf") || name.endsWith(".pdf");
  const isDocx = type.includes("wordprocessingml") || type.includes("msword") || name.endsWith(".docx") || name.endsWith(".doc");
  const isXlsx = type.includes("spreadsheet") || type.includes("excel") || name.endsWith(".xlsx") || name.endsWith(".xls");

  if (isPdf) return extractFromPdfFile(file, onProgress);
  if (isDocx) return extractFromDocxFile(file);
  if (isXlsx) return extractFromXlsxFile(file);
  return extractFromTextFile(file);
}

/** Extract facts and Q&As from plain text (e.g. for Rescan when we have stored rawText). */
export function extractFromText(text) {
  const facts = extractFacts(text);
  const qas = extractQAs(text);
  return { text, facts, qas };
}
