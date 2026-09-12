/**
 * Trial auth session (logical multi-tenancy).
 * Demo mode: no session → Proposal Manager localStorage keys stay global (unchanged).
 * Trial mode: session present → keys scoped by tenantId; API calls send Bearer token.
 */

const SESSION_KEY = "juno_trial_session";

export function getTrialSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.token || !parsed?.tenantId) return null;
    if (parsed.expiresAt && Date.parse(parsed.expiresAt) <= Date.now()) {
      clearTrialSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setTrialSession(payload) {
  const session = {
    token: payload.token,
    expiresAt: payload.expiresAt,
    tenantId: payload.tenant?.id || payload.tenantId,
    tenantName: payload.tenant?.name || payload.tenantName || "",
    trialEndsAt: payload.tenant?.trialEndsAt || payload.trialEndsAt || "",
    user: payload.user || null,
    usage: payload.usage || null,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearTrialSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function isTrialMode() {
  return !!getTrialSession()?.tenantId;
}

export function getTrialTenantId() {
  return getTrialSession()?.tenantId || null;
}

export function trialUserToRbacUser(loginPayload) {
  const user = loginPayload.user;
  const tenant = loginPayload.tenant;
  return {
    id: user.id,
    username: user.email,
    name: user.name,
    email: user.email,
    collabEmail: user.email,
    team: user.team || "Proposal Team",
    role: user.role || "Proposal Manager",
    tenantId: tenant.id,
    tenantName: tenant.name,
    trialEndsAt: tenant.trialEndsAt,
    isTrialUser: true,
  };
}
