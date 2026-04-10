/**
 * Extract explicitly stated dates from RFP / procurement document text using OpenAI.
 * Chunks large inputs; merges, validates ISO dates, dedupes.
 */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const MAX_CHUNK_CHARS = 48_000;
const CHUNK_OVERLAP = 1_200;
const MAX_RAW_TEXT_LEN = 500;

function isValidISODate(s) {
  if (typeof s !== "string" || !ISO_DATE_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function normalizeEventLabel(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Split long text on paragraph/sentence boundaries with overlap so dates on boundaries are not lost.
 */
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
      if (breakAt > maxChunk * 0.45) {
        end = start + breakAt + 1;
      }
    }
    chunks.push(t.slice(start, end));
    if (end >= t.length) break;
    start = Math.max(start + 1, end - overlap);
  }
  return chunks;
}

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

function sanitizeItem(row) {
  if (!row || typeof row !== "object") return null;
  const event =
    typeof row.event === "string" && row.event.trim()
      ? row.event.trim().slice(0, 200)
      : "Unknown Event";
  const date = typeof row.date === "string" ? row.date.trim() : "";
  if (!isValidISODate(date)) return null;
  let rawText =
    typeof row.raw_text === "string"
      ? row.raw_text.trim().slice(0, MAX_RAW_TEXT_LEN)
      : "";
  if (!rawText) return null;
  return { event, date, raw_text: rawText };
}

function dedupeAndSort(items) {
  const byKey = new Map();
  for (const item of items) {
    const key = `${item.date}|${normalizeEventLabel(item.event)}`;
    const prev = byKey.get(key);
    if (!prev || item.raw_text.length > prev.raw_text.length) {
      byKey.set(key, item);
    }
  }
  return [...byKey.values()].sort(
    (a, b) => a.date.localeCompare(b.date) || a.event.localeCompare(b.event),
  );
}

const SYSTEM_PROMPT = `You extract explicit calendar dates from RFP, RFQ, ITB, solicitation, or procurement text.

STRICT RULES:
1. Only include dates that are clearly written or unambiguously stated in the provided text. Never invent or infer dates not supported by the text.
2. For each date, output:
   - "event": A short English label. Prefer: "Bid Submission Deadline", "Pre-bid Meeting", "Pre-bid Conference", "Site Visit", "Questions Due", "Addendum Deadline", "Bid Opening", "Contract Start", "Project Start", "Project End", "Period of Performance End", "Proposal Due", "Intent to Bid Due", or similar when the text supports it. If the event type is unclear, use "Unknown Event".
   - "date": Must be ISO 8601 calendar date only: YYYY-MM-DD. Convert from any format found in the text (e.g. March 15, 2026 → 2026-03-15). If the text is relative without an anchor ("30 days from award") and no calendar day can be resolved, OMIT that item.
   - "raw_text": Copy the shortest contiguous excerpt from the text that contains the date (sentence or phrase), verbatim (same wording), max 500 characters.
3. If no qualifying dates exist in this excerpt, return an empty important_dates array.
4. Output a single JSON object: {"important_dates":[...]} with no extra keys.`;

async function extractFromChunk(openai, chunkText, chunkIndex, totalChunks) {
  const user =
    totalChunks > 1
      ? `Document segment ${chunkIndex + 1} of ${totalChunks}. Extract dates only from this segment.\n\n---\n${chunkText}\n---`
      : chunkText;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_completion_tokens: 4096,
  });

  const parsed = parseModelJson(response.choices[0]?.message?.content);
  if (!parsed || typeof parsed !== "object") return [];
  const arr = Array.isArray(parsed.important_dates) ? parsed.important_dates : [];
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
 * @returns {Promise<{ important_dates: { event: string; date: string; raw_text: string }[] }>}
 */
export async function extractImportantDates(openai, documentText) {
  const text = String(documentText ?? "").trim();
  if (!text.length) {
    return { important_dates: [] };
  }

  const chunks = chunkDocumentText(text);
  const merged = [];
  let lastError = null;

  for (let i = 0; i < chunks.length; i++) {
    try {
      const part = await extractFromChunk(openai, chunks[i], i, chunks.length);
      merged.push(...part);
    } catch (err) {
      lastError = err;
      console.error(
        `extract-dates chunk ${i + 1}/${chunks.length}:`,
        err?.message || err,
      );
    }
  }

  if (merged.length === 0 && lastError) {
    throw lastError;
  }

  return { important_dates: dedupeAndSort(merged) };
}
