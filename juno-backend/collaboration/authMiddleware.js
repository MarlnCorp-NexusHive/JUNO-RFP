import { store } from "./store.js";

export function toPublicUser(record) {
  if (!record) return null;
  return {
    id: record.id,
    email: record.email,
    name: record.name,
    role: record.role,
  };
}

/**
 * Mock auth: `Authorization: Bearer <userId>` where userId is one of the seeded ids.
 * Use POST /rfp-collab/auth/login to obtain the token.
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
  const user = store.usersById.get(token);
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

/** Auditor may only act as themselves unless proposal_manager. */
export function requireAuditorSelfOrPm(paramName = "auditorId") {
  return (req, res, next) => {
    const targetId = req.params[paramName];
    if (req.user.role === "proposal_manager") return next();
    if (req.user.role === "auditor" && req.userId === targetId) return next();
    return res.status(403).json({ error: "You may only access your own auditor dashboard" });
  };
}
