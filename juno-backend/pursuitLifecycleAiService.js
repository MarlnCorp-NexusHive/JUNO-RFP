/**
 * AI for Bid Vault / Scoring / Win Slide — grounded in Source Docs + Q&A context when provided.
 */

function asText(value, max = 12_000) {
  const s = String(value || "").trim();
  return s.length > max ? s.slice(0, max) : s;
}

function asNum(value, fallback = null) {
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
 * Suggest Bid Vault submissions from Source Docs catalog + shortlist.
 */
export async function suggestBidVaultFromSources(openai, payload = {}) {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `You are a proposal capture analyst. From source document metadata and Q&A library snippets, suggest Bid Vault pursuit records.
Return ONLY JSON:
{"submissions":[{"title":"...","number":"","agency":"","segment":"Federal|State/Local|Commercial|International","stage":"pipeline|capture|proposal|submitted","value":null,"deadline":"YYYY-MM-DD or null","sourceDocIds":["..."],"notes":"..."}],"rationale":"1-2 sentences"}
Prefer grounding in provided document names and deadlines. Max 8 submissions. Do not invent agencies that contradict the docs.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          sourceDocs: payload.sourceDocs || {},
          shortlist: Array.isArray(payload.shortlist) ? payload.shortlist.slice(0, 15) : [],
          existingTitles: Array.isArray(payload.existingTitles)
            ? payload.existingTitles.slice(0, 30)
            : [],
        }),
      },
    ],
  });

  const parsed = parseJsonObject(response.choices?.[0]?.message?.content);
  const submissions = Array.isArray(parsed.submissions)
    ? parsed.submissions
        .map((s) => ({
          title: asText(s.title, 300),
          number: asText(s.number, 120),
          agency: asText(s.agency, 200),
          segment: asText(s.segment || "State/Local", 40),
          stage: asText(s.stage || "pipeline", 40),
          value: asNum(s.value, null),
          deadline: s.deadline ? asText(s.deadline, 20) : null,
          sourceDocIds: Array.isArray(s.sourceDocIds) ? s.sourceDocIds.map(String).slice(0, 5) : [],
          notes: asText(s.notes, 400),
        }))
        .filter((s) => s.title)
        .slice(0, 8)
    : [];
  if (!submissions.length) throw new Error("No bid vault suggestions generated");
  return { submissions, rationale: asText(parsed.rationale, 500) };
}

/**
 * Parse debrief / score sheet text into scoring structure, using source docs context.
 */
export async function parseScoringDebriefAi(openai, payload = {}) {
  const text = asText(payload.text, 20_000);
  if (!text) throw new Error("text is required");

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `You extract structured win/loss scoring from debrief notes or Section M score sheets.
Return ONLY JSON:
{"outcome":"won|lost|pending","summary":"...","whyWon":["..."],"whyLost":["..."],"evaluatorComments":"...","factors":[{"name":"...","sectionMRef":"M.1","weight":0,"ourScore":0,"winnerScore":0,"maxScore":5,"notes":"..."}],"capabilityGaps":[{"title":"...","productArea":"content|intel|solutioning|export|compliance|collab|ingest|other","severity":"high|medium|low","description":"..."}]}
Use source doc / Q&A context when it clarifies the RFP. Max 8 factors, 5 gaps.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          text,
          pursuit: payload.pursuit || {},
          sourceDocs: payload.sourceDocs || {},
        }),
      },
    ],
  });

  const parsed = parseJsonObject(response.choices?.[0]?.message?.content);
  const outcomeRaw = String(parsed.outcome || "pending").toLowerCase();
  const outcome = ["won", "lost", "pending"].includes(outcomeRaw) ? outcomeRaw : "pending";
  const list = (v, max = 8) =>
    Array.isArray(v) ? v.map((x) => asText(x, 400)).filter(Boolean).slice(0, max) : [];
  const factors = Array.isArray(parsed.factors)
    ? parsed.factors
        .map((f, i) => ({
          id: `fac_ai_${Date.now()}_${i}`,
          name: asText(f.name, 160),
          sectionMRef: asText(f.sectionMRef, 40),
          weight: asNum(f.weight, 0) ?? 0,
          ourScore: asNum(f.ourScore, null),
          winnerScore: asNum(f.winnerScore, null),
          maxScore: asNum(f.maxScore, 5) ?? 5,
          notes: asText(f.notes, 300),
        }))
        .filter((f) => f.name)
        .slice(0, 8)
    : [];
  const capabilityGaps = Array.isArray(parsed.capabilityGaps)
    ? parsed.capabilityGaps
        .map((g, i) => ({
          id: `gap_ai_${Date.now()}_${i}`,
          title: asText(g.title, 200),
          description: asText(g.description, 500),
          productArea: asText(g.productArea || "other", 40),
          severity: ["high", "medium", "low"].includes(String(g.severity || "").toLowerCase())
            ? String(g.severity).toLowerCase()
            : "medium",
          status: "open",
          relatedFactorIds: [],
          evidence: "AI debrief parse",
          roadmapTheme: "",
        }))
        .filter((g) => g.title)
        .slice(0, 5)
    : [];

  return {
    outcome,
    debrief: {
      sourceType: "ai_debrief",
      summary: asText(parsed.summary, 1200),
      whyWon: list(parsed.whyWon, 6),
      whyLost: list(parsed.whyLost, 6),
      evaluatorComments: asText(parsed.evaluatorComments, 800),
    },
    factors,
    capabilityGaps,
  };
}

