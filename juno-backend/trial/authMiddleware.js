import {
  assertAiQuota,
  getUsageSnapshot,
  publicTenant,
  publicUser,
  recordAiUsage,
  resolveSession,
} from "./tenantStore.js";

function extractBearer(req) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  const m = String(header).match(/^Bearer\s+(.+)$/i);
  if (m) return m[1].trim();
  if (req.query?.trialToken) return String(req.query.trialToken).trim();
  return "";
}

/** Attach trial context when a valid trial token is present. Never blocks demo (no token). */
export function attachTrialContext(req, _res, next) {
  const token = extractBearer(req);
  if (!token) return next();
  const resolved = resolveSession(token);
  if (!resolved) return next();
  if (resolved.invalid) {
    req.trialAuthError = resolved;
    return next();
  }
  req.trialToken = token;
  req.trialUser = publicUser(resolved.user);
  req.trialTenant = publicTenant(resolved.tenant);
  req.tenantId = resolved.tenant.id;
  req.trialTenantFull = resolved.tenant;
  next();
}

/**
 * For metered AI routes:
 * - No trial token → demo mode, allow (unchanged)
 * - Invalid/expired trial token → 401
 * - Valid trial → enforce quota, then record usage after successful response start
 */
export function meterTrialAi(req, res, next) {
  if (req.trialAuthError) {
    return res.status(401).json({
      error: req.trialAuthError.message || "Trial session invalid",
      code: req.trialAuthError.code || "trial_auth_error",
    });
  }
  if (!req.trialTenantFull) return next();

  const quota = assertAiQuota(req.trialTenantFull);
  if (!quota.ok) {
    return res.status(429).json({
      error: quota.message,
      code: quota.code,
      usage: quota.usage,
    });
  }

  const tenantId = req.trialTenantFull.id;
  const originalJson = res.json.bind(res);
  let recorded = false;
  res.json = (body) => {
    if (!recorded && res.statusCode < 400) {
      recorded = true;
      try {
        recordAiUsage(tenantId, 1);
      } catch (err) {
        console.warn("[trial] usage record failed:", err.message);
      }
    }
    return originalJson(body);
  };

  const originalSend = res.send.bind(res);
  res.send = (body) => {
    if (!recorded && res.statusCode < 400) {
      recorded = true;
      try {
        recordAiUsage(tenantId, 1);
      } catch (err) {
        console.warn("[trial] usage record failed:", err.message);
      }
    }
    return originalSend(body);
  };

  next();
}

export function requireTrialAuth(req, res, next) {
  if (req.trialAuthError) {
    return res.status(401).json({
      error: req.trialAuthError.message || "Trial session invalid",
      code: req.trialAuthError.code || "trial_auth_error",
    });
  }
  if (!req.trialUser || !req.trialTenant) {
    return res.status(401).json({ error: "Trial authentication required", code: "trial_auth_required" });
  }
  next();
}

export function trialUsageForRequest(req) {
  if (!req.trialTenantFull) return null;
  return getUsageSnapshot(req.trialTenantFull);
}
