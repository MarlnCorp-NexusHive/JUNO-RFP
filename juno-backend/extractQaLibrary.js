/**
 * AI extraction of reusable Q&A library entries from RFP / grant / solicitation text.
 */

const MAX_CHUNK_CHARS = 48_000;
const CHUNK_OVERLAP = 1_200;
const MAX_ITEMS_TOTAL = 40;

function parseModelJson(content) {
  const raw = String(content || "").trim();
  try {
    return JSON.parse(raw);
  } catch {
    const m = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) {
      try {
        return JSON.parse(m[1].trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function chunkDocumentText(text, maxChunk = MAX_CHUNK_CHARS, overlap = CHUNK_OVERLAP) {
  const t = String(text || "").trim();
  if (!t.length) return [];
  if (t.length <= maxChunk) return [t];

  const chunks = [];
  let start = 0;
  while (start < t.length) {
    let end = Math.min(start + maxChunk, t.length);
    if (end < t.length) {
      const slice = t.slice(start, end);
      const breakAt = Math.max(
        slice.lastIndexOf("\n\n"),
        slice.lastIndexOf("\n"),
        slice.lastIndexOf(". "),
      );
      if (breakAt > maxChunk * 0.45) end = start + breakAt + 1;
    }
    chunks.push(t.slice(start, end));
    if (end >= t.length) break;
    start = Math.max(start + 1, end - overlap);
  }
  return chunks;
}

function sanitizeItem(row) {
  if (!row || typeof row !== "object") return null;
  const question = String(row.question || "").trim().slice(0, 2000);
  const answer = String(row.answer || "").trim().slice(0, 4000);
  if (question.length < 8) return null;
  if (answer.length < 4) return null;
  const tags = Array.isArray(row.tags)
    ? row.tags.map((t) => String(t || "").trim()).filter(Boolean).slice(0, 8)
    : [];
  return { question, answer, tags };
}

function normalizeQ(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

function dedupe(items) {
  const byKey = new Map();
  for (const item of items) {
    const key = normalizeQ(item.question);
    const prev = byKey.get(key);
    if (!prev || item.answer.length > prev.answer.length) byKey.set(key, item);
  }
  return [...byKey.values()].slice(0, MAX_ITEMS_TOTAL);
}

const SYSTEM_PROMPT = `You build a reusable Q&A library from RFP, RFQ, ITB, grant, or solicitation text for a proposal team.

Deep-scan the document thoroughly (cover page, tables, appendices, Q&A addenda, Section L/M, evaluation criteria, scope, past performance, pricing instructions).

For each library entry output:
- "question": A clear question the offeror must answer or that appears in an official Q&A / clarification.
- "answer": The best answer grounded ONLY in this document — official response text, clarification language, or the most relevant requirement excerpt/guidance. If the document only states a requirement with no answer content, set answer to "(Requirement noted — draft response needed)" and still include a precise question.
- "tags": 1–5 short tags such as "Q&A", "Clarification", "Section L", "Section M", "Technical", "Pricing", "Past Performance", "Evaluation", "Format", "Scope", "Deadline", "Eligibility".

PRIORITIZE:
1) Official Q&A / amendment clarifications
2) Explicit offeror questions the solicitation answers
3) High-value requirements useful as reusable library prompts

Skip pure boilerplate headers, signatures, and page numbers. Prefer quality over quantity (max ~25 per segment).
Output JSON only: {"qa_items":[...]}`;

async function extractFromChunk(openai, chunkText, chunkIndex, totalChunks) {
  const user =
    totalChunks > 1
      ? `Document segment ${chunkIndex + 1} of ${totalChunks}. Extract Q&A library items only from this segment.\n\n---\n${chunkText}\n---`
      : chunkText;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.15,
    max_completion_tokens: 8192,
  });

  const parsed = parseModelJson(response.choices[0]?.message?.content);
  if (!parsed || typeof parsed !== "object") return [];
  const arr = Array.isArray(parsed.qa_items) ? parsed.qa_items : [];
  const cleaned = [];
  for (const row of arr) {
    const item = sanitizeItem(row);
    if (item) cleaned.push(item);
  }
  return cleaned;
}

/**
 * @param {import("openai").OpenAI} openai
 * @param {string} documentText
 * @returns {Promise<{ qa_items: { question: string; answer: string; tags: string[] }[] }>}
 */
export async function extractQaLibraryItems(openai, documentText) {
  const text = String(documentText ?? "").trim();
  if (!text.length) return { qa_items: [] };

  const chunks = chunkDocumentText(text);
  const merged = [];
  let lastError = null;

  for (let i = 0; i < chunks.length; i++) {
    try {
      const part = await extractFromChunk(openai, chunks[i], i, chunks.length);
      merged.push(...part);
    } catch (err) {
      lastError = err;
      console.error(`extract-qas chunk ${i + 1}/${chunks.length}:`, err?.message || err);
    }
  }

  if (merged.length === 0 && lastError) throw lastError;
  return { qa_items: dedupe(merged) };
}
