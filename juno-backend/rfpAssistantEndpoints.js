/**
 * Proposal Manager / Content Hub AI routes proxied from Vite.
 */

const MAX_DOC_CHARS = 120_000;

function parseJsonCompletion(content) {
  if (!content || typeof content !== "string") return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export function registerRfpAssistantEndpoints(app, openai) {
  app.post("/structure-rfp-requirements", async (req, res) => {
    try {
      const text = req.body?.text;
      if (typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: 'Request body must include non-empty string "text"' });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Split the RFP/solicitation text into separate numbered requirements. Return JSON: {"items":[{"n":number,"q":"requirement text","ref":"optional short source excerpt"}]}. One distinct requirement per item; preserve order. Use consecutive n starting at 1. If there are no clear requirements, return {"items":[]}.',
          },
          { role: "user", content: text.slice(0, MAX_DOC_CHARS) },
        ],
        temperature: 0.2,
        max_completion_tokens: 8192,
      });

      const parsed = parseJsonCompletion(response.choices[0]?.message?.content);
      const rawItems = Array.isArray(parsed?.items) ? parsed.items : [];
      const items = rawItems
        .map((row, i) => ({
          n: Number(row?.n) || i + 1,
          q: String(row?.q || "").trim(),
          ref: row?.ref != null ? String(row.ref).trim() : undefined,
        }))
        .filter((row) => row.q.length > 0);

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
            content:
              "Answer ONLY using the RFP/document context provided. If the answer is not in the document, say it is not stated in the document.",
          },
          {
            role: "user",
            content: `DOCUMENT:\n${documentText}\n\nQUESTION:\n${question}`,
          },
        ],
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
}
