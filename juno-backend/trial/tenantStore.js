import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "..", "data", "trial-tenants.json");

function emptyDb() {
  return { tenants: [], users: [], sessions: [], usage: {} };
}

function ensureDir() {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function loadTrialDb() {
  try {
    if (!fs.existsSync(DATA_PATH)) return emptyDb();
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      tenants: Array.isArray(parsed.tenants) ? parsed.tenants : [],
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      usage: parsed.usage && typeof parsed.usage === "object" ? parsed.usage : {},
    };
  } catch (err) {
    console.warn("[trial] failed to load trial-tenants.json:", err.message);
    return emptyDb();
  }
}

export function saveTrialDb(db) {
  ensureDir();
  const tmp = `${DATA_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmp, DATA_PATH);
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

export function createTrialTenant({
  companyName,
  email,
  password,
  contactName,
  trialDays = 30,
  aiDailyLimit = 80,
  aiMonthlyLimit = 800,
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
  const ends = new Date(now.getTime() + Number(trialDays) * 24 * 60 * 60 * 1000);
  const tenantId = slugifyTenantId(companyName);
  const { salt, hash } = hashPassword(password);

  const tenant = {
    id: tenantId,
    name: String(companyName).trim(),
    status: "active",
    trialStartsAt: now.toISOString(),
    trialEndsAt: ends.toISOString(),
    aiDailyLimit: Number(aiDailyLimit) || 80,
    aiMonthlyLimit: Number(aiMonthlyLimit) || 800,
    createdAt: now.toISOString(),
  };

  const user = {
    id: `u_${crypto.randomBytes(6).toString("hex")}`,
    tenantId,
    email: emailNorm,
    name: String(contactName || emailNorm.split("@")[0]).trim(),
    passwordSalt: salt,
    passwordHash: hash,
    role: "Proposal Manager",
    team: "Proposal Team",
    createdAt: now.toISOString(),
  };

  db.tenants.push(tenant);
  db.users.push(user);
  if (!db.usage[tenantId]) db.usage[tenantId] = {};
  saveTrialDb(db);

  return { tenant, user: publicUser(user), temporaryPassword: String(password) };
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

export function publicTenant(tenant) {
  if (!tenant) return null;
  return {
    id: tenant.id,
    name: tenant.name,
    status: tenant.status,
    trialStartsAt: tenant.trialStartsAt,
    trialEndsAt: tenant.trialEndsAt,
    aiDailyLimit: tenant.aiDailyLimit,
    aiMonthlyLimit: tenant.aiMonthlyLimit,
  };
}

export function getTenantStatus(tenant) {
  if (!tenant) return { ok: false, code: "tenant_missing", message: "Tenant not found" };
  if (tenant.status === "revoked" || tenant.status === "disabled") {
    return { ok: false, code: "tenant_disabled", message: "This trial has been disabled" };
  }
  const ends = Date.parse(tenant.trialEndsAt || "");
  if (Number.isFinite(ends) && Date.now() > ends) {
    return { ok: false, code: "trial_expired", message: "This trial has expired" };
  }
  return { ok: true };
}

export function createSession(user, tenant, ttlHours = 24 * 14) {
  const db = loadTrialDb();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();
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
  return {
    day,
    month,
    aiDailyLimit: tenant.aiDailyLimit,
    aiMonthlyLimit: tenant.aiMonthlyLimit,
    dayRemaining: Math.max(0, (tenant.aiDailyLimit || 0) - day),
    monthRemaining: Math.max(0, (tenant.aiMonthlyLimit || 0) - month),
  };
}

export function assertAiQuota(tenant) {
  const snap = getUsageSnapshot(tenant);
  if (snap.day >= (tenant.aiDailyLimit || 0)) {
    return { ok: false, code: "ai_daily_limit", message: "Daily AI limit reached for this trial", usage: snap };
  }
  if (snap.month >= (tenant.aiMonthlyLimit || 0)) {
    return { ok: false, code: "ai_monthly_limit", message: "Monthly AI limit reached for this trial", usage: snap };
  }
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

export function dataFilePath() {
  return DATA_PATH;
}
