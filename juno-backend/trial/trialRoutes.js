import { Router } from "express";
import { requireTrialAuth } from "./authMiddleware.js";
import {
  buildTrialConfirmUrl,
  buildPasswordResetUrl,
  isEmailConfigured,
  sendTrialConfirmationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from "./emailService.js";
import {
  changeUserPassword,
  confirmTrialEmail,
  createPasswordResetToken,
  createSession,
  deleteUserAccount,
  ensureTrialClockStarted,
  findTenantById,
  findUserByEmail,
  getTenantStatus,
  getTrialStorageStatus,
  getUsageSnapshot,
  listUsersForTenant,
  publicTenant,
  publicUser,
  registerTrialSignup,
  reissueEmailConfirmation,
  resetPasswordWithToken,
  revokeSession,
  updateUserProfile,
  verifyPasswordAsync,
} from "./tenantStore.js";
import { exportAllTenantFeatures } from "./featureStore.js";
import { purgeTenantSatelliteData } from "../privacy/purgeTenantData.js";
import { appendPrivacyAudit } from "../privacy/privacyAuditLog.js";

const router = Router();

async function deliverConfirmation({ email, name, confirmToken }) {
  const confirmUrl = buildTrialConfirmUrl(confirmToken);
  if (isEmailConfigured()) {
    await sendTrialConfirmationEmail({ to: email, name, confirmUrl });
    return { emailed: true, confirmUrl: null };
  }
  // Dev fallback: no Resend key — log link so local testing still works
  console.warn("[trial] RESEND_API_KEY missing — confirmation link (dev only):", confirmUrl);
  return { emailed: false, confirmUrl };
}

router.post("/signup", async (req, res) => {
  try {
    const {
      name,
      contactName,
      email,
      password,
      companyName,
      company,
      privacyAccepted,
      privacyPolicyVersion,
    } = req.body || {};

    if (privacyAccepted !== true) {
      return res.status(400).json({
        error: "You must accept the Privacy Policy to create an account.",
        code: "privacy_consent_required",
      });
    }

    const result = registerTrialSignup({
      contactName: name || contactName,
      email,
      password,
      companyName: companyName || company,
      privacyAccepted: true,
      privacyPolicyVersion: privacyPolicyVersion || "2026-11",
      privacyMeta: {
        ip: req.ip || req.socket?.remoteAddress || "",
        userAgent: String(req.headers["user-agent"] || "").slice(0, 180),
        source: "signup",
      },
    });

    appendPrivacyAudit({
      action: "consent_accepted",
      userId: result.user?.id,
      tenantId: result.tenant?.id,
      email: result.user?.email,
      detail: `policy=${privacyPolicyVersion || "2026-11"}`,
      ip: req.ip,
      userAgent: String(req.headers["user-agent"] || ""),
      requestId: req.requestId,
    });

    const delivery = await deliverConfirmation({
      email: result.user.email,
      name: result.user.name,
      confirmToken: result.confirmToken,
    });

    const joined = Boolean(result.joinedExisting);
    return res.status(201).json({
      ok: true,
      message: delivery.emailed
        ? joined
          ? "Joined your company trial. Check your email to confirm before signing in."
          : "Check your email to confirm your account before signing in."
        : joined
          ? "Joined your company trial. Email is not configured — use the confirmation link returned (dev mode)."
          : "Account created. Email is not configured on this server — use the confirmation link returned (dev mode).",
      user: result.user,
      tenant: publicTenant(result.tenant),
      joinedExisting: joined,
      emailSent: delivery.emailed,
      // Only expose confirm URL when Resend is not configured (local/dev).
      confirmUrl: delivery.confirmUrl,
      confirmExpiresAt: result.confirmExpiresAt,
    });
  } catch (err) {
    const code = err.code || "signup_failed";
    const status =
      code === "email_taken"
        ? 409
        : code === "trial_expired" || code === "tenant_disabled"
          ? 403
        : code === "privacy_consent_required" ||
            code === "missing_name" ||
            code === "missing_company" ||
            code === "invalid_email" ||
            code === "password_too_short"
          ? 400
          : 500;
    if (status >= 500) console.error("[trial] signup error:", err);
    return res.status(status).json({ error: err.message || "Signup failed", code });
  }
});

function respondConfirm(res, result) {
  return res.json({
    ok: true,
    alreadyConfirmed: Boolean(result.alreadyConfirmed),
    message: result.alreadyConfirmed
      ? "Email was already confirmed. You can sign in."
      : "Email confirmed. You can sign in now.",
    user: result.user,
    tenant: result.tenant,
  });
}

function respondConfirmError(res, err, label) {
  const code = err.code || "confirm_failed";
  const status =
    code === "missing_token" || code === "invalid_token" || code === "token_expired"
      ? 400
      : code === "user_missing"
        ? 404
        : 500;
  if (status >= 500) console.error(`[trial] ${label} error:`, err);
  return res.status(status).json({ error: err.message || "Confirmation failed", code });
}

router.post("/confirm", (req, res) => {
  try {
    const token = req.body?.token || req.query?.token;
    return respondConfirm(res, confirmTrialEmail(token));
  } catch (err) {
    return respondConfirmError(res, err, "confirm");
  }
});

router.get("/confirm", (req, res) => {
  try {
    return respondConfirm(res, confirmTrialEmail(req.query?.token));
  } catch (err) {
    return respondConfirmError(res, err, "confirm");
  }
});

router.post("/resend-confirmation", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const result = reissueEmailConfirmation({ email, password });
    const delivery = await deliverConfirmation({
      email: result.user.email,
      name: result.user.name,
      confirmToken: result.confirmToken,
    });
    return res.json({
      ok: true,
      message: delivery.emailed
        ? "Confirmation email resent. Check your inbox."
        : "Confirmation link regenerated (dev mode — email not configured).",
      emailSent: delivery.emailed,
      confirmUrl: delivery.confirmUrl,
      confirmExpiresAt: result.confirmExpiresAt,
    });
  } catch (err) {
    const code = err.code || "resend_failed";
    const status =
      code === "invalid_credentials"
        ? 401
        : code === "already_verified"
          ? 400
          : 500;
    if (status >= 500) console.error("[trial] resend-confirmation error:", err);
    return res.status(status).json({ error: err.message || "Could not resend confirmation", code });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body?.email || req.body?.username || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required", code: "missing_credentials" });
    }

    const user = findUserByEmail(email);
    const passOk = user ? await verifyPasswordAsync(password, user.passwordSalt, user.passwordHash) : false;
    if (!user || !passOk) {
      return res.status(401).json({ error: "Invalid trial credentials", code: "invalid_credentials" });
    }

    if (user.emailVerified === false) {
      return res.status(403).json({
        error: "Please confirm your email before signing in. Check your inbox for the activation link.",
        code: "email_not_verified",
      });
    }

    const tenant = findTenantById(user.tenantId);
    const status = getTenantStatus(tenant);
    if (!status.ok) {
      return res.status(403).json({ error: status.message, code: status.code });
    }

    // Fallback: start business-day trial clock on first login if confirm didn't (legacy rows).
    // Permanent walkthrough tenants never start a countdown.
    const tenantFresh =
      tenant?.permanent || tenant?.neverExpires
        ? tenant
        : ensureTrialClockStarted(user.tenantId) || tenant;

    const { token, expiresAt } = createSession(user, tenantFresh);
    const usage = getUsageSnapshot(tenantFresh);

    return res.json({
      token,
      expiresAt,
      user: publicUser(user),
      tenant: publicTenant(tenantFresh),
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

/** Signup accounts for the authenticated tenant (shared User Management metrics/list). */
router.get("/members", requireTrialAuth, (req, res) => {
  try {
    const members = listUsersForTenant(req.tenantId);
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const newMembers = members.filter((m) => {
      const t = Date.parse(m.createdAt || m.emailVerifiedAt || "");
      return Number.isFinite(t) && now - t <= weekMs;
    });
    return res.json({
      ok: true,
      tenantId: req.tenantId,
      members,
      totals: {
        totalUsers: members.length,
        newUsers: newMembers.length,
      },
    });
  } catch (err) {
    console.error("[trial] members error:", err);
    return res.status(500).json({ error: err.message || "Could not load members", code: "members_failed" });
  }
});

/** Public health/persistence check — redacted so filesystem paths and tenant counts are not leaked. */
router.get("/storage-status", (_req, res) => {
  const status = getTrialStorageStatus();
  return res.json({
    ok: true,
    exists: Boolean(status?.exists),
    persistent: Boolean(status?.usingCustomPath),
  });
});

router.post("/logout", (req, res) => {
  if (req.trialToken) revokeSession(req.trialToken);
  return res.json({ ok: true });
});

router.post("/change-password", requireTrialAuth, (req, res) => {
  try {
    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Current password and new password are required",
        code: "missing_passwords",
      });
    }

    const result = changeUserPassword(req.trialUser.id, currentPassword, newPassword, {
      keepToken: req.trialToken,
    });

    return res.json({
      ok: true,
      user: result.user,
      passwordChangedAt: result.passwordChangedAt,
    });
  } catch (err) {
    const code = err.code || "change_password_failed";
    const status =
      code === "invalid_current_password"
        ? 401
        : code === "password_too_short" || code === "password_unchanged"
          ? 400
          : code === "user_missing"
            ? 404
            : 500;
    if (status >= 500) console.error("[trial] change-password error:", err);
    return res.status(status).json({ error: err.message || "Could not change password", code });
  }
});