/**
 * Draft win slide copy from scoring + source docs context.
 */
export async function draftWinSlideAi(openai, payload = {}) {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: `You draft a post-selection win/loss slide for orals or internal debrief.
Return ONLY JSON:
{"pov":"2-4 sentences","testing":"proof/testing notes","whyUs":["..."],"whyThem":["..."],"competitors":["optional free-text rival names"],"outcomeHint":"won|lost|pending"}
Ground in scoring factors and source-doc Q&As when provided. Max 5 whyUs and whyThem bullets.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          pursuit: payload.pursuit || {},
          scoring: payload.scoring || {},
          competitors: payload.competitors || [],
          sourceDocs: payload.sourceDocs || {},
          outcome: payload.outcome || "",
        }),
      },
    ],
  });

  const parsed = parseJsonObject(response.choices?.[0]?.message?.content);
  const bullets = (v) =>
    Array.isArray(v) ? v.map((x) => asText(x, 200)).filter(Boolean).slice(0, 5) : [];
  return {
    pov: asText(parsed.pov, 1200),
    testing: asText(parsed.testing, 800),
    whyUs: bullets(parsed.whyUs),
    whyThem: bullets(parsed.whyThem),
    competitors: bullets(parsed.competitors),
    outcomeHint: asText(parsed.outcomeHint || payload.outcome || "", 20),
  };
}

/**
 * Deep-parse an RFP/grant source document into dashboard + vault + compliance insights.
 * @param {import("openai").OpenAI} openai
 * @param {{ document?: string, documentName?: string, context?: object }} payload
 */
export async function extractDashboardInsights(openai, payload = {}) {
  const document = asText(payload.document, 120_000);
  if (!document || document.length < 40) {
    throw new Error("document text is required");
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `You are a federal/grant proposal capture analyst. Deeply read the solicitation (or excerpt) and extract structured insights for a company proposal dashboard.
Return ONLY JSON:
{
  "opportunity": {
    "title":"...",
    "number":"",
    "agency":"",
    "segment":"Federal|State/Local|Commercial|International",
    "stageHint":"pipeline|capture|proposal|submitted",
    "valueEstimate": null,
    "deadline":"YYYY-MM-DD or null",
    "procurementType":"FAR Part 15 (Best Value)|FAR Part 15 (LPTA)|FAR Part 16 (Task Orders)|Sole Source|Grant|Other",
    "winProbability": 0
  },
  "sectionM":[{"name":"...","weight":0,"score":0}],
  "risks":[{"name":"...","level":"low|medium|high","score":0,"mitigation":"..."}],
  "complianceAreas":[{"name":"...","status":"compliant|pending|nonCompliant","score":0}],
  "quality":{"completeness":0,"clarity":0,"compliance":0,"differentiation":0},
  "alerts":["short urgent actionable strings"],
  "summary":"2-3 sentences",
  "synopsis":"4-8 sentence capture-ready overview: what the document is, issuer, what is sought, value/scope if stated, key deadlines, evaluation themes, and hard constraints",
  "synopsisBullets":["up to 6 short bullet highlights"]
}
Rules:
- Ground EVERY field in the document; use null/empty when unknown — do not invent agencies or dollar values.
- valueEstimate is USD number when budget/ceiling/estimated value is stated; else null.
- sectionM: up to 6 evaluation factors (Section M / evaluation criteria). score is readiness/importance hint 0-100.
- risks: up to 5 material risks (deadline, page limits, mandatory clauses, OCI, etc.).
- complianceAreas: up to 6 areas (FAR clauses, certifications, past performance, format).
- winProbability 0-100 qualitative capture fit if inferable, else 50.
- alerts: max 4, only if truly time-sensitive or elimination risk.
- synopsis must be useful as a standalone card brief; synopsisBullets max 6, concrete facts only.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          documentName: asText(payload.documentName, 300),
          context: payload.context || {},
          document,
        }),
      },
    ],
  });

  const parsed = parseJsonObject(response.choices?.[0]?.message?.content);
  const opp = parsed.opportunity || {};
  const clamp = (n, lo = 0, hi = 100) => {
    const v = asNum(n, null);
    if (v == null) return null;
    return Math.max(lo, Math.min(hi, Math.round(v)));
  };
  const listAlerts = Array.isArray(parsed.alerts)
    ? parsed.alerts.map((a) => asText(a, 240)).filter(Boolean).slice(0, 4)
    : [];

  return {
    opportunity: {
      title: asText(opp.title, 300),
      number: asText(opp.number, 120),
      agency: asText(opp.agency, 200),
      segment: asText(opp.segment || "State/Local", 40),
      stageHint: asText(opp.stageHint || "pipeline", 40),
      valueEstimate: asNum(opp.valueEstimate, null),
      deadline: opp.deadline ? asText(opp.deadline, 20) : null,
      procurementType: asText(opp.procurementType || "Other", 80),
      winProbability: clamp(opp.winProbability, 0, 100) ?? 50,
    },
    sectionM: Array.isArray(parsed.sectionM)
      ? parsed.sectionM
          .map((f) => ({
            name: asText(f.name, 160),
            weight: asNum(f.weight, 0) ?? 0,
            score: clamp(f.score, 0, 100) ?? 0,
          }))
          .filter((f) => f.name)
          .slice(0, 6)
      : [],
    risks: Array.isArray(parsed.risks)
      ? parsed.risks
          .map((r) => ({
            name: asText(r.name, 160),
            level: ["low", "medium", "high"].includes(String(r.level || "").toLowerCase())
              ? String(r.level).toLowerCase()
              : "medium",
            score: clamp(r.score, 0, 100) ?? 50,
            mitigation: asText(r.mitigation, 300),
          }))
          .filter((r) => r.name)
          .slice(0, 5)
      : [],
    complianceAreas: Array.isArray(parsed.complianceAreas)
      ? parsed.complianceAreas
          .map((a) => {
            const statusRaw = String(a.status || "pending").toLowerCase();
            const status =
              statusRaw === "compliant" || statusRaw === "noncompliant" || statusRaw === "non-compliant"
                ? statusRaw.replace("non-compliant", "nonCompliant").replace("noncompliant", "nonCompliant")
                : "pending";
            return {
              name: asText(a.name, 160),
              status: status === "nonCompliant" ? "nonCompliant" : status === "compliant" ? "compliant" : "pending",
              score: clamp(a.score, 0, 100) ?? 50,
            };
          })
          .filter((a) => a.name)
          .slice(0, 6)
      : [],
    quality: {
      completeness: clamp(parsed.quality?.completeness, 0, 100) ?? 0,
      clarity: clamp(parsed.quality?.clarity, 0, 100) ?? 0,
      compliance: clamp(parsed.quality?.compliance, 0, 100) ?? 0,
      differentiation: clamp(parsed.quality?.differentiation, 0, 100) ?? 0,
    },
    alerts: listAlerts,
    summary: asText(parsed.summary, 800),
    synopsis: asText(parsed.synopsis || parsed.summary, 2500),
    synopsisBullets: Array.isArray(parsed.synopsisBullets)
      ? parsed.synopsisBullets.map((b) => asText(b, 240)).filter(Boolean).slice(0, 6)
      : [],
  };
}

