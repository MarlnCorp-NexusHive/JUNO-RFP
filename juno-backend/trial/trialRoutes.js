import { Router } from "express";
import {
  createSession,
  findTenantById,
  findUserByEmail,
  getTenantStatus,
  getUsageSnapshot,
  publicTenant,
  publicUser,
  revokeSession,
  verifyPassword,
} from "./tenantStore.js";

const router = Router();

router.post("/login", (req, res) => {
  try {
    const email = String(req.body?.email || req.body?.username || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required", code: "missing_credentials" });
    }

    const user = findUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid trial credentials", code: "invalid_credentials" });
    }

    const tenant = findTenantById(user.tenantId);
    const status = getTenantStatus(tenant);
    if (!status.ok) {
      return res.status(403).json({ error: status.message, code: status.code });
    }

    const { token, expiresAt } = createSession(user, tenant);
    const usage = getUsageSnapshot(tenant);

    return res.json({
      token,
      expiresAt,
      user: publicUser(user),
      tenant: publicTenant(tenant),
      usage,
    });
  } catch (err) {
    console.error("[trial] login error:", err);
    return res.status(500).json({ error: "Trial login failed" });
  }
});

router.get("/me", (req, res) => {
  if (req.trialAuthError) {
    return res.status(401).json({
      error: req.trialAuthError.message || "Trial session invalid",
      code: req.trialAuthError.code || "trial_auth_error",
    });
  }
  if (!req.trialUser || !req.trialTenantFull) {
    return res.status(401).json({ error: "Not authenticated", code: "trial_auth_required" });
  }
  return res.json({
    user: req.trialUser,
    tenant: publicTenant(req.trialTenantFull),
    usage: getUsageSnapshot(req.trialTenantFull),
  });
});

router.post("/logout", (req, res) => {
  if (req.trialToken) revokeSession(req.trialToken);
  return res.json({ ok: true });
});

export default router;
