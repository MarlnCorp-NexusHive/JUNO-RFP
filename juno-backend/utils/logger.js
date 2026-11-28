import crypto from "crypto";

const IS_PROD = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);
const LEVEL_WEIGHT = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL = LEVEL_WEIGHT[String(process.env.LOG_LEVEL || (IS_PROD ? "info" : "debug")).toLowerCase()] ?? 20;

function formatEntry(level, message, meta = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: String(message || ""),
    ...meta,
  };
  if (IS_PROD) {
    return JSON.stringify(entry);
  }
  const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return `[${entry.ts}] ${level.toUpperCase()} ${entry.msg}${extra}`;
}

export const logger = {
  debug(msg, meta) {
    if (MIN_LEVEL > LEVEL_WEIGHT.debug) return;
    console.debug(formatEntry("debug", msg, meta));
  },
  info(msg, meta) {
    if (MIN_LEVEL > LEVEL_WEIGHT.info) return;
    console.log(formatEntry("info", msg, meta));
  },
  warn(msg, meta) {
    if (MIN_LEVEL > LEVEL_WEIGHT.warn) return;
    console.warn(formatEntry("warn", msg, meta));
  },
  error(msg, errOrMeta, extraMeta = {}) {
    if (MIN_LEVEL > LEVEL_WEIGHT.error) return;
    let meta = {};
    if (errOrMeta instanceof Error) {
      meta = {
        error: errOrMeta.message,
        code: errOrMeta.code || undefined,
        stack: IS_PROD ? undefined : errOrMeta.stack,
        ...extraMeta,
      };
    } else if (errOrMeta && typeof errOrMeta === "object") {
      meta = { ...errOrMeta, ...extraMeta };
    } else if (errOrMeta != null) {
      meta = { error: String(errOrMeta), ...extraMeta };
    }
    console.error(formatEntry("error", msg, meta));
  },
};

/**
 * Express middleware: assigns X-Request-Id and logs structured info/warn/error
 * on response completion with durationMs, statusCode, tenantId, and redacted path.
 */
export function requestLoggerMiddleware(req, res, next) {
  const startHr = process.hrtime.bigint();
  const reqId = String(req.headers["x-request-id"] || "").trim().slice(0, 64) || crypto.randomBytes(6).toString("hex");
  req.requestId = reqId;
  res.setHeader("X-Request-Id", reqId);

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startHr) / 1e6;
    const meta = {
      reqId,
      method: req.method,
      // Path only (never req.url) so ?token= / ?trialToken= secrets are never logged.
      path: req.path,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 10) / 10,
      ip: req.ip || req.socket?.remoteAddress || "unknown",
      ...(req.tenantId ? { tenantId: req.tenantId } : {}),
    };
    if (res.statusCode >= 500) {
      logger.error("http_request_error", meta);
    } else if (res.statusCode >= 400) {
      logger.warn("http_request_client_error", meta);
    } else {
      logger.info("http_request", meta);
    }
  });

  next();
}
