/**
 * Curated private-foundation and state/local grant opportunities for JUNO capture desk.
 * Not live APIs — illustrative public-style programs for demo / pipeline planning.
 * Snapshot ~2026-09-27.
 */

export const ALT_GRANTS_SNAPSHOT = "2026-09-27";

/** @typedef {{
 *  id: string,
 *  sourceType: 'private' | 'local',
 *  title: string,
 *  funder: string,
 *  program: string,
 *  geography: string,
 *  focusAreas: string[],
 *  applicantTypes: string[],
 *  status: 'Open' | 'Forecasted' | 'Closed',
 *  postedDate: string,
 *  closeDate: string | null,
 *  awardMin: number | null,
 *  awardMax: number | null,
 *  awardLabel: string | null,
 *  description: string,
 *  eligibility: string,
 *  url: string,
 *  keywords: string[],
 * }} AltGrantOpportunity */

/** @type {AltGrantOpportunity[]} */
export const PRIVATE_FUNDING_GRANTS = [
  {
    id: "priv-ford-equity-tech",
    sourceType: "private",
    title: "Building Equitable Digital Infrastructure",
    funder: "Ford Foundation",
    program: "Future of Work(ers) / Technology & Society",
    geography: "United States (national; priority to underserved regions)",
    focusAreas: ["Digital equity", "Workforce", "Civic tech", "Community broadband"],
    applicantTypes: ["Nonprofits", "Community organizations", "Higher education"],
    status: "Open",
    postedDate: "2026-09-01",
    closeDate: "2026-11-15",
    awardMin: 100000,
    awardMax: 750000,
    awardLabel: "$100K–$750K (12–24 months)",
    description:
      "Supports organizations advancing equitable access to digital tools, skills, and infrastructure so workers and communities can participate in the digital economy. Preference for proposals that pair technology deployment with community governance and measurable workforce outcomes.",
    eligibility:
      "501(c)(3) or equivalent public charities; collaborative proposals with community-based partners encouraged. For-profit entities are not eligible as prime applicants.",
    url: "https://www.fordfoundation.org/",
    keywords: ["foundation", "digital equity", "workforce", "nonprofit", "private"],
  },
  {
    id: "priv-gates-data-health",
    sourceType: "private",
    title: "Data for Health Systems Strengthening",
    funder: "Bill & Melinda Gates Foundation",
    program: "Global Health — Data & Digital",
    geography: "United States + partner countries (see NOFO)",
    focusAreas: ["Health data", "Interoperability", "Analytics", "Public health"],
    applicantTypes: ["Nonprofits", "Universities", "Public agencies (with eligible partner)"],
    status: "Open",
    postedDate: "2026-08-20",
    closeDate: "2026-10-31",
    awardMin: 250000,
    awardMax: 2000000,
    awardLabel: "Up to $2M",
    description:
      "Seeks proposals that improve health-system decision making through trusted data pipelines, standards-based exchange, and responsible analytics. Emphasis on reusable platforms rather than one-off dashboards.",
    eligibility:
      "Registered nonprofit or academic institutions; consortia allowed. Must describe data governance and privacy safeguards.",
    url: "https://www.gatesfoundation.org/",
    keywords: ["Gates", "health", "data", "foundation", "private"],
  },
  {
    id: "priv-rwjf-community",
    sourceType: "private",
    title: "Healthy Communities Technology Challenge",
    funder: "Robert Wood Johnson Foundation",
    program: "Healthy Communities",
    geography: "United States",
    focusAreas: ["Public health", "Social determinants", "Community engagement"],
    applicantTypes: ["Nonprofits", "Local health departments", "Community coalitions"],
    status: "Open",
    postedDate: "2026-09-10",
    closeDate: "2026-12-01",
    awardMin: 50000,
    awardMax: 350000,
    awardLabel: "$50K–$350K",
    description:
      "Funds community-led projects that use technology and data to improve health equity—navigation tools, closed-loop referral systems, or trusted local information networks.",
    eligibility:
      "U.S.-based nonprofits and governmental public health entities. Letter of intent may be required before full proposal.",
    url: "https://www.rwjf.org/",
    keywords: ["RWJF", "health equity", "community", "private", "foundation"],
  },
  {
    id: "priv-macarthur-climate",
    sourceType: "private",
    title: "Climate Solutions & Just Transition Grants",
    funder: "MacArthur Foundation",
    program: "Climate Solutions",
    geography: "United States (selected metro regions)",
    focusAreas: ["Climate", "Clean energy", "Just transition", "Civic capacity"],
    applicantTypes: ["Nonprofits", "Municipal partners", "Research institutes"],
    status: "Forecasted",
    postedDate: "2026-09-05",
    closeDate: "2027-01-20",
    awardMin: 150000,
    awardMax: 1000000,
    awardLabel: "$150K–$1M (forecast)",
    description:
      "Forecast cycle for projects that accelerate equitable climate solutions—grid modernization community benefits, workforce pathways into clean energy, and civic capacity for local climate planning.",
    eligibility:
      "Forecast only — full guidelines expected Q4 2026. Prior MacArthur grantees and new applicants both eligible when cycle opens.",
    url: "https://www.macfound.org/",
    keywords: ["MacArthur", "climate", "energy", "forecast", "private"],
  },
  {
    id: "priv-knight-civic",
    sourceType: "private",
    title: "Knight Prototype Fund — Civic Information",
    funder: "Knight Foundation",
    program: "Prototype Fund",
    geography: "United States",
    focusAreas: ["Civic tech", "Local news", "Public information", "Prototyping"],
    applicantTypes: ["Individuals", "Nonprofits", "Small teams", "Newsrooms"],
    status: "Open",
    postedDate: "2026-09-15",
    closeDate: "2026-10-20",
    awardMin: 15000,
    awardMax: 15000,
    awardLabel: "$15K seed prototypes",
    description:
      "Small, fast grants to prototype tools that help communities access trustworthy local information or participate in civic life. Designed for early experiments, not multi-year platforms.",
    eligibility:
      "U.S.-based individuals and organizations. Prior prototype experience helpful but not required.",
    url: "https://knightfoundation.org/",
    keywords: ["Knight", "civic tech", "prototype", "private", "news"],
  },
  {
    id: "priv-mellon-humanities",
    sourceType: "private",
    title: "Higher Learning — Digital Humanities Infrastructure",
    funder: "Andrew W. Mellon Foundation",
    program: "Higher Learning",
    geography: "United States",
    focusAreas: ["Digital humanities", "Archives", "Higher education", "Open knowledge"],
    applicantTypes: ["Colleges & universities", "Libraries", "Museums"],
    status: "Open",
    postedDate: "2026-08-01",
    closeDate: "2026-11-30",
    awardMin: 200000,
    awardMax: 1500000,
    awardLabel: "$200K–$1.5M",
    description:
      "Supports durable digital infrastructure for humanities scholarship—shared repositories, teaching collections, and community-engaged archival platforms with sustainability plans.",
    eligibility:
      "Accredited U.S. higher-education institutions and affiliated cultural organizations. Multi-institution consortia welcome.",
    url: "https://www.mellon.org/",
    keywords: ["Mellon", "humanities", "education", "archives", "private"],
  },
];

