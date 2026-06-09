import PptxGenJS from "pptxgenjs";

const SLIDE_MODEL = process.env.SLIDE_DECK_MODEL || "gpt-4o";
const MIN_CONTENT_CHARS = 120;
const MAX_INPUT_CHARS = 48_000;

const MARLN = {
  navy: "1E3A5F",
  blue: "2563EB",
  teal: "0D9488",
  slate: "334155",
  light: "F1F5F9",
  white: "FFFFFF",
};

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

function fallbackOutline(question, content) {
  const paras = String(content)
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);
  const slides = [
    {
      layout: "title",
      title: question?.trim()?.slice(0, 120) || "Proposal briefing",
      subtitle: "Generated from JUNO Content Hub",
    },
  ];
  if (paras.length === 0) {
    slides.push({
      layout: "bullets",
      title: "Summary",
      bullets: [content.slice(0, 500)],
    });
  } else {
    for (const p of paras.slice(0, 14)) {
      const lines = p
        .split(/\n/)
        .map((l) => l.replace(/^[-*•]\s*/, "").trim())
        .filter(Boolean);
      if (lines.length <= 1) {
        slides.push({
          layout: "bullets",
          title: lines[0]?.slice(0, 80) || "Key point",
          bullets: [p.slice(0, 400)],
        });
      } else {
        slides.push({
          layout: "bullets",
          title: lines[0].slice(0, 80),
          bullets: lines.slice(1, 6).map((l) => l.slice(0, 220)),
        });
      }
    }
  }
  slides.push({ layout: "closing", title: "Questions & next steps", subtitle: "JUNO RFP" });
  return { deckTitle: slides[0].title, slides };
}

