/**
 * Grant Pursuit Brief — AI-generated once per opportunity, shared global disk cache.
 * Any tenant/user can retrieve the same brief without re-burning tokens.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getTrialDataPath } from "./trial/tenantStore.js";

const MODEL = process.env.GRANT_BRIEF_MODEL || "gpt-4.1-mini";

function briefsDir() {
  const tenantsPath = getTrialDataPath();
  return path.join(path.dirname(tenantsPath), "grant-briefs");
}

function ensureDir() {
  const dir = briefsDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function normalizeBriefKey(source, opportunityId) {
  const s = String(source || "grants")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .slice(0, 40);
  const id = String(opportunityId || "")
    .trim()
    .replace(/[^a-zA-Z0-9._:-]+/g, "_")
    .slice(0, 160);
  if (!id) throw new Error("opportunityId is required");
  return `${s}:${id}`;
}

function briefFilePath(key) {
  // Windows forbids `:` in filenames — keep logical key as `source:id`, file as `source__id`.
  const safe = String(key)
    .replace(/:/g, "__")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 200);
  return path.join(ensureDir(), `${safe}.json`);
}

function snapshotHash(opportunity = {}) {
  const payload = JSON.stringify({
    title: opportunity.title || "",
    number: opportunity.number || "",
    agency: opportunity.agency || "",
    deadline: opportunity.deadline || "",
    status: opportunity.status || "",
    amount: opportunity.amount ?? opportunity.amountLabel ?? "",
    url: opportunity.url || "",
    summary: String(opportunity.summary || opportunity.description || "").slice(0, 2000),
  });
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 24);
}

export function readCachedBrief(key) {
  const file = briefFilePath(key);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    console.warn("[grant-brief] failed to read cache", key, err.message);
    return null;
  }
}

function writeCachedBrief(brief) {
  const file = briefFilePath(brief.key);
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(brief, null, 2), "utf8");
  fs.renameSync(tmp, file);
  return brief;
}

function asText(value, max = 2000) {
  const s = String(value || "").trim();
  return s.length > max ? s.slice(0, max) : s;
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
    throw new Error("AI returned non-JSON brief");
  }
}

function normalizeBrief(parsed, meta) {
  const steps = Array.isArray(parsed.steps)
    ? parsed.steps
        .map((s, i) => ({
          id: asText(s.id || `step-${i + 1}`, 40),
          title: asText(s.title, 200),
          detail: asText(s.detail, 800),
          order: Number.isFinite(Number(s.order)) ? Number(s.order) : i + 1,
        }))
        .filter((s) => s.title)
        .slice(0, 12)
    : [];

  const dates = Array.isArray(parsed.dates)
    ? parsed.dates
        .map((d, i) => ({
          id: asText(d.id || `date-${i + 1}`, 40),
          label: asText(d.label, 160),
          date: asText(d.date, 40),
          type: asText(d.type || "deadline", 40),
        }))
        .filter((d) => d.label)
        .slice(0, 12)
    : [];

  const documents = Array.isArray(parsed.documents)
    ? parsed.documents
        .map((d, i) => ({
          id: asText(d.id || `doc-${i + 1}`, 40),
          name: asText(d.name, 200),
          required: d.required !== false,
          notes: asText(d.notes, 400),
        }))
        .filter((d) => d.name)
        .slice(0, 20)
    : [];

  const contacts = Array.isArray(parsed.contacts)
    ? parsed.contacts
        .map((c, i) => ({
          id: asText(c.id || `contact-${i + 1}`, 40),
          name: asText(c.name, 160),
          role: asText(c.role, 120),
          email: asText(c.email, 160),
          phone: asText(c.phone, 80),
          notes: asText(c.notes, 400),
        }))
        .filter((c) => c.name || c.email || c.phone)
        .slice(0, 10)
    : [];

  const checklistTemplate = Array.isArray(parsed.checklistTemplate)
    ? parsed.checklistTemplate
        .map((c, i) => ({
          id: asText(c.id || `check-${i + 1}`, 40),
          label: asText(c.label, 240),
        }))
        .filter((c) => c.label)
        .slice(0, 20)
    : steps.map((s) => ({ id: `check-${s.id}`, label: s.title }));

  return {
    key: meta.key,
    source: meta.source,
    opportunityId: meta.opportunityId,
    title: asText(parsed.title || meta.opportunity.title, 300),
    generatedAt: new Date().toISOString(),
    model: MODEL,
    confidence: ["high", "medium", "low"].includes(parsed.confidence)
      ? parsed.confidence
      : meta.thinSource
        ? "low"
        : "medium",
    sourceSnapshotHash: meta.hash,
    snapshot: {
      number: asText(meta.opportunity.number, 120),
      agency: asText(meta.opportunity.agency, 200),
      deadline: asText(meta.opportunity.deadline, 40),
      status: asText(meta.opportunity.status, 80),
      amountLabel: asText(
        meta.opportunity.amountLabel || meta.opportunity.amount,
        80,
      ),
      url: asText(meta.opportunity.url, 500),
      sourceLabel: asText(meta.opportunity.source || meta.source, 80),
    },
    eligibility: {
      summary: asText(parsed.eligibility?.summary, 1200),
      fitNotes: asText(parsed.eligibility?.fitNotes, 1200),
      watchOuts: Array.isArray(parsed.eligibility?.watchOuts)
        ? parsed.eligibility.watchOuts.map((w) => asText(w, 300)).filter(Boolean).slice(0, 8)
        : [],
    },
    howToApply: {
      portal: asText(parsed.howToApply?.portal, 500),
      packageType: asText(parsed.howToApply?.packageType, 200),
      submissionPath: asText(parsed.howToApply?.submissionPath, 1200),
      notes: asText(parsed.howToApply?.notes, 1200),
    },
    steps,
    dates,
    documents,
    contacts,
    followUp: {
      afterSubmit: Array.isArray(parsed.followUp?.afterSubmit)
        ? parsed.followUp.afterSubmit.map((x) => asText(x, 300)).filter(Boolean).slice(0, 8)
        : [],
      tips: Array.isArray(parsed.followUp?.tips)
        ? parsed.followUp.tips.map((x) => asText(x, 300)).filter(Boolean).slice(0, 8)
        : [],
    },
    checklistTemplate,
    assistPrompts: Array.isArray(parsed.assistPrompts)
      ? parsed.assistPrompts.map((x) => asText(x, 200)).filter(Boolean).slice(0, 6)
      : [
          "Explain the eligibility risks for our team",
          "Draft a 5-bullet LOI outline",
          "What should we verify on the official portal?",
        ],
  };
}

async function generateBriefWithAi(openai, opportunity, meta) {
  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.25,
    messages: [
      {
        role: "system",
        content: `You are a US federal/state grant capture advisor for proposal teams.
Given opportunity metadata from JUNO's Grants desk, produce a structured Pursuit Brief.
Be practical and honest. If data is thin, set confidence to "low" and tell the user to verify on the official portal.
Do NOT invent exact portal URLs, emails, or deadlines that are not supported by the input — mark unknowns clearly.
Return ONLY JSON with this shape:
{
  "title": "...",
  "confidence": "high|medium|low",
  "eligibility": {"summary":"...","fitNotes":"...","watchOuts":["..."]},
  "howToApply": {"portal":"...","packageType":"...","submissionPath":"...","notes":"..."},
  "steps":[{"id":"s1","title":"...","detail":"...","order":1}],
  "dates":[{"id":"d1","label":"...","date":"YYYY-MM-DD or text","type":"deadline|qa|loi|award|other"}],
  "documents":[{"id":"doc1","name":"...","required":true,"notes":"..."}],
  "contacts":[{"id":"c1","name":"...","role":"...","email":"...","phone":"...","notes":"..."}],
  "followUp":{"afterSubmit":["..."],"tips":["..."]},
  "checklistTemplate":[{"id":"k1","label":"..."}],
  "assistPrompts":["..."]
}`,
      },
      {
        role: "user",
        content: JSON.stringify({
          source: meta.source,
          opportunity: {
            id: meta.opportunityId,
            title: opportunity.title,
            number: opportunity.number,
            agency: opportunity.agency,
            organization: opportunity.organization,
            company: opportunity.company,
            deadline: opportunity.deadline,
            status: opportunity.status,
            amount: opportunity.amount,
            amountLabel: opportunity.amountLabel,
            summary: opportunity.summary,
            description: opportunity.description,
            eligibility: opportunity.eligibility,
            applicantTypes: opportunity.applicantTypes,
            url: opportunity.url,
            pi: opportunity.pi,
            sourceLabel: opportunity.source,
          },
        }),
      },
    ],
  });

  const parsed = parseJsonObject(response.choices?.[0]?.message?.content);
  return normalizeBrief(parsed, meta);
}

/**
 * Get cached brief or generate + cache.
 * @returns {{ brief: object, cached: boolean, stale?: boolean }}
 */
