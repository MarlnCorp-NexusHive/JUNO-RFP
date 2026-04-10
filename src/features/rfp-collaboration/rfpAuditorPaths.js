/** Base path for auditor UI: main RBAC app vs standalone /collaboration. */
export function getRfpAuditorBasePath() {
  if (typeof window === "undefined") return "/collaboration";
  return window.location.pathname.startsWith("/rbac/rfp-auditor") ? "/rbac/rfp-auditor" : "/collaboration";
}
