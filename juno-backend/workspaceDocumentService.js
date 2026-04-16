import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  AlignmentType,
} from "docx";

/** @type {Map<string, { title: string, sections: Array<{id:string, question:string, answerHtml:string}>, updatedAt: string }>} */
const workspaceDocuments = new Map();

function nowIso() {
  return new Date().toISOString();
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeAnswerHtml(html) {
  const input = String(html || "");
  const normalizedBlocks = input
    .replace(/<div\b[^>]*>/gi, "<p>")
    .replace(/<\/div>/gi, "</p>")
    .replace(/<span\b([^>]*)>([\s\S]*?)<\/span>/gi, (_m, attrs = "", inner = "") => {
      const a = String(attrs || "").toLowerCase();
      const bold = /font-weight\s*:\s*(bold|[6-9]00)/.test(a);
      const italic = /font-style\s*:\s*italic/.test(a);
      if (bold && italic) return `<strong><em>${inner}</em></strong>`;
      if (bold) return `<strong>${inner}</strong>`;
      if (italic) return `<em>${inner}</em>`;
      return inner;
    });

  return normalizedBlocks
    .replace(/<(?!\/?(p|br|h1|h2|h3|ul|ol|li|strong|b|em|i)\b)[^>]*>/gi, "")
    .replace(/\s+on\w+="[^"]*"/gi, "")
    .replace(/\s+on\w+='[^']*'/gi, "")
    .trim();
}

function defaultModel() {
  return {
    title: "RFP Response",
    sections: [],
    updatedAt: nowIso(),
  };
}

export function normalizeWorkspaceDocumentModel(model) {
  const safe = model && typeof model === "object" ? model : {};
  const title = String(safe.title || "RFP Response").slice(0, 500);
  const inSections = Array.isArray(safe.sections) ? safe.sections : [];
  const sections = inSections.map((s, i) => ({
    id: String(s?.id || `section_${i + 1}`),
    question: String(s?.question || "").slice(0, 20_000),
    answerHtml: sanitizeAnswerHtml(s?.answerHtml || ""),
    formatting: s?.formatting && typeof s.formatting === "object" ? s.formatting : {},
  }));
  return { title, sections, updatedAt: nowIso() };
}

export function saveWorkspaceDocument(workspaceId, model) {
  const id = String(workspaceId || "").trim();
  if (!id) throw new Error("workspaceId is required");
  const normalized = normalizeWorkspaceDocumentModel(model);
  workspaceDocuments.set(id, normalized);
  return normalized;
}

export function getWorkspaceDocument(workspaceId) {
  const id = String(workspaceId || "").trim();
  if (!id) return null;
  return workspaceDocuments.get(id) || null;
}

function stripTags(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function inlineRunsFromHtml(html) {
  const runs = [];
  const tokens = String(html || "").split(/(<\/?(?:strong|b|em|i|br)\s*\/?>)/gi).filter(Boolean);
  let bold = false;
  let italics = false;
  for (const token of tokens) {
    const t = token.toLowerCase();
    if (t === "<strong>" || t === "<b>") {
      bold = true;
      continue;
    }
    if (t === "</strong>" || t === "</b>") {
      bold = false;
      continue;
    }
    if (t === "<em>" || t === "<i>") {
      italics = true;
      continue;
    }
    if (t === "</em>" || t === "</i>") {
      italics = false;
      continue;
    }
    if (t.startsWith("<br")) {
      runs.push(new TextRun({ text: "\n" }));
      continue;
    }
    runs.push(new TextRun({ text: token.replace(/&nbsp;/g, " "), bold, italics }));
  }
  return runs.length ? runs : [new TextRun("")];
}

function paragraphsFromAnswerHtml(html) {
  const source = String(html || "").trim();
  if (!source) return [new Paragraph("")];

  const blocks = source.split(/(<\/?(?:p|h1|h2|h3|ul|ol|li)\b[^>]*>)/gi).filter(Boolean);
  const paragraphs = [];
  const listStack = [];
  let currentTag = null;
  let buffer = "";

  const pushBlock = () => {
    const text = buffer.trim();
    if (!text && currentTag !== "li") {
      buffer = "";
      return;
    }
    if (currentTag === "h1") {
      paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: inlineRunsFromHtml(text) }));
    } else if (currentTag === "h2") {
      paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: inlineRunsFromHtml(text) }));
    } else if (currentTag === "h3") {
      paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: inlineRunsFromHtml(text) }));
    } else if (currentTag === "li") {
      const listType = listStack[listStack.length - 1] || "ul";
      const numbering =
        listType === "ol"
          ? { reference: "rfp-numbered", level: 0 }
          : { reference: "rfp-bulleted", level: 0 };
      paragraphs.push(new Paragraph({ children: inlineRunsFromHtml(text), numbering }));
    } else {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 180 },
          children: inlineRunsFromHtml(text),
        }),
      );
    }
    buffer = "";
  };

  for (const token of blocks) {
    const lower = token.toLowerCase();
    if (/^<(p|h1|h2|h3|li)\b/.test(lower)) {
      currentTag = lower.match(/^<(\w+)/)?.[1] || null;
      buffer = "";
      continue;
    }
    if (/^<\/(p|h1|h2|h3|li)>/.test(lower)) {
      pushBlock();
      currentTag = null;
      continue;
    }
    if (/^<(ul|ol)\b/.test(lower)) {
      listStack.push(lower.includes("<ol") ? "ol" : "ul");
      continue;
    }
    if (/^<\/(ul|ol)>/.test(lower)) {
      listStack.pop();
      continue;
    }
    if (currentTag) {
      buffer += token;
    } else {
      const plain = stripTags(token);
      if (plain) {
        paragraphs.push(new Paragraph({ spacing: { after: 180 }, children: inlineRunsFromHtml(escapeHtml(plain)) }));
      }
    }
  }
  if (buffer.trim()) pushBlock();
  return paragraphs.length ? paragraphs : [new Paragraph("")];
}

