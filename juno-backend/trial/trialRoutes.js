import { Router } from "express";
import { requireTrialAuth } from "./authMiddleware.js";
import {
  buildTrialConfirmUrl,
  isEmailConfigured,
  sendTrialConfirmationEmail,
} from "./emailService.js";
import {
  changeUserPassword,
  confirmTrialEmail,
  createSession,
  ensureTrialClockStarted,
  findTenantById,
  findUserByEmail,
  getTenantStatus,
  getUsageSnapshot,
  publicTenant,
  publicUser,
  registerTrialSignup,
  reissueEmailConfirmation,
  revokeSession,
  verifyPassword,
} from "./tenantStore.js";

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
    } = req.body || {};

    const result = registerTrialSignup({
      contactName: name || contactName,
      email,
      password,
      companyName: companyName || company,
    });

    const delivery = await deliverConfirmation({
      email: result.user.email,
      name: result.user.name,
      confirmToken: result.confirmToken,
    });

    return res.status(201).json({
      ok: true,
      message: delivery.emailed
        ? "Check your email to confirm your account before signing in."
        : "Account created. Email is not configured on this server — use the confirmation link returned (dev mode).",
      user: result.user,
      tenant: publicTenant(result.tenant),
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
        : code === "missing_name" ||
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

    // Fallback: start 7-day clock on first login if confirm didn't (legacy rows).
    const tenantFresh = ensureTrialClockStarted(user.tenantId) || tenant;

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

export default router;