/** @type {AltGrantOpportunity[]} */
export const LOCAL_STATE_GRANTS = [
  {
    id: "local-ca-broadband",
    sourceType: "local",
    title: "Last-Mile Broadband Infrastructure Grants",
    funder: "State of California — California Public Utilities Commission",
    program: "California Advanced Services Fund (CASF)",
    geography: "California (unserved / underserved census blocks)",
    focusAreas: ["Broadband", "Infrastructure", "Rural access", "Digital equity"],
    applicantTypes: ["ISPs", "Local governments", "Tribes", "Nonprofits (with eligible partner)"],
    status: "Open",
    postedDate: "2026-09-01",
    closeDate: "2026-10-28",
    awardMin: 500000,
    awardMax: 5000000,
    awardLabel: "Up to $5M per project (match rules apply)",
    description:
      "State grant program to deploy last-mile broadband to unserved and underserved California communities. Projects must show enforceable deployment timelines, affordability commitments, and community outreach plans.",
    eligibility:
      "Entities authorized to provide broadband in California; tribal governments and local agencies may apply directly or with a provider partner. Cost sharing typically required.",
    url: "https://www.cpuc.ca.gov/",
    keywords: ["California", "broadband", "state", "local", "infrastructure"],
  },
  {
    id: "local-nyc-civic",
    sourceType: "local",
    title: "Civic Innovation Challenge — City Services Modernization",
    funder: "City of New York — Mayor’s Office of Technology & Innovation",
    program: "NYC Civic Innovation Fund",
    geography: "New York City (five boroughs)",
    focusAreas: ["Civic tech", "Service delivery", "Accessibility", "Open data"],
    applicantTypes: ["Nonprofits", "Universities", "Small businesses (NYC-registered)"],
    status: "Open",
    postedDate: "2026-09-12",
    closeDate: "2026-11-05",
    awardMin: 75000,
    awardMax: 400000,
    awardLabel: "$75K–$400K",
    description:
      "City challenge grants for prototypes that improve resident-facing city services—permits, benefits navigation, language access, or neighborhood information—built with NYC open data and accessibility standards.",
    eligibility:
      "Organizations with a New York City presence; must commit to Section 508 / NYC digital standards and a 12-month pilot with a city agency sponsor.",
    url: "https://www.nyc.gov/",
    keywords: ["NYC", "civic", "city", "local", "innovation"],
  },
  {
    id: "local-tx-workforce",
    sourceType: "local",
    title: "Skills Development Fund — Employer Partnership Grants",
    funder: "State of Texas — Texas Workforce Commission",
    program: "Skills Development Fund",
    geography: "Texas (statewide; priority to high-demand occupations)",
    focusAreas: ["Workforce training", "Employer partnerships", "Upskilling"],
    applicantTypes: ["Community colleges", "Technical colleges", "Workforce boards + employers"],
    status: "Open",
    postedDate: "2026-08-15",
    closeDate: "2026-10-15",
    awardMin: 100000,
    awardMax: 2000000,
    awardLabel: "Typically $100K–$2M",
    description:
      "State training grants that pair public colleges with employers to design customized upskilling programs for Texas workers. Emphasizes measurable job placement and wage outcomes.",
    eligibility:
      "Public community/technical colleges as fiscal agents with documented employer partners. Private training vendors may subcontract but not prime in most cases.",
    url: "https://www.twc.texas.gov/",
    keywords: ["Texas", "workforce", "training", "state", "local"],
  },
  {
    id: "local-il-climate",
    sourceType: "local",
    title: "Clean Energy & Community Resilience Grants",
    funder: "State of Illinois — Illinois EPA / IEPA partners",
    program: "Illinois Climate & Equitable Jobs Act (CEJA) community grants",
    geography: "Illinois (environmental justice / Equity Investment Eligible Communities prioritized)",
    focusAreas: ["Clean energy", "Resilience", "Workforce", "Environmental justice"],
    applicantTypes: ["Local governments", "Nonprofits", "Community-based organizations"],
    status: "Open",
    postedDate: "2026-09-08",
    closeDate: "2026-12-15",
    awardMin: 50000,
    awardMax: 1500000,
    awardLabel: "$50K–$1.5M",
    description:
      "Supports community clean-energy projects, resilience hubs, and related workforce pathways in priority Illinois communities under CEJA-aligned funding.",
    eligibility:
      "Illinois-based local governments and nonprofits serving Equity Investment Eligible Communities; partnership letters strongly encouraged.",
    url: "https://epa.illinois.gov/",
    keywords: ["Illinois", "climate", "clean energy", "state", "local", "CEJA"],
  },
  {
    id: "local-ma-muni-cyber",
    sourceType: "local",
    title: "Municipal Cybersecurity Grant Program",
    funder: "Commonwealth of Massachusetts — Executive Office of Technology Services and Security",
    program: "Municipal Cybersecurity",
    geography: "Massachusetts municipalities and regional school districts",
    focusAreas: ["Cybersecurity", "Local government", "Risk reduction", "Training"],
    applicantTypes: ["Cities", "Towns", "Regional entities"],
    status: "Open",
    postedDate: "2026-09-20",
    closeDate: "2026-11-12",
    awardMin: 25000,
    awardMax: 250000,
    awardLabel: "$25K–$250K",
    description:
      "Helps Massachusetts municipalities harden networks, implement MFA/endpoint protections, and train staff. Can fund assessments, tooling, and shared-services models across small towns.",
    eligibility:
      "Massachusetts municipal governments and eligible regional school districts. Prior cybersecurity assessment may be required for larger awards.",
    url: "https://www.mass.gov/",
    keywords: ["Massachusetts", "cyber", "municipal", "state", "local"],
  },
  {
    id: "local-wa-housing-tech",
    sourceType: "local",
    title: "Housing & Homelessness Data Systems Improvement",
    funder: "State of Washington — Department of Commerce",
    program: "Homelessness Assistance / HMIS modernization support",
    geography: "Washington State",
    focusAreas: ["Housing", "HMIS", "Data systems", "Continuums of Care"],
    applicantTypes: ["Local governments", "Continuums of Care", "Nonprofit housing providers"],
    status: "Forecasted",
    postedDate: "2026-09-18",
    closeDate: "2027-01-10",
    awardMin: 75000,
    awardMax: 600000,
    awardLabel: "$75K–$600K (forecast)",
    description:
      "Forecast funding to improve local homelessness data systems, coordinated entry integrations, and reporting quality for Continuums of Care and housing providers.",
    eligibility:
      "Washington Continuums of Care and local government housing leads; forecast guidelines TBD. Full NOFO expected late 2026.",
    url: "https://www.commerce.wa.gov/",
    keywords: ["Washington", "housing", "HMIS", "state", "local", "forecast"],
  },
];

export function filterAltGrants(opps, filters = {}) {
  const kw = String(filters.keyword || "")
    .trim()
    .toLowerCase();
  const geography = String(filters.geography || "")
    .trim()
    .toLowerCase();
  const status = String(filters.status || "").trim();
  const focus = String(filters.focus || "")
    .trim()
    .toLowerCase();

  return (opps || []).filter((o) => {
    if (status && o.status !== status) return false;
    if (geography) {
      const hay = `${o.geography} ${o.funder}`.toLowerCase();
      if (!hay.includes(geography)) return false;
    }
    if (focus) {
      const blob = [...(o.focusAreas || []), ...(o.keywords || [])].join(" ").toLowerCase();
      if (!blob.includes(focus)) return false;
    }
    if (kw) {
      const blob = [
        o.title,
        o.funder,
        o.program,
        o.description,
        o.eligibility,
        o.geography,
        ...(o.focusAreas || []),
        ...(o.keywords || []),
        ...(o.applicantTypes || []),
      ]
        .join(" ")
        .toLowerCase();
      if (!blob.includes(kw)) return false;
    }
    return true;
  });
}
