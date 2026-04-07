import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import multer from "multer";

// ✅ CORRECT DOCX IMPORT (IMPORTANT)
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

dotenv.config();

const app = express();

/* ================= CORE MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

/* ================= MULTER ================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

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

    // Templates
    const title =
      selectedTemplate === "modern"
        ? "RFP RESPONSE DOCUMENT"
        : selectedTemplate === "technical"
        ? "Technical Proposal"
        : "RFP Response";

    const children = [];

    // TITLE
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.TITLE,
        children: [
          new TextRun({
            text: title,
            bold: true,
          }),
        ],
      })
    );

    // COMPANY
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `Company: ${companyName || "N/A"}`,
            italics: true,
          }),
        ],
      })
    );

    children.push(new Paragraph({ text: "" }));

    // QUESTIONS + ANSWERS
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
        })
      );

      children.push(
        new Paragraph({
          children: [new TextRun(row.answer)],
        })
      );

      children.push(new Paragraph({ text: "" }));
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="rfp-response-${selectedTemplate}.docx"`
    );

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

    const documentText = file.buffer.toString("utf-8");

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: "Answer ONLY using uploaded document.",
        },
        {
          role: "user",
          content: `DOCUMENT:\n${documentText}\n\nQUESTION:\n${question}`,
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
  console.log("POST /ask-with-file\n");
});