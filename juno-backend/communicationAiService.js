/**
 * Proposal Communication AI helpers: kickoff draft, thread summary, reply coach.
 */

function asText(value, max = 12_000) {
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
    throw new Error("AI returned non-JSON");
  }
}

/**
 * @param {import("openai").OpenAI} openai
 * @param {{ opportunity?: object, channelName?: string, members?: string[] }} payload
 */
export async function draftKickoffBrief(openai, payload = {}) {
  const opportunity = payload.opportunity || {};
  const title = asText(opportunity.title || opportunity.name || payload.channelName || "Opportunity", 400);
  const number = asText(opportunity.number, 120);
  const agency = asText(opportunity.agency, 200);
  const deadline = asText(opportunity.deadline, 80);
  const members = Array.isArray(payload.members)
    ? payload.members.map((m) => asText(m, 80)).filter(Boolean).slice(0, 20)
    : [];

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: `You are a federal/grant proposal operations lead. Draft a concise kickoff post for a proposal team channel.
Return ONLY JSON:
{"body":"markdown-friendly message with short sections: Context, Goals this week, Open questions, Owners","subjectHint":"optional short subject line"}
Keep body under 220 words. Use plain language. No fluff.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          title,
          number,
          agency,
          deadline,
          members,
        }),
      },
    ],
  });

  const parsed = parseJsonObject(response.choices?.[0]?.message?.content);
  return {
    body: asText(parsed.body || parsed.message || "", 4000) || `Kickoff: ${title}`,
    subjectHint: asText(parsed.subjectHint || "", 200),
  };
}

/**
 * @param {import("openai").OpenAI} openai
 * @param {{ messages?: Array<{ authorName?: string, body?: string, createdAt?: string }>, channelName?: string }} payload
 */
export async function summarizeThread(openai, payload = {}) {
  const messages = Array.isArray(payload.messages) ? payload.messages.slice(-40) : [];
  if (!messages.length) {
    return {
      summary: "No messages to summarize yet.",
      decisions: [],
      openQuestions: [],
      owners: [],
    };
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `Summarize a proposal team thread. Return ONLY JSON:
{"summary":"2-4 sentences","decisions":["..."],"openQuestions":["..."],"owners":["Name — next action"]}
Be factual. If unknown, omit. Keep arrays short (max 5 each).`,
      },
      {
        role: "user",
        content: JSON.stringify({
          channelName: asText(payload.channelName, 200),
          messages: messages.map((m) => ({
            author: asText(m.authorName || m.author || "Unknown", 80),
            body: asText(m.body, 800),
            at: asText(m.createdAt, 40),
          })),
        }),
      },
    ],
  });

  const parsed = parseJsonObject(response.choices?.[0]?.message?.content);
  const list = (v) =>
    Array.isArray(v) ? v.map((x) => asText(x, 240)).filter(Boolean).slice(0, 5) : [];
  return {
    summary: asText(parsed.summary, 1200) || "Summary unavailable.",
    decisions: list(parsed.decisions),
    openQuestions: list(parsed.openQuestions),
    owners: list(parsed.owners),
  };
}

/**
 * @param {import("openai").OpenAI} openai
 * @param {{ message?: string, tone?: string, context?: string }} payload
 */
export async function replyCoach(openai, payload = {}) {
  const message = asText(payload.message, 2000);
  if (!message) throw new Error("message is required");
  const tone = asText(payload.tone || "clarifying", 40).toLowerCase();
  const allowed = new Set(["formal", "firm", "clarifying"]);
  const toneKey = allowed.has(tone) ? tone : "clarifying";

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.5,
    messages: [
      {
        role: "system",
        content: `You help proposal teams reply in-thread. Return ONLY JSON:
{"replies":[{"label":"Option A","body":"..."},{"label":"Option B","body":"..."},{"label":"Option C","body":"..."}]}
Tone: ${toneKey}. Each body 2-5 sentences, professional, ready to paste.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          tone: toneKey,
          message,
          context: asText(payload.context, 1500),
        }),
      },
    ],
  });

  const parsed = parseJsonObject(response.choices?.[0]?.message?.content);
  const replies = Array.isArray(parsed.replies)
    ? parsed.replies
        .map((r, i) => ({
          label: asText(r.label || `Option ${String.fromCharCode(65 + i)}`, 40),
          body: asText(r.body, 1500),
        }))
        .filter((r) => r.body)
        .slice(0, 3)
    : [];
  if (!replies.length) throw new Error("No reply suggestions generated");
  return { tone: toneKey, replies };
}

export function registerCommunicationAiRoutes(app, openai) {
  app.post("/communication/ai/draft-kickoff", async (req, res) => {
    try {
      const result = await draftKickoffBrief(openai, req.body || {});
      res.json(result);
    } catch (err) {
      console.error("COMM AI KICKOFF ERROR:", err.message);
      res.status(500).json({ error: err.message || "Kickoff draft failed" });
    }
  });

  app.post("/communication/ai/summarize", async (req, res) => {
    try {
      const result = await summarizeThread(openai, req.body || {});
      res.json(result);
    } catch (err) {
      console.error("COMM AI SUMMARIZE ERROR:", err.message);
      res.status(500).json({ error: err.message || "Thread summary failed" });
    }
  });

  app.post("/communication/ai/reply-coach", async (req, res) => {
    try {
      const result = await replyCoach(openai, req.body || {});
      res.json(result);
    } catch (err) {
      console.error("COMM AI REPLY ERROR:", err.message);
      const status = /required/i.test(err.message) ? 400 : 500;
      res.status(status).json({ error: err.message || "Reply coach failed" });
    }
  });
}
