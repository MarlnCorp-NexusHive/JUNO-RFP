import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PizZip from "pizzip";
import { getWorkspaceDocument } from "./workspaceDocumentService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.join(
  __dirname,
  "templates",
  "marln-technical-proposal-dxc-template.docx",
);

const MAX_AI_REPLACEMENTS = 55;
const MAX_NEW_TEXT_LEN = 14_000;
const MAX_PAYLOAD_CHARS = 48_000;
const STYLED_EXPORT_MODEL = process.env.STYLED_EXPORT_MODEL || "gpt-4o";

function decodeXmlText(s) {
  return String(s || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function escapeXmlText(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Strip C0 controls and lone surrogates so Word does not reject document.xml. */
function sanitizePlainForXml(s) {
  return String(s || "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/[\uD800-\uDFFF]/g, "");
}

function simpleParagraphXml(plainText) {
  const t = sanitizePlainForXml(String(plainText ?? ""));
  const esc = escapeXmlText(t);
  return `<w:p><w:r><w:t xml:space="preserve">${esc}</w:t></w:r></w:p>`;
}

/**
 * When AI returns no in-body replacements (or the API fails), append Q&A so the
 * download is still the branded template plus all answers at the end.
 */
function appendWorkspaceAnnexToDocumentXml(documentXml, qa) {
  const lines = [
    "— Workspace responses (attached; template body unchanged) —",
    "",
    "The automatic paragraph merge did not apply or returned no safe targets. Your answers are included below so nothing is lost.",
    "",
  ];
  for (const row of qa) {
    lines.push(`${row.number}. ${row.question}`);
    lines.push(row.answer);
    lines.push("");
  }
  const annexXml = lines.map((line) => simpleParagraphXml(line)).join("");
  const sectIdx = documentXml.indexOf("<w:sectPr");
  if (sectIdx !== -1) {
    return documentXml.slice(0, sectIdx) + annexXml + documentXml.slice(sectIdx);
  }
  const bodyClose = documentXml.lastIndexOf("</w:body>");
  if (bodyClose !== -1) {
    return documentXml.slice(0, bodyClose) + annexXml + documentXml.slice(bodyClose);
  }
  return documentXml + annexXml;
}

/**
 * Marln DXC template hard-codes a sample client name split across two `<w:t>` runs
 * (Confidentiality clause and similar blocks). Replace with the workspace-linked issuer.
 */
const TEMPLATE_RECIPIENT_NAME_PART1 = "<w:t>Dalilna</w:t>";
const TEMPLATE_RECIPIENT_NAME_PART2 =
  '<w:t xml:space="preserve"> for Training and Consultancy Company</w:t>';

function applyWorkspaceRecipientCompanyNameToDocumentXml(documentXml, displayName) {
  const plain = sanitizePlainForXml(String(displayName || "").trim()).slice(0, 500);
  if (!plain || !documentXml.includes("Dalilna")) return documentXml;
  const esc = escapeXmlText(plain);
  let out = documentXml;
  if (out.includes(TEMPLATE_RECIPIENT_NAME_PART1)) {
    out = out.replaceAll(
      TEMPLATE_RECIPIENT_NAME_PART1,
      `<w:t xml:space="preserve">${esc}</w:t>`,
    );
  }
  if (out.includes(TEMPLATE_RECIPIENT_NAME_PART2)) {
    out = out.replaceAll(TEMPLATE_RECIPIENT_NAME_PART2, `<w:t xml:space="preserve"></w:t>`);
  }
  return out;
}

function extractParagraphPlainText(pXml) {
  const runs = [...pXml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)];
  return runs.map((m) => decodeXmlText(m[1])).join("");
}

function stripHtmlToPlain(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** `<w:p` that starts a paragraph, not `<w:pPr` / `<w:pict` / etc. */
function findNextWParagraphStart(xml, fromIndex) {
  let pos = fromIndex;
  while (pos < xml.length) {
    const idx = xml.indexOf("<w:p", pos);
    if (idx === -1) return -1;
    const ch = xml[idx + 4];
    if (ch !== undefined && /[A-Za-z]/.test(ch)) {
      pos = idx + 4;
      continue;
    }
    return idx;
  }
  return -1;
}

/** Exclusive end index after the `>` that closes `<w:p ...>` or `<w:p .../>`. Respects `"` in attributes. */
function findWParagraphOpenTagEnd(xml, openStart) {
  let inDouble = false;
  const i0 = openStart + 4;
  for (let i = i0; i < xml.length; i++) {
    const c = xml[i];
    if (c === '"') {
      inDouble = !inDouble;
      continue;
    }
    if (!inDouble && c === ">") {
      return i + 1;
    }
  }
  return -1;
}

const CLOSE_W_P = "</w:p>";

/**
 * Exclusive end index after the `</w:p>` that closes the paragraph opened at
 * `openStart`, counting nested `<w:p>` (e.g. inside `w:txbxContent` / shapes).
 */
function findMatchingWParagraphCloseEnd(xml, openTagExclusiveEnd) {
  let depth = 1;
  let i = openTagExclusiveEnd;
  while (depth > 0 && i < xml.length) {
    const nextClose = xml.indexOf(CLOSE_W_P, i);
    if (nextClose === -1) return -1;
    const nextOpen = findNextWParagraphStart(xml, i);
    if (nextOpen !== -1 && nextOpen < nextClose) {
      const nestedOpenEnd = findWParagraphOpenTagEnd(xml, nextOpen);
      if (nestedOpenEnd === -1) return -1;
      const nestedSelfClosing =
        nestedOpenEnd >= 2 && xml[nestedOpenEnd - 2] === "/";
      if (nestedSelfClosing) {
        i = nestedOpenEnd;
        continue;
      }
      depth++;
      i = nestedOpenEnd;
      continue;
    }
    depth--;
    if (depth === 0) {
      return nextClose + CLOSE_W_P.length;
    }
    i = nextClose + CLOSE_W_P.length;
  }
  return -1;
}

/**
 * Split `word/document.xml` on `<w:p>` blocks. Handles self-closing empty
 * paragraphs (`<w:p .../>`) — a naive `[\s\S]*?</w:p>` regex would swallow the
 * next real paragraph and corrupt OOXML (Word then refuses to open the file).
 */
function splitDocumentBodyIntoSegments(documentXml) {
  const segments = [];
  let last = 0;
  let pIndex = 0;
  while (last < documentXml.length) {
    const start = findNextWParagraphStart(documentXml, last);
    if (start === -1) {
      if (last < documentXml.length) {
        segments.push({ kind: "raw", xml: documentXml.slice(last) });
      }
      break;
    }
    if (start > last) {
      segments.push({ kind: "raw", xml: documentXml.slice(last, start) });
    }
    const openEnd = findWParagraphOpenTagEnd(documentXml, start);
    if (openEnd === -1) {
      segments.push({ kind: "raw", xml: documentXml.slice(start) });
      break;
    }
    const isSelfClosing = openEnd >= 2 && documentXml[openEnd - 2] === "/";
    if (isSelfClosing) {
      segments.push({
        kind: "p",
        xml: documentXml.slice(start, openEnd),
        index: pIndex++,
      });
      last = openEnd;
      continue;
    }
    const fullEnd = findMatchingWParagraphCloseEnd(documentXml, openEnd);
    if (fullEnd === -1) {
      segments.push({ kind: "raw", xml: documentXml.slice(start) });
      break;
    }
    segments.push({
      kind: "p",
      xml: documentXml.slice(start, fullEnd),
      index: pIndex++,
    });
    last = fullEnd;
  }
  return { segments, paragraphCount: pIndex };
}

function joinDocumentBody(segments) {
  return segments.map((s) => s.xml).join("");
}

function documentXmlSplitRoundTrips(documentXml) {
  try {
    const { segments } = splitDocumentBodyIntoSegments(documentXml);
    return segments.map((s) => s.xml).join("") === documentXml;
  } catch {
    return false;
  }
}

/** True if replacing this block with plain w:r/w:t runs would likely break OOXML (drawings, text boxes, fields, …). */
function paragraphXmlUnsafeForPlainTextReplace(pXml) {
  if (!pXml || typeof pXml !== "string") return true;
  return /<(w:drawing|w:pict|w:object|w:txbxContent|w:subDoc|w:sdt|w:smartTag|w:customXml|w:fldChar|w:instrText|mc:AlternateContent|wps:|wpg:|wp:anchor|wp:inline|v:shape|v:group|v:imagedata)\b/i.test(
    pXml,
  );
}

function replaceParagraphInnerKeepingPPr(pXml, plainText) {
  const open = pXml.match(/^<w:p\b[^>]*>/)?.[0];
  if (!open) return pXml;
  const close = "</w:p>";
  if (!pXml.endsWith(close)) return pXml;
  const inner = pXml.slice(open.length, pXml.length - close.length);
  const pPrMatch = inner.match(/^\s*(<w:pPr>[\s\S]*?<\/w:pPr>)\s*/);
  const pPr = pPrMatch ? pPrMatch[1] : "";
  const text = sanitizePlainForXml(String(plainText ?? "").replace(/\r\n/g, "\n"));
  const CHUNK = 8000;
  const runs = [];
  if (text.length === 0) {
    runs.push(`<w:r><w:t xml:space="preserve"></w:t></w:r>`);
  } else {
    let i = 0;
    while (i < text.length) {
      let end = Math.min(text.length, i + CHUNK);
      if (end < text.length) {
        const c = text.charCodeAt(end - 1);
        if (c >= 0xd800 && c <= 0xdbff) {
          end--;
          if (end <= i) end = Math.min(text.length, i + 1);
        }
      }
      const slice = text.slice(i, end);
      runs.push(
        `<w:r><w:t xml:space="preserve">${escapeXmlText(slice)}</w:t></w:r>`,
      );
      i = end;
    }
  }
  return `${open}${pPr}${runs.join("")}${close}`;
}

function buildParagraphSamples(totalParagraphs, getXml) {
  const previews = [];
  for (let i = 0; i < totalParagraphs; i++) {
    const xml = getXml(i);
    const t = extractParagraphPlainText(xml).replace(/\s+/g, " ").trim().slice(0, 220);
    previews.push({ i, t });
  }
  let json = JSON.stringify(previews);
  if (json.length <= MAX_PAYLOAD_CHARS) {
    return { samples: previews, paragraphCount: totalParagraphs };
  }

  const n = totalParagraphs;
  const target = Math.min(300, n);
  const set = new Set();
  for (let k = 0; k < 24; k++) set.add(k);
  for (let k = Math.max(0, n - 24); k < n; k++) set.add(k);
  for (let k = 0; k < target; k++) {
    set.add(Math.min(n - 1, Math.floor((k * n) / target)));
  }
  let idxs = [...set].sort((a, b) => a - b);
  let samples = idxs.map((i) => previews[i]);
  json = JSON.stringify(samples);
  while (json.length > MAX_PAYLOAD_CHARS && samples.length > 100) {
    samples = samples.filter((_, idx) => idx % 2 === 0);
    json = JSON.stringify(samples);
  }
  return { samples, paragraphCount: n };
}

function parseJsonCompletion(content) {
  if (!content || typeof content !== "string") return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function safeFileStemForDownload(name, maxLen = 100) {
  return String(name || "")
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

function buildStyledExportFilename(issuerDisplayName, workspaceId, documentTitle) {
  const client = safeFileStemForDownload(issuerDisplayName);
  if (client) return `RFP Response — ${client} (Marln proposal).docx`;
  const t = safeFileStemForDownload(String(documentTitle || "").replace(/\.[^/.]+$/, ""));
  if (t) return `RFP Response — ${t} (Marln proposal).docx`;
  return `marln-styled-rfp-response-${workspaceId}.docx`;
}

/**
 * @param {import("openai").OpenAI} openai
 * @param {string} workspaceId
 * @param {{ issuerDisplayName?: string }} [options]
 */
export async function buildStyledWorkspaceDocx(openai, workspaceId, options = {}) {
  const issuerDisplayName = String(options.issuerDisplayName ?? "").trim();
  const id = String(workspaceId || "").trim();
  if (!id) {
    const e = new Error("workspaceId is required");
    e.statusCode = 400;
    throw e;
  }

  if (!openai) {
    const e = new Error("OpenAI client is required for styled export.");
    e.statusCode = 500;
    throw e;
  }

  if (!fs.existsSync(TEMPLATE_PATH)) {
    const e = new Error(`Styled template missing at ${TEMPLATE_PATH}`);
    e.statusCode = 500;
    throw e;
  }

  const model = getWorkspaceDocument(id);
  if (!model) {
    const e = new Error("Workspace document not found");
    e.statusCode = 404;
    throw e;
  }

  const qa = (model.sections || [])
    .map((s, idx) => ({
      number: idx + 1,
      question: stripHtmlToPlain(s?.question || ""),
      answer: stripHtmlToPlain(s?.answerHtml || ""),
    }))
    .filter((row) => row.answer.length > 0);

  if (qa.length === 0) {
    const e = new Error("No answered content to merge into the template.");
    e.statusCode = 400;
    throw e;
  }

  const templateBuf = fs.readFileSync(TEMPLATE_PATH);
  const zip = new PizZip(templateBuf);
  const docEntry = zip.file("word/document.xml");
  if (!docEntry) {
    const e = new Error("word/document.xml missing in template");
    e.statusCode = 500;
    throw e;
  }
  const documentXml = docEntry.asText();
  const { segments, paragraphCount } = splitDocumentBodyIntoSegments(documentXml);
  const pXmlByIndex = [];
  for (const seg of segments) {
    if (seg.kind === "p") pXmlByIndex[seg.index] = seg.xml;
  }

  const { samples, paragraphCount: totalP } = buildParagraphSamples(paragraphCount, (i) => pXmlByIndex[i]);

  const userPayload = {
    totalParagraphCount: totalP,
    paragraphSamples: samples,
    qa,
    instructions:
      "Map workspace Q&A answers into the Marln technical proposal template. Each qa item has number, question, answer. Use paragraphIndex from 0 to totalParagraphCount-1. Prefer paragraphs whose preview text relates to that requirement, is placeholder/TBD/Lorem, or sits under a matching heading. You SHOULD return one replacement per qa item when you can find any reasonable target (up to the max). paragraphIndex must appear in paragraphSamples OR still be a valid index in range.",
  };

  let parsed = null;
  let aiErrorMessage = "";
  try {
    const response = await openai.chat.completions.create({
      model: STYLED_EXPORT_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You merge RFP workspace answers into an existing Word document body (OOXML w:p paragraphs).
Return ONLY valid JSON: {"replacements":[{"paragraphIndex":number,"newText":"string"}],"notes":string}.
Rules:
- paragraphIndex: integer, 0 <= paragraphIndex < totalParagraphCount from the user JSON.
- Return up to ${MAX_AI_REPLACEMENTS} replacements. Aim for at least one replacement per qa item when any paragraph preview relates to that question or is clearly filler/placeholder text.
- newText: plain text only (no HTML). Newlines allowed. Max ${MAX_NEW_TEXT_LEN} characters each; truncate if needed.
- Do not invent facts beyond the provided answers.
- No duplicate paragraphIndex.`,
        },
        {
          role: "user",
          content: JSON.stringify(userPayload),
        },
      ],
      temperature: 0.2,
      max_completion_tokens: 8192,
    });

    const raw = response.choices[0]?.message?.content;
    parsed = parseJsonCompletion(raw);
  } catch (err) {
    aiErrorMessage = err?.message || String(err);
    console.warn("STYLED EXPORT OpenAI call failed:", aiErrorMessage);
  }

  const rawList = Array.isArray(parsed?.replacements)
    ? parsed.replacements
    : Array.isArray(parsed?.replacement)
      ? parsed.replacement
      : [];
  const seen = new Set();
  const replacements = [];
  for (const row of rawList) {
    const paragraphIndex = Number(row?.paragraphIndex ?? row?.paragraph_index);
    const newText = String(row?.newText ?? row?.new_text ?? "").slice(0, MAX_NEW_TEXT_LEN);
    if (!Number.isInteger(paragraphIndex)) continue;
    if (paragraphIndex < 0 || paragraphIndex >= paragraphCount) continue;
    if (seen.has(paragraphIndex)) continue;
    if (!sanitizePlainForXml(newText).trim()) continue;
    const paraXml = pXmlByIndex[paragraphIndex];
    if (!paraXml || paragraphXmlUnsafeForPlainTextReplace(paraXml)) continue;
    seen.add(paragraphIndex);
    replacements.push({ paragraphIndex, newText: sanitizePlainForXml(newText) });
    if (replacements.length >= MAX_AI_REPLACEMENTS) break;
  }

  let newDocumentXml;
  let mergeMode = "ai-paragraphs";
  let appliedReplacementsCount = 0;
  if (replacements.length === 0) {
    mergeMode = "annex-only";
    console.warn(
      "STYLED EXPORT: no AI paragraph targets; appending Q&A annex.",
      parsed?.notes || aiErrorMessage || "",
    );
    newDocumentXml = appendWorkspaceAnnexToDocumentXml(documentXml, qa);
  } else {
    const byIndex = new Map(replacements.map((r) => [r.paragraphIndex, r.newText]));
    const nextSegments = segments.map((seg) => {
      if (seg.kind !== "p") return seg;
      const nt = byIndex.get(seg.index);
      if (nt == null) return seg;
      appliedReplacementsCount++;
      return {
        ...seg,
        xml: replaceParagraphInnerKeepingPPr(seg.xml, nt),
      };
    });
    newDocumentXml = joinDocumentBody(nextSegments);
    if (!documentXmlSplitRoundTrips(newDocumentXml)) {
      console.warn(
        "STYLED EXPORT: merged document.xml failed integrity check; using annex-only on original template.",
      );
      newDocumentXml = appendWorkspaceAnnexToDocumentXml(documentXml, qa);
      mergeMode = "annex-only-recovered";
      appliedReplacementsCount = 0;
    }
  }
  newDocumentXml = applyWorkspaceRecipientCompanyNameToDocumentXml(
    newDocumentXml,
    issuerDisplayName,
  );
  /** Pizzip (same stack as docxtemplater) repackages OOXML in a way Word accepts more reliably than JSZip. */
  zip.file("word/document.xml", newDocumentXml, {
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const buffer = zip.generate({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return {
    buffer,
    filename: buildStyledExportFilename(issuerDisplayName, id, model.title),
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    appliedReplacements: appliedReplacementsCount,
    mergeMode,
  };
}

export { splitDocumentBodyIntoSegments };
