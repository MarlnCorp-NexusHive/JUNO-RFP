/**
 * Prefix a path under /public for Vite base (e.g. /r/ on junorfp.com combined deploy).
 * Accepts "foo.png" or "/foo.png".
 */
export function publicUrl(path = "") {
  const base = import.meta.env.BASE_URL || "/";
  const clean = String(path || "").replace(/^\/+/, "");
  return `${base}${clean}`;
}
