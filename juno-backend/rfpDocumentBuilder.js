import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { fillStructuredTemplateSections } from "./aiRfpPlacement.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_PATH = path.join(__dirname, "data", "rfp-response-templates.json");

let cachedTemplates = null;

function loadStructuredTemplates() {
  if (!cachedTemplates) {
    const raw = fs.readFileSync(TEMPLATES_PATH, "utf8");
    cachedTemplates = JSON.parse(raw).templates;
  }
  return cachedTemplates;
}

export function getStructuredTemplateById(id) {
  return loadStructuredTemplates().find((t) => t.id === id);
}

export function listStructuredTemplateIds() {
  return loadStructuredTemplates().map((t) => t.id);
}

function builtinTitle(selectedTemplate) {
  if (selectedTemplate === "modern") return "RFP RESPONSE DOCUMENT";
  if (selectedTemplate === "technical") return "Technical Proposal";
  return "RFP Response";
}

function splitLongTextRuns(text) {
  const chunk = 8000;
  if (text.length <= chunk) return [new TextRun(text)];
  const runs = [];
  for (let i = 0; i < text.length; i += chunk) {
    runs.push(new TextRun(text.slice(i, i + chunk)));
  }
  return runs;
}

/** Turn section body into Word paragraphs (double newlines = new paragraph). */
function bodyToParagraphs(body) {
  const parts = String(body || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    return [new Paragraph({ children: [new TextRun("")] })];
  }
  return parts.map(
    (text) =>
      new Paragraph({
        children: splitLongTextRuns(text.replace(/\n/g, " ").trim()),
      }),
  );
}

function buildParagraphs({ normalized, companyName, mode, selectedTemplate }) {
  const children = [];

  if (mode === "standalone") {
    const title = builtinTitle(selectedTemplate);
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.TITLE,
        children: [new TextRun({ text: title, bold: true })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `Company: ${companyName || "N/A"}`,
            italics: true,
          }),
        ],
      }),
      new Paragraph({ text: "" }),
    );
  }

  normalized.forEach((row) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: `${row.number}. ${row.question}`,
            bold: true,
          }),
        ],
      }),
      new Paragraph({
        children: splitLongTextRuns(row.answer),
      }),
      new Paragraph({ text: "" }),
    );
  });

  return children;
}

export async function buildQaDocxBuffer({ normalized, companyName, mode, selectedTemplate }) {
  const children = buildParagraphs({ normalized, companyName, mode, selectedTemplate });
  const doc = new Document({
    sections: [{ properties: {}, children }],
  });
  return Packer.toBuffer(doc);
}

function pushAnnex(children, normalized) {
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "Annex — Workspace Q&A (source)", bold: true })],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Verbatim requirement text and answers as captured in the proposal workspace.",
          italics: true,
        }),
      ],
    }),
    new Paragraph({ text: "" }),
  );

  normalized.forEach((row) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: `${row.number}. ${row.question}`,
            bold: true,
          }),
        ],
      }),
      new Paragraph({
        children: splitLongTextRuns(row.answer),
      }),
      new Paragraph({ text: "" }),
    );
  });
}

async function buildStructuredDocx(openai, templateDef, normalized, companyName) {
  const filled = await fillStructuredTemplateSections(
    openai,
    templateDef.sections,
    normalized,
    companyName,
  );

  const children = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: "RFP Response", bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Company: ${companyName || "N/A"}`,
          italics: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Structure: ${templateDef.id.replace(/-/g, " ")}`,
          italics: true,
        }),
      ],
    }),
    new Paragraph({ text: "" }),
  );

  for (const block of filled) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: block.title, bold: true })],
      }),
    );
    bodyToParagraphs(block.body).forEach((p) => children.push(p));
    children.push(new Paragraph({ text: "" }));
  }

  pushAnnex(children, normalized);

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });
  return Packer.toBuffer(doc);
}

/**
 * @param {object} options
 * @param {import("openai").default} options.openai Required for structured (AI) templates
 * @param {string} options.selectedTemplate
 * @param {{ number: number; question: string; answer: string }[]} options.normalized
 * @param {string} options.companyName
 */
export async function buildGeneratedRfpDocument({
  openai,
  selectedTemplate,
  normalized,
  companyName,
}) {
  const baseName = `rfp-response-${selectedTemplate}`;
  const structured = getStructuredTemplateById(selectedTemplate);

  if (structured) {
    if (!openai) {
      throw new Error("OpenAI client is required for structured templates.");
    }
    const buffer = await buildStructuredDocx(openai, structured, normalized, companyName);
    return {
      buffer,
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      filename: `${baseName}.docx`,
    };
  }

  const qaBuffer = await buildQaDocxBuffer({
    normalized,
    companyName,
    mode: "standalone",
    selectedTemplate,
  });

  return {
    buffer: qaBuffer,
    contentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    filename: `${baseName}.docx`,
  };
}
