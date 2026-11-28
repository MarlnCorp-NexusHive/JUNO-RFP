const ALLOWED_TAGS = new Set([
  "P",
  "BR",
  "H1",
  "H2",
  "H3",
  "H4",
  "UL",
  "OL",
  "LI",
  "STRONG",
  "B",
  "EM",
  "I",
  "U",
  "S",
  "BLOCKQUOTE",
]);

const DROP_CONTENT_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "SVG",
  "MATH",
  "TEMPLATE",
  "NOSCRIPT",
  "HEAD",
]);

/**
 * Strict client-side HTML sanitizer for proposal rich-text answers.
 * Preserves semantic formatting tags while stripping all scripts, event handlers,
 * styles, javascript: URLs, and arbitrary attributes.
 */
export function sanitizeRichHtml(dirtyHtml) {
  const input = String(dirtyHtml || "");
  if (!input.trim()) return "<p></p>";

  if (typeof DOMParser === "undefined") {
    return input
      .replace(/<(script|style|iframe|object|embed|svg|math|template|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
      .replace(/<(\/?)\s*([a-z0-9]+)\b[^>]*>/gi, (_m, slash, tag) => {
        const up = String(tag || "").toUpperCase();
        if (!ALLOWED_TAGS.has(up)) return "";
        if (up === "BR") return slash ? "" : "<br/>";
        return `<${slash ? "/" : ""}${up.toLowerCase()}>`;
      })
      .trim();
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, "text/html");
    const outDoc = document.implementation.createHTMLDocument("");

    const cleanNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return outDoc.createTextNode(node.nodeValue || "");
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return null;
      }
      const tag = node.tagName.toUpperCase();
      if (DROP_CONTENT_TAGS.has(tag)) {
        return null;
      }

      if (tag === "DIV") {
        const p = outDoc.createElement("p");
        for (const child of node.childNodes) {
          const cleaned = cleanNode(child);
          if (cleaned) p.appendChild(cleaned);
        }
        return p;
      }

      if (ALLOWED_TAGS.has(tag)) {
        const el = outDoc.createElement(tag.toLowerCase());
        for (const child of node.childNodes) {
          const cleaned = cleanNode(child);
          if (cleaned) el.appendChild(cleaned);
        }
        return el;
      }

      // Unwrap disallowed non-dangerous tags (e.g., span/font) while preserving safe text children.
      const frag = outDoc.createDocumentFragment();
      for (const child of node.childNodes) {
        const cleaned = cleanNode(child);
        if (cleaned) frag.appendChild(cleaned);
      }
      return frag;
    };

    const container = outDoc.createElement("div");
    for (const child of doc.body.childNodes) {
      const cleaned = cleanNode(child);
      if (cleaned) container.appendChild(cleaned);
    }
    return container.innerHTML.trim() || "<p></p>";
  } catch {
    return "<p></p>";
  }
}