/** Anti-enumeration forgot-password — always returns ok. */
router.post("/forgot-password", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ error: "Email is required", code: "invalid_email" });
    }
    const issued = createPasswordResetToken(email);
    if (issued.issued && isEmailConfigured()) {
      const resetUrl = buildPasswordResetUrl(issued.resetToken);
      await sendPasswordResetEmail({
        to: issued.user.email,
        name: issued.user.name,
        resetUrl,
      });
      appendPrivacyAudit({
        action: "password_reset_requested",
        userId: issued.user.id,
        tenantId: issued.user.tenantId,
        email: issued.user.email,
        ip: req.ip,
        userAgent: String(req.headers["user-agent"] || ""),
        requestId: req.requestId,
      });
      return res.json({ ok: true, emailSent: true });
    }
    if (issued.issued && !isEmailConfigured()) {
      // Dev fallback: return link only when email is not configured
      return res.json({
        ok: true,
        emailSent: false,
        resetUrl: buildPasswordResetUrl(issued.resetToken),
        message: "Email is not configured — use the reset link returned (dev mode).",
      });
    }
    return res.json({
      ok: true,
      emailSent: false,
      message: "If an account exists for that email, a reset link has been sent.",
    });
  } catch (err) {
    console.error("[trial] forgot-password error:", err);
    return res.status(500).json({ error: "Could not process password reset", code: "forgot_failed" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const token = req.body?.token || req.query?.token;
    const newPassword = String(req.body?.newPassword || req.body?.password || "");
    const result = resetPasswordWithToken(token, newPassword);
    if (isEmailConfigured()) {
      try {
        await sendPasswordChangedEmail({ to: result.user.email, name: result.user.name });
      } catch {
        /* non-blocking */
      }
    }
    appendPrivacyAudit({
      action: "password_reset_completed",
      userId: result.user.id,
      tenantId: result.user.tenantId,
      email: result.user.email,
      ip: req.ip,
      userAgent: String(req.headers["user-agent"] || ""),
      requestId: req.requestId,
    });
    return res.json({ ok: true, message: "Password updated. You can sign in now." });
  } catch (err) {
    const code = err.code || "reset_failed";
    const status =
      code === "missing_token" || code === "invalid_token" || code === "token_expired" || code === "password_too_short"
        ? 400
        : code === "user_missing"
          ? 404
          : 500;
    if (status >= 500) console.error("[trial] reset-password error:", err);
    return res.status(status).json({ error: err.message || "Could not reset password", code });
  }
});

