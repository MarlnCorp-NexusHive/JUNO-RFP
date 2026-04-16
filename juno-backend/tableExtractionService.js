/**
 * Extract structured tables and figure metadata from RFP document text.
 * Uses heuristics first; OpenAI for messy tables and figure descriptions.
 * In-memory storage keyed by workspaceId → documentId.
 */

const MAX_DOC_CHARS = 120_000;
const MAX_TABLE_ROWS = 200;
const MAX_CELL_CHARS = 4_000;
const MAX_RAW_TABLE_CHARS = 24_000;
const FIGURE_CONTEXT_BEFORE = 400;
const FIGURE_CONTEXT_AFTER = 800;

/** @type {Map<string, Map<string, { tables: object[], figures: object[], updatedAt: string }>>} */
const workspaceById = new Map();

function nowIso() {
  return new Date().toISOString();
}

function simpleHash(str) {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return String(h);
}

/**
 * Split a line into cells: prefer tabs, then pipes, then 2+ spaces.
 */
export function splitTableRow(line) {
  const raw = line.replace(/\u00a0/g, " ").trim();
  if (!raw) return [];

  if (raw.includes("\t")) {
    return raw.split("\t").map((c) => c.trim());
  }
  if (raw.includes("|")) {
    return raw
      .split("|")
      .map((c) => c.trim())
      .filter((c, i, arr) => !(c === "" && (i === 0 || i === arr.length - 1)));
  }
  const multiSpace = raw.split(/\s{2,}/).filter(Boolean);
  if (multiSpace.length >= 2) return multiSpace;

  return [raw];
}

/**
 * Find consecutive lines that look like a table (2+ columns, 2+ rows).
 */
function extractTableBlocks(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const row0 = splitTableRow(lines[i]);
    if (row0.length < 2) {
      i++;
      continue;
    }

    const rows = [row0];
    let j = i + 1;
    let emptyStreak = 0;
    while (j < lines.length && rows.length < MAX_TABLE_ROWS) {
      const trimmed = lines[j].trim();
      if (trimmed === "") {
        emptyStreak++;
        if (emptyStreak > 1) break;
        j++;
        continue;
      }
      emptyStreak = 0;
      const parts = splitTableRow(lines[j]);
      if (parts.length < 2) break;
      if (Math.abs(parts.length - row0.length) > Math.max(2, Math.floor(row0.length / 2))) break;
      rows.push(parts);
      j++;
    }

    if (rows.length >= 2) {
      const rawLines = lines.slice(i, j).join("\n");
      if (rawLines.length <= MAX_RAW_TABLE_CHARS) {
        blocks.push({ rows: rows.map((r) => r.slice(0, 32)), raw_text: rawLines });
      }
      i = j;
    } else {
      i++;
    }
  }

  return blocks;
}

function normalizeRowsToHeaders(rows) {
  if (!rows.length) return { title: null, headers: [], rows: [] };
  const first = rows[0].map((c) => String(c || "").trim());
  const looksHeader =
    first.every((c) => /^[A-Za-z][\w\s\-/&%]{0,80}$/.test(c) || c.length < 60) && rows.length >= 2;

  if (looksHeader) {
    return {
      title: null,
      headers: first,
      rows: rows.slice(1).map((r) => padRow(r, first.length)),
    };
  }

  const n = Math.max(...rows.map((r) => r.length));
  const headers = Array.from({ length: n }, (_, k) => `Column ${k + 1}`);
  return {
    title: null,
    headers,
    rows: rows.map((r) => padRow(r, n)),
  };
}

function padRow(cells, n) {
  const out = cells.slice(0, n).map((c) => String(c || "").trim());
  while (out.length < n) out.push("");
  return out;
}

function dedupeTables(tables) {
  const seen = new Set();
  const out = [];
  for (const t of tables) {
    const key = simpleHash(t.raw_text || JSON.stringify([t.headers, t.rows]));
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function truncateTable(table) {
  const headers = (table.headers || []).map((c) => String(c || "").slice(0, MAX_CELL_CHARS));
  const rows = (table.rows || []).slice(0, MAX_TABLE_ROWS).map((row) =>
    (row || []).map((c) => String(c || "").slice(0, MAX_CELL_CHARS)),
  );
  let raw = String(table.raw_text || "").slice(0, MAX_RAW_TABLE_CHARS);
  return { ...table, headers, rows, raw_text: raw };
}

function extractFigureCandidates(text) {
  const figures = [];
  const slice = text.slice(0, MAX_DOC_CHARS);
  // Inline and line-start references: "Figure 1:", "Fig. 2 – Title", "See Figure 3 ..."
  const re = /\b(?:Figure|Fig\.?)\s*(\d+)\s*[:.\u2013\u2014\-]?\s*([^\n]{0,300})/gi;
  for (const m of slice.matchAll(re)) {
    const num = m[1];
    const captionPart = (m[2] || "").trim();
    const idx = m.index;
    const start = Math.max(0, idx - FIGURE_CONTEXT_BEFORE);
    const end = Math.min(slice.length, idx + m[0].length + FIGURE_CONTEXT_AFTER);
    const context = slice.slice(start, end).trim();
    const caption = `Figure ${num}${captionPart ? `: ${captionPart}` : ""}`.slice(0, 500);
    figures.push({ num, caption, context });
  }
  const dedup = [];
  const seen = new Set();
  for (const f of figures) {
    const k = `${f.num}:${f.caption}`;
    if (seen.has(k)) continue;
    seen.add(k);
    dedup.push(f);
  }
  return dedup;
}

async function structureTableWithAi(openai, rawText) {
  if (!openai || !String(rawText || "").trim()) return null;
  const prompt = String(rawText).slice(0, 12_000);
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'You are an expert document analyst. Convert unstructured table text into structured rows and columns. Do not hallucinate missing data — use empty string for unclear cells. Return JSON: {"title":string|null,"headers":string[],"rows":string[][]}. If not a table, return {"title":null,"headers":[],"rows":[]}.',
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_completion_tokens: 4096,
    });
    const raw = response.choices[0]?.message?.content;
    const parsed = JSON.parse(raw || "{}");
    const headers = Array.isArray(parsed.headers) ? parsed.headers.map((h) => String(h || "").trim()) : [];
    const rows = Array.isArray(parsed.rows)
      ? parsed.rows.map((r) => (Array.isArray(r) ? r.map((c) => String(c ?? "").trim()) : []))
      : [];
    const title = parsed.title != null ? String(parsed.title).trim() || null : null;
    if (!headers.length && !rows.length) return null;
    return { title, headers, rows };
  } catch {
    return null;
  }
}

