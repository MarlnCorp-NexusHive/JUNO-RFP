import { store, resolveCollabToken } from "./store.js";

export function toPublicUser(record) {
  if (!record) return null;
  return {
    id: record.id,
    email: record.email,
    name: record.name,
    role: record.role,
    ...(record.tenantId ? { tenantId: record.tenantId } : {}),
  };
}

/**
 * Authenticates `Authorization: Bearer <token>` (or `?token=` for SSE) against
 * server-issued opaque session tokens from /rfp-collab/auth/*.
 */
export function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  let token = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  const q = req.query?.token;
  if (!token && typeof q === "string" && q.trim()) {
    token = q.trim();
  }
  if (!token) {
    return res.status(401).json({ error: "Missing Authorization: Bearer <token>" });
  }
  const user = resolveCollabToken(token);
  if (!user) {
    return res.status(401).json({ error: "Invalid token" });
  }
  req.userId = user.id;
  req.user = toPublicUser(user);
  next();
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden for this role" });
    }
    next();
  };
}

/** Auditor may only act as themselves; PM may only inspect auditors in the same tenant scope. */
export function requireAuditorSelfOrPm(paramName = "auditorId") {
  return (req, res, next) => {
    const targetId = req.params[paramName];
    if (req.user.role === "auditor" && req.userId === targetId) return next();
    if (req.user.role === "proposal_manager") {
      const pm = store.usersById.get(req.userId);
      const target = store.usersById.get(targetId);
      if (!target || target.role !== "auditor") {
        return res.status(404).json({ error: "Auditor not found" });
      }
      const pmIsTrial = Boolean(pm?.tenantId || String(pm?.id || "").startsWith("user_pm_trial_"));
      const targetIsTrial = Boolean(target?.tenantId || String(target?.id || "").startsWith("user_aud_trial_"));
      if (pmIsTrial) {
        if (targetIsTrial && pm.tenantId && target.tenantId === pm.tenantId) return next();
        return res.status(403).json({ error: "Forbidden across tenants" });
      }
      if (!targetIsTrial) return next();
      return res.status(403).json({ error: "Forbidden across tenants" });
    }
    return res.status(403).json({ error: "You may only access your own auditor dashboard" });
  };
}