/** Right to rectification */
router.patch("/profile", requireTrialAuth, (req, res) => {
  try {
    const result = updateUserProfile(req.trialUser.id, { name: req.body?.name });
    appendPrivacyAudit({
      action: "profile_rectification",
      userId: req.trialUser.id,
      tenantId: req.tenantId,
      email: req.trialUser.email,
      detail: "name_updated",
      ip: req.ip,
      userAgent: String(req.headers["user-agent"] || ""),
      requestId: req.requestId,
    });
    return res.json({ ok: true, user: result.user });
  } catch (err) {
    const code = err.code || "profile_update_failed";
    const status = code === "missing_name" ? 400 : code === "user_missing" ? 404 : 500;
    if (status >= 500) console.error("[trial] profile update error:", err);
    return res.status(status).json({ error: err.message || "Could not update profile", code });
  }
});

/**
 * Right to Access / Data Portability (GDPR Art. 15/20, CCPA, PDPL, PIPEDA):
 * Exports the authenticated user's profile, consent record, tenant metadata, usage, and stored feature data.
 */
router.get("/export-my-data", requireTrialAuth, (req, res) => {
  try {
    const tenant = findTenantById(req.tenantId);
    const payload = {
      exportedAt: new Date().toISOString(),
      policyVersion: "2026-11",
      jurisdictions: ["GDPR", "CCPA/CPRA", "PDPL", "PIPEDA"],
      user: publicUser(req.trialUser),
      tenant: publicTenant(tenant),
      usage: getUsageSnapshot(req.tenantId),
      features: exportAllTenantFeatures(req.tenantId),
    };
    res.setHeader("Content-Disposition", `attachment; filename="juno-rfp-my-data-${req.trialUser.id}.json"`);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    appendPrivacyAudit({
      action: "dsar_export",
      userId: req.trialUser.id,
      tenantId: req.tenantId,
      email: req.trialUser.email,
      ip: req.ip,
      userAgent: String(req.headers["user-agent"] || ""),
      requestId: req.requestId,
    });
    return res.json(payload);
  } catch (err) {
    console.error("[trial] export-my-data error:", err);
    return res.status(500).json({ error: "Could not export user data", code: "export_failed" });
  }
});

/**
 * Right to Erasure (GDPR Art. 17, CCPA, PDPL, PIPEDA):
 * Permanently deletes the authenticated user's account, revokes sessions, and purges tenant data if sole member.
 */
router.delete("/account", requireTrialAuth, (req, res) => {
  try {
    const result = deleteUserAccount(req.trialUser.id);
    if (result.tenantDeleted) {
      purgeTenantSatelliteData(result.tenantId, "account_erasure");
    }
    appendPrivacyAudit({
      action: "dsar_erasure",
      userId: result.deletedUserId,
      tenantId: result.tenantId,
      email: req.trialUser.email,
      detail: result.tenantDeleted ? "tenant_purged" : "user_only",
      ip: req.ip,
      userAgent: String(req.headers["user-agent"] || ""),
      requestId: req.requestId,
    });
    return res.json({
      ok: true,
      message: "Your account and associated data have been permanently deleted.",
      ...result,
    });
  } catch (err) {
    const code = err.code || "delete_account_failed";
    const status = code === "user_missing" ? 404 : 500;
    if (status >= 500) console.error("[trial] delete account error:", err);
    return res.status(status).json({ error: err.message || "Could not delete account", code });
  }
});

export default router;
