/**
 * Smoke-test styled export and parse with mammoth.
 * Run: node scripts/test-styled-export.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import JSZip from "jszip";
import mammoth from "mammoth";
import { saveWorkspaceDocument } from "../workspaceDocumentService.js";
import {
  buildStyledWorkspaceDocx,
  splitDocumentBodyIntoSegments,
} from "../styledWorkspaceExport.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outAnnex = path.join(root, "_styled-smoke-annex.docx");
const outReplace = path.join(root, "_styled-smoke-replace.docx");

function unsafe(pXml) {
  return /<(w:drawing|w:pict|w:object|w:txbxContent|w:subDoc|w:sdt|w:smartTag|w:customXml|w:fldChar|w:instrText|mc:AlternateContent|wps:|wpg:|wp:anchor|wp:inline|v:shape|v:group|v:imagedata)\b/i.test(
    pXml,
  );
}

const mockOpenaiEmpty = {
  chat: {
    completions: {
      create: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                replacements: [],
                notes: "mock empty for annex path",
              }),
            },
          },
        ],
      }),
    },
  },
};

const wsId = `styled-smoke-${Date.now()}`;
saveWorkspaceDocument(wsId, {
  title: "Smoke Test",
  sections: [
    {
      id: "1",
      question: "What is the answer?",
      answerHtml: "<p>Hello <strong>world</strong> with unicode — €</p>",
    },
  ],
});

async function mammothCheck(label, buffer) {
  try {
    const mt = await mammoth.extractRawText({ buffer });
    console.log(label, "mammoth ok, text len", (mt.value || "").length);
  } catch (e) {
    console.log(label, "MAMMOTH FAIL", e.message);
  }
}

const annex = await buildStyledWorkspaceDocx(mockOpenaiEmpty, wsId);
fs.writeFileSync(outAnnex, annex.buffer);
console.log("annex", annex.mergeMode, annex.appliedReplacements, "bytes", annex.buffer.length);
await mammothCheck("annex", annex.buffer);

const templateBuf = fs.readFileSync(
  path.join(root, "templates", "marln-technical-proposal-dxc-template.docx"),
);
const z0 = await JSZip.loadAsync(templateBuf);
const documentXml = await z0.file("word/document.xml").async("string");
const { segments } = splitDocumentBodyIntoSegments(documentXml);
let pick = -1;
for (const seg of segments) {
  if (seg.kind === "p" && !unsafe(seg.xml)) {
    pick = seg.index;
    break;
  }
}
console.log("first safe paragraph index", pick);

const mockOneReplace = {
  chat: {
    completions: {
      create: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                replacements: [{ qaNumber: 1, paragraphIndex: pick, newText: "Hello world with unicode — €" }],
                notes: "one replace",
              }),
            },
          },
        ],
      }),
    },
  },
};

const replaced = await buildStyledWorkspaceDocx(mockOneReplace, wsId);
fs.writeFileSync(outReplace, replaced.buffer);
console.log("replace", replaced.mergeMode, replaced.appliedReplacements, "bytes", replaced.buffer.length);
await mammothCheck("replace", replaced.buffer);
