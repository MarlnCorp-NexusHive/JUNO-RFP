/**
 * Company-wide people roster — same source as User Management "Total Users":
 * trial signup members (/trial/auth/members) + manual userManagement rows (email-deduped).
 * Also keeps Manage Team members aligned so Team Members count matches Total Users.
 */
import { fetchTrialMembers } from "../../../services/api.js";
import {
  canUseTrialFeatures,
  loadTrialFeatureData,
  persistTrialFeatureData,
} from "../../../services/trialFeatureApi.js";
import { getTrialSession } from "../../../services/trialAuthSession.js";
import {
  getTeamData,
  setTeamMembers,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
} from "./teamStore.js";

export const USER_ROSTER_CHANGED_EVENT = "juno-trial-user-roster-changed";

function emailKey(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function sessionUserAsMember() {
  const session = getTrialSession();
  const u = session?.user;
  if (!u?.id && !u?.email) return null;
  return {
    id: u.id || `session_${u.email}`,
    tenantId: session.tenantId || u.tenantId,
    email: u.email || "",
    name: u.name || u.email || "You",
    role: u.role || "Proposal Manager",
    team: u.team || "Proposals",
    emailVerified: true,
    createdAt: u.createdAt || session.savedAt || new Date().toISOString(),
    emailVerifiedAt: u.emailVerifiedAt || null,
  };
}

export function mergeSignupMembers(apiMembers) {
  const list = Array.isArray(apiMembers) ? [...apiMembers] : [];
  const self = sessionUserAsMember();
  if (self) {
    const selfEmail = emailKey(self.email);
    const exists = list.some(
      (m) =>
        String(m.id) === String(self.id) ||
        (selfEmail && emailKey(m.email) === selfEmail),
    );
    if (!exists) list.unshift(self);
  }
  return list;
}

export function mapSignupMemberToCard(m) {
  const name = String(m?.name || "").trim() || String(m?.email || "").split("@")[0] || "User";
  const initials = name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const created = m?.createdAt || m?.emailVerifiedAt || "";
  return {
    id: m.id,
    source: "signup",
    name,
    displayName: name,
    email: m.email || "",
    role: m.role || "Proposal Manager",
    department: m.team || "Proposals",
    statusKey: "userStatuses.active",
    avatar: initials || "U",
    permissions: 3,
    joinDate: String(created).slice(0, 10) || "—",
    createdAt: created || null,
  };
}

function notifyRosterChanged(detail) {
  try {
    window.dispatchEvent(new CustomEvent(USER_ROSTER_CHANGED_EVENT, { detail }));
  } catch {
    /* ignore */
  }
}

/**
 * Build the same roster User Management uses for Total Users.
 * @returns {Promise<{ roster: object[], count: number, signupMembers: object[], manualUsers: object[] }>}
 */
export async function loadCompanyUserRoster() {
  if (!canUseTrialFeatures()) {
    return { roster: [], count: 0, signupMembers: [], manualUsers: [] };
  }

  let membersRes = null;
  try {
    membersRes = await fetchTrialMembers();
  } catch (err) {
    console.warn("[user-roster] members fetch failed:", err?.message || err);
  }

  const feature = await loadTrialFeatureData("userManagement", { users: [] });
  const manualUsers = (Array.isArray(feature?.users) ? feature.users : [])
    .filter((u) => u?.source !== "signup")
    .map((u) => ({ ...u, source: u.source || "manual" }));

  const signupMembers = mergeSignupMembers(membersRes?.ok ? membersRes.members : []);
  const session = getTrialSession();
  const selfEmail = emailKey(session?.user?.email);
  const signupCards = signupMembers.map((m) => {
    const card = mapSignupMemberToCard(m);
    const isSelf =
      (selfEmail && emailKey(card.email) === selfEmail) ||
      String(card.id) === String(session?.user?.id || "");
    return { ...card, isSelf };
  });
  signupCards.sort((a, b) => Number(b.isSelf) - Number(a.isSelf));

  const signupEmails = new Set(signupCards.map((u) => emailKey(u.email)).filter(Boolean));
  const manualCards = manualUsers
    .filter((u) => !signupEmails.has(emailKey(u.email)))
    .map((u) => ({
      ...u,
      source: "manual",
      isSelf: false,
      name: u.name || u.displayName || u.email || "User",
      displayName: u.displayName || u.name || u.email || "User",
      role: u.role || "Proposal Manager",
    }));

  const roster = [...signupCards, ...manualCards];
  return {
    roster,
    count: roster.length,
    signupMembers,
    manualUsers,
  };
}

function rosterToTeamMember(card, existing = null) {
  const name = String(card.name || card.displayName || card.email || "Team member").trim();
  const role = String(card.role || existing?.role || "Proposal Writer").trim() || "Proposal Writer";
  return {
    id: existing?.id || `member_${String(card.id || emailKey(card.email) || Date.now())}`,
    name,
    role,
    email: String(card.email || existing?.email || "").trim(),
    phone: existing?.phone || "",
    skills: Array.isArray(existing?.skills) ? existing.skills : [],
    projects: Array.isArray(existing?.projects) ? existing.projects : [],
    status: existing?.status || "Active",
    permissions: Array.isArray(existing?.permissions) ? existing.permissions : [],
    avatar: existing?.avatar || "👤",
    performance: existing?.performance ?? 80,
    rosterSource: card.source || "manual",
    rosterUserId: card.id || null,
  };
}

/**
 * Align manageTeam.members with the company user roster (Total Users).
 * Preserves enrichment (skills, permissions, etc.) when email matches.
 */
export async function syncTeamMembersFromCompanyRoster(opts = {}) {
  const notify = opts.notify !== false;
  if (!canUseTrialFeatures()) return getTeamData();

  const { roster, count } = await loadCompanyUserRoster();
  const current = getTeamData().members || [];
  const byEmail = new Map(
    current
      .filter((m) => emailKey(m.email))
      .map((m) => [emailKey(m.email), m]),
  );

  const nextMembers = roster.map((card) => {
    const existing = byEmail.get(emailKey(card.email)) || null;
    return rosterToTeamMember(card, existing);
  });

  const prevJson = JSON.stringify(
    (current || []).map((m) => ({
      id: m.id,
      email: emailKey(m.email),
      name: m.name,
      role: m.role,
    })),
  );
  const nextJson = JSON.stringify(
    nextMembers.map((m) => ({
      id: m.id,
      email: emailKey(m.email),
      name: m.name,
      role: m.role,
    })),
  );

  if (prevJson !== nextJson) {
    setTeamMembers(nextMembers);
  }

  if (notify) {
    notifyRosterChanged({ count, rosterLength: roster.length });
  }

  return { ...getTeamData(), rosterCount: count };
}

/**
 * Persist a manual user into userManagement (same blob User Management uses).
 */
export async function upsertManualUserManagementUser({
  id,
  name,
  email,
  role = "Proposal Manager",
  department = "Proposals",
} = {}) {
  if (!canUseTrialFeatures()) return null;
  const emailNorm = emailKey(email);
  if (!emailNorm) return null;

  const data = await loadTrialFeatureData("userManagement", { users: [] });
  const users = Array.isArray(data?.users) ? [...data.users] : [];
  const idx = users.findIndex((u) => emailKey(u.email) === emailNorm);
  const initials = String(name || emailNorm)
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const row = {
    id: id || (idx >= 0 ? users[idx].id : `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
    source: "manual",
    name: String(name || "").trim() || emailNorm,
    displayName: String(name || "").trim() || emailNorm,
    email: String(email || "").trim(),
    role,
    department,
    statusKey: "userStatuses.active",
    avatar: initials || "U",
    permissions: 3,
    joinDate: idx >= 0 ? users[idx].joinDate || new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    createdAt: idx >= 0 ? users[idx].createdAt || new Date().toISOString() : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (idx >= 0) users[idx] = { ...users[idx], ...row };
  else users.push(row);

  await persistTrialFeatureData("userManagement", { users });
  notifyRosterChanged({ count: null });
  return row;
}

/**
 * Remove a manual user from userManagement by email (does not touch signup accounts).
 */
export async function removeManualUserManagementUserByEmail(email) {
  if (!canUseTrialFeatures()) return;
  const emailNorm = emailKey(email);
  if (!emailNorm) return;

  const data = await loadTrialFeatureData("userManagement", { users: [] });
  const users = (Array.isArray(data?.users) ? data.users : []).filter(
    (u) => emailKey(u.email) !== emailNorm,
  );
  await persistTrialFeatureData("userManagement", { users });
  notifyRosterChanged({ count: null });
}

/**
 * Add a person in both User Management (Total Users) and Manage Team.
 */
export async function addCompanyTeamPerson(input = {}) {
  const name = String(input.name || "").trim();
  const email = String(input.email || "").trim();
  if (!name || !email) return { ok: false, error: "missing_fields" };

  const { roster } = await loadCompanyUserRoster();
  if (roster.some((u) => emailKey(u.email) === emailKey(email))) {
    // Already on Total Users roster — just ensure team member enrichment exists
    const existing = (getTeamData().members || []).find(
      (m) => emailKey(m.email) === emailKey(email),
    );
    if (existing) {
      updateTeamMember(existing.id, {
        name,
        role: input.role,
        phone: input.phone,
        skills: input.skills,
        projects: input.projects,
        status: input.status,
        permissions: input.permissions,
      });
    } else {
      addTeamMember({ ...input, name, email });
    }
    await syncTeamMembersFromCompanyRoster();
    return { ok: true, data: getTeamData() };
  }

  await upsertManualUserManagementUser({
    name,
    email,
    role: input.role || "Proposal Manager",
    department: "Proposals",
  });
  addTeamMember({ ...input, name, email });
  await syncTeamMembersFromCompanyRoster();
  return { ok: true, data: getTeamData() };
}

/**
 * Remove from Manage Team; if they were a manual UM user, remove from Total Users too.
 * Signup accounts stay on the auth roster (and thus Total Users).
 */
export async function removeCompanyTeamPerson(member) {
  if (!member?.id) return getTeamData();
  const email = member.email;
  removeTeamMember(member.id);

  const { roster } = await loadCompanyUserRoster();
  const onRoster = roster.find((u) => emailKey(u.email) === emailKey(email));
  if (onRoster?.source === "manual") {
    await removeManualUserManagementUserByEmail(email);
  }
  await syncTeamMembersFromCompanyRoster();
  return getTeamData();
}

export function subscribeUserRoster(onChange) {
  const handler = () => onChange();
  window.addEventListener(USER_ROSTER_CHANGED_EVENT, handler);
  return () => window.removeEventListener(USER_ROSTER_CHANGED_EVENT, handler);
}
