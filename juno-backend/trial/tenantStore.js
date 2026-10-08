import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_PATH = path.join(__dirname, "..", "data", "trial-tenants.json");

/**
 * Resolve trial DB path.
 * On Render, set TRIAL_DATA_PATH to a file on a Persistent Disk
 * (e.g. /var/data/trial-tenants.json) so signups survive restarts.
 * Lazy: reads env at call time (after dotenv).
 */
export function getTrialDataPath() {
  const fromEnv = String(
    process.env.TRIAL_DATA_PATH || process.env.JUNO_TRIAL_DATA_PATH || "",
  ).trim();
  if (fromEnv) return path.resolve(fromEnv);
  const dirEnv = String(process.env.TRIAL_DATA_DIR || "").trim();
  if (dirEnv) return path.resolve(dirEnv, "trial-tenants.json");
  return DEFAULT_DATA_PATH;
}

function emptyDb() {
  return {
    tenants: [],
    users: [],
    sessions: [],
    usage: {},
    emailTokens: [],
    usedEmailTokens: [],
  };
}

const USED_TOKEN_TTL_MS = 48 * 60 * 60 * 1000;

/** Default self-serve / provisioned trial length (weekdays only). Clock starts on email confirm (or first login fallback). */
export const DEFAULT_TRIAL_DAYS = 7;

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * End instant after `businessDays` weekdays, counting the start day when it is a weekday.
 * Weekends are skipped and do not count toward the allowance.
 * @param {Date} start
 * @param {number} businessDays
 * @returns {Date}
 */
export function trialEndsAtAfterBusinessDays(start, businessDays) {
  const days = Number(businessDays) > 0 ? Number(businessDays) : DEFAULT_TRIAL_DAYS;
  const end = start instanceof Date ? new Date(start.getTime()) : new Date(start);
  if (days <= 0) return end;

  let counted = isWeekend(end) ? 0 : 1;
  while (counted < days) {
    end.setDate(end.getDate() + 1);
    if (!isWeekend(end)) counted += 1;
  }
  return end;
}

/**
 * Start the trial window once. No-op if trialEndsAt is already set.
 * @returns {boolean} true if the clock was started now
 */
export function isPermanentTenant(tenant) {
  return Boolean(tenant?.permanent || tenant?.neverExpires);
}

export function startTrialClockIfNeeded(tenant, { now = new Date() } = {}) {
  if (!tenant) return false;
  if (isPermanentTenant(tenant)) return false;
  if (tenant.trialEndsAt) return false;
  const days =
    Number(tenant.trialDays) > 0 ? Number(tenant.trialDays) : DEFAULT_TRIAL_DAYS;
  const start = now instanceof Date ? now : new Date(now);
  tenant.trialDays = days;
  tenant.trialStartsAt = start.toISOString();
  tenant.trialEndsAt = trialEndsAtAfterBusinessDays(start, days).toISOString();
  return true;
}

function pruneUsedEmailTokens(db) {
  const cutoff = Date.now() - USED_TOKEN_TTL_MS;
  db.usedEmailTokens = (db.usedEmailTokens || []).filter(
    (t) => Date.parse(t.usedAt || 0) > cutoff,
  );
}

/**
 * Align every started tenant trial to `days` business days from its start.
 * Leaves pending accounts (no trialEndsAt) untouched so the clock still starts on confirm.
 * @returns {number} tenants updated
 */
export function capTrialWindowsToDefaultDays(db, { days = DEFAULT_TRIAL_DAYS } = {}) {
  let updated = 0;
  for (const tenant of db.tenants || []) {
    if (!tenant) continue;
    if (isPermanentTenant(tenant)) continue;
    const prevDays = tenant.trialDays;
    const prevEnds = tenant.trialEndsAt;
    tenant.trialDays = days;

    if (!tenant.trialEndsAt) {
      // Clock not started yet (awaiting email confirm)
      if (prevDays !== days) updated += 1;
      continue;
    }

    const startMs = Date.parse(
      tenant.trialStartsAt || tenant.activatedAt || tenant.createdAt || "",
    );
    const start = Number.isFinite(startMs) ? new Date(startMs) : new Date();
    if (!Number.isFinite(Date.parse(tenant.trialStartsAt || ""))) {
      tenant.trialStartsAt = start.toISOString();
    }
    const expectedEnd = trialEndsAtAfterBusinessDays(start, days).toISOString();
    if (prevEnds !== expectedEnd || prevDays !== days) {
      tenant.trialEndsAt = expectedEnd;
      updated += 1;
    }
  }
  return updated;
}

