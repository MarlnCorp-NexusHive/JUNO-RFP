/**
 * Transactional email via Resend (https://resend.com).
 * Env:
 *   RESEND_API_KEY   — required to actually send
 *   RESEND_FROM      — e.g. "JUNO RFP <onboarding@resend.dev>" (dev) or your verified domain
 *   JUNO_APP_URL     — public app origin for confirmation links
 */

function getAppUrl() {
  const raw = (process.env.JUNO_APP_URL || process.env.PUBLIC_APP_URL || "http://localhost:5173").trim();
  return raw.replace(/\/$/, "");
}

function getFromAddress() {
  return (
    process.env.RESEND_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    "JUNO RFP <onboarding@resend.dev>"
  );
}

export function isEmailConfigured() {
  return Boolean(String(process.env.RESEND_API_KEY || "").trim());
}

/**
 * @param {{ to: string, subject: string, html: string, text?: string }} opts
 */
export async function sendEmail({ to, subject, html, text }) {
  const apiKey = String(process.env.RESEND_API_KEY || "").trim();
  if (!apiKey) {
    const err = new Error("RESEND_API_KEY is not configured");
    err.code = "email_not_configured";
    throw err;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: [to],
      subject,
      html,
      text: text || undefined,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body?.message || `Resend HTTP ${res.status}`);
    err.code = "email_send_failed";
    err.details = body;
    throw err;
  }
  return body;
}

export function buildTrialConfirmUrl(token) {
  return `${getAppUrl()}/login?trialConfirm=${encodeURIComponent(token)}`;
}

export async function sendTrialConfirmationEmail({ to, name, confirmUrl }) {
  const displayName = name || to;
  const subject = "Confirm your JUNO RFP trial account";
  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#0f172a;max-width:560px;margin:0 auto">
      <h1 style="font-size:20px;margin:0 0 12px">Confirm your trial</h1>
      <p style="margin:0 0 12px">Hi ${escapeHtml(displayName)},</p>
      <p style="margin:0 0 16px">Thanks for signing up for a JUNO RFP trial. Click the button below to confirm your email and activate your login.</p>
      <p style="margin:0 0 20px">
        <a href="${confirmUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600">
          Confirm email &amp; activate
        </a>
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#475569">Or paste this link into your browser:</p>
      <p style="margin:0 0 16px;font-size:13px;word-break:break-all"><a href="${confirmUrl}">${confirmUrl}</a></p>
      <p style="margin:0;font-size:12px;color:#64748b">This link expires in 24 hours. If you did not request a trial, you can ignore this email.</p>
    </div>
  `;
  const text = `Hi ${displayName},\n\nConfirm your JUNO RFP trial:\n${confirmUrl}\n\nThis link expires in 24 hours.`;

  return sendEmail({ to, subject, html, text });
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export { getAppUrl };