export async function structureSlideDeck(openai, { question, content, clientName }) {
  const text = String(content || "").trim();
  if (text.length < MIN_CONTENT_CHARS) {
    const e = new Error(`Content must be at least ${MIN_CONTENT_CHARS} characters for slide generation`);
    e.statusCode = 400;
    throw e;
  }

  const userPayload = {
    question: String(question || "").slice(0, 2000),
    clientName: clientName ? String(clientName).slice(0, 200) : null,
    content: text.slice(0, MAX_INPUT_CHARS),
    rules: {
      maxSlides: 18,
      maxBulletsPerSlide: 5,
      maxBulletChars: 160,
      layouts: ["title", "section", "bullets", "closing"],
    },
  };

  let outline = null;
  try {
    const response = await openai.chat.completions.create({
      model: SLIDE_MODEL,
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You convert long proposal/RFP text into a presentation outline.
Return ONLY JSON: {"deckTitle":string,"slides":[{"layout":"title"|"section"|"bullets"|"closing","title":string,"subtitle":string?,"bullets":string[]?,"notes":string?}]}
Rules:
- First slide: layout "title" with deckTitle as title; subtitle can mention client if provided.
- Use "section" slides to introduce major themes (no bullets required).
- Use "bullets" for content slides: max 5 bullets, each under 160 chars, crisp proposal language.
- Last slide: layout "closing".
- 8–16 slides total for long content; do not paste paragraphs into bullets.
- Speaker notes optional in "notes" (1–2 sentences).
- Ground content only in the provided text; do not invent facts.`,
        },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
    });
    outline = parseModelJson(response.choices[0]?.message?.content);
  } catch {
    outline = null;
  }

  if (!outline?.slides?.length) {
    outline = fallbackOutline(question, text);
  }

  const deckTitle =
    typeof outline.deckTitle === "string" && outline.deckTitle.trim()
      ? outline.deckTitle.trim().slice(0, 200)
      : fallbackOutline(question, text).deckTitle;

  const slides = (Array.isArray(outline.slides) ? outline.slides : [])
    .slice(0, 20)
    .map((s) => ({
      layout: ["title", "section", "bullets", "closing"].includes(s.layout) ? s.layout : "bullets",
      title: String(s.title || "Slide").slice(0, 200),
      subtitle: s.subtitle ? String(s.subtitle).slice(0, 300) : "",
      bullets: Array.isArray(s.bullets)
        ? s.bullets.map((b) => String(b).slice(0, 200)).slice(0, 5)
        : [],
      notes: s.notes ? String(s.notes).slice(0, 1000) : "",
    }));

  if (!slides.length) {
    return fallbackOutline(question, text);
  }

  return { deckTitle, slides };
}

function addTitleSlide(pptx, slide, deckTitle, clientName) {
  slide.background = { color: MARLN.navy };
  slide.addText(deckTitle || slide.title || "Presentation", {
    x: 0.6,
    y: 1.4,
    w: 8.8,
    h: 1.4,
    fontSize: 32,
    bold: true,
    color: MARLN.white,
    fontFace: "Calibri",
  });
  const sub = slide.subtitle || clientName || "JUNO RFP · Content Hub";
  slide.addText(sub, {
    x: 0.6,
    y: 3.0,
    w: 8.8,
    h: 0.8,
    fontSize: 16,
    color: "CBD5E1",
    fontFace: "Calibri",
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.6,
    y: 4.2,
    w: 2.2,
    h: 0.08,
    fill: { color: MARLN.teal },
    line: { color: MARLN.teal },
  });
}

function addSectionSlide(slide, data) {
  slide.background = { color: MARLN.blue };
  slide.addText(data.title, {
    x: 0.7,
    y: 2.0,
    w: 8.6,
    h: 1.2,
    fontSize: 30,
    bold: true,
    color: MARLN.white,
    fontFace: "Calibri",
  });
}

function addBulletsSlide(pptx, slide, data) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 0.12,
    h: "100%",
    fill: { color: MARLN.teal },
  });
  slide.addText(data.title, {
    x: 0.55,
    y: 0.45,
    w: 9.0,
    h: 0.7,
    fontSize: 22,
    bold: true,
    color: MARLN.navy,
    fontFace: "Calibri",
  });
  const bullets = data.bullets?.length ? data.bullets : ["(No bullet content)"];
  slide.addText(bullets.join("\n"), {
    x: 0.55,
    y: 1.35,
    w: 9.0,
    h: 4.0,
    fontSize: 14,
    color: MARLN.slate,
    fontFace: "Calibri",
    bullet: true,
    lineSpacing: 22,
  });
}

function addClosingSlide(slide, data) {
  slide.background = { color: MARLN.navy };
  slide.addText(data.title || "Thank you", {
    x: 0.6,
    y: 2.2,
    w: 8.8,
    h: 1.0,
    fontSize: 28,
    bold: true,
    color: MARLN.white,
    align: "center",
    fontFace: "Calibri",
  });
  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: 0.6,
      y: 3.3,
      w: 8.8,
      h: 0.6,
      fontSize: 14,
      color: "CBD5E1",
      align: "center",
      fontFace: "Calibri",
    });
  }
}

export async function buildSlideDeckPptx({ deckTitle, slides, clientName }) {
  const pptx = new PptxGenJS();
  pptx.author = "JUNO RFP";
  pptx.company = "Marln";
  pptx.title = deckTitle || "Content Hub Deck";
  pptx.layout = "LAYOUT_16x9";

  for (let i = 0; i < slides.length; i++) {
    const data = slides[i];
    const s = pptx.addSlide();
    if (data.notes) s.addNotes(data.notes);

    if (data.layout === "title") {
      addTitleSlide(pptx, s, i === 0 ? deckTitle : data.title, clientName);
    } else if (data.layout === "section") {
      addSectionSlide(s, data);
    } else if (data.layout === "closing") {
      addClosingSlide(s, data);
    } else {
      addBulletsSlide(pptx, s, data);
    }
  }

  const buffer = await pptx.write({ outputType: "nodebuffer" });
  const safeName = (deckTitle || "content-hub-deck")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return {
    buffer,
    filename: `${safeName || "content-hub-deck"}.pptx`,
    slideCount: slides.length,
  };
}

export async function generateSlideDeckFromContent(openai, body) {
  const { question, content, clientName, issuerName } = body || {};
  const outline = await structureSlideDeck(openai, {
    question,
    content,
    clientName: clientName || issuerName,
  });
  return buildSlideDeckPptx({
    deckTitle: outline.deckTitle,
    slides: outline.slides,
    clientName: clientName || issuerName,
  });
}
