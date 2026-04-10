/**
 * Map workspace Q&As into structured RFP sections using the OpenAI API.
 */

const MAX_Q_CHARS = 2000;
const MAX_A_CHARS = 6000;

function clampQaForPrompt(normalized) {
  return normalized.map((r) => ({
    number: r.number,
    question:
      r.question.length > MAX_Q_CHARS
        ? `${r.question.slice(0, MAX_Q_CHARS)}… [truncated]`
        : r.question,
    answer:
      r.answer.length > MAX_A_CHARS
        ? `${r.answer.slice(0, MAX_A_CHARS)}… [truncated]`
        : r.answer,
  }));
}

function parseJsonFromMessage(content) {
  const raw = String(content || "").trim();
  try {
    return JSON.parse(raw);
  } catch {
    const m = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) {
      try {
        return JSON.parse(m[1].trim());
      } catch {
        /* fall through */
      }
    }
  }
  throw new Error("Model did not return valid JSON for section placement.");
}

/**
 * @param {import("openai").default} openai
 * @param {{ id: string; title: string; hint: string }[]} sections
 * @param {{ number: number; question: string; answer: string }[]} normalized
 * @param {string} companyName
 */
export async function fillStructuredTemplateSections(openai, sections, normalized, companyName) {
  const qa = clampQaForPrompt(normalized);
  const sectionSpec = sections
    .map(
      (s, i) =>
        `${i + 1}. id: ${s.id}\n   title: ${s.title}\n   guidance: ${s.hint}`,
    )
    .join("\n\n");

  const system = `You are an expert proposal writer for government and enterprise RFPs.
You must place and synthesize content ONLY from the numbered workspace Q&As provided.
Rules:
- Do not invent certifications, past performance, pricing numbers, or client names not present in the Q&As.
- If nothing in the Q&As fits a section, write a short honest placeholder stating that no matching workspace answers were provided for that topic and list which requirement numbers might be relevant to add later.
- Preserve factual claims exactly as stated in answers; you may reorganize and smooth prose.
- Output a single JSON object with shape: { "sections": [ { "id": "<section id>", "content": "<prose, can use \\n between paragraphs>" } ] }
- Include exactly one object per section id below, in the same order as listed.`;

  const user = `Company name (offeror): ${companyName || "Not specified"}

SECTIONS TO FILL (in order):
${sectionSpec}

WORKSPACE Q&A (use only this material):
${JSON.stringify(qa, null, 2)}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_completion_tokens: 8192,
  });

  const text = response.choices[0]?.message?.content;
  const parsed = parseJsonFromMessage(text);
  const list = Array.isArray(parsed?.sections) ? parsed.sections : null;
  if (!list) {
    throw new Error("AI response missing sections array.");
  }

  const byId = new Map(list.map((s) => [String(s.id || ""), String(s.content || "").trim()]));

  return sections.map((s) => ({
    id: s.id,
    title: s.title,
    body:
      byId.get(s.id) ||
      "No mapped content returned for this section. Regenerate or paste answers from the workspace manually.",
  }));
}