export async function buildWorkspaceDocumentDocx(workspaceId) {
  const model = getWorkspaceDocument(workspaceId);
  if (!model) {
    const e = new Error("Workspace document not found");
    e.statusCode = 404;
    throw e;
  }

  const docChildren = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 280 },
      children: [new TextRun({ text: model.title || "RFP Response", bold: true })],
    }),
  ];

  model.sections.forEach((section, i) => {
    docChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 180, after: 140 },
        children: [new TextRun({ text: `${i + 1}. ${section.question || "Untitled question"}`, bold: true })],
      }),
    );
    docChildren.push(...paragraphsFromAnswerHtml(section.answerHtml || ""));
  });

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "rfp-bulleted",
          levels: [{ level: 0, format: "bullet", text: "•", alignment: AlignmentType.LEFT }],
        },
        {
          reference: "rfp-numbered",
          levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.LEFT }],
        },
      ],
    },
    sections: [{ children: docChildren }],
  });

  const buffer = await Packer.toBuffer(doc);
  return {
    buffer,
    filename: `workspace-${String(workspaceId)}-response.docx`,
    contentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
}

export function ensureWorkspaceDocument(workspaceId, questions = [], answers = {}) {
  const existing = getWorkspaceDocument(workspaceId);
  if (existing) return existing;
  const sections = (Array.isArray(questions) ? questions : []).map((q, idx) => {
    const key = `q_${idx}`;
    const answerText = String(answers?.[key] || "");
    return {
      id: key,
      question: String(q?.question || "").trim(),
      answerHtml: `<p>${escapeHtml(answerText).replace(/\n/g, "<br/>")}</p>`,
      formatting: {},
    };
  });
  const seeded = {
    ...defaultModel(),
    sections,
    updatedAt: nowIso(),
  };
  workspaceDocuments.set(String(workspaceId), seeded);
  return seeded;
}