/** Load DB, apply business-day trial window migration once per process start, persist if needed. */
export function migrateTrialDurationsOnBoot() {
  const db = loadTrialDb();
  const n = capTrialWindowsToDefaultDays(db);
  if (n > 0) {
    saveTrialDb(db);
    console.log(
      `[trial] aligned ${n} tenant trial window(s) to ${DEFAULT_TRIAL_DAYS} business days`,
    );
  }
  return n;
}

function ensureDir() {
  const dataPath = getTrialDataPath();
  const dir = path.dirname(dataPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function loadTrialDb() {
  const dataPath = getTrialDataPath();
  try {
    if (!fs.existsSync(dataPath)) return emptyDb();
    const raw = fs.readFileSync(dataPath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      tenants: Array.isArray(parsed.tenants) ? parsed.tenants : [],
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      usage: parsed.usage && typeof parsed.usage === "object" ? parsed.usage : {},
      emailTokens: Array.isArray(parsed.emailTokens) ? parsed.emailTokens : [],
      usedEmailTokens: Array.isArray(parsed.usedEmailTokens) ? parsed.usedEmailTokens : [],
    };
  } catch (err) {
    console.warn("[trial] failed to load trial DB:", dataPath, err.message);
    return emptyDb();
  }
}

export function saveTrialDb(db) {
  const dataPath = getTrialDataPath();
  ensureDir();
  const payload = JSON.stringify(db, null, 2);
  const tmp = `${dataPath}.tmp`;
  const fd = fs.openSync(tmp, "w");
  try {
    fs.writeFileSync(fd, payload, "utf8");
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmp, dataPath);
  // Best-effort directory fsync so the rename itself survives a sudden restart.
  try {
    const dirFd = fs.openSync(path.dirname(dataPath), "r");
    try {
      fs.fsyncSync(dirFd);
    } finally {
      fs.closeSync(dirFd);
    }
  } catch {
    // Some environments disallow directory fsync; file write already succeeded.
  }
  const bytes = Buffer.byteLength(payload, "utf8");
  console.log(
    `[trial] saved ${db.tenants?.length || 0} tenant(s), ${db.users?.length || 0} user(s) → ${dataPath} (${bytes} bytes)`,
  );
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return { salt, hash };
}

export function verifyPassword(password, salt, expectedHash) {
  if (!salt || !expectedHash) return false;
  const { hash } = hashPassword(password, salt);
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expectedHash, "hex"));
  } catch {
    return false;
  }
}

export function slugifyTenantId(name) {
  const base = String(name || "tenant")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "tenant";
  return `t_${base}_${crypto.randomBytes(3).toString("hex")}`;
}

/** Case/space-insensitive company match so teammates land on one tenant. */
export function normalizeCompanyName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Canonical org key for tenant joining.
 * WBEC variants (WBEC, WBEC Pacific, WBEC North, WBEC-Pacific, etc.) share one tenant.
 */
