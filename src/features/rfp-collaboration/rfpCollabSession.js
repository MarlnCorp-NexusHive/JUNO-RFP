import { rfpCollab } from "../../services/rfpCollabApi.js";
import { getTrialSession } from "../../services/trialAuthSession.js";

const KEY = "juno_rfp_collab_session";

const PM_TEAM = "Proposal Team";
const PM_ROLE = "Proposal Manager";

const RFP_COLLAB_TEAM = "RFP Collaboration";
const RFP_AUDITOR_ROLE = "RFP Auditor";

function readRbacUser() {
  try {
    return JSON.parse(localStorage.getItem("rbac_current_user") || "null");
  } catch {
    return null;
  }
}

/** Display name from trial signup / main JUNO login (not collab seed users). */
function getSignedUpDisplayName() {
  const rbac = readRbacUser();
  const fromRbac = String(rbac?.name || rbac?.displayName || "").trim();
  if (fromRbac) return fromRbac;
  const trial = getTrialSession();
  return String(trial?.user?.name || "").trim();
}

/**
 * Collab API still uses seeded credentials; for trial only, overlay the signed-up name.
 */
function withSignedUpIdentity(user) {
  if (!user) return user;
  const trial = getTrialSession();
  const rbac = readRbacUser();
  const isTrial = Boolean(trial?.token || rbac?.isTrialUser);
  if (!isTrial) return user;
  const name = getSignedUpDisplayName();
  if (!name) return user;
  const isPm =
    user.role === "proposal_manager" &&
    (rbac?.team === PM_TEAM && rbac?.role === PM_ROLE);
  const isAuditor =
    user.role === "auditor" &&
    (rbac?.team === RFP_COLLAB_TEAM && rbac?.role === RFP_AUDITOR_ROLE);
  if (!isPm && !isAuditor) return user;
  if (user.name === name) return user;
  return { ...user, name };
}

/** Matches main JUNO login (LoginPage → rbac_current_user). */
export function isMainAppRfpAuditor() {
  try {
    const u = readRbacUser();
    return u?.team === RFP_COLLAB_TEAM && u?.role === RFP_AUDITOR_ROLE;
  } catch {
    return false;
  }
}

/**
 * After main JUNO login as RFP Auditor, sync collaboration API session (seeded email/password on user record).
 */
export async function ensureRbacAuditorCollabSession() {
  const existing = loadCollabSession();
  if (existing?.token && existing?.user?.role === "auditor") {
    return existing;
  }
  if (!isMainAppRfpAuditor()) return null;
  const rbac = readRbacUser();
  const email = String(rbac?.collabEmail || "").trim();
  const password = rbac?.collabPassword;
  if (!email || !password) return null;
  const { data } = await rfpCollab.login(email, password);
  if (data.user?.role !== "auditor") {
    throw new Error("Collaboration auditor account mismatch");
  }
  saveCollabSession(data.token, data.user);
  return loadCollabSession();
}

export function isMainAppProposalManager() {
  try {
    const u = readRbacUser();
    return u?.team === PM_TEAM && u?.role === PM_ROLE;
  } catch {
    return false;
  }
}

/**
 * If the user is logged into JUNO as Proposal Manager, obtain a collaboration API session
 * using the seeded PM account (override with VITE_COLLAB_PM_EMAIL / VITE_COLLAB_PM_PASSWORD).
 * Display name is taken from the signed-up / main-app user, not the seed account.
 */
export async function ensureProposalManagerCollabSession() {
  const existing = loadCollabSession();
  if (existing?.token && existing?.user?.role === "proposal_manager") {
    return existing;
  }
  if (!isMainAppProposalManager()) return null;
  const email = (import.meta.env.VITE_COLLAB_PM_EMAIL || "jordan@juno").trim();
  const password = import.meta.env.VITE_COLLAB_PM_PASSWORD || "pm123";
  const { data } = await rfpCollab.login(email, password);
  if (data.user?.role !== "proposal_manager") {
    throw new Error("Collaboration PM account mismatch");
  }
  saveCollabSession(data.token, data.user);
  return loadCollabSession();
}

export function loadCollabSession() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o?.token || !o?.user) return null;
    const user = withSignedUpIdentity(o.user);
    if (user !== o.user) {
      sessionStorage.setItem(KEY, JSON.stringify({ token: o.token, user }));
    }
    return { token: o.token, user };
  } catch {
    return null;
  }
}

export function saveCollabSession(token, user) {
  sessionStorage.setItem(KEY, JSON.stringify({ token, user: withSignedUpIdentity(user) }));
}

export function clearCollabSession() {
  sessionStorage.removeItem(KEY);
}
