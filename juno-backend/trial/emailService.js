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
 * @param {{
 *   to: string | string[],
 *   subject: string,
 *   html: string,
 *   text?: string,
 *   attachments?: Array<{ filename: string, content: string, contentType?: string }>
 * }} opts
 * `attachments[].content` must be base64 (no data: URL prefix).
 */
export async function sendEmail({ to, subject, html, text, attachments }) {
  const apiKey = String(process.env.RESEND_API_KEY || "").trim();
  if (!apiKey) {
    const err = new Error("RESEND_API_KEY is not configured");
    err.code = "email_not_configured";
    throw err;
  }

  const recipients = Array.isArray(to) ? to : [to];
  const payload = {
    from: getFromAddress(),
    to: recipients.map((x) => String(x || "").trim()).filter(Boolean),
    subject,
    html,
    text: text || undefined,
  };

  if (Array.isArray(attachments) && attachments.length) {
    payload.attachments = attachments.map((a) => ({
      filename: String(a.filename || "attachment").slice(0, 180),
      content: String(a.content || "").replace(/^data:[^;]+;base64,/, ""),
      content_type: a.contentType || a.content_type || undefined,
    }));
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
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
      <p style="margin:0 0 16px">Thanks for signing up for a JUNO RFP trial. Click the button below to confirm your email and activate your login. Your <strong>7-business-day trial</strong> starts when you confirm (weekends do not count toward the trial period).</p>
      <p style="margin:0 0 20px">
        <a href="${confirmUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600">
          Confirm email &amp; activate
        </a>
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#475569">Or paste this link into your browser:</p>
      <p style="margin:0 0 16px;font-size:13px;word-break:break-all"><a href="${confirmUrl}">${confirmUrl}</a></p>
      <p style="margin:0;font-size:12px;color:#64748b">This confirmation link expires in 24 hours. If you did not request a trial, you can ignore this email.</p>
    </div>
  `;
  const text = `Hi ${displayName},\n\nConfirm your JUNO RFP trial (your 7-business-day trial starts when you confirm; weekends do not count):\n${confirmUrl}\n\nThis confirmation link expires in 24 hours.`;

  return sendEmail({ to, subject, html, text });
}

/**
 * Workspace: email an RFP/grant original or completed export as an attachment.
 */
export async function sendWorkspaceDocumentEmail({
  to,
  subject,
  message,
  senderName,
  fileName,
  attachment,
}) {
  const who = String(senderName || "A JUNO RFP teammate").trim();
  const fname = String(fileName || attachment?.filename || "document").trim();
  const note = String(message || "").trim();
  const subj =
    String(subject || "").trim() || `JUNO RFP document: ${fname}`;

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#0f172a;max-width:560px;margin:0 auto">
      <h1 style="font-size:20px;margin:0 0 12px">Document shared from JUNO RFP</h1>
      <p style="margin:0 0 12px"><strong>${escapeHtml(who)}</strong> sent you a file from Workspace.</p>
      <p style="margin:0 0 12px"><strong>File:</strong> ${escapeHtml(fname)}</p>
      ${
        note
          ? `<p style="margin:0 0 16px;padding:12px 14px;background:#f1f5f9;border-radius:8px;white-space:pre-wrap">${escapeHtml(note)}</p>`
          : ""
      }
      <p style="margin:0;font-size:12px;color:#64748b">The file is attached to this email. Sent via JUNO RFP by MARLN Corporation.</p>
    </div>
  `;
  const text = [
    `${who} sent you a file from JUNO RFP Workspace.`,
    `File: ${fname}`,
    note ? `\nMessage:\n${note}` : "",
    "\nThe file is attached to this email.",
  ]
    .filter(Boolean)
    .join("\n");

  return sendEmail({
    to,
    subject: subj,
    html,
    text,
    attachments: attachment
      ? [
          {
            filename: attachment.filename || fname,
            content: attachment.content,
            contentType: attachment.contentType,
          },
        ]
      : undefined,
  });
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export { getAppUrl };
