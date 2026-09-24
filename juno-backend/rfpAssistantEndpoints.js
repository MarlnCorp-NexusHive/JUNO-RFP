/**
 * Proposal Manager / Content Hub AI routes proxied from Vite.
 */

import { DOCUMENT_QA_SYSTEM_PROMPT } from "./documentQaPrompt.js";

const MAX_DOC_CHARS = 120_000;

function parseJsonCompletion(content) {
  if (!content || typeof content !== "string") return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function normalizeRequirementKey(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/^\s*\d+[\.)]\s+/, "")
    .replace(/^\s*[\u2022•\-–—]\s+/, "")
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();
}

/** Prefer the exact span from the source document when the model returns near-verbatim text. */
function snapToSourceVerbatim(source, candidate) {
  const src = String(source || "");
  const cand = String(candidate || "").trim();
  if (!cand) return "";
  if (!src) return cand;

  const direct = src.indexOf(cand);
  if (direct >= 0) return src.slice(direct, direct + cand.length);

  const words = cand.split(/\s+/).filter(Boolean);
  if (words.length < 4) return cand;
  try {
    const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const re = new RegExp(escaped.join("\\s+"), "i");
    const m = src.match(re);
    if (m?.[0]) return m[0];
  } catch {
    /* ignore bad regex */
  }
  return cand;
}

function dedupeRequirementItems(items) {
  const out = [];
  const seen = new Set();
  for (const row of items) {
    const q = String(row?.q || "").trim();
    if (!q) continue;
    const key = normalizeRequirementKey(q);
    if (!key || key.length < 12) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      n: Number(row?.n) || out.length + 1,
      q,
      ref: row?.ref != null ? String(row.ref).trim() : undefined,
    });
  }
  return out.map((row, i) => ({ ...row, n: i + 1 }));
}

const STRUCTURE_RFP_SYSTEM_PROMPT = `You extract discrete RFP / solicitation requirements for a proposal workspace.

Return ONLY JSON of this shape:
{"items":[{"n":number,"q":"requirement text","ref":"optional short source excerpt"}]}

Rules (strict):
1. COPY each requirement VERBATIM from the source. Do NOT paraphrase, summarize, rewrite, rephrase, "clean up", or change meaning, grammar, spelling, punctuation, capitalization, or legal wording.
2. Your job is ONLY to find boundaries between distinct requirements / questions and split them into separate items. The text in "q" must be the original words from the document.
3. Preserve original list numbers inside "q" when they appear in the source (e.g. keep "3. The contractor shall…"). Also set "n" to consecutive integers starting at 1 for workspace order.
4. Detect duplicates: if the same requirement appears more than once (same or nearly identical wording), include it ONLY ONCE — keep the first occurrence.
5. Skip boilerplate that is not a response requirement (title pages, TOC-only lines, pure confidentiality headers) unless they contain an actionable shall/must/requirement.
6. One distinct requirement per item. Preserve document order. If there are no clear requirements, return {"items":[]}.
7. "ref" is optional and must also be a short verbatim excerpt from the source (or omit it). Never invent text.`;

