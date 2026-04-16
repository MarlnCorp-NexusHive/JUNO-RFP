import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import multer from "multer";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

import { buildGeneratedRfpDocument } from "./rfpDocumentBuilder.js";
import { extractImportantDates } from "./extractImportantDates.js";
import { initCollaboration, collaborationRouter } from "./collaboration/index.js";
import { registerRfpAssistantEndpoints } from "./rfpAssistantEndpoints.js";
import {
  extractStructuredData,
  storeStructuredData,
  getStructuredDataForWorkspace,
} from "./tableExtractionService.js";
import {
  saveWorkspaceDocument,
  getWorkspaceDocument,
  buildWorkspaceDocumentDocx,
  ensureWorkspaceDocument,
} from "./workspaceDocumentService.js";

dotenv.config();

const app = express();

/* ================= CORE MIDDLEWARE ================= */
app.use(cors());
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true, limit: "12mb" }));

/* ================= DEBUG LOGGER ================= */
app.use((req, res, next) => {
  console.log("\n--- REQUEST ---");
  console.log("METHOD:", req.method);
  console.log("URL:", req.url);
  console.log("CONTENT-TYPE:", req.headers["content-type"]);
  next();
});

/* ================= OPENAI ================= */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

initCollaboration(openai);
app.use("/rfp-collab", collaborationRouter);
registerRfpAssistantEndpoints(app, openai);

/* ================= MULTER ================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const MIN_EXTRACTED_CHARS = 24;

async function extractUploadedDocumentText(buffer, originalname = "", mimetype = "") {
  const name = (originalname || "").toLowerCase();
  const type = (mimetype || "").toLowerCase();

  if (name.endsWith(".txt") || type.includes("text/plain")) {
    return { text: buffer.toString("utf8").trim(), format: "txt" };
  }

  if (name.endsWith(".pdf") || type.includes("pdf")) {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      await parser.destroy();
      return { text: (result?.text || "").trim(), format: "pdf" };
    } catch (e) {
      await parser.destroy().catch(() => {});
      return { text: "", format: "pdf", error: e?.message || "Could not read PDF text." };
    }
  }

  if (
    name.endsWith(".docx") ||
    type.includes("wordprocessingml") ||
    type.includes("officedocument.wordprocessingml")
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return { text: (result?.value || "").trim(), format: "docx" };
    } catch (e) {
      return { text: "", format: "docx", error: e?.message || "Could not read DOCX." };
    }
  }

  if (name.endsWith(".doc")) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return { text: (result?.value || "").trim(), format: "doc" };
    } catch {
      return {
        text: "",
        format: "doc",
        error: "Legacy .doc is not supported. Save as .docx or .pdf and try again.",
      };
    }
  }

  const asUtf8 = buffer.toString("utf8").trim();
  if (asUtf8.length >= MIN_EXTRACTED_CHARS && /[\r\n]/.test(asUtf8)) {
    return { text: asUtf8, format: "text-fallback" };
  }

  return {
    text: "",
    format: "unknown",
    error: "Unsupported file type. Use .txt, .pdf, or .docx.",
  };
}

/* ================= ROUTES ================= */

// ROOT
app.get("/", (req, res) => {
  res.json({ message: "Backend running" });
});

