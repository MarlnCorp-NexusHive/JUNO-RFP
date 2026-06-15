/**
 * Technical Solutioning — multi-stage AI for RFP response architecture design.
 * Grounds outputs in ingested reference assets (prior diagrams, system designs, product solutions).
 */

const MAX_CHARS = 100_000;
const MAX_ASSET_CHARS = 24_000;

function parseJson(content) {
  if (!content || typeof content !== "string") return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function trimAssets(assets) {
  if (!Array.isArray(assets)) return [];
  return assets
    .slice(0, 12)
    .map((a, i) => ({
      id: String(a?.id || `asset_${i + 1}`),
      name: String(a?.name || `Reference ${i + 1}`).slice(0, 120),
      category: String(a?.category || "system_design").slice(0, 64),
      text: String(a?.text || "").slice(0, MAX_ASSET_CHARS),
    }))
    .filter((a) => a.text.trim().length > 80);
}

function buildReferenceCorpus(assets) {
  return assets
    .map(
      (a, i) =>
        `--- REFERENCE ${i + 1} [${a.category}] id=${a.id} name="${a.name}" ---\n${a.text}`,
    )
    .join("\n\n")
    .slice(0, MAX_CHARS);
}

/**
 * Stage 1 — Extract reusable solution patterns from reference corpus.
 */
export async function extractReferencePatterns(openai, assets) {
  const trimmed = trimAssets(assets);
  if (trimmed.length === 0) {
    return { patterns: [], components: [], capabilities: [], integrations: [] };
  }

  const corpus = buildReferenceCorpus(trimmed);
  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    response_format: { type: "json_object" },
    temperature: 0.15,
    max_completion_tokens: 8192,
    messages: [
      {
        role: "system",
        content: `You are a principal solution architect indexing an organization's technical reference library for RFP reuse.
Extract structured patterns ONLY from the provided references — do not invent products not mentioned.
Return JSON:
{
  "patterns": [{"id":"p1","name":"...","summary":"...","sourceAssetIds":["..."],"tags":["cloud","security"]}],
  "components": [{"id":"c1","name":"...","layer":"Presentation|API|Services|Data|Integration|Security","description":"...","sourceAssetIds":["..."]}],
  "capabilities": [{"id":"cap1","name":"...","description":"...","sourceAssetIds":["..."]}],
  "integrations": [{"id":"i1","from":"...","to":"...","protocol":"...","sourceAssetIds":["..."]}]
}
Keep each list focused (max 20 items total across all lists). Cite sourceAssetIds from reference ids.`,
      },
      { role: "user", content: corpus },
    ],
  });

  const parsed = parseJson(response.choices[0]?.message?.content) || {};
  return {
    patterns: Array.isArray(parsed.patterns) ? parsed.patterns : [],
    components: Array.isArray(parsed.components) ? parsed.components : [],
    capabilities: Array.isArray(parsed.capabilities) ? parsed.capabilities : [],
    integrations: Array.isArray(parsed.integrations) ? parsed.integrations : [],
  };
}

/**
 * Stage 2 — Generate full technical solution design grounded in references + RFP requirements.
 */
