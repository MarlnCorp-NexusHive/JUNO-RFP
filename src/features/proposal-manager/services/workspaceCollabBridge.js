/**
 * Map local workspace questions ↔ /rfp-collab workspace questions (by number + text prefix).
 */

export function extractLeadingQuestionNumber(question) {
  const m = String(question || "")
    .trim()
    .match(/^(\d+)[\.)]\s/);
  return m ? Number(m[1]) : null;
}

export function buildCollabQuestionsPayload(rows) {
  return rows.map((row, idx) => {
    const q = String(row?.question || "").trim();
    const n = extractLeadingQuestionNumber(q) ?? idx + 1;
    return { number: n, text: q.slice(0, 50_000) };
  });
}

/**
 * @param {Array<{ question?: string }>} localRows
 * @param {Array<{ id: string, number: number, text: string }>} serverQuestions
 * @returns {(string|null)[]} collab question id per local index
 */
export function mapServerQuestionsToLocalIndices(localRows, serverQuestions) {
  const server = [...serverQuestions].sort((a, b) => a.number - b.number);
  const used = new Set();
  return localRows.map((row, idx) => {
    const n = extractLeadingQuestionNumber(row?.question) ?? idx + 1;
    const candidates = server.filter((s) => s.number === n && !used.has(s.id));
    let pick = candidates[0];
    if (candidates.length > 1) {
      const prefix = String(row?.question || "").slice(0, 120);
      pick =
        candidates.find((c) => String(c.text || "").slice(0, 120) === prefix) ||
        candidates[0];
    }
    if (pick) used.add(pick.id);
    return pick?.id ?? null;
  });
}