export async function getOrCreateGrantBrief(openai, body = {}) {
  const source = String(body.source || "grants").trim();
  const opportunityId = String(body.opportunityId || body.id || "").trim();
  const opportunity = body.opportunity && typeof body.opportunity === "object"
    ? body.opportunity
    : body;
  const forceRefresh = Boolean(body.forceRefresh || body.refresh);

  const key = normalizeBriefKey(source, opportunityId);
  const hash = snapshotHash(opportunity);
  const thinSource = !String(opportunity.summary || opportunity.description || "").trim()
    && !String(opportunity.url || "").trim();

  const existing = readCachedBrief(key);
  if (existing && !forceRefresh) {
    const stale = existing.sourceSnapshotHash && existing.sourceSnapshotHash !== hash;
    return { brief: existing, cached: true, stale: Boolean(stale) };
  }

  if (!openai) throw new Error("OpenAI client unavailable");

  const brief = await generateBriefWithAi(openai, opportunity, {
    key,
    source,
    opportunityId,
    opportunity,
    hash,
    thinSource,
  });
  writeCachedBrief(brief);
  return { brief, cached: false, stale: false };
}

export function registerGrantBriefRoutes(app, openai) {
  app.get("/grants/brief", (req, res) => {
    try {
      const key = String(req.query.key || "").trim();
      if (!key) return res.status(400).json({ error: "key required" });
      const brief = readCachedBrief(key);
      if (!brief) return res.status(404).json({ error: "Brief not cached yet", code: "brief_not_found" });
      return res.json({ brief, cached: true });
    } catch (err) {
      return res.status(400).json({ error: err.message || "Invalid key" });
    }
  });

  app.post("/grants/brief/get", async (req, res) => {
    try {
      const result = await getOrCreateGrantBrief(openai, req.body || {});
      return res.json({
        ...result,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[grants/brief/get]", err);
      const status = /required|opportunityId/i.test(err.message) ? 400 : 502;
      return res.status(status).json({
        error: err.message || "Failed to build grant brief",
        code: "grant_brief_failed",
      });
    }
  });

  app.post("/grants/brief/regenerate", async (req, res) => {
    try {
      const result = await getOrCreateGrantBrief(openai, {
        ...(req.body || {}),
        forceRefresh: true,
      });
      return res.json({
        ...result,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[grants/brief/regenerate]", err);
      const status = /required|opportunityId/i.test(err.message) ? 400 : 502;
      return res.status(status).json({
        error: err.message || "Failed to regenerate grant brief",
        code: "grant_brief_regen_failed",
      });
    }
  });
}