export function registerRfpAssistantEndpoints(app, openai) {
  app.post("/structure-rfp-requirements", async (req, res) => {
    try {
      const text = req.body?.text;
      if (typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: 'Request body must include non-empty string "text"' });
      }

      const sourceText = text.slice(0, MAX_DOC_CHARS);

      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: STRUCTURE_RFP_SYSTEM_PROMPT,
          },
          { role: "user", content: sourceText },
        ],
        temperature: 0,
        max_completion_tokens: 8192,
      });

      const parsed = parseJsonCompletion(response.choices[0]?.message?.content);
      const rawItems = Array.isArray(parsed?.items) ? parsed.items : [];
      const snapped = rawItems.map((row, i) => {
        const rawQ = String(row?.q || "").trim();
        const rawRef = row?.ref != null ? String(row.ref).trim() : "";
        const q = snapToSourceVerbatim(sourceText, rawQ);
        const ref = rawRef ? snapToSourceVerbatim(sourceText, rawRef) : undefined;
        return {
          n: Number(row?.n) || i + 1,
          q,
          ref: ref || undefined,
        };
      });
      const items = dedupeRequirementItems(snapped);

      res.json({ items });
    } catch (err) {
      console.error("STRUCTURE RFP REQUIREMENTS ERROR:", err.message);
      res.status(500).json({ error: err.message || "Structuring failed" });
    }
  });

  app.post("/ask-with-context", async (req, res) => {
    try {
      const { question, document } = req.body || {};
      if (typeof question !== "string" || !question.trim()) {
        return res.status(400).json({ error: "question is required" });
      }
      if (typeof document !== "string" || !document.trim()) {
        return res.status(400).json({ error: "document is required" });
      }

      const documentText = document.slice(0, MAX_DOC_CHARS);
      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: DOCUMENT_QA_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: `DOCUMENT:\n${documentText}\n\nQUESTION:\n${question}`,
          },
        ],
        temperature: 0.25,
      });

      res.json({ answer: response.choices[0]?.message?.content ?? "" });
    } catch (err) {
      console.error("ASK WITH CONTEXT ERROR:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/generate-company-profile", async (req, res) => {
    try {
      const companyName = String(req.body?.companyName ?? "").trim();
      const companyWebsite = String(req.body?.companyWebsite ?? "").trim();
      const companyText = String(req.body?.companyText ?? "").trim();

      if (!companyName && !companyWebsite && !companyText) {
        return res.status(400).json({
          error: "Provide at least one of companyName, companyWebsite, or companyText",
        });
      }

      const userBits = [
        companyName && `Company name: ${companyName}`,
        companyWebsite && `Website: ${companyWebsite}`,
        companyText && `Additional notes / pasted content:\n${companyText.slice(0, MAX_DOC_CHARS)}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Return JSON with string fields only: companyOverview, keyServices, strengths, relevantExperience, suggestedRfpResponseParagraph. Write professional proposal-ready prose. If information is missing, infer cautiously and note assumptions briefly in the overview.',
          },
          { role: "user", content: userBits },
        ],
        temperature: 0.35,
        max_completion_tokens: 4096,
      });

      const parsed = parseJsonCompletion(response.choices[0]?.message?.content) || {};
      const keys = [
        "companyOverview",
        "keyServices",
        "strengths",
        "relevantExperience",
        "suggestedRfpResponseParagraph",
      ];
      const out = {};
      for (const k of keys) {
        out[k] = typeof parsed[k] === "string" ? parsed[k] : "";
      }
      res.json(out);
    } catch (err) {
      console.error("GENERATE COMPANY PROFILE ERROR:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/company-intelligence-remote", async (req, res) => {
    try {
      const query = String(req.body?.query ?? "").trim();
      if (!query) {
        return res.status(400).json({ error: "query is required" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You help build structured company snapshots for RFP writers. The user names a company (optionally with ticker).

Return ONLY valid JSON matching this shape:
{
  "name": "canonical company name",
  "ticker": "uppercase symbol or null if unknown/private",
  "region": "primary HQ region or null",
  "sector": "industry sector or null",
  "financials": {
    "revenue": [{"period":"e.g. FY2023","value": number}],
    "netIncome": [{"period":"...","value": number}],
    "assets": [{"period":"...","value": number}]
  },
  "customers": "2-6 sentence narrative: products, customers, positioning. Use only well-known public facts; if uncertain use null for ticker and empty arrays for financials and explain in customers that figures are unavailable.",
  "source": "short note e.g. Public knowledge summary — verify before financial use",
  "error": null
}

Use USD for financial values when you include them; use [] for series you cannot support. Set error to a string only if the query is not a company name.`,
          },
          { role: "user", content: query.slice(0, 500) },
        ],
        temperature: 0.2,
        max_completion_tokens: 2048,
      });

      const parsed = parseJsonCompletion(response.choices[0]?.message?.content);
      if (!parsed || typeof parsed !== "object") {
        return res.status(500).json({ error: "Invalid model response" });
      }

      if (parsed.error && typeof parsed.error === "string") {
        return res.json({
          name: query,
          ticker: null,
          region: null,
          sector: null,
          financials: { revenue: [], netIncome: [], assets: [] },
          trends: { revenue: [], netIncome: [], assets: [] },
          customers: "",
          source: null,
          error: parsed.error,
        });
      }

      const fin = parsed.financials || {};
      const financials = {
        revenue: Array.isArray(fin.revenue) ? fin.revenue : [],
        netIncome: Array.isArray(fin.netIncome) ? fin.netIncome : [],
        assets: Array.isArray(fin.assets) ? fin.assets : [],
      };

      res.json({
        name: String(parsed.name || query).trim() || query,
        ticker: parsed.ticker != null ? String(parsed.ticker).toUpperCase() : null,
        region: parsed.region != null ? String(parsed.region) : null,
        sector: parsed.sector != null ? String(parsed.sector) : null,
        financials,
        trends: financials,
        customers: typeof parsed.customers === "string" ? parsed.customers : "",
        source: typeof parsed.source === "string" ? parsed.source : "AI summary — verify",
        error: null,
      });
    } catch (err) {
      console.error("COMPANY INTELLIGENCE REMOTE ERROR:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Competitive Intelligence: refresh datasheet + differentiators for a named peer SI.
   * Returns the Competitive Intelligence sample shape used by the PM page.
   */
  app.post("/competitive-intelligence-enrich", async (req, res) => {
    try {
      const companyName = String(req.body?.companyName ?? req.body?.query ?? "").trim();
      const segment = String(req.body?.segment ?? "").trim();
      if (!companyName) {
        return res.status(400).json({ error: "companyName is required" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a competitive intelligence analyst supporting RFP / proposal managers at a systems-integrator firm.
Given a peer competitor company name (and optional segment hint), return ONLY valid JSON:

{
  "name": "canonical company name",
  "shortName": "short brand name",
  "hq": "HQ city/country or region",
  "segment": "e.g. Global SI | Federal integrator | Big Four consulting",
  "datasheet": {
    "revenueUsdB": number or null,
    "employeesK": number or null,
    "operatingMarginPct": number or null,
    "publicSectorSharePct": number or null,
    "offshoreMixPct": number or null,
    "growthYoYPct": number or null,
    "keyVehicles": "comma-separated public contract vehicles / frameworks if known, else empty string"
  },
  "valueProposition": "1-2 sentences on how this firm wins RFPs / adds value vs peers",
  "keyDifferentiators": ["3-5 bid-relevant differentiators"],
  "typicalWinThemes": ["2-3 themes they typically sell"],
  "source": "short source note e.g. Public filings & industry knowledge — verify",
  "error": null
}

Rules:
- Use approximate, well-known public figures in USD billions / percentages when widely reported; prefer null over inventing precise fake decimals.
- keyDifferentiators and valueProposition must be useful for bid strategy (positioning, past performance posture, delivery model, clearance, commercials).
- Set error to a string only if the name is not a recognizable company.
- Do not invent classified or non-public contract details; use common public IDIQ/framework names only.`,
          },
          {
            role: "user",
            content: segment
              ? `Company: ${companyName.slice(0, 200)}\nSegment hint: ${segment.slice(0, 120)}`
              : `Company: ${companyName.slice(0, 200)}`,
          },
        ],
        temperature: 0.25,
        max_completion_tokens: 2048,
      });

      const parsed = parseJsonCompletion(response.choices[0]?.message?.content);
      if (!parsed || typeof parsed !== "object") {
        return res.status(500).json({ error: "Invalid model response" });
      }

      if (parsed.error && typeof parsed.error === "string") {
        return res.json({
          name: companyName,
          shortName: companyName,
          hq: null,
          segment: segment || null,
          datasheet: {
            revenueUsdB: null,
            employeesK: null,
            operatingMarginPct: null,
            publicSectorSharePct: null,
            offshoreMixPct: null,
            growthYoYPct: null,
            keyVehicles: "",
          },
          valueProposition: "",
          keyDifferentiators: [],
          typicalWinThemes: [],
          source: null,
          error: parsed.error,
          remote: true,
        });
      }

      const ds = parsed.datasheet && typeof parsed.datasheet === "object" ? parsed.datasheet : {};
      const numOrNull = (v) => {
        if (v == null || v === "") return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };
      const strList = (v) =>
        Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean).slice(0, 6) : [];

      res.json({
        name: String(parsed.name || companyName).trim() || companyName,
        shortName: String(parsed.shortName || parsed.name || companyName).trim() || companyName,
        hq: parsed.hq != null ? String(parsed.hq) : null,
        segment: parsed.segment != null ? String(parsed.segment) : segment || null,
        datasheet: {
          revenueUsdB: numOrNull(ds.revenueUsdB),
          employeesK: numOrNull(ds.employeesK),
          operatingMarginPct: numOrNull(ds.operatingMarginPct),
          publicSectorSharePct: numOrNull(ds.publicSectorSharePct),
          offshoreMixPct: numOrNull(ds.offshoreMixPct),
          growthYoYPct: numOrNull(ds.growthYoYPct),
          keyVehicles: ds.keyVehicles != null ? String(ds.keyVehicles) : "",
        },
        valueProposition:
          typeof parsed.valueProposition === "string" ? parsed.valueProposition.trim() : "",
        keyDifferentiators: strList(parsed.keyDifferentiators),
        typicalWinThemes: strList(parsed.typicalWinThemes),
        source:
          typeof parsed.source === "string"
            ? parsed.source
            : "Live AI enrichment — verify before bid use",
        error: null,
        remote: true,
      });
    } catch (err) {
      console.error("COMPETITIVE INTELLIGENCE ENRICH ERROR:", err.message);
      res.status(500).json({ error: err.message });
    }
  });
}
