import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

const MIN_CONTENT_CHARS = 80;

function sanitizeWordPlainText(s) {
  return String(s || "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/[\uD800-\uDFFF]/g, "");
}

function splitLongTextRuns(text) {
  const safe = sanitizeWordPlainText(text);
  const chunk = 8000;
  if (safe.length <= chunk) return [new TextRun(safe)];
  const runs = [];
  for (let i = 0; i < safe.length; i += chunk) {
    runs.push(new TextRun(safe.slice(i, i + chunk)));
  }
  return runs;
}

function slugifyFilename(title) {
  const slug = String(title || "work-document")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "work-document";
}

/** Turn AI answer text into Word paragraphs (headings, bullets, body). */
function appendContentBlocks(children, content) {
  const blocks = String(content || "")
    .trim()
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  for (const block of blocks) {
    const headingMatch = block.match(/^(#{1,3})\s+(.+?)(?:\n+([\s\S]*))?$/);
    if (headingMatch) {
      const depth = headingMatch[1].length;
      const heading =
        depth === 1
          ? HeadingLevel.HEADING_2
          : depth === 2
            ? HeadingLevel.HEADING_3
            : HeadingLevel.HEADING_4;
      children.push(
        new Paragraph({
          heading,
          children: [new TextRun({ text: sanitizeWordPlainText(headingMatch[2]), bold: true })],
        }),
      );
      const body = headingMatch[3]?.trim();
      if (body) {
        children.push(new Paragraph({ children: splitLongTextRuns(body.replace(/\n/g, " ")) }));
      }
      continue;
    }

    const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
    const isBulletBlock = lines.length > 0 && lines.every((l) => /^[-*•]\s+/.test(l) || /^\d+[.)]\s+/.test(l));

    if (isBulletBlock) {
      for (const line of lines) {
        const text = line.replace(/^[-*•]\s+/, "").replace(/^\d+[.)]\s+/, "").trim();
        children.push(
          new Paragraph({
            children: [new TextRun("• "), ...splitLongTextRuns(text)],
          }),
        );
      }
      children.push(new Paragraph({ text: "" }));
      continue;
    }

    children.push(new Paragraph({ children: splitLongTextRuns(block.replace(/\n/g, " ")) }));
    children.push(new Paragraph({ text: "" }));
  }
}

/**
 * Build a Word work document from Content Hub Ask AI question + answer.
 */
export async function buildWorkDocumentFromContent({ question, content, issuerName }) {
  const text = String(content || "").trim();
  if (text.length < MIN_CONTENT_CHARS) {
    const err = new Error(`Content must be at least ${MIN_CONTENT_CHARS} characters for document generation`);
    err.statusCode = 400;
    throw err;
  }

  const title = sanitizeWordPlainText(question?.trim()?.slice(0, 200) || "Work Document");
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: title, bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Generated ${dateStr} · JUNO Content Hub`,
          italics: true,
          size: 20,
        }),
      ],
    }),
  ];

  if (issuerName && String(issuerName).trim()) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `Issuer / client: ${sanitizeWordPlainText(issuerName)}`,
            italics: true,
          }),
        ],
      }),
    );
  }

  children.push(new Paragraph({ text: "" }));
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "Working document", bold: true })],
    }),
  );

  if (question?.trim()) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Prompt: ", bold: true }),
          ...splitLongTextRuns(question.trim()),
        ],
      }),
      new Paragraph({ text: "" }),
    );
  }

  appendContentBlocks(children, text);

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });
  const buffer = await Packer.toBuffer(doc);

  return {
    buffer,
    filename: `${slugifyFilename(title)}-work-doc.docx`,
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
}
