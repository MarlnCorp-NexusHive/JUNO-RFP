/** Hub ids for Guided navigation (Find / Respond / Manage / Account). */
export const PROPOSAL_MANAGER_HUBS = [
  {
    id: "find",
    titleKey: "proposalManagerNav.hubs.find.title",
    subtitleKey: "proposalManagerNav.hubs.find.subtitle",
    longTitleKey: "proposalManagerNav.hubs.find.longTitle",
  },
  {
    id: "respond",
    titleKey: "proposalManagerNav.hubs.respond.title",
    subtitleKey: "proposalManagerNav.hubs.respond.subtitle",
    longTitleKey: "proposalManagerNav.hubs.respond.longTitle",
  },
  {
    id: "manage",
    titleKey: "proposalManagerNav.hubs.manage.title",
    subtitleKey: "proposalManagerNav.hubs.manage.subtitle",
    longTitleKey: "proposalManagerNav.hubs.manage.longTitle",
  },
  {
    id: "account",
    titleKey: "proposalManagerNav.hubs.account.title",
    subtitleKey: "proposalManagerNav.hubs.account.subtitle",
    longTitleKey: "proposalManagerNav.hubs.account.longTitle",
  },
];

export const HUB_HOME_FEATURE = {
  label: "proposalManagerNav.home",
  icon: "🏠",
  route: "/app/home",
  description: "Four main work areas",
  hub: null,
  matchPrefix: false,
};

export const proposalManagerFeatures = [
  { label: "director.dashboard", icon: "📊", route: "/app/dashboard", description: "Performance Overview, KPI Summary, Alerts & Notices", hub: "manage" },
  { label: "proposalManager.grants", icon: "🏛️", route: "/app/grants", description: "Federal Grants.gov (live) + private foundations (live IRS/ProPublica) + state/local-eligible Grants.gov + SAM.gov contracts (curated)", hub: "find" },
  { label: "proposalManager.awardManagement", icon: "📈", route: "/app/award-management", description: "Post-award Grant Pulse portfolio — spend, deliverables, deadlines, and priority actions", hub: "manage" },
  { label: "director.workspace", icon: "📁", route: "/app/workspace", description: "Workspace and tasks", hub: "respond" },
  { label: "proposalManager.companyIntelligence", icon: "🌐", route: "/app/company-intelligence", description: "RFP issuer financials, trends, and customers from public sources", hub: "find" },
  { label: "proposalManager.competitiveIntelligence", icon: "🎯", route: "/app/competitive-intelligence", description: "Look up any competitor or compare curated peers — datasheets and differentiators", hub: "find" },
  { label: "proposalManager.sourceDocs", icon: "📄", route: "/app/source-docs", description: "Source documents and reference materials", hub: "respond" },
  { label: "proposalManager.manageTeam", icon: "👥", route: "/app/team", description: "Team Management and Collaboration", hub: "manage" },
  { label: "proposalManager.rfpCollaboration", icon: "🤝", route: "/app/rfp-collaboration", description: "Assign RFP questions to team members, AI drafts, review, activity log", hub: "respond", matchPrefix: true },
  { label: "proposalManager.technicalSolutioning", icon: "🏗️", route: "/app/technical-solutioning", description: "AI solution architecture from reference designs and RFP requirements", hub: "respond" },
  { label: "proposalManager.topology", icon: "🧭", route: "/app/topology", description: "Customer infrastructure topography with JUNO overlay and RFP legends", hub: "respond" },
  { label: "proposalManager.bidVault", icon: "📦", route: "/app/bid-vault", description: "Bid repository and submissions", hub: "respond" },
  { label: "proposalManager.scoring", icon: "🏅", route: "/app/scoring", description: "Win/loss scoring, debrief ingest, and product capability gaps", hub: "manage" },
  { label: "proposalManager.winSlide", icon: "🖼️", route: "/app/win-slide", description: "Post-selection win slide: POV, proof, and who we won or lost against", hub: "manage" },
  { label: "proposalManager.captureStrategy", icon: "🗺️", route: "/app/capture-strategy", description: "Capture strategy and planning", hub: "find" },
  { label: "proposalManager.contentHub", icon: "📝", route: "/app/content-hub", description: "Content library and assets", hub: "respond" },
  { label: "proposalManager.pricing", icon: "💰", route: "/app/pricing", description: "Pricing and cost proposals", hub: "respond" },
  { label: "proposalManager.communication", icon: "💬", route: "/app/communication", description: "Internal Communication Hub", hub: "manage" },
  { label: "proposalManager.compliance", icon: "🕵️", route: "/app/compliance", description: "Audit, Compliance, Legal Docs", hub: "manage" },
  { label: "proposalManager.meetingsCalendar", icon: "🗓️", route: "/app/meetings-calendar", description: "Scheduler, Minutes, Events", hub: "manage" },
  { label: "director.userManagement", icon: "👤", route: "/app/user-management", description: "Roles, Permissions, Admin Controls", hub: "account" },
  { label: "director.helpSupport", icon: "🆘", route: "/app/help-support", description: "Technical Support, Handbook", hub: "account" },
  { label: "director.settings", icon: "⚙️", route: "/app/settings", description: "Profile, Branding, Notifications", hub: "account" },
];

export function getHubById(hubId) {
  return PROPOSAL_MANAGER_HUBS.find((h) => h.id === hubId) || null;
}

export function featuresForHub(hubId, features = proposalManagerFeatures) {
  return features.filter((f) => f.hub === hubId);
}

/** Resolve which hub owns the current path (null on /app/home root). */
export function hubForRoute(pathname, features = proposalManagerFeatures) {
  const path = String(pathname || "");
  if (path === "/app/home" || path === "/app/home/") return null;
  const hubMatch = path.match(/^\/app\/home\/([^/]+)/);
  if (hubMatch) return hubMatch[1];

  let best = null;
  let bestLen = -1;
  for (const f of features) {
    const route = String(f.route || "");
    if (!route) continue;
    const hit = f.matchPrefix
      ? path === route || path.startsWith(`${route}/`)
      : path === route;
    if (hit && route.length > bestLen) {
      best = f.hub;
      bestLen = route.length;
    }
  }
  return best;
}
