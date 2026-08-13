/**
 * Writes shareable HTML + DOCX boilerplate files under public/documents/boilerplate/.
 */
import { mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import {
  BOILERPLATE_ORG,
  BOILERPLATE_PACK,
  BOILERPLATE_PRODUCT,
} from "../src/features/proposal-manager/data/boilerplateCapabilities.js";

const require = createRequire(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "../juno-backend/package.json")
);
const { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } = require("docx");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "documents", "boilerplate");

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlForPack(pack) {
  const sections = pack.sections
    .map((section) => {
      const paras = (section.paragraphs || [])
        .map((p) => `<p>${escapeHtml(p)}</p>`)
        .join("\n");
      const bullets = section.bullets?.length
        ? `<ul>${section.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`
        : "";
      return `<section><h2>${escapeHtml(section.heading)}</h2>${paras}${bullets}</section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(pack.title)}</title>
  <style>
    :root { color-scheme: light; }
    body { font-family: Georgia, "Times New Roman", serif; margin: 0; color: #0f172a; background: #fff; }
    .sheet { max-width: 800px; margin: 0 auto; background: #fff; padding: 16px 20px; }
    .kicker { font-family: system-ui, sans-serif; font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: #4f46e5; font-weight: 700; }
    h1 { font-size: 22px; line-height: 1.25; margin: 6px 0 6px; }
    .sub { font-family: system-ui, sans-serif; color: #475569; margin: 0 0 8px; }
    .meta { font-family: system-ui, sans-serif; font-size: 13px; color: #64748b; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid #4f46e5; }
    h2 { font-size: 14px; letter-spacing: .04em; text-transform: uppercase; color: #312e81; margin: 18px 0 8px; }
    p, li { font-size: 14px; line-height: 1.5; }
    ul { padding-left: 1.2em; }
    footer { margin-top: 24px; font-family: system-ui, sans-serif; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    @media print { body { background: #fff; } .sheet { box-shadow: none; margin: 0; } }
  </style>
</head>
<body>
  <article class="sheet">
    <div class="kicker">${escapeHtml(BOILERPLATE_ORG)} · ${escapeHtml(BOILERPLATE_PRODUCT)}</div>
    <h1>${escapeHtml(pack.title)}</h1>
    <p class="sub">${escapeHtml(pack.subtitle)}</p>
    <p class="meta">Audience: ${escapeHtml(pack.audience || "Prospects and leads")} · Shareable boilerplate</p>
    ${sections}
    <footer>Marln Corporation · JUNO RFP · Audit-Ready. Submission-Ready. Win-Ready. · Verify figures before a live bid.</footer>
  </article>
</body>
</html>
`;
}

function docParagraphs(pack) {
  const children = [
    new Paragraph({
      children: [
        new TextRun({
          text: `${BOILERPLATE_ORG} · ${BOILERPLATE_PRODUCT}`,
          bold: true,
          color: "4F46E5",
          size: 20,
        }),
      ],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: pack.title, bold: true })],
    }),
    new Paragraph({
      children: [new TextRun({ text: pack.subtitle, italics: true })],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Audience: ${pack.audience || "Prospects and leads"}`,
          size: 20,
          color: "475569",
        }),
      ],
    }),
    new Paragraph({ text: "" }),
  ];

  for (const section of pack.sections) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: section.heading, bold: true })],
      }),
    );
    for (const p of section.paragraphs || []) {
      children.push(new Paragraph({ children: [new TextRun(p)] }));
    }
    for (const b of section.bullets || []) {
      children.push(
        new Paragraph({
          children: [new TextRun("• "), new TextRun(b)],
        }),
      );
    }
  }

  children.push(
    new Paragraph({ text: "" }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [
        new TextRun({
          text: "Marln Corporation · JUNO RFP · Audit-Ready. Submission-Ready. Win-Ready.",
          size: 18,
          color: "64748B",
        }),
      ],
    }),
  );
  return children;
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const catalog = [];

  for (const pack of BOILERPLATE_PACK) {
    const htmlName = `${pack.fileBase}.html`;
    const docxName = `${pack.fileBase}.docx`;
    const htmlPath = path.join(outDir, htmlName);
    const docxPath = path.join(outDir, docxName);

    await writeFile(htmlPath, htmlForPack(pack), "utf8");

    const doc = new Document({
      creator: BOILERPLATE_ORG,
      title: pack.title,
      description: pack.subtitle,
      sections: [{ children: docParagraphs(pack) }],
    });
    const buf = await Packer.toBuffer(doc);
    await writeFile(docxPath, buf);

    const htmlStat = await stat(htmlPath);
    const docxStat = await stat(docxPath);
    catalog.push({
      id: pack.id,
      title: pack.title,
      html: { name: htmlName, size: htmlStat.size },
      docx: { name: docxName, size: docxStat.size },
    });
    console.log("wrote", htmlName, docxName);
  }

  console.log(JSON.stringify(catalog, null, 2));
}

await main();