// TEST AI
app.get("/test-ai", async (req, res) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [{ role: "user", content: "What is an RFP?" }],
    });

    res.json({
      answer: response.choices[0].message.content,
    });
  } catch (err) {
    console.error("TEST ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// EXTRACT IMPORTANT DATES (RFP text)
app.post("/extract-dates", async (req, res) => {
  try {
    const { document: documentText } = req.body || {};

    if (typeof documentText !== "string") {
      return res.status(400).json({
        error: 'Request body must include string field "document"',
      });
    }

    const result = await extractImportantDates(openai, documentText);
    res.json(result);
  } catch (err) {
    console.error("EXTRACT DATES ERROR:", err.message);
    res.status(500).json({ error: err.message || "Date extraction failed" });
  }
});

// GENERATE ANSWER
app.post("/generate-answer", async (req, res) => {
  try {
    const { question } = req.body || {};

    if (!question || typeof question !== "string") {
      return res.status(400).json({
        error: "Question is required",
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: "You are a professional RFP writer." },
        { role: "user", content: question },
      ],
    });

    res.json({
      answer: response.choices[0].message.content,
    });
  } catch (err) {
    console.error("GENERATE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ================= GENERATE RFP DOCUMENT ================= */

app.post("/generate-rfp-document", async (req, res) => {
  try {
    console.log("📄 Generating RFP document...");

    const {
      answeredQuestions = [],
      answers = [],
      companyName = "",
      selectedTemplate = "classic",
    } = req.body || {};

    // support both formats
    const finalQuestions =
      answeredQuestions.length > 0 ? answeredQuestions : answers;

    if (!Array.isArray(finalQuestions) || finalQuestions.length === 0) {
      return res.status(400).json({
        error: "No answered questions provided",
      });
    }

    const normalized = finalQuestions
      .map((q, i) => ({
        number: Number(q?.number) || i + 1,
        question: String(q?.question || "").trim(),
        answer: String(q?.answer || "").trim(),
      }))
      .filter((q) => q.answer.length > 0);

    if (normalized.length === 0) {
      return res.status(400).json({
        error: "All answers are empty",
      });
    }

    const { buffer, contentType, filename } = await buildGeneratedRfpDocument({
      openai,
      selectedTemplate,
      normalized,
      companyName,
    });

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);

    console.log("✅ Document generated successfully");
  } catch (err) {
    console.error("❌ DOC GENERATION ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= FILE UPLOAD ================= */

app.post("/ask-with-file", upload.single("file"), async (req, res) => {
  try {
    const { question } = req.body;
    const file = req.file;

    if (!question || !file) {
      return res.status(400).json({
        error: "File + question required",
      });
    }

    const extracted = await extractUploadedDocumentText(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    if (extracted.error) {
      return res.status(400).json({ error: extracted.error });
    }

    if (!extracted.text || extracted.text.length < MIN_EXTRACTED_CHARS) {
      return res.status(400).json({
        error:
          "Could not extract enough text from this file. Try a text-based PDF or Word document, or use a .txt export.",
      });
    }

    const documentText = extracted.text.slice(0, 120000);

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content:
            "Answer ONLY using the uploaded document excerpt below. If the answer is not in the document, say it is not stated in the document.",
        },
        {
          role: "user",
          content: `DOCUMENT (extracted text):\n${documentText}\n\nQUESTION:\n${question}`,
        },
      ],
    });

    res.json({
      answer: response.choices[0].message.content,
    });
  } catch (err) {
    console.error("FILE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ================= STRUCTURED TABLES / FIGURES ================= */

app.post("/extract-structured-data", async (req, res) => {
  try {
    const { document: documentText, workspaceId, documentId, skipAi } = req.body || {};

    if (typeof documentText !== "string" || !documentText.trim()) {
      return res.status(400).json({
        error: 'Request body must include non-empty string field "document"',
      });
    }

    const result = await extractStructuredData(openai, documentText, {
      workspaceId,
      documentId,
      skipAi: Boolean(skipAi),
    });

    if (workspaceId != null && documentId != null) {
      const ws = String(workspaceId).trim();
      const doc = String(documentId).trim();
      if (ws && doc) {
        storeStructuredData(ws, doc, result);
      }
    }

    res.json(result);
  } catch (err) {
    console.error("EXTRACT STRUCTURED DATA ERROR:", err.message);
    res.status(500).json({ error: err.message || "Extraction failed" });
  }
});

app.get("/get-tables/:workspaceId", (req, res) => {
  try {
    const { workspaceId } = req.params;
    if (!workspaceId || typeof workspaceId !== "string") {
      return res.status(400).json({ error: "workspaceId is required" });
    }
    const data = getStructuredDataForWorkspace(workspaceId);
    res.json(data);
  } catch (err) {
    console.error("GET TABLES ERROR:", err.message);
    res.status(500).json({ error: err.message || "Failed to load tables" });
  }
});

/* ================= WORKSPACE DOCUMENT MODEL + EXPORT ================= */

app.post("/workspace-document/:workspaceId", (req, res) => {
  try {
    const { workspaceId } = req.params;
    const model = req.body?.document;
    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId is required" });
    }
    if (!model || typeof model !== "object") {
      return res.status(400).json({ error: 'Request body must include object field "document"' });
    }
    const saved = saveWorkspaceDocument(workspaceId, model);
    res.json({ workspaceId, document: saved });
  } catch (err) {
    console.error("SAVE WORKSPACE DOCUMENT ERROR:", err.message);
    res.status(500).json({ error: err.message || "Failed to save workspace document" });
  }
});

app.get("/workspace-document/:workspaceId", (req, res) => {
  try {
    const { workspaceId } = req.params;
    if (!workspaceId) return res.status(400).json({ error: "workspaceId is required" });
    const existing = getWorkspaceDocument(workspaceId);
    if (!existing) return res.status(404).json({ error: "Workspace document not found" });
    res.json({ workspaceId, document: existing });
  } catch (err) {
    console.error("GET WORKSPACE DOCUMENT ERROR:", err.message);
    res.status(500).json({ error: err.message || "Failed to load workspace document" });
  }
});

app.post("/workspace-document/:workspaceId/seed", (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { questions = [], answers = {} } = req.body || {};
    if (!workspaceId) return res.status(400).json({ error: "workspaceId is required" });
    const doc = ensureWorkspaceDocument(workspaceId, questions, answers);
    res.json({ workspaceId, document: doc });
  } catch (err) {
    console.error("SEED WORKSPACE DOCUMENT ERROR:", err.message);
    res.status(500).json({ error: err.message || "Failed to seed workspace document" });
  }
});

app.get("/export-document/:workspaceId", async (req, res) => {
  try {
    const { workspaceId } = req.params;
    if (!workspaceId) return res.status(400).json({ error: "workspaceId is required" });
    const { buffer, filename, contentType } = await buildWorkspaceDocumentDocx(workspaceId);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error("EXPORT WORKSPACE DOCUMENT ERROR:", err.message);
    const code = err.statusCode || 500;
    res.status(code).json({ error: err.message || "Failed to export workspace document" });
  }
});

/* ================= GLOBAL ERROR ================= */

app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err.message);

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: "Invalid JSON format",
    });
  }

  res.status(500).json({
    error: "Server error",
  });
});

/* ================= START ================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log("✅ Endpoints:");
  console.log("GET  /test-ai");
  console.log("POST /generate-answer");
  console.log("POST /generate-rfp-document");
  console.log("POST /ask-with-file");
  console.log("POST /extract-dates");
  console.log("POST /extract-structured-data");
  console.log("GET  /get-tables/:workspaceId");
  console.log("POST /workspace-document/:workspaceId");
  console.log("GET  /workspace-document/:workspaceId");
  console.log("POST /workspace-document/:workspaceId/seed");
  console.log("GET  /export-document/:workspaceId");
  console.log("POST /structure-rfp-requirements");
  console.log("POST /ask-with-context");
  console.log("POST /company-intelligence-remote");
  console.log("POST /generate-company-profile");
  console.log("RFP collaboration API: /rfp-collab/* (see collaboration/)\n");
});