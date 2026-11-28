import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import multer from "multer";
import mammoth from "mammoth";
import PizZip from "pizzip";
import { createRequire } from "module";

let _PDFParse = null;
async function getPDFParse() {
  if (_PDFParse) return _PDFParse;
  // Compatibility shim for Node < 20.16 where pdfjs-dist expects process.getBuiltinModule
  if (typeof process.getBuiltinModule !== "function") {
    const req = createRequire(import.meta.url);
    process.getBuiltinModule = (id) => {
      try {
        return req(id);
      } catch {
        return undefined;
      }
    };
  }
  const mod = await import("pdf-parse");
  _PDFParse = mod.PDFParse;
  return _PDFParse;
}

import { buildGeneratedRfpDocument } from "./rfpDocumentBuilder.js";
import { extractImportantDates } from "./extractImportantDates.js";
import { extractQaLibraryItems } from "./extractQaLibrary.js";
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
import { buildStyledWorkspaceDocx } from "./styledWorkspaceExport.js";
import { initCalendar, calendarRouter } from "./calendar/index.js";
import { generateSlideDeckFromContent } from "./slideDeckBuilder.js";
import { buildWorkDocumentFromContent } from "./workDocumentBuilder.js";
import { registerTechnicalSolutioningRoutes } from "./technicalSolutioningService.js";
import { registerCommunicationAiRoutes } from "./communicationAiService.js";
import { registerPricingAiRoutes } from "./pricingAiService.js";
import { registerPursuitLifecycleAiRoutes } from "./pursuitLifecycleAiService.js";
import { DOCUMENT_QA_SYSTEM_PROMPT } from "./documentQaPrompt.js";
import { registerTrialSystem } from "./trial/index.js";
import { metricsMiddleware, registerMonitoringRoutes } from "./monitoring/metricsService.js";
import { redactPiiDeep } from "./utils/piiRedact.js";

const IS_PROD = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);
import {
  isEmailConfigured,
  sendWorkspaceDocumentEmail,
} from "./trial/emailService.js";
import { registerGrantsGovRoutes } from "./grantsGovService.js";
import { registerAltGrantsRoutes } from "./altGrantsService.js";
import { registerUsaSpendingRoutes } from "./usaSpendingService.js";
import { registerSbirRoutes } from "./sbirService.js";
import { registerNihReporterRoutes } from "./nihReporterService.js";
import { registerNsfAwardsRoutes } from "./nsfAwardsService.js";
import { registerCaGrantsRoutes } from "./caGrantsService.js";
import { registerFacRoutes } from "./facService.js";
import { registerAssistanceListingsRoutes } from "./assistanceListingsService.js";
import { registerGrantBriefRoutes } from "./grantBriefService.js";
import { registerPhilanthropicGrantmakersRoutes } from "./philanthropicGrantmakersService.js";
import path from "path";
import { fileURLToPath } from "url";
import { logger, requestLoggerMiddleware } from "./utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config({ path: path.join(__dirname, ".env") });

/**
 * Safe Content-Disposition for file downloads. Node rejects non-Latin-1 / non-ASCII in
 * header values; our filenames use em dashes and may include accents (issuer names).
 * ASCII filename= fallback plus RFC 5987 filename*=UTF-8'' for full Unicode.
 */
