import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import JSZip from "jszip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docx = path.join(
  __dirname,
  "..",
  "templates",
  "marln-technical-proposal-dxc-template.docx",
);
const zip = await JSZip.loadAsync(fs.readFileSync(docx));
const xml = await zip.file("word/document.xml").async("string");

const re = /<w:p\b/g;
let m;
const hits = [];
while ((m = re.exec(xml))) {
  const after = xml.slice(m.index + 4, m.index + 8);
  hits.push({ idx: m.index, after });
}
console.log("hits", hits.length);
const weird = hits.filter((h) => /[A-Za-z]/.test(h.after[0]));
console.log("hits where 5th char is letter (false?)", weird.length);
console.log(weird.slice(0, 5));

import { splitDocumentBodyIntoSegments } from "../styledWorkspaceExport.js";
const { segments } = splitDocumentBodyIntoSegments(xml);
let off = 0;
const starts = [];
for (const s of segments) {
  if (s.kind === "p") starts.push(off);
  off += s.xml.length;
}
const brute = hits.map((h) => h.idx);
const missing = brute.filter((i) => !starts.includes(i));
const extra = starts.filter((i) => !brute.includes(i));
console.log("split p starts", starts.length, "missing from split", missing.length, missing.slice(0, 5));
console.log("extra", extra.length);
