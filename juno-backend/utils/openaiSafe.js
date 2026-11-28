import { redactPiiDeep, safeLogSnippet } from "./piiRedact.js";
import { logger } from "./logger.js";

/**
 * Privacy-safe OpenAI chat completion wrapper:
 * - Redacts common PII patterns from message content before sending
 * - Never logs full prompts/documents
 */
export async function createChatCompletion(openai, params = {}, meta = {}) {
  if (!openai?.chat?.completions?.create) {
    throw new Error("OpenAI client is not configured");
  }
  const safeParams = {
    ...params,
    messages: Array.isArray(params.messages) ? redactPiiDeep(params.messages) : params.messages,
  };

  if (meta.logLabel) {
    const preview = Array.isArray(safeParams.messages)
      ? safeParams.messages.map((m) => safeLogSnippet(m?.content, 80)).join(" | ")
      : "";
    logger.debug("openai_chat_request", {
      label: meta.logLabel,
      model: safeParams.model,
      messageCount: Array.isArray(safeParams.messages) ? safeParams.messages.length : 0,
      preview,
    });
  }

  return openai.chat.completions.create(safeParams);
}