export function companyGroupKey(name) {
  const n = normalizeCompanyName(name);
  if (!n) return "";
  const compact = n.replace(/[\s\-_.']/g, "");

  // Known trial org: WBEC (any regional / legal suffix)
  if (
    compact === "wbec" ||
    compact.startsWith("wbecpacific") ||
    compact.startsWith("wbecnorth") ||
    compact.startsWith("wbecsouth") ||
    compact.startsWith("wbeceast") ||
    compact.startsWith("wbecwest") ||
    /^wbec(inc|llc|corp|corporation|co|company)?$/.test(compact) ||
    /^wbec\b/.test(n)
  ) {
    return "org:wbec";
  }

  return `name:${n}`;
}

export function findTenantByCompanyName(companyName, db = null) {
  const store = db || loadTrialDb();
  const groupKey = companyGroupKey(companyName);
  if (!groupKey) return null;
  return (
    (store.tenants || []).find((t) => companyGroupKey(t.name) === groupKey) || null
  );
}

/** Preferred display name when creating the first tenant for a known org group. */
export function canonicalCompanyDisplayName(companyName) {
  const group = companyGroupKey(companyName);
  if (group === "org:wbec") return "WBEC Pacific";
  return String(companyName || "").trim();
}

export function createTrialTenant({
  companyName,
  email,
  password,
  contactName,
  trialDays = DEFAULT_TRIAL_DAYS,
  aiDailyLimit = null,
  aiMonthlyLimit = null,
}) {
  const db = loadTrialDb();
  const emailNorm = String(email || "").trim().toLowerCase();
  if (!companyName?.trim()) throw new Error("companyName is required");
  if (!emailNorm) throw new Error("email is required");
  if (!password || String(password).length < 8) throw new Error("password must be at least 8 characters");
  if (db.users.some((u) => String(u.email).toLowerCase() === emailNorm)) {
    throw new Error(`user already exists: ${emailNorm}`);
  }

  const now = new Date();
  const days = Number(trialDays) > 0 ? Number(trialDays) : DEFAULT_TRIAL_DAYS;
  const ends = trialEndsAtAfterBusinessDays(now, days);
  const { salt, hash } = hashPassword(password);

  let tenant = findTenantByCompanyName(companyName, db);
  let joinedExisting = false;
  if (tenant) {
    const status = getTenantStatus(tenant);
    if (tenant.status === "revoked" || tenant.status === "disabled") {
      throw new Error("This company trial has been disabled");
    }
    if (!status.ok && status.code === "trial_expired") {
      throw new Error("This company trial has expired");
    }
    joinedExisting = true;
  } else {
    const displayName = canonicalCompanyDisplayName(companyName);
    tenant = {
      id: slugifyTenantId(displayName),
      name: displayName,
      status: "active",
      trialDays: days,
      trialStartsAt: now.toISOString(),
      trialEndsAt: ends.toISOString(),
      aiDailyLimit: aiDailyLimit == null ? null : Number(aiDailyLimit),
      aiMonthlyLimit: aiMonthlyLimit == null ? null : Number(aiMonthlyLimit),
      brandLogo: "marln",
      createdAt: now.toISOString(),
    };
    db.tenants.push(tenant);
  }

  const user = {
    id: `u_${crypto.randomBytes(6).toString("hex")}`,
    tenantId: tenant.id,
    email: emailNorm,
    name: String(contactName || emailNorm.split("@")[0]).trim(),
    passwordSalt: salt,
    passwordHash: hash,
    role: "Proposal Manager",
    team: "Proposal Team",
    emailVerified: true,
    createdAt: now.toISOString(),
  };

  db.users.push(user);
  if (!db.usage[tenant.id]) db.usage[tenant.id] = {};
  saveTrialDb(db);

  return {
    tenant,
    user: publicUser(user),
    temporaryPassword: String(password),
    joinedExisting,
  };
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    name: user.name,
    role: user.role,
    team: user.team,
  };
}

/** Members list for User Management — includes signup timestamps for Total/New metrics. */
export function publicMemberUser(user) {
  if (!user) return null;
  return {
    ...publicUser(user),
    emailVerified: Boolean(user.emailVerified),
    createdAt: user.createdAt || null,
    emailVerifiedAt: user.emailVerifiedAt || null,
  };
}

/** All users belonging to a tenant (signup accounts). */
export function listUsersForTenant(tenantId) {
  const db = loadTrialDb();
  const tid = String(tenantId || "");
  if (!tid) return [];
  return (db.users || [])
    .filter((u) => u && String(u.tenantId) === tid)
    .map(publicMemberUser)
    .filter(Boolean)
    .sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
}

function resolveTenantBrandLogo(tenant) {
  const explicit = String(tenant?.brandLogo || "").trim().toLowerCase();
  if (explicit === "wbec" || explicit === "wbec-pacific") return "wbec-pacific";
  if (explicit === "marln") return "marln";
  const name = String(tenant?.name || "").toLowerCase();
  const id = String(tenant?.id || "").toLowerCase();
  if (/wbec|wbenc/.test(name) || /wbec|wbenc/.test(id)) return "wbec-pacific";
  return "marln";
}

export function publicTenant(tenant) {
  if (!tenant) return null;
  return {
    id: tenant.id,
    name: tenant.name,
    status: tenant.status,
    trialStartsAt: tenant.trialStartsAt,
    trialEndsAt: isPermanentTenant(tenant) ? null : tenant.trialEndsAt,
    permanent: isPermanentTenant(tenant),
    aiDailyLimit: tenant.aiDailyLimit,
    aiMonthlyLimit: tenant.aiMonthlyLimit,
    brandLogo: resolveTenantBrandLogo(tenant),
  };
}

export function getTenantStatus(tenant) {
  if (!tenant) return { ok: false, code: "tenant_missing", message: "Tenant not found" };
  if (tenant.status === "pending_verification") {
    return {
      ok: false,
      code: "email_not_verified",
      message: "Please confirm your email before signing in. Check your inbox for the activation link.",
    };
  }
  if (tenant.status === "revoked" || tenant.status === "disabled") {
    return { ok: false, code: "tenant_disabled", message: "This trial has been disabled" };
  }
  if (isPermanentTenant(tenant)) return { ok: true };
  const ends = Date.parse(tenant.trialEndsAt || "");
  if (Number.isFinite(ends) && Date.now() > ends) {
    return { ok: false, code: "trial_expired", message: "This trial has expired" };
  }
  return { ok: true };
}

/** Shared walkthrough / demo trial — no expiry; re-seeded on every boot (incl. live). */
export const WALKTHROUGH_DEFAULTS = {
  email: "walkthrough@junorfp.com",
  password: "Walkthrough2026!",
  companyName: "JUNO Walkthrough",
  contactName: "Walkthrough PM",
};

export function getWalkthroughCredentials() {
  return {
    email: String(process.env.WALKTHROUGH_EMAIL || WALKTHROUGH_DEFAULTS.email)
      .trim()
      .toLowerCase(),
    password: String(process.env.WALKTHROUGH_PASSWORD || WALKTHROUGH_DEFAULTS.password),
    companyName: String(process.env.WALKTHROUGH_COMPANY || WALKTHROUGH_DEFAULTS.companyName).trim(),
    contactName: String(process.env.WALKTHROUGH_NAME || WALKTHROUGH_DEFAULTS.contactName).trim(),
  };
}

/**
 * Ensure a permanent walkthrough trial exists with a known password.
 * Safe to call on every boot — updates flags/password so live always has a usable login.
 */
export function ensurePermanentWalkthroughAccount() {
  const creds = getWalkthroughCredentials();
  const db = loadTrialDb();
  const nowIso = new Date().toISOString();
  let user = (db.users || []).find((u) => String(u.email).toLowerCase() === creds.email);
  let tenant = user ? (db.tenants || []).find((t) => t.id === user.tenantId) : null;
  let created = false;

  if (!tenant) {
    const existingByName = findTenantByCompanyName(creds.companyName, db);
    if (existingByName && isPermanentTenant(existingByName)) {
      tenant = existingByName;
    }
  }

  if (!tenant) {
    const displayName = canonicalCompanyDisplayName(creds.companyName);
    tenant = {
      id: slugifyTenantId(displayName),
      name: displayName,
      status: "active",
      permanent: true,
      neverExpires: true,
      trialDays: null,
      trialStartsAt: nowIso,
      trialEndsAt: null,
      aiDailyLimit: null,
      aiMonthlyLimit: null,
      brandLogo: "marln",
      createdAt: nowIso,
      walkthrough: true,
    };
    db.tenants.push(tenant);
    created = true;
  } else {
    tenant.status = "active";
    tenant.permanent = true;
    tenant.neverExpires = true;
    tenant.trialEndsAt = null;
    tenant.trialDays = null;
    tenant.walkthrough = true;
    if (!tenant.brandLogo) tenant.brandLogo = "marln";
    if (!tenant.trialStartsAt) tenant.trialStartsAt = nowIso;
  }

  const { salt, hash } = hashPassword(creds.password);
  if (!user) {
    user = {
      id: `u_${crypto.randomBytes(6).toString("hex")}`,
      tenantId: tenant.id,
      email: creds.email,
      name: creds.contactName,
      passwordSalt: salt,
      passwordHash: hash,
      role: "Proposal Manager",
      team: "Proposal Team",
      emailVerified: true,
      createdAt: nowIso,
      walkthrough: true,
    };
    db.users.push(user);
    created = true;
  } else {
    user.tenantId = tenant.id;
    user.name = creds.contactName || user.name;
    user.passwordSalt = salt;
    user.passwordHash = hash;
    user.emailVerified = true;
    user.walkthrough = true;
    if (!user.role) user.role = "Proposal Manager";
    if (!user.team) user.team = "Proposal Team";
  }

  if (!db.usage) db.usage = {};
  if (!db.usage[tenant.id]) db.usage[tenant.id] = {};

  saveTrialDb(db);
  return {
    created,
    email: creds.email,
    tenantId: tenant.id,
    tenantName: tenant.name,
    permanent: true,
  };
}

/**
 * Self-serve signup: creates a pending trial until email is confirmed.
 * @returns {{ tenant, user, confirmToken, confirmExpiresAt }}
 */
export function registerTrialSignup({
  companyName,
  email,
  password,
  contactName,
  trialDays = DEFAULT_TRIAL_DAYS,
  aiDailyLimit = null,
  aiMonthlyLimit = null,
}) {
  const db = loadTrialDb();
  const emailNorm = String(email || "").trim().toLowerCase();
  const name = String(contactName || "").trim();
  const company = String(companyName || "").trim();

  if (!name) {
    const err = new Error("Name is required");
    err.code = "missing_name";
    throw err;
  }
  if (!company) {
    const err = new Error("Company name is required");
    err.code = "missing_company";
    throw err;
  }
  if (!emailNorm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
    const err = new Error("A valid email is required");
    err.code = "invalid_email";
    throw err;
  }
  if (!password || String(password).length < 8) {
    const err = new Error("Password must be at least 8 characters");
    err.code = "password_too_short";
    throw err;
  }

  const existing = db.users.find((u) => String(u.email).toLowerCase() === emailNorm);
  if (existing) {
    const tenant = db.tenants.find((t) => t.id === existing.tenantId);
    if (existing.emailVerified || tenant?.status === "active") {
      const err = new Error("An account with this email already exists. Please sign in.");
      err.code = "email_taken";
      throw err;
    }
    // Allow re-signup refresh for unverified accounts: update password/name and issue new token
    const { salt, hash } = hashPassword(password);
    existing.passwordSalt = salt;
    existing.passwordHash = hash;
    existing.name = name;
    if (tenant) tenant.name = company;

    db.emailTokens = (db.emailTokens || []).filter((t) => t.userId !== existing.id);
    const confirmToken = crypto.randomBytes(32).toString("hex");
    const confirmExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    db.emailTokens.push({
      token: confirmToken,
      userId: existing.id,
      tenantId: existing.tenantId,
      purpose: "email_confirm",
      expiresAt: confirmExpiresAt,
      createdAt: new Date().toISOString(),
    });
    saveTrialDb(db);
    return {
      tenant,
      user: publicUser(existing),
      confirmToken,
      confirmExpiresAt,
      refreshed: true,
    };
  }

  const now = new Date();
  const days = Number(trialDays) > 0 ? Number(trialDays) : DEFAULT_TRIAL_DAYS;
  const { salt, hash } = hashPassword(password);

  // Same company name → same tenant so teammates share dashboards / uploads / feature data.
  let tenant = findTenantByCompanyName(company, db);
  let joinedExisting = false;
  if (tenant) {
    if (tenant.status === "revoked" || tenant.status === "disabled") {
      const err = new Error("This company trial has been disabled");
      err.code = "tenant_disabled";
      throw err;
    }
    const status = getTenantStatus(tenant);
    if (!status.ok && status.code === "trial_expired") {
      const err = new Error("This company trial has expired");
      err.code = "trial_expired";
      throw err;
    }
    joinedExisting = true;
  } else {
    const displayName = canonicalCompanyDisplayName(company);
    tenant = {
      id: slugifyTenantId(displayName),
      name: displayName,
      status: "pending_verification",
      // Clock starts when email is confirmed (see confirmTrialEmail / login fallback).
      trialDays: days,
      trialStartsAt: null,
      trialEndsAt: null,
      aiDailyLimit: aiDailyLimit == null ? null : Number(aiDailyLimit),
      aiMonthlyLimit: aiMonthlyLimit == null ? null : Number(aiMonthlyLimit),
      brandLogo: "marln",
      createdAt: now.toISOString(),
    };
    db.tenants.push(tenant);
  }

  const user = {
    id: `u_${crypto.randomBytes(6).toString("hex")}`,
    tenantId: tenant.id,
    email: emailNorm,
    name,
    passwordSalt: salt,
    passwordHash: hash,
    role: "Proposal Manager",
    team: "Proposal Team",
    emailVerified: false,
    createdAt: now.toISOString(),
  };

  const confirmToken = crypto.randomBytes(32).toString("hex");
  const confirmExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  db.users.push(user);
  if (!db.emailTokens) db.emailTokens = [];
  db.emailTokens.push({
    token: confirmToken,
    userId: user.id,
    tenantId: tenant.id,
    purpose: "email_confirm",
    expiresAt: confirmExpiresAt,
    createdAt: now.toISOString(),
  });
  if (!db.usage[tenant.id]) db.usage[tenant.id] = {};
  saveTrialDb(db);

  return {
    tenant,
    user: publicUser(user),
    confirmToken,
    confirmExpiresAt,
    refreshed: false,
    joinedExisting,
  };
}

export function confirmTrialEmail(token) {
  const db = loadTrialDb();
  const raw = String(token || "").trim();
  if (!raw) {
    const err = new Error("Confirmation token is required");
    err.code = "missing_token";
    throw err;
  }

  pruneUsedEmailTokens(db);

  const record = (db.emailTokens || []).find(
    (t) => t.token === raw && t.purpose === "email_confirm",
  );

  // Idempotent: link already consumed (email scanner / double-click / Strict Mode)
  if (!record) {
    const used = (db.usedEmailTokens || []).find((t) => t.token === raw);
    if (used) {
      const user = db.users.find((u) => u.id === used.userId);
      const tenant = db.tenants.find((t) => t.id === used.tenantId);
      if (user?.emailVerified && tenant) {
        return {
          user: publicUser(user),
          tenant: publicTenant(tenant),
          alreadyConfirmed: true,
        };
      }
    }
    const err = new Error("Invalid or already used confirmation link");
    err.code = "invalid_token";
    throw err;
  }
  if (Date.parse(record.expiresAt) <= Date.now()) {
    const err = new Error("This confirmation link has expired. Please sign up again or resend confirmation.");
    err.code = "token_expired";
    throw err;
  }

  const user = db.users.find((u) => u.id === record.userId);
  const tenant = db.tenants.find((t) => t.id === record.tenantId);
  if (!user || !tenant) {
    const err = new Error("Account not found for this confirmation link");
    err.code = "user_missing";
    throw err;
  }

  user.emailVerified = true;
  user.emailVerifiedAt = new Date().toISOString();
  if (tenant.status === "pending_verification") {
    tenant.status = "active";
    tenant.activatedAt = new Date().toISOString();
  }
  // Business-day trial window (tenant.trialDays) begins at confirmation — not at signup.
  startTrialClockIfNeeded(tenant);

  db.emailTokens = (db.emailTokens || []).filter((t) => t.token !== raw);
  db.usedEmailTokens = db.usedEmailTokens || [];
  db.usedEmailTokens.push({
    token: raw,
    userId: user.id,
    tenantId: tenant.id,
    usedAt: new Date().toISOString(),
  });
  saveTrialDb(db);

  return { user: publicUser(user), tenant: publicTenant(tenant), alreadyConfirmed: false };
}

/** Issue a fresh confirmation token for an unverified account (password required). */
export function reissueEmailConfirmation({ email, password }) {
  const db = loadTrialDb();
  const emailNorm = String(email || "").trim().toLowerCase();
  const user = db.users.find((u) => String(u.email).toLowerCase() === emailNorm);
  if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    const err = new Error("Invalid email or password");
    err.code = "invalid_credentials";
    throw err;
  }
  if (user.emailVerified) {
    const err = new Error("Email is already confirmed. You can sign in.");
    err.code = "already_verified";
    throw err;
  }

  db.emailTokens = (db.emailTokens || []).filter((t) => t.userId !== user.id || t.purpose !== "email_confirm");
  const confirmToken = crypto.randomBytes(32).toString("hex");
  const confirmExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  db.emailTokens.push({
    token: confirmToken,
    userId: user.id,
    tenantId: user.tenantId,
    purpose: "email_confirm",
    expiresAt: confirmExpiresAt,
    createdAt: new Date().toISOString(),
  });
  saveTrialDb(db);

  const tenant = db.tenants.find((t) => t.id === user.tenantId);
  return {
    user: publicUser(user),
    tenant,
    confirmToken,
    confirmExpiresAt,
  };
}