export function registerPursuitLifecycleAiRoutes(app, openai) {
  app.post("/pursuit/ai/suggest-bid-vault", async (req, res) => {
    try {
      const result = await suggestBidVaultFromSources(openai, req.body || {});
      res.json(result);
    } catch (err) {
      console.error("PURSUIT AI BID VAULT ERROR:", err.message);
      res.status(500).json({ error: err.message || "Bid vault suggest failed" });
    }
  });

  app.post("/pursuit/ai/parse-scoring", async (req, res) => {
    try {
      const result = await parseScoringDebriefAi(openai, req.body || {});
      res.json(result);
    } catch (err) {
      console.error("PURSUIT AI SCORING ERROR:", err.message);
      const status = /required/i.test(err.message) ? 400 : 500;
      res.status(status).json({ error: err.message || "Scoring parse failed" });
    }
  });

  app.post("/pursuit/ai/draft-win-slide", async (req, res) => {
    try {
      const result = await draftWinSlideAi(openai, req.body || {});
      res.json(result);
    } catch (err) {
      console.error("PURSUIT AI WIN SLIDE ERROR:", err.message);
      res.status(500).json({ error: err.message || "Win slide draft failed" });
    }
  });

  app.post("/pursuit/ai/dashboard-insights", async (req, res) => {
    try {
      const result = await extractDashboardInsights(openai, req.body || {});
      res.json(result);
    } catch (err) {
      console.error("PURSUIT AI DASHBOARD ERROR:", err.message);
      const status = /required/i.test(err.message) ? 400 : 500;
      res.status(status).json({ error: err.message || "Dashboard insights failed" });
    }
  });
}