export async function generateTechnicalSolutionDesign(openai, payload) {
  const {
    rfpRequirementsText = "",
    rfpRequirementsItems = [],
    referenceAssets = [],
    indexedPatterns = null,
    issuerName = "",
    solutionTitle = "",
    designGoals = "",
  } = payload || {};

  const reqText =
    typeof rfpRequirementsText === "string" && rfpRequirementsText.trim()
      ? rfpRequirementsText.trim().slice(0, MAX_CHARS)
      : Array.isArray(rfpRequirementsItems) && rfpRequirementsItems.length
        ? rfpRequirementsItems
            .map((r, i) => `${r?.n ?? i + 1}. ${String(r?.q || r?.text || r).trim()}`)
            .join("\n")
            .slice(0, MAX_CHARS)
        : "";

  if (!reqText) {
    throw new Error('Provide "rfpRequirementsText" or non-empty "rfpRequirementsItems"');
  }

  const assets = trimAssets(referenceAssets);
  const corpus = assets.length ? buildReferenceCorpus(assets) : "(No reference assets — design from requirements only; flag gaps clearly.)";
  const patternsBlock = indexedPatterns
    ? `\n\nINDEXED PATTERNS (from prior ingestion):\n${JSON.stringify(indexedPatterns).slice(0, 40_000)}`
    : "";

  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    response_format: { type: "json_object" },
    temperature: 0.25,
    max_completion_tokens: 16384,
    messages: [
      {
        role: "system",
        content: `You are a world-class proposal solution architect drafting a TECHNICAL SOLUTION DESIGN for an RFP response.
Rules:
- Ground every major component in reference assets when possible; cite sourceAssetIds.
- Map each significant RFP requirement to a solution element (traceability).
- Assign confidence 0.0–1.0 per traceability row (retrieval strength, not guess quality).
- Flag gaps where no reference exists and recommend SME review.
- Produce a coherent target architecture — not a generic template.
- diagramSpec must be renderable: layers top-to-bottom, 6–14 nodes, clear edges.

Return JSON:
{
  "solutionTitle": "string",
  "executiveSummary": "2-3 paragraphs",
  "confidenceOverall": 0.0-1.0,
  "designPrinciples": ["..."],
  "diagramSpec": {
    "layers": ["Presentation","API Gateway","Services","Data","External"],
    "nodes": [{"id":"n1","label":"Short name","layer":"Services","description":"one line","sourceAssetIds":[]}],
    "edges": [{"from":"n1","to":"n2","label":"optional protocol"}]
  },
  "solutionSections": [
    {"title":"Architecture Overview","content":"markdown-ish prose","confidence":0.0-1.0,"sourceAssetIds":[]},
    {"title":"Integration Approach","content":"...","confidence":0.0-1.0,"sourceAssetIds":[]},
    {"title":"Security & Compliance","content":"...","confidence":0.0-1.0,"sourceAssetIds":[]},
    {"title":"Deployment & Operations","content":"...","confidence":0.0-1.0,"sourceAssetIds":[]},
    {"title":"Scalability & Performance","content":"...","confidence":0.0-1.0,"sourceAssetIds":[]}
  ],
  "traceability": [
    {
      "requirementRef": "3.2.1 or excerpt",
      "requirementText": "short requirement",
      "solutionElement": "what we propose",
      "confidence": 0.0-1.0,
      "sourceAssetIds": [],
      "needsSmeReview": false,
      "smeRole": "optional e.g. Security Architect"
    }
  ],
  "gaps": [{"topic":"...","severity":"high|medium|low","recommendation":"...","suggestedSme":"..."}],
  "differentiators": ["..."],
  "risks": [{"risk":"...","mitigation":"..."}]
}`,
      },
      {
        role: "user",
        content: `ISSUER / CLIENT: ${issuerName || "Not specified"}
SOLUTION TITLE: ${solutionTitle || "Technical Solution for RFP Response"}
DESIGN GOALS: ${designGoals || "Winning, compliant, reuse proven architecture"}

RFP TECHNICAL REQUIREMENTS:
${reqText}

REFERENCE LIBRARY (prior architecture, system design, product solutions):
${corpus}${patternsBlock}`,
      },
    ],
  });

  const parsed = parseJson(response.choices[0]?.message?.content);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("AI returned invalid solution design JSON");
  }

  return normalizeSolutionDesign(parsed, solutionTitle, issuerName);
}

