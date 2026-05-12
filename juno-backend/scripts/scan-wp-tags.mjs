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

const events = [];
const re = /<w:p\b[^>]*>|<\/w:p>/g;
let m;
while ((m = re.exec(xml))) {
  events.push({ idx: m.index, tag: m[0].slice(0, 40) });
}

let depth = 0;
for (const e of events) {
  if (e.tag.startsWith("</")) depth--;
  else depth++;
  if (depth < 0) {
    console.log("underflow at", e.idx, e.tag);
    break;
  }
}
console.log("events", events.length, "final depth", depth);

// Show last few opens if depth > 0
if (depth !== 0) {
  let d = 0;
  const stack = [];
  for (const e of events) {
    if (e.tag.startsWith("</")) {
      stack.pop();
      d--;
    } else {
      stack.push(e.idx);
      d++;
    }
  }
  console.log("unclosed opens (last 5 positions)", stack.slice(-5));
}

const selfClosing = [...xml.matchAll(/<w:p\b[^>]*\/>/g)];
console.log("self-closing w:p count", selfClosing.length);
if (selfClosing[0]) console.log("sample", selfClosing[0][0]);
