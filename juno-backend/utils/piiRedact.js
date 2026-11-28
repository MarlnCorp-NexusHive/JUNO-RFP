/**
 * Lightweight PII / high-sensitivity redaction for AI prompts and logs.
 * Privacy-by-design: minimize personal identifiers sent to LLM providers.
 */

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/g;
const CC_RE = /\b(?:\d[ -]*?){13,19}\b/g;
const PHONE_RE = /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g;

/**
 * Mask an email/label for telemetry and audit logs (keeps domain).
 * jane@acme.com → j***@acme.com
 */
export function maskPiiLabel(raw) {
  const s = String(raw || "User").trim().slice(0, 120);
  return s.replace(
    /([a-zA-Z0-9._%+-])([a-zA-Z0-9._%+-]*)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    "$1***@$3",
  );
}

/**
 * Redact common high-risk patterns from free text before AI processing or logging.
 * @param {unknown} input
 * @param {{ maskEmails?: boolean }} [opts]
 * @returns {string}
 */
export function redactPii(input, opts = {}) {
  const maskEmails = opts.maskEmails !== false;
  let text = String(input ?? "");
  if (!text) return "";

  text = text.replace(SSN_RE, "[REDACTED-SSN]");
  text = text.replace(CC_RE, "[REDACTED-CARD]");
  text = text.replace(PHONE_RE, "[REDACTED-PHONE]");
  if (maskEmails) {
    text = text.replace(EMAIL_RE, "[REDACTED-EMAIL]");
  }
  return text;
}

/**
 * Recursively redact string fields in chat message arrays / nested objects (shallow-safe).
 * @param {unknown} value
 * @returns {unknown}
 */
export function redactPiiDeep(value) {
  if (typeof value === "string") return redactPii(value);
  if (Array.isArray(value)) return value.map((v) => redactPiiDeep(v));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (typeof v === "string" && (k === "content" || k === "text" || k === "prompt" || k === "input")) {
        out[k] = redactPii(v);
      } else if (typeof v === "string" && v.length > 80) {
        out[k] = redactPii(v);
      } else {
        out[k] = redactPiiDeep(v);
      }
    }
    return out;
  }
  return value;
}

/**
 * Safe log snippet: redact + truncate so prompts/documents never hit logs in full.
 * @param {unknown} input
 * @param {number} [maxLen]
 */
export function safeLogSnippet(input, maxLen = 120) {
  const redacted = redactPii(input);
  if (redacted.length <= maxLen) return redacted;
  return `${redacted.slice(0, maxLen)}…[truncated ${redacted.length - maxLen} chars]`;
}