const PERMANENT_SESSION_TTL_HOURS = 24 * 365 * 10; // ~10 years

export function createSession(user, tenant, ttlHours = 24 * 14) {
  const db = loadTrialDb();
  const token = crypto.randomBytes(32).toString("hex");
  const hours = isPermanentTenant(tenant) ? PERMANENT_SESSION_TTL_HOURS : ttlHours;
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  db.sessions = (db.sessions || []).filter((s) => Date.parse(s.expiresAt) > Date.now());
  db.sessions.push({
    token,
    userId: user.id,
    tenantId: tenant.id,
    expiresAt,
    createdAt: new Date().toISOString(),
  });
  saveTrialDb(db);
  return { token, expiresAt };
}

export function revokeSession(token) {
  const db = loadTrialDb();
  db.sessions = (db.sessions || []).filter((s) => s.token !== token);
  saveTrialDb(db);
}

export function resolveSession(token) {
  if (!token) return null;
  const db = loadTrialDb();
  const session = (db.sessions || []).find((s) => s.token === token);
  if (!session) return null;
  if (Date.parse(session.expiresAt) <= Date.now()) {
    db.sessions = db.sessions.filter((s) => s.token !== token);
    saveTrialDb(db);
    return null;
  }
  const user = db.users.find((u) => u.id === session.userId);
  const tenant = db.tenants.find((t) => t.id === session.tenantId);
  if (!user || !tenant) return null;
  let dirty = false;
  if (startTrialClockIfNeeded(tenant)) dirty = true;
  // Keep permanent walkthrough sessions from aging out during long demos.
  if (isPermanentTenant(tenant)) {
    const remainingMs = Date.parse(session.expiresAt) - Date.now();
    if (!Number.isFinite(remainingMs) || remainingMs < 365 * 24 * 60 * 60 * 1000) {
      session.expiresAt = new Date(Date.now() + PERMANENT_SESSION_TTL_HOURS * 60 * 60 * 1000).toISOString();
      dirty = true;
    }
  }
  if (dirty) saveTrialDb(db);
  const status = getTenantStatus(tenant);
  if (!status.ok) return { invalid: true, ...status };
  return { session, user, tenant };
}

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function monthKey(d = new Date()) {
  return `month:${d.toISOString().slice(0, 7)}`;
}

