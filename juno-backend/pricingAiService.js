/**
 * Proposal Pricing AI: suggest rate card, estimate hours, price risk note.
 */

function asText(value, max = 12_000) {
  const s = String(value || "").trim();
  return s.length > max ? s.slice(0, max) : s;
}

function asNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseJsonObject(raw) {
  const text = String(raw || "").trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : text;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error("AI returned non-JSON");
  }
}

/**
 * @param {import("openai").OpenAI} openai
 * @param {{ industry?: string, region?: string, context?: string, existingRoles?: string[] }} payload
 */
export async function suggestRateCard(openai, payload = {}) {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `You are a US federal/grant proposal pricing analyst. Suggest a practical labor rate card in USD/hour.
Return ONLY JSON:
{"rates":[{"role":"...","rate":0,"loaded":0,"billable":0,"notes":"..."}],"rationale":"1-2 sentences"}
Use 5-8 common proposal roles. Numbers must be realistic US market ranges. loaded >= rate, billable typically near rate or slightly above.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          industry: asText(payload.industry || "professional services / government contracting", 200),
          region: asText(payload.region || "United States", 120),
          context: asText(payload.context, 2000),
          existingRoles: Array.isArray(payload.existingRoles)
            ? payload.existingRoles.map((r) => asText(r, 80)).filter(Boolean).slice(0, 20)
            : [],
        }),
      },
    ],
  });

  const parsed = parseJsonObject(response.choices?.[0]?.message?.content);
  const rates = Array.isArray(parsed.rates)
    ? parsed.rates
        .map((r) => {
          const rate = Math.max(0, Math.round(asNum(r.rate)));
          const loaded = Math.max(rate, Math.round(asNum(r.loaded, rate * 1.2)));
          const billable = Math.max(0, Math.round(asNum(r.billable, rate)));
          return {
            role: asText(r.role, 80),
            rate,
            loaded,
            billable,
            notes: asText(r.notes, 200),
          };
        })
        .filter((r) => r.role)
        .slice(0, 10)
    : [];
  if (!rates.length) throw new Error("No rate suggestions generated");
  return { rates, rationale: asText(parsed.rationale, 500) };
}

/**
 * @param {import("openai").OpenAI} openai
 * @param {{ opportunity?: object, roles?: string[], context?: string }} payload
 */
export async function estimateHours(openai, payload = {}) {
  const opportunity = payload.opportunity || {};
  const roles = Array.isArray(payload.roles)
    ? payload.roles.map((r) => asText(r, 80)).filter(Boolean).slice(0, 15)
    : [];

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `Estimate proposal/delivery labor hours by role for a first-pass cost volume.
Return ONLY JSON:
{"lines":[{"role":"...","hours":0,"rationale":"..."}],"assumptions":"1-2 sentences"}
Hours are total effort (not FTE). Be conservative and practical. Prefer roles from the provided list when present.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          title: asText(opportunity.title || opportunity.name, 400),
          number: asText(opportunity.number, 120),
          agency: asText(opportunity.agency, 200),
          deadline: asText(opportunity.deadline, 80),
          roles,
          context: asText(payload.context, 2500),
        }),
      },
    ],
  });

  const parsed = parseJsonObject(response.choices?.[0]?.message?.content);
  const lines = Array.isArray(parsed.lines)
    ? parsed.lines
        .map((l) => ({
          role: asText(l.role, 80),
          hours: Math.max(0, Math.round(asNum(l.hours))),
          rationale: asText(l.rationale, 200),
        }))
        .filter((l) => l.role && l.hours > 0)
        .slice(0, 15)
    : [];
  if (!lines.length) throw new Error("No hour estimates generated");
  return { lines, assumptions: asText(parsed.assumptions, 500) };
}

/**
 * @param {import("openai").OpenAI} openai
 * @param {{ volume?: object, rates?: object[] }} payload
 */
export async function priceRiskNote(openai, payload = {}) {
  const volume = payload.volume || {};
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.25,
    messages: [
      {
        role: "system",
        content: `You are a pricing red-team reviewer for proposal cost volumes.
Return ONLY JSON:
{"level":"low|medium|high","headline":"...","notes":["..."],"actions":["..."]}
Be specific about bid vs target, missing ODC/subs, thin labor, or aggressive pricing. Max 4 notes and 4 actions.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          title: asText(volume.title, 300),
          laborTotal: asNum(volume.laborTotal),
          subcontractors: asNum(volume.subcontractors),
          odc: asNum(volume.odc),
          total: asNum(volume.total),
          bidPrice: volume.bidPrice == null ? null : asNum(volume.bidPrice),
          targetCost: volume.targetCost == null ? null : asNum(volume.targetCost),
          laborLines: Array.isArray(volume.laborLines)
            ? volume.laborLines.slice(0, 20).map((l) => ({
                role: asText(l.role, 80),
                hours: asNum(l.hours),
                amount: asNum(l.amount),
              }))
            : [],
        }),
      },
    ],
  });

  const parsed = parseJsonObject(response.choices?.[0]?.message?.content);
  const levelRaw = String(parsed.level || "medium").toLowerCase();
  const level = ["low", "medium", "high"].includes(levelRaw) ? levelRaw : "medium";
  const list = (v) =>
    Array.isArray(v) ? v.map((x) => asText(x, 240)).filter(Boolean).slice(0, 4) : [];
  return {
    level,
    headline: asText(parsed.headline, 200) || "Pricing review complete",
    notes: list(parsed.notes),
    actions: list(parsed.actions),
  };
}

export function registerPricingAiRoutes(app, openai) {
  app.post("/pricing/ai/suggest-rates", async (req, res) => {
    try {
      const result = await suggestRateCard(openai, req.body || {});
      res.json(result);
    } catch (err) {
      console.error("PRICING AI RATES ERROR:", err.message);
      res.status(500).json({ error: err.message || "Rate suggestion failed" });
    }
  });

  app.post("/pricing/ai/estimate-hours", async (req, res) => {
    try {
      const result = await estimateHours(openai, req.body || {});
      res.json(result);
    } catch (err) {
      console.error("PRICING AI HOURS ERROR:", err.message);
      res.status(500).json({ error: err.message || "Hour estimate failed" });
    }
  });

  app.post("/pricing/ai/risk-note", async (req, res) => {
    try {
      const result = await priceRiskNote(openai, req.body || {});
      res.json(result);
    } catch (err) {
      console.error("PRICING AI RISK ERROR:", err.message);
      res.status(500).json({ error: err.message || "Price risk note failed" });
    }
  });
}