function attachmentContentDisposition(filename) {
  const raw = String(filename || "download.docx").trim() || "download.docx";
  const ascii =
    raw
      .replace(/[^\x20-\x7E]/g, "-")
      .replace(/["\\/]/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180) || "download.docx";
  const star = encodeURIComponent(raw);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${star}`;
}

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

/* ================= CORE MIDDLEWARE ================= */
const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (IS_PROD && !ALLOWED_ORIGINS.length) {
  logger.error("production_cors_misconfigured", {
    msg: "ALLOWED_ORIGINS is empty in production. Browser cross-origin calls will be rejected until you set it.",
  });
}

app.use(
  cors(
    ALLOWED_ORIGINS.length
      ? {
          origin(origin, cb) {
            if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
            return cb(new Error("Origin not allowed by CORS"));
          },
        }
      : IS_PROD
        ? {
            // Fail closed in production when allowlist is missing: allow non-browser (no Origin) only.
            origin(origin, cb) {
              if (!origin) return cb(null, true);
              return cb(new Error("Origin not allowed by CORS — set ALLOWED_ORIGINS"));
            },
          }
        : {},
  ),
);

/* ================= SECURITY & PRIVACY HEADERS ================= */
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  const isHttps = req.secure || String(req.headers["x-forwarded-proto"] || "").includes("https");
  if (IS_PROD || isHttps) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

app.use(express.json({ limit: "16mb" }));
app.use(express.urlencoded({ extended: true, limit: "16mb" }));

/* ================= LIGHTWEIGHT RATE LIMITER ================= */
function createRateLimiter({ windowMs, max, keyPrefix, keyFn }) {
  const hits = new Map();
  let lastPrune = Date.now();
  return (req, res, next) => {
    const now = Date.now();
    if (now - lastPrune > windowMs) {
      lastPrune = now;
      for (const [k, rec] of hits.entries()) {
        if (now >= rec.resetAt) hits.delete(k);
      }
    }
    const ip = String(req.ip || req.socket?.remoteAddress || "unknown");
    const suffix = typeof keyFn === "function" ? keyFn(req, ip) : ip;
    const key = `${keyPrefix}:${suffix}`;
    const existing = hits.get(key);
    if (!existing || now >= existing.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    existing.count += 1;
    if (existing.count > max) {
      res.setHeader("Retry-After", String(Math.ceil((existing.resetAt - now) / 1000)));
      logger.warn("rate_limit_exceeded", { keyPrefix, ip, path: req.path });
      return res.status(429).json({
        error: "Too many requests. Please wait a moment and try again.",
        code: "rate_limited",
      });
    }
    return next();
  };
}

// High per-IP cap so 50+ colleagues behind one office NAT can log in simultaneously,
// combined with per-account (ip+email) brute-force throttling.
const authIpRateLimit = createRateLimiter({ windowMs: 15 * 60_000, max: 300, keyPrefix: "auth_ip" });
const authAccountRateLimit = createRateLimiter({
  windowMs: 15 * 60_000,
  max: 25,
  keyPrefix: "auth_acct",
  keyFn: (req, ip) => {
    const ident = String(req.body?.email || req.body?.username || "anon").trim().toLowerCase().slice(0, 120);
    return `${ip}:${ident}`;
  },
});
const emailRateLimit = createRateLimiter({ windowMs: 15 * 60_000, max: 15, keyPrefix: "email" });
const testAiRateLimit = createRateLimiter({ windowMs: 15 * 60_000, max: 10, keyPrefix: "testai" });
const aiRouteRateLimit = createRateLimiter({ windowMs: 15 * 60_000, max: 300, keyPrefix: "ai" });

app.use(["/trial/auth/login", "/trial/auth/signup", "/trial/auth/resend-confirmation", "/trial/auth/forgot-password", "/trial/auth/reset-password", "/rfp-collab/auth/login"], authIpRateLimit, authAccountRateLimit);
app.use("/workspace/email-document", emailRateLimit);
app.use("/test-ai", testAiRateLimit);
app.use(
  [
    "/generate-answer",
    "/generate-rfp-document",
    "/ask-with-file",
    "/ask-with-context",
    "/extract-dates",
    "/extract-qas",
    "/extract-structured-data",
    "/structure-rfp-requirements",
    "/generate-slide-deck",
    "/technical-solution",
    "/communication/ai",
    "/pricing/ai",
    "/pursuit/ai",
    "/grants/brief",
    "/grants/philanthropic/opportunities",
  ],
  aiRouteRateLimit,
);

/* ================= STRUCTURED REQUEST LOGGER & PROMETHEUS METRICS ================= */
app.use(requestLoggerMiddleware);
app.use(metricsMiddleware);
registerMonitoringRoutes(app);

/* ================= OPENAI (PII-redacted chat completions by default) ================= */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
{
  const originalCreate = openai.chat.completions.create.bind(openai.chat.completions);
  openai.chat.completions.create = (params, options) => {
    const safeParams =
      params && typeof params === "object"
        ? {
            ...params,
            messages: Array.isArray(params.messages) ? redactPiiDeep(params.messages) : params.messages,
          }
        : params;
    return originalCreate(safeParams, options);
  };
}

if (IS_PROD && !(process.env.ADMIN_METRICS_TOKEN || process.env.METRICS_TOKEN)) {
  logger.error("production_metrics_unprotected", {
    msg: "ADMIN_METRICS_TOKEN (or METRICS_TOKEN) is required in production. /metrics and /admin/health-metrics will return 401 until set.",
  });
}

registerTrialSystem(app);

initCollaboration(openai);
initCalendar();
app.use("/rfp-collab", collaborationRouter);
app.use("/calendar", calendarRouter);
registerRfpAssistantEndpoints(app, openai);
registerTechnicalSolutioningRoutes(app, openai);
registerCommunicationAiRoutes(app, openai);
registerPricingAiRoutes(app, openai);
registerPursuitLifecycleAiRoutes(app, openai);
registerGrantsGovRoutes(app);
registerAltGrantsRoutes(app);
registerUsaSpendingRoutes(app);
registerSbirRoutes(app);
registerNihReporterRoutes(app);
registerNsfAwardsRoutes(app);
registerCaGrantsRoutes(app);
registerFacRoutes(app);
registerAssistanceListingsRoutes(app);
registerGrantBriefRoutes(app, openai);
registerPhilanthropicGrantmakersRoutes(app, openai);

/* ================= MULTER ================= */
const ALLOWED_UPLOAD_EXTS = new Set([".pdf", ".docx", ".doc", ".txt", ".csv", ".md"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, cb) {
    const ext = path.extname(String(file?.originalname || "").toLowerCase());
    if (!ext || ALLOWED_UPLOAD_EXTS.has(ext)) return cb(null, true);
    const err = new Error("Unsupported file type. Use .txt, .pdf, or .docx.");
    err.statusCode = 400;
    return cb(err);
  },
});

const MIN_EXTRACTED_CHARS = 24;
const MAX_DOCX_UNCOMPRESSED_BYTES = 100 * 1024 * 1024;
const MAX_DOCX_ENTRIES = 5000;

function assertSafeDocxArchive(buffer) {
  const zip = new PizZip(buffer);
  const files = Object.values(zip.files || {});
  if (files.length > MAX_DOCX_ENTRIES) {
    throw new Error("DOCX archive contains too many entries.");
  }
  let totalUncompressed = 0;
  for (const entry of files) {
    const size = Number(entry?._data?.uncompressedSize || 0);
    if (size > 0) totalUncompressed += size;
    if (totalUncompressed > MAX_DOCX_UNCOMPRESSED_BYTES) {
      throw new Error("DOCX decompressed content exceeds safe size limit.");
    }
  }
}

async function extractUploadedDocumentText(buffer, originalname = "", mimetype = "") {
  const name = (originalname || "").toLowerCase();
  const type = (mimetype || "").toLowerCase();

  if (name.endsWith(".txt") || type.includes("text/plain")) {
    return { text: buffer.toString("utf8").trim(), format: "txt" };
  }

  if (name.endsWith(".pdf") || type.includes("pdf")) {
    let parser = null;
    try {
      const PDFParse = await getPDFParse();
      parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      return { text: (result?.text || "").trim(), format: "pdf" };
    } catch (e) {
      await parser?.destroy?.().catch(() => {});
      return { text: "", format: "pdf", error: e?.message || "Could not read PDF text." };
    }
  }

  if (
    name.endsWith(".docx") ||
    type.includes("wordprocessingml") ||
    type.includes("officedocument.wordprocessingml")
  ) {
    try {
      assertSafeDocxArchive(buffer);
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

// ROOT & HEALTH
app.get("/", (req, res) => {
  res.json({ message: "Backend running" });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, status: "healthy" });
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

// EXTRACT Q&A LIBRARY ITEMS (RFP / grant text → Content Hub)
app.post("/extract-qas", async (req, res) => {
  try {
    const { document: documentText } = req.body || {};

    if (typeof documentText !== "string") {
      return res.status(400).json({
        error: 'Request body must include string field "document"',
      });
    }

    const result = await extractQaLibraryItems(openai, documentText);
    res.json(result);
  } catch (err) {
    console.error("EXTRACT QAS ERROR:", err.message);
    res.status(500).json({ error: err.message || "Q&A extraction failed" });
  }
});

// GENERATE ANSWER
app.post("/generate-answer", async (req, res) => {
  try {
    const { question, libraryContext } = req.body || {};

    if (!question || typeof question !== "string") {
      return res.status(400).json({
        error: "Question is required",
      });
    }

    const library = typeof libraryContext === "string" ? libraryContext.trim() : "";
    const systemParts = [
      "You are a professional RFP / grant proposal writer.",
      "Draft clear, formal, submission-ready responses.",
    ];
    if (library) {
      systemParts.push(
        "When a Q&A library is provided, prefer those approved answers for matching topics. Adapt wording to the current requirement; do not invent facts that contradict the library; if the library is silent, answer professionally and note uncertainty only when material.",
      );
    }

    const userContent = library
      ? `APPROVED Q&A LIBRARY (company knowledge base):\n${library.slice(0, 60000)}\n\n---\n\nTASK:\n${question}`
      : question;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: systemParts.join(" ") },
        { role: "user", content: userContent },
      ],
      temperature: 0.3,
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
    res.setHeader("Content-Disposition", attachmentContentDisposition(filename));
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

    console.log(
      `ask-with-file: extracted ${documentText.length} chars from ${file.originalname || "upload"} (${extracted.format})`,
    );

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: DOCUMENT_QA_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `DOCUMENT (extracted text):\n${documentText}\n\nQUESTION:\n${question}`,
        },
      ],
      temperature: 0.25,
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

/** @deprecated Use GET /export-document/:id?style=styled (same proxy prefix as plain export). */
app.get("/export-document-styled/:workspaceId", (req, res) => {
  const { workspaceId } = req.params;
  if (!workspaceId) return res.status(400).send("workspaceId required");
  res.redirect(307, `/export-document/${encodeURIComponent(workspaceId)}?style=styled`);
});

app.get("/export-document/:workspaceId", async (req, res) => {
  try {
    const { workspaceId } = req.params;
    if (!workspaceId) return res.status(400).json({ error: "workspaceId is required" });

    const styled =
      req.query.style === "styled" || req.query.styled === "1" || req.query.styled === "true";

    if (styled) {
      const issuerDisplayName = (() => {
        const a = req.query.issuerName ?? req.query.issuer;
        if (typeof a === "string" && a.trim()) return a.trim();
        return "";
      })();
      const { buffer, filename, contentType, appliedReplacements, mergeMode } = await buildStyledWorkspaceDocx(
        openai,
        workspaceId,
        issuerDisplayName ? { issuerDisplayName } : {},
      );
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", attachmentContentDisposition(filename));
      if (appliedReplacements != null) {
        res.setHeader("X-Styled-Replacements", String(appliedReplacements));
      }
      if (mergeMode) {
        res.setHeader("X-Styled-Merge-Mode", String(mergeMode));
      }
      res.send(buffer);
      return;
    }

    const { buffer, filename, contentType } = await buildWorkspaceDocumentDocx(workspaceId);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", attachmentContentDisposition(filename));
    res.send(buffer);
  } catch (err) {
    console.error("EXPORT WORKSPACE DOCUMENT ERROR:", err.message);
    const code = err.statusCode || 500;
    res.status(code).json({ error: err.message || "Failed to export workspace document" });
  }
});

const WORKSPACE_EMAIL_MAX_BYTES = 10 * 1024 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function stripDataUrlBase64(raw) {
  const s = String(raw || "").trim();
  const m = /^data:[^;]+;base64,(.+)$/i.exec(s);
  return m ? m[1] : s.replace(/\s+/g, "");
}

function approxBase64Bytes(b64) {
  const len = String(b64 || "").length;
  if (!len) return 0;
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((len * 3) / 4) - padding);
}

/**
 * Email an original uploaded RFP/grant file or a completed Workspace export.
 * Body: { to, subject?, message?, senderName?, kind: "original"|"simple"|"styled",
 *         workspaceId?, filename?, contentBase64?, contentType?, issuerName? }
 */
app.post("/workspace/email-document", async (req, res) => {
  try {
    if (!isEmailConfigured()) {
      return res.status(503).json({
        error: "Email is not configured on the server (RESEND_API_KEY).",
        code: "email_not_configured",
      });
    }

    const body = req.body || {};
    const to = String(body.to || "").trim();
    if (!EMAIL_RE.test(to)) {
      return res.status(400).json({ error: "A valid recipient email is required.", code: "invalid_to" });
    }

    const kind = String(body.kind || "").trim().toLowerCase();
    if (!["original", "simple", "styled"].includes(kind)) {
      return res.status(400).json({
        error: 'kind must be "original", "simple", or "styled".',
        code: "invalid_kind",
      });
    }

    let filename = "";
    let contentType = "application/octet-stream";
    let contentBase64 = "";

    if (kind === "original") {
      contentBase64 = stripDataUrlBase64(body.contentBase64 || body.fileDataUrl || "");
      filename = String(body.filename || body.fileName || "document").trim() || "document";
      contentType = String(body.contentType || body.fileType || "application/octet-stream").trim();
      if (!contentBase64) {
        return res.status(400).json({
          error: "Original file bytes are missing. Re-upload the RFP/grant in Workspace, then try again.",
          code: "missing_original",
        });
      }
    } else {
      const workspaceId = String(body.workspaceId || "").trim();
      if (!workspaceId) {
        return res.status(400).json({ error: "workspaceId is required for exports.", code: "missing_workspace" });
      }

      if (kind === "styled") {
        const issuerDisplayName =
          typeof body.issuerName === "string" && body.issuerName.trim()
            ? body.issuerName.trim()
            : "";
        const built = await buildStyledWorkspaceDocx(
          openai,
          workspaceId,
          issuerDisplayName ? { issuerDisplayName } : {},
        );
        contentBase64 = Buffer.from(built.buffer).toString("base64");
        filename = built.filename || `styled-response-${workspaceId}.docx`;
        contentType = built.contentType || "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      } else {
        const built = await buildWorkspaceDocumentDocx(workspaceId);
        contentBase64 = Buffer.from(built.buffer).toString("base64");
        filename = built.filename || `response-${workspaceId}.docx`;
        contentType = built.contentType || "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      }
    }

    const byteLen = approxBase64Bytes(contentBase64);
    if (byteLen > WORKSPACE_EMAIL_MAX_BYTES) {
      return res.status(413).json({
        error: `Attachment is too large (${Math.round(byteLen / (1024 * 1024))} MB). Max is 10 MB.`,
        code: "attachment_too_large",
      });
    }

    const result = await sendWorkspaceDocumentEmail({
      to,
      subject: body.subject,
      message: body.message,
      senderName: body.senderName,
      fileName: filename,
      attachment: {
        filename,
        content: contentBase64,
        contentType,
      },
    });

    return res.json({
      ok: true,
      id: result?.id || null,
      filename,
      kind,
      to,
    });
  } catch (err) {
    console.error("WORKSPACE EMAIL DOCUMENT ERROR:", err.message);
    const code = err.code === "email_not_configured" ? 503 : err.statusCode || 500;
    return res.status(code).json({
      error: err.message || "Failed to email workspace document",
      code: err.code || "email_send_failed",
    });
  }
});

app.get("/workspace/email-status", (_req, res) => {
  res.json({ configured: isEmailConfigured() });
});

/* ================= CONTENT HUB → WORK DOCUMENT (DOCX) ================= */

app.post("/generate-work-document", async (req, res) => {
  try {
    const { question, content, issuerName } = req.body || {};
    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "content is required" });
    }
    const result = await buildWorkDocumentFromContent({ question, content, issuerName });
    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Content-Disposition", attachmentContentDisposition(result.filename));
    res.send(result.buffer);
  } catch (err) {
    console.error("WORK DOCUMENT ERROR:", err.message);
    const code = err.statusCode || 500;
    res.status(code).json({ error: err.message || "Work document generation failed" });
  }
});

/* ================= CONTENT HUB → SLIDE DECK ================= */

app.post("/generate-slide-deck", async (req, res) => {
  try {
    const { question, content, clientName, issuerName } = req.body || {};
    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "content is required" });
    }
    const result = await generateSlideDeckFromContent(openai, {
      question,
      content,
      clientName,
      issuerName,
    });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    );
    res.setHeader("Content-Disposition", attachmentContentDisposition(result.filename));
    res.setHeader("X-Slide-Count", String(result.slideCount));
    res.send(result.buffer);
  } catch (err) {
    console.error("SLIDE DECK ERROR:", err.message);
    const code = err.statusCode || 500;
    res.status(code).json({ error: err.message || "Slide deck generation failed" });
  }
});

/* ================= GLOBAL ERROR ================= */

app.use((err, req, res, next) => {
  logger.error("express_global_error", err, {
    reqId: req.requestId,
    method: req.method,
    path: req.path,
  });

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: "Invalid JSON format",
    });
  }

  if (err instanceof multer.MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(status).json({
      error: err.code === "LIMIT_FILE_SIZE" ? "Uploaded file exceeds 25 MB limit." : err.message,
      code: err.code,
    });
  }

  if (err.message === "Origin not allowed by CORS") {
    return res.status(403).json({ error: "Origin not allowed" });
  }

  const status = err.statusCode && err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500;
  res.status(status).json({
    error: status < 500 ? err.message : "Server error",
    requestId: req.requestId,
  });
});

process.on("unhandledRejection", (reason) => {
  logger.error("unhandled_rejection", reason instanceof Error ? reason : { reason: String(reason) });
});

process.on("uncaughtException", (err) => {
  logger.error("uncaught_exception", err);
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
  console.log("POST /extract-qas");
  console.log("POST /extract-structured-data");
  console.log("GET  /get-tables/:workspaceId");
  console.log("POST /workspace-document/:workspaceId");
  console.log("GET  /workspace-document/:workspaceId");
  console.log("POST /workspace-document/:workspaceId/seed");
  console.log("GET  /export-document/:workspaceId (?style=styled for template merge)");
  console.log("POST /workspace/email-document (original | simple | styled attachment)");
  console.log("GET  /workspace/email-status");
  console.log("POST /structure-rfp-requirements");
  console.log("POST /ask-with-context");
  console.log("POST /company-intelligence-remote");
  console.log("POST /competitive-intelligence-enrich");
  console.log("POST /generate-company-profile");
  console.log("POST /generate-work-document");
  console.log("POST /generate-slide-deck");
  console.log("POST /technical-solution/extract-patterns");
  console.log("POST /technical-solution/generate-design");
  console.log("POST /communication/ai/draft-kickoff");
  console.log("POST /communication/ai/summarize");
  console.log("POST /communication/ai/reply-coach");
  console.log("POST /pricing/ai/suggest-rates");
  console.log("POST /pricing/ai/estimate-hours");
  console.log("POST /pricing/ai/risk-note");
  console.log("POST /pursuit/ai/suggest-bid-vault");
  console.log("POST /pursuit/ai/parse-scoring");
  console.log("POST /pursuit/ai/draft-win-slide");
  console.log("POST /pursuit/ai/dashboard-insights");
  console.log("RFP collaboration API: /rfp-collab/* (see collaboration/)");
  console.log("Calendar API: /calendar/events, /calendar/team-summary, /calendar/sync-deadlines");
  console.log("Trial tenancy: /trial/auth/* (logical multi-tenant trials)");
  console.log("Grants.gov: POST /grants/search, POST /grants/opportunity");
  console.log("Alt grants: POST /grants/alt/search (private + local live)");
  console.log("USAspending: POST /grants/usaspending/search");
  console.log("SBIR: POST /grants/sbir/search");
  console.log("NIH RePORTER: POST /grants/nih/search");
  console.log("NSF Awards: POST /grants/nsf/search");
  console.log("CA Grants: POST /grants/ca/search");
  console.log("FAC: POST /grants/fac/search");
  console.log("Assistance Listings: POST /grants/assistance-listings/search");
  console.log("Grant briefs: GET /grants/brief, POST /grants/brief/get, POST /grants/brief/regenerate");
  console.log("Philanthropic US: GET /grants/philanthropic/directory, POST /grants/philanthropic/opportunities\n");
});