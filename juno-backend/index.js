import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import multer from "multer";

dotenv.config();

const app = express();

/* ================= CORE MIDDLEWARE ================= */
app.use(cors());

// ONLY parse JSON when Content-Type is application/json
app.use(express.json());

// Parse form data (for non-file requests)
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

    res.json({ answer: response.choices[0].message.content });
  } catch (err) {
    console.error("TEST ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GENERATE ANSWER
app.post("/generate-answer", async (req, res) => {
  try {
    console.log("BODY RECEIVED:", req.body);

    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        error: "Invalid or missing JSON body",
      });
    }

    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        error: "Question is required",
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: "You are a professional RFP proposal writer.",
        },
        {
          role: "user",
          content: question,
        },
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

// Split / number RFP requirements (JSON) — Proposal Manager workspace
app.post("/structure-rfp-requirements", async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text (string) is required" });
    }
    const trimmed = text.trim().slice(0, 14000);
    if (trimmed.length < 80) {
      return res.status(400).json({ error: "text is too short" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You split RFP, solicitation, and questionnaire text into separate numbered requirement items.
Return ONLY valid JSON with this exact shape:
{"items":[{"n":1,"q":"full wording of ONE discrete requirement or question","ref":"optional short supporting excerpt from the source, or empty string"}]}

Rules:
- n must be 1, 2, 3, ... with no gaps.
- One object per discrete item. Never merge two numbered list entries (e.g. "8. ..." and "9. ..." must be two items).
- Do not prefix q with the number (no leading "1." in q); n is the number.
- Preserve source meaning; fix obvious broken words/line breaks only; do not invent requirements.
- ref may be "" if there is nothing extra to cite.
- Produce as many items as the text clearly supports (often dozens for long excerpts).`,
        },
        {
          role: "user",
          content: `Split and number this excerpt into discrete requirements:\n\n${trimmed}`,
        },
      ],
    });

    const raw = response.choices[0].message.content;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: "Model returned invalid JSON" });
    }
    if (!parsed || !Array.isArray(parsed.items)) {
      return res.status(500).json({ error: "Invalid response shape from model" });
    }
    const items = parsed.items.filter(
      (it) =>
        it &&
        typeof it === "object" &&
        typeof it.q === "string" &&
        it.q.trim().length >= 3,
    );
    res.json({ items });
  } catch (err) {
    console.error("STRUCTURE RFP REQUIREMENTS ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// CONTEXT BASED
app.post("/ask-with-context", async (req, res) => {
  try {
    const { question, document } = req.body || {};

    if (!question || !document) {
      return res.status(400).json({
        error: "question and document required",
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content:
            "Answer ONLY from the document. If not found, say 'Not found'.",
        },
        {
          role: "user",
          content: `DOCUMENT:\n${document}\n\nQUESTION:\n${question}`,
        },
      ],
    });

    res.json({
      answer: response.choices[0].message.content,
    });

  } catch (err) {
    console.error("CONTEXT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* -------- Wikipedia (live) + OpenAI structuring -------- */
const WIKI_UA =
  "JUNO-RFP/1.0 (https://github.com/MarlnCorp-NexusHive/JUNO-RFP; company research)";

async function fetchWikipediaContext(searchQuery) {
  const q = searchQuery.trim().slice(0, 280);
  if (!q) return { blocks: [] };
  const opUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
    q,
  )}&limit=3&namespace=0&format=json&origin=*`;
  const opRes = await fetch(opUrl, { headers: { "User-Agent": WIKI_UA } });
  if (!opRes.ok) return { blocks: [] };
  const data = await opRes.json();
  const titles = data[1] || [];
  const descriptions = data[2] || [];
  const blocks = [];
  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];
    const enc = encodeURIComponent(title.replace(/ /g, "_"));
    const sumUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${enc}`;
    const sr = await fetch(sumUrl, { headers: { "User-Agent": WIKI_UA } });
    let extract = descriptions[i] || "";
    let pageUrl = `https://en.wikipedia.org/wiki/${enc}`;
    if (sr.ok) {
      const sj = await sr.json();
      extract = sj.extract || extract;
      pageUrl = sj.content_urls?.desktop?.page || pageUrl;
    }
    blocks.push(`Article: ${title}\nURL: ${pageUrl}\nSummary:\n${extract}\n`);
  }
  return { blocks };
}

// COMPANY INTELLIGENCE — remote (not in local JSON dataset)
app.post("/company-intelligence-remote", async (req, res) => {
  try {
    const query = typeof req.body?.query === "string" ? req.body.query.trim() : "";
    if (!query) {
      return res.status(400).json({ error: "query is required" });
    }

    const wiki = await fetchWikipediaContext(query);
    const wikiText = wiki.blocks.length
      ? wiki.blocks.join("\n---\n")
      : "No matching English Wikipedia articles were returned for this search.";

    const system =
      "You transform public Wikipedia text into structured company intelligence for RFP teams. Stay faithful to the source; do not invent financial numbers. If figures are not in the excerpts, use empty arrays.";

    const user = `User search: "${query}"

Sources (English Wikipedia, retrieved live):
${wikiText}

Return JSON only (no markdown) with keys:
"name" (canonical organization name),
"ticker" (exchange symbol or empty string if unknown),
"region" (e.g. country or "Global"),
"sector" (short industry label),
"customers" (multi-paragraph narrative for proposal research; state that facts are derived from Wikipedia when applicable),
"revenue" (array of { "period": string, "value": number } only if annual revenue is explicitly stated in the excerpts, else []),
"netIncome" (same rule, else []),
"assets" (same rule, else []).

Rules:
- Never fabricate numeric time series.
- If sources are a poor match or empty, explain briefly in "customers" and still return best-effort name/region/sector.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return res.status(502).json({ error: "Empty model response" });

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(502).json({ error: "Invalid JSON from model" });
    }

    const normSeries = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr
        .filter(
          (x) =>
            x &&
            x.period != null &&
            typeof x.value === "number" &&
            !Number.isNaN(x.value),
        )
        .slice(0, 24)
        .map((x) => ({ period: String(x.period), value: x.value }));
    };

    const revenue = normSeries(parsed.revenue);
    const netIncome = normSeries(parsed.netIncome);
    const assets = normSeries(parsed.assets);

    const name =
      typeof parsed.name === "string" && parsed.name.trim() ? parsed.name.trim() : query;
    const ticker =
      typeof parsed.ticker === "string" && parsed.ticker.trim()
        ? parsed.ticker.trim().toUpperCase()
        : null;
    const region = typeof parsed.region === "string" ? parsed.region.trim() || null : null;
    const sector = typeof parsed.sector === "string" ? parsed.sector.trim() || null : null;
    const customers = typeof parsed.customers === "string" ? parsed.customers.trim() : "";

    res.json({
      name,
      ticker,
      region,
      sector,
      customers,
      financials: { revenue, netIncome, assets },
      trends: { revenue, netIncome, assets },
      source: wiki.blocks.length
        ? "Wikipedia (live) + AI structuring"
        : "AI structuring (no Wikipedia match)",
      error: null,
      remote: true,
    });
  } catch (err) {
    console.error("REMOTE CI ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// COMPANY PROFILE (RFP)
app.post("/generate-company-profile", async (req, res) => {
  try {
    const { companyName, companyWebsite, companyText } = req.body || {};
    const trim = (v) => (typeof v === "string" ? v.trim() : "");
    const name = trim(companyName);
    const web = trim(companyWebsite);
    const text = trim(companyText);

    if (!name && !web && !text) {
      return res.status(400).json({
        error: "Provide at least one of: companyName, companyWebsite, companyText",
      });
    }

    const parts = [];
    if (name) parts.push(`Company name: ${name}`);
    if (web) parts.push(`Website URL: ${web}`);
    if (text) parts.push(`Pasted company description / notes:\n${text}`);
    const userInputs = parts.join("\n\n");

    const systemPrompt =
      "You are an expert proposal writer. Generate a professional company profile suitable for RFP submissions. Keep it formal, structured, and concise.";

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Using the inputs below, respond with a single JSON object only (no markdown fences) with exactly these keys, each value a non-empty string:
"companyOverview", "keyServices", "strengths", "relevantExperience", "suggestedRfpResponseParagraph".

Guidelines:
- Formal, proposal-ready tone.
- If facts are unknown, use cautious professional language; do not invent specific contract names, dollar amounts, or client names not suggested by the inputs.
- keyServices and strengths: use newline-separated bullet lines inside the string.
- suggestedRfpResponseParagraph: one cohesive paragraph suitable to paste into an RFP response.

Inputs:
${userInputs}`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) {
      return res.status(502).json({ error: "Empty model response" });
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(502).json({ error: "Model returned invalid JSON" });
    }

    const keys = [
      "companyOverview",
      "keyServices",
      "strengths",
      "relevantExperience",
      "suggestedRfpResponseParagraph",
    ];
    const out = {};
    for (const k of keys) {
      out[k] = typeof parsed[k] === "string" ? parsed[k] : String(parsed[k] ?? "");
    }

    res.json(out);
  } catch (err) {
    console.error("COMPANY PROFILE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// FILE UPLOAD (IMPORTANT FIX)
app.post("/ask-with-file", (req, res, next) => {
  if (!req.headers["content-type"]?.includes("multipart/form-data")) {
    return res.status(400).json({
      error: "Content-Type must be multipart/form-data",
    });
  }
  next();
}, upload.single("file"), async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file?.originalname);

    const { question } = req.body;
    const file = req.file;

    if (!question || !file) {
      return res.status(400).json({
        error: "File and question are required",
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
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log("✅ Ready endpoints:");
  console.log("GET  /test-ai");
  console.log("POST /generate-answer");
  console.log("POST /structure-rfp-requirements");
  console.log("POST /ask-with-context");
  console.log("POST /company-intelligence-remote");
  console.log("POST /generate-company-profile");
  console.log("POST /ask-with-file\n");
});