/**
 * Map Proposal Manager routes → tour page keys (shared by Start Tour button + auto-start).
 */
export function getProposalManagerTourPage(pathname = "") {
  const segments = String(pathname).split("/").filter(Boolean);
  // Product shell: /app/... (legacy: /dashboard, /rbac/proposal-manager)
  if (!segments.includes("app") && !segments.includes("dashboard") && !segments.includes("proposal-manager")) {
    return null;
  }

  const pageOrder = [
    "source-docs",
    "company-intelligence",
    "competitive-intelligence",
    "rfp-collaboration",
    "technical-solutioning",
    "topology",
    "bid-vault",
    "scoring",
    "win-slide",
    "grants",
    "capture-strategy",
    "content-hub",
    "pricing",
    "communication",
    "compliance",
    "meetings-calendar",
    "user-management",
    "workspace",
    "help-support",
    "settings",
    "team",
  ];

  for (const page of pageOrder) {
    if (segments.includes(page)) return page;
  }
  return "dashboard";
}

/** All Proposal Manager pages that should expose Start Tour */
export const PROPOSAL_MANAGER_TOUR_PAGES = [
  "dashboard",
  "company-intelligence",
  "competitive-intelligence",
  "source-docs",
  "team",
  "rfp-collaboration",
  "technical-solutioning",
  "topology",
  "bid-vault",
  "scoring",
  "win-slide",
  "grants",
  "capture-strategy",
  "content-hub",
  "pricing",
  "communication",
  "compliance",
  "meetings-calendar",
  "user-management",
  "workspace",
  "help-support",
  "settings",
];