export function getUsageSnapshot(tenant) {
  const db = loadTrialDb();
  const bucket = db.usage[tenant.id] || {};
  const day = Number(bucket[dayKey()] || 0);
  const month = Number(bucket[monthKey()] || 0);
  // Trials are unmetered — keep counters for observability only.
  return {
    day,
    month,
    aiDailyLimit: null,
    aiMonthlyLimit: null,
    dayRemaining: null,
    monthRemaining: null,
    unlimited: true,
  };
}

/** Trials have no AI call caps (usage is still recorded for observability). */
export function assertAiQuota(tenant) {
  const snap = getUsageSnapshot(tenant);
  return { ok: true, usage: snap };
}

export function recordAiUsage(tenantId, amount = 1) {
  const db = loadTrialDb();
  if (!db.usage[tenantId]) db.usage[tenantId] = {};
  const bucket = db.usage[tenantId];
  const d = dayKey();
  const m = monthKey();
  bucket[d] = Number(bucket[d] || 0) + amount;
  bucket[m] = Number(bucket[m] || 0) + amount;
  saveTrialDb(db);
  return getUsageSnapshot({ id: tenantId, aiDailyLimit: 0, aiMonthlyLimit: 0, ...db.tenants.find((t) => t.id === tenantId) });
}

export function findUserByEmail(email) {
  const db = loadTrialDb();
  const emailNorm = String(email || "").trim().toLowerCase();
  return db.users.find((u) => String(u.email).toLowerCase() === emailNorm) || null;
}