function normalizeSolutionDesign(raw, fallbackTitle, issuerName) {
  const diagramSpec = raw.diagramSpec && typeof raw.diagramSpec === "object" ? raw.diagramSpec : {};
  const layers = Array.isArray(diagramSpec.layers) && diagramSpec.layers.length
    ? diagramSpec.layers.map(String)
    : ["Presentation", "Application", "Data", "Integration"];

  const nodes = (Array.isArray(diagramSpec.nodes) ? diagramSpec.nodes : [])
    .slice(0, 20)
    .map((n, i) => ({
      id: String(n?.id || `node_${i + 1}`),
      label: String(n?.label || `Component ${i + 1}`).slice(0, 80),
      layer: String(n?.layer || layers[i % layers.length]),
      description: String(n?.description || "").slice(0, 300),
      sourceAssetIds: Array.isArray(n?.sourceAssetIds) ? n.sourceAssetIds.map(String) : [],
    }));

  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = (Array.isArray(diagramSpec.edges) ? diagramSpec.edges : [])
    .filter((e) => nodeIds.has(String(e?.from)) && nodeIds.has(String(e?.to)))
    .slice(0, 30)
    .map((e) => ({
      from: String(e.from),
      to: String(e.to),
      label: e?.label != null ? String(e.label).slice(0, 60) : undefined,
    }));

  return {
    solutionTitle: String(raw.solutionTitle || fallbackTitle || "Technical Solution Design").slice(0, 200),
    issuerName: String(issuerName || "").slice(0, 120),
    executiveSummary: String(raw.executiveSummary || "").slice(0, 8000),
    confidenceOverall: Math.min(1, Math.max(0, Number(raw.confidenceOverall) || 0.7)),
    designPrinciples: Array.isArray(raw.designPrinciples) ? raw.designPrinciples.map(String).slice(0, 10) : [],
    diagramSpec: { layers, nodes, edges },
    solutionSections: (Array.isArray(raw.solutionSections) ? raw.solutionSections : []).slice(0, 8).map((s) => ({
      title: String(s?.title || "Section").slice(0, 120),
      content: String(s?.content || "").slice(0, 6000),
      confidence: Math.min(1, Math.max(0, Number(s?.confidence) || 0.75)),
      sourceAssetIds: Array.isArray(s?.sourceAssetIds) ? s.sourceAssetIds.map(String) : [],
    })),
    traceability: (Array.isArray(raw.traceability) ? raw.traceability : []).slice(0, 40).map((t) => ({
      requirementRef: String(t?.requirementRef || "").slice(0, 40),
      requirementText: String(t?.requirementText || "").slice(0, 500),
      solutionElement: String(t?.solutionElement || "").slice(0, 500),
      confidence: Math.min(1, Math.max(0, Number(t?.confidence) || 0.5)),
      sourceAssetIds: Array.isArray(t?.sourceAssetIds) ? t.sourceAssetIds.map(String) : [],
      needsSmeReview: Boolean(t?.needsSmeReview),
      smeRole: t?.smeRole ? String(t.smeRole).slice(0, 80) : undefined,
    })),
    gaps: (Array.isArray(raw.gaps) ? raw.gaps : []).slice(0, 12).map((g) => ({
      topic: String(g?.topic || "").slice(0, 120),
      severity: ["high", "medium", "low"].includes(g?.severity) ? g.severity : "medium",
      recommendation: String(g?.recommendation || "").slice(0, 500),
      suggestedSme: g?.suggestedSme ? String(g.suggestedSme).slice(0, 80) : undefined,
    })),
    differentiators: Array.isArray(raw.differentiators) ? raw.differentiators.map(String).slice(0, 8) : [],
    risks: (Array.isArray(raw.risks) ? raw.risks : []).slice(0, 8).map((r) => ({
      risk: String(r?.risk || "").slice(0, 300),
      mitigation: String(r?.mitigation || "").slice(0, 300),
    })),
    generatedAt: new Date().toISOString(),
  };
}

export function registerTechnicalSolutioningRoutes(app, openai) {
  app.post("/technical-solution/extract-patterns", async (req, res) => {
    try {
      const assets = req.body?.assets;
      const result = await extractReferencePatterns(openai, assets);
      res.json(result);
    } catch (err) {
      console.error("TECH SOLUTION EXTRACT ERROR:", err.message);
      res.status(500).json({ error: err.message || "Pattern extraction failed" });
    }
  });

  app.post("/technical-solution/generate-design", async (req, res) => {
    try {
      const design = await generateTechnicalSolutionDesign(openai, req.body || {});
      res.json(design);
    } catch (err) {
      console.error("TECH SOLUTION GENERATE ERROR:", err.message);
      const status = /provide/i.test(err.message) ? 400 : 500;
      res.status(status).json({ error: err.message || "Solution design generation failed" });
    }
  });
}
