import { rfpCollab } from "../../services/rfpCollabApi.js";

const KEY = "juno_rfp_collab_session";

const PM_TEAM = "Proposal Team";
const PM_ROLE = "Proposal Manager";

const RFP_COLLAB_TEAM = "RFP Collaboration";
const RFP_AUDITOR_ROLE = "RFP Auditor";

/** Matches main JUNO login (LoginPage → rbac_current_user). */
export function isMainAppRfpAuditor() {
  try {
    const raw = localStorage.getItem("rbac_current_user");
    if (!raw) return false;
    const u = JSON.parse(raw);
    return u?.team === RFP_COLLAB_TEAM && u?.role === RFP_AUDITOR_ROLE;
  } catch {
    return false;
  }
}

/**
 * After main JUNO login as RFP Auditor, sync collaboration API session (seeded email/password on user record).
 */
export async function ensureRbacAuditorCollabSession() {
  if (!isMainAppRfpAuditor()) return null;
  let rbac;
  try {
    rbac = JSON.parse(localStorage.getItem("rbac_current_user") || "null");
  } catch {
    return null;
  }
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
    const raw = localStorage.getItem("rbac_current_user");
    if (!raw) return false;
    const u = JSON.parse(raw);
    return u?.team === PM_TEAM && u?.role === PM_ROLE;
  } catch {
    return false;
  }
}

/**
 * If the user is logged into JUNO as Proposal Manager, obtain a collaboration API session
 * using the seeded PM account (override with VITE_COLLAB_PM_EMAIL / VITE_COLLAB_PM_PASSWORD).
 */
export async function ensureProposalManagerCollabSession() {
  if (!isMainAppProposalManager()) return null;
  const existing = loadCollabSession();
  if (existing?.token && existing?.user?.role === "proposal_manager") {
    return existing;
  }
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
    return o;
  } catch {
    return null;
  }
}

export function saveCollabSession(token, user) {
  sessionStorage.setItem(KEY, JSON.stringify({ token, user }));
}

export function clearCollabSession() {
  sessionStorage.removeItem(KEY);
}