async function describeFigureWithAi(openai, caption, context) {
  if (!openai) return "Description unavailable (AI not configured).";
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content:
            "You describe figures in RFP documents briefly for procurement teams. Base the description only on the caption and surrounding excerpt. If insufficient detail, say what is referenced without inventing specifics.",
        },
        {
          role: "user",
          content: `Caption: ${caption}\n\nNearby document text:\n${String(context).slice(0, 6000)}`,
        },
      ],
      temperature: 0.2,
      max_completion_tokens: 400,
    });
    return String(response.choices[0]?.message?.content || "").trim() || "(No description generated.)";
  } catch {
    return "(Could not generate description.)";
  }
}

/**
 * Main extraction pipeline.
 * @param {import("openai").OpenAI} openai
 * @param {string} documentText
 * @param {{ workspaceId?: string, documentId?: string, skipAi?: boolean }} [options]
 */
export async function extractStructuredData(openai, documentText, options = {}) {
  const text = typeof documentText === "string" ? documentText.slice(0, MAX_DOC_CHARS) : "";
  const skipAi = Boolean(options.skipAi) || !process.env.OPENAI_API_KEY;

  const tables = [];
  const blocks = extractTableBlocks(text);
  let tableIdx = 0;

  for (const block of blocks) {
    const normalized = normalizeRowsToHeaders(block.rows);
    let table = {
      id: `table_${++tableIdx}`,
      title: normalized.title,
      headers: normalized.headers,
      rows: normalized.rows,
      raw_text: block.raw_text,
    };

    const messy =
      normalized.rows.some((r) => r.length !== normalized.headers.length) ||
      normalized.headers.length === 0;

    if (!skipAi && openai && (messy || block.raw_text.length > 2000)) {
      const ai = await structureTableWithAi(openai, block.raw_text);
      if (ai && (ai.headers?.length || ai.rows?.length)) {
        table = {
          id: table.id,
          title: ai.title ?? table.title,
          headers: ai.headers.length ? ai.headers : table.headers,
          rows: ai.rows.length ? ai.rows : table.rows,
          raw_text: block.raw_text,
        };
      }
    }

    tables.push(truncateTable(table));
  }

  const dedupedTables = dedupeTables(tables);

  const figureCandidates = extractFigureCandidates(text);
  const figures = [];
  let figIdx = 0;
  for (const fc of figureCandidates) {
    let description = "";
    if (!skipAi && openai) {
      description = await describeFigureWithAi(openai, fc.caption, fc.context);
    } else {
      description = "AI description skipped; see caption and RFP context in surrounding text.";
    }
    figures.push({
      id: `figure_${++figIdx}`,
      caption: fc.caption,
      description,
    });
  }

  return { tables: dedupedTables, figures };
}

/**
 * Persist under workspace + document for later GET.
 */
export function storeStructuredData(workspaceId, documentId, payload) {
  const ws = String(workspaceId || "").trim();
  const doc = String(documentId || "").trim();
  if (!ws || !doc) return;

  if (!workspaceById.has(ws)) {
    workspaceById.set(ws, new Map());
  }
  const byDoc = workspaceById.get(ws);
  byDoc.set(doc, {
    tables: Array.isArray(payload.tables) ? payload.tables : [],
    figures: Array.isArray(payload.figures) ? payload.figures : [],
    updatedAt: nowIso(),
  });
}

export function getStructuredDataForWorkspace(workspaceId) {
  const ws = String(workspaceId || "").trim();
  const byDoc = workspaceById.get(ws);
  if (!byDoc) {
    return { workspaceId: ws, documents: [] };
  }
  const documents = [];
  for (const [documentId, data] of byDoc.entries()) {
    documents.push({
      documentId,
      tables: data.tables || [],
      figures: data.figures || [],
      updatedAt: data.updatedAt,
    });
  }
  return { workspaceId: ws, documents };
}

export function getStructuredDataForDocument(workspaceId, documentId) {
  const ws = String(workspaceId || "").trim();
  const doc = String(documentId || "").trim();
  const byDoc = workspaceById.get(ws);
  if (!byDoc || !byDoc.has(doc)) return null;
  const data = byDoc.get(doc);
  return {
    workspaceId: ws,
    documentId: doc,
    tables: data.tables || [],
    figures: data.figures || [],
    updatedAt: data.updatedAt,
  };
}
