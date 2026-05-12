import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import JSZip from "jszip";
import { splitDocumentBodyIntoSegments } from "../styledWorkspaceExport.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const TEMPLATE = path.join(
  root,
  "templates",
  "marln-technical-proposal-dxc-template.docx",
);

function escapeXmlText(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

function countMismatch(xml) {
  const open = (xml.match(/<w:p\b/g) || []).length;
  const close = (xml.match(/<\/w:p>/g) || []).length;
  return { open, close, ok: open === close };
}

function countRealParagraphOpens(xml) {
  return (xml.match(/<w:p(?![A-Za-z])/g) || []).length;
}

const buf = fs.readFileSync(TEMPLATE);
const zip = await JSZip.loadAsync(buf);
const xml = await zip.file("word/document.xml").async("string");
console.log("template document.xml", countMismatch(xml));

const qa = [{ number: 1, question: "Q", answer: "A" }];
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
const sectIdx = xml.indexOf("<w:sectPr");
const merged =
  sectIdx !== -1
    ? xml.slice(0, sectIdx) + annexXml + xml.slice(sectIdx)
    : xml + annexXml;
console.log("after annex", countMismatch(merged));

zip.file("word/document.xml", merged);
const out = await zip.generateAsync({
  type: "nodebuffer",
  compression: "DEFLATE",
  compressionOptions: { level: 6 },
});
const outPath = path.join(root, "_test-styled-out.docx");
fs.writeFileSync(outPath, out);
console.log("wrote", outPath, "size", out.length);

// Round-trip: reload output and parse document.xml
const zip2 = await JSZip.loadAsync(out);
const xml2 = await zip2.file("word/document.xml").async("string");
console.log("round-trip", countMismatch(xml2));

const { segments, paragraphCount } = splitDocumentBodyIntoSegments(xml);
const pSegs = segments.filter((s) => s.kind === "p");
console.log(
  "split segments p count",
  pSegs.length,
  "paragraphCount",
  paragraphCount,
  "real <w:p(?!letter) opens",
  countRealParagraphOpens(xml),
);

let covered = segments.reduce((acc, s) => acc + s.xml.length, 0);
const joined = segments.map((s) => s.xml).join("");
console.log("chars covered by segments vs total", covered, xml.length, "gap", xml.length - covered);
console.log("round-trip xml === joined", joined === xml);