export function findTenantById(tenantId) {
  const db = loadTrialDb();
  return db.tenants.find((t) => t.id === tenantId) || null;
}

/** Persist trial clock start for a tenant (e.g. first login if confirm missed it). */
export function ensureTrialClockStarted(tenantId) {
  const db = loadTrialDb();
  const tenant = db.tenants.find((t) => t.id === tenantId);
  if (!tenant) return null;
  if (startTrialClockIfNeeded(tenant)) saveTrialDb(db);
  return tenant;
}

/**
 * Update a trial user's password after verifying the current one.
 * Revokes other sessions for that user; keeps the active token if provided.
 */
export function changeUserPassword(userId, currentPassword, newPassword, { keepToken } = {}) {
  const db = loadTrialDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    const err = new Error("User not found");
    err.code = "user_missing";
    throw err;
  }
  if (!verifyPassword(currentPassword, user.passwordSalt, user.passwordHash)) {
    const err = new Error("Current password is incorrect");
    err.code = "invalid_current_password";
    throw err;
  }
  const next = String(newPassword || "");
  if (next.length < 8) {
    const err = new Error("New password must be at least 8 characters");
    err.code = "password_too_short";
    throw err;
  }
  if (verifyPassword(next, user.passwordSalt, user.passwordHash)) {
    const err = new Error("New password must be different from the current password");
    err.code = "password_unchanged";
    throw err;
  }

  const { salt, hash } = hashPassword(next);
  user.passwordSalt = salt;
  user.passwordHash = hash;
  user.passwordChangedAt = new Date().toISOString();

  db.sessions = (db.sessions || []).filter((s) => {
    if (s.userId !== userId) return true;
    if (keepToken && s.token === keepToken) return true;
    return false;
  });

  saveTrialDb(db);
  return { user: publicUser(user), passwordChangedAt: user.passwordChangedAt };
}

export function dataFilePath() {
  return getTrialDataPath();
}

/** Safe diagnostics for Render disk debugging (no secrets / passwords). */
export function getTrialStorageStatus() {
  const dataPath = getTrialDataPath();
  const dir = path.dirname(dataPath);
  const fromEnv = Boolean(
    String(process.env.TRIAL_DATA_PATH || process.env.JUNO_TRIAL_DATA_PATH || process.env.TRIAL_DATA_DIR || "").trim(),
  );
  let exists = false;
  let bytes = 0;
  let tenants = 0;
  let users = 0;
  let mtime = null;
  try {
    if (fs.existsSync(dataPath)) {
      exists = true;
      const st = fs.statSync(dataPath);
      bytes = st.size;
      mtime = st.mtime.toISOString();
      const db = loadTrialDb();
      tenants = db.tenants?.length || 0;
      users = db.users?.length || 0;
    }
  } catch (err) {
    return {
      ok: false,
      dataPath,
      dir,
      fromEnv,
      error: err.message,
    };
  }
  return {
    ok: true,
    dataPath,
    dir,
    fromEnv,
    fileExists: exists,
    bytes,
    mtime,
    tenants,
    users,
    render: Boolean(process.env.RENDER),
  };
}
