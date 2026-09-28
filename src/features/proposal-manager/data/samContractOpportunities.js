/**
 * Curated SAM.gov Contract Opportunities — public notice fields only.
 * Snapshot extracted from sam.gov opportunity pages (no API key / no live API calls).
 * Sourced ~2026-09-28 for JUNO demo / trial capture desk.
 *
 * Each record keeps the Notice ID and sam.gov URL so users can verify on the source.
 */

export const SAM_DATA_SNAPSHOT = "2026-09-28";
export const SAM_SOURCE_LABEL = "SAM.gov (curated excerpt)";
export const SAM_REFRESH_INTERVAL_MS = 60 * 60 * 1000;

export const SAM_QUICK_AGENCIES = ["DHS", "DOD", "IRS", "USMC", "ARMY", "NAVY"];

export const SAM_NOTICE_TYPES = [
  "Presolicitation",
  "Solicitation",
  "Sources Sought",
  "Special Notice",
  "Combined Synopsis/Solicitation",
  "Award Notice",
];

export const SAM_SET_ASIDES = [
  "None",
  "Women-Owned Small Business (WOSB)",
  "Total Small Business",
  "8(a)",
  "HUBZone",
  "Service-Disabled Veteran-Owned Small Business (SDVOSB)",
];

/** @typedef {{
 *  id: string,
 *  noticeId: string,
 *  title: string,
 *  noticeType: string,
 *  status: 'Active' | 'Inactive',
 *  department: string,
 *  subtier: string,
 *  office: string,
 *  agencyCode: string,
 *  naics: string,
 *  naicsTitle: string,
 *  psc: string,
 *  pscTitle: string,
 *  setAside: string,
 *  placeOfPerformance: string,
 *  postedDate: string,
 *  responseDeadline: string | null,
 *  inactiveDate: string | null,
 *  awardCeiling: number | null,
 *  awardFloor: number | null,
 *  awardCeilingLabel: string | null,
 *  periodOfPerformance: string | null,
 *  description: string,
 *  keywords: string[],
 *  contacts: { name: string, email?: string, phone?: string, role?: string }[],
 *  attachments: { name: string, updated?: string }[],
 *  samUrl: string,
 *  notes?: string,
 * }} SamOpportunity */

/** @type {SamOpportunity[]} */
export const SAM_CONTRACT_OPPORTUNITIES = [
  {
    id: "sam-edcom-it",
    noticeId: "M00264-26-R-0015",
    title: "EDCOM ITSS — USMC Education Command IT Support Services",
    noticeType: "Presolicitation",
    status: "Active",
    department: "DEPT OF DEFENSE",
    subtier: "DEPT OF THE NAVY",
    office: "MCINCR-RCO — United States Marine Corps Education Command (EDCOM)",
    agencyCode: "USMC",
    naics: "541512",
    naicsTitle: "Computer Systems Design Services",
    psc: "DA01",
    pscTitle: "IT and Telecom — Business Application / Application Development Support Services (Labor)",
    setAside: "Women-Owned Small Business (WOSB)",
    placeOfPerformance: "Marine Corps Base Quantico, VA",
    postedDate: "2026-09-17",
    responseDeadline: null,
    inactiveDate: "2027-09-17",
    awardCeiling: 45000000,
    awardFloor: null,
    awardCeilingLabel: "$45M ceiling (5-year IDIQ)",
    periodOfPerformance: "Five-year ordering period (FFP CLINs + CR travel)",
    description:
      "Information Technology Support Services (ITSS) for USMC Education Command (EDCOM). Single-award IDIQ with Firm Fixed-Price CLINs for services and Cost Reimbursement for travel. 100% Women-Owned Small Business set-aside under NAICS 541512. Commercial contracting under FAR Part 12 and FAR 15; best-value trade-off; all-or-none award. Formal solicitation M00264-26-R-0015 expected via the PIEE Solicitation Module on or about 30 September 2026. Related to prior RFI M00264-26-RFI-0028 (network/system support, cybersecurity, helpdesk, AV/VTC). Offerors must be SAM-registered with current reps/certs and a CAGE code.",
    keywords: [
      "IT support",
      "EDCOM",
      "ITSS",
      "Marine Corps",
      "IDIQ",
      "WOSB",
      "education command",
      "PIEE",
      "Quantico",
    ],
    contacts: [
      { name: "Genia Fouts", email: "genia.fouts@usmc.mil", role: "Contract Specialist" },
      { name: "Jeffrey A. Sisk Sr.", email: "jeffrey.a.sisk@usmc.mil", role: "Team Lead" },
      { name: "Christian Hernandez", email: "christian.hernandezsoto@usmc.mil", role: "Contracting Officer" },
    ],
    attachments: [],
    samUrl: "https://sam.gov/opp/7c474918c191423f99e32039c4b7e006/view",
    notes:
      "Presolicitation still Active (as of 28 Sep 2026). Watch PIEE for formal RFP on/about 30 Sep 2026. Opportunity inactive date ~17 Sep 2027.",
  },
  {
    id: "sam-irs-data-pipeline",
    noticeId: "5000233302",
    title: "IRS Enterprise Data Pipeline Modernization and Data Consumption Services",
    noticeType: "Sources Sought",
    status: "Inactive",
    department: "DEPARTMENT OF THE TREASURY",
    subtier: "INTERNAL REVENUE SERVICE (IRS)",
    office: "IRS — IT Strategy and Modernization",
    agencyCode: "IRS",
    naics: "541512",
    naicsTitle: "Computer Systems Design Services",
    psc: "DA01",
    pscTitle: "IT and Telecom — Business Application / Application Development Support Services (Labor)",
    setAside: "None",
    placeOfPerformance:
      "Contractor facility; possible IRS sites (Lanham MD; Memphis TN; Austin/Dallas TX; Ogden UT)",
    postedDate: "2026-09-15",
    responseDeadline: "2026-09-25",
    inactiveDate: "2026-09-26",
    awardCeiling: 20000000,
    awardFloor: 15000000,
    awardCeilingLabel: "$15M–$20M (market research estimate)",
    periodOfPerformance: "1-year base + two 12-month options",
    description:
      "IRS Sources Sought (Notice 5000233302) for market research on Enterprise Data Pipeline Modernization and Data Consumption Services supporting Individual Master File (IMF) modernization and related taxpayer-account processing. Contemplated scope: enterprise data pipeline modernization; data engineering and integration (including Databricks / AWS alongside legacy mainframe sources); data product development and BI; metadata, governance, security, and data quality; self-service analytics and natural-language query; AI-assisted legacy modernization; DevSecOps and automation; testing and readiness; O&M; and transition / knowledge-transfer. Capability statements were due Friday, September 25, 2026, 2:00 PM ET. Planning only — not a solicitation; no award from this notice.",
    keywords: [
      "data pipeline",
      "IRS",
      "IMF",
      "Databricks",
      "modernization",
      "analytics",
      "DevSecOps",
      "AI",
      "data engineering",
      "sources sought",
    ],
    contacts: [
      { name: "Jared Alexis", email: "jared.j.alexis@irs.gov", role: "Contract Specialist" },
      { name: "Ebenezer Owusu", email: "ebenezer.k.owusu@irs.gov", role: "POC" },
    ],
    attachments: [{ name: "Attachment 1 — Draft Performance Work Statement (PWS)", updated: "2026-09" }],
    samUrl: "https://sam.gov/opp/6d4373433c504f7994f117458c9e3f9e/view",
    notes: "Inactive — response window closed 25 Sep 2026. Retained for capture history / follow-on watch.",
  },
  {
    id: "sam-aie-its-cso",
    noticeId: "W50NH9-26-S-0001",
    title: "Army Intelligence Enterprise IT Services (AIE-ITS) — Commercial Solutions Opening",
    noticeType: "Solicitation",
    status: "Active",
    department: "DEPT OF DEFENSE",
    subtier: "DEPT OF THE ARMY",
    office: "Army Contracting Command — Detroit Arsenal (ACC-DTA)",
    agencyCode: "ARMY",
    naics: "541512",
    naicsTitle: "Computer Systems Design Services",
    psc: "DA01",
    pscTitle: "IT and Telecom — Business Application / Application Development Support Services (Labor)",
    setAside: "None",
    placeOfPerformance: "CONUS and OCONUS (Army Intelligence enterprise; Fort Belvoir VA footprint)",
    postedDate: "2026-09-10",
    responseDeadline: "2027-09-11",
    inactiveDate: "2027-09-26",
    awardCeiling: null,
    awardFloor: null,
    awardCeilingLabel: null,
    periodOfPerformance: "Standing CSO — SAM offers-due date 11 Sep 2027 (program text cites open through 2036)",
    description:
      "Commercial Solutions Opening (CSO) for Army Intelligence Enterprise Information Technology Services (AIE-ITS). Objective: enhance, secure, sustain, and modernize the global IT environment supporting Army Intelligence operations at Project, Activity, or Enterprise scale. Dual-track: Track 1 continuous solution briefs against open Areas of Interest; Track 2 timed Calls for Innovative Solutions. Multi-phase: Phase 1 written solution brief; Phase 2 presentation/pitch (if applicable); Phase 3 commercial solution proposal. Awards may be FAR Part 12 fixed-price or non-FAR agreements. Mandatory eligibility commonly includes a valid Top Secret facility clearance and TS/SCI-eligible U.S. personnel. Submissions via PIEE Solicitation Module.",
    keywords: [
      "Army Intelligence",
      "CSO",
      "IT services",
      "modernization",
      "cyber",
      "OCONUS",
      "commercial solutions",
      "Top Secret",
      "PIEE",
    ],
    contacts: [],
    attachments: [],
    samUrl: "https://sam.gov/opp/907ad2ce08a243079f41847b51acebe0/view",
    notes:
      "Active as of 28 Sep 2026. SAM lists offers due 11 Sep 2027 / inactive ~26 Sep 2027. Verify live AOIs and security gates on SAM/PIEE before submitting.",
  },
  {
    id: "sam-seco-it",
    noticeId: "N4571A-26-R-0016",
    title: "SECO IT — Military Spouse Digital Services Unification",
    noticeType: "Solicitation",
    status: "Active",
    department: "DEPT OF DEFENSE",
    subtier: "NAVSUP / DEPT OF THE NAVY",
    office: "Commander Navy Installations Command (CNIC) — DET Millington",
    agencyCode: "NAVY",
    naics: "541990",
    naicsTitle: "All Other Professional, Scientific, and Technical Services",
    psc: "DA01",
    pscTitle: "IT and Telecom — Business Application / Application Development Support Services (Labor)",
    setAside: "None",
    placeOfPerformance: "Millington, TN 38055 (remote work permitted; occasional onsite)",
    postedDate: "2026-09-18",
    responseDeadline: "2026-10-05",
    inactiveDate: "2026-10-06",
    awardCeiling: null,
    awardFloor: null,
    awardCeilingLabel: null,
    periodOfPerformance: "See solicitation package (Amendment 0005)",
    description:
      "Navy/CNIC solicitation to unify and modernize military-spouse employment-support applications (SECO, MySECO, MSEP, MyCAA, SECO Administration Portal, VEMIS, PECS) into an integrated responsive web platform. Scope: application development and maintenance, migration/integration, PMO, data management and analytics, UX, accessibility (Section 508), O&M, help desk, cybersecurity compliance, automated security testing, RMF/ATO support, 24/7 availability in Government-furnished AWS GovCloud IL4. Best-value tradeoff. Latest package includes Amendment 0005 (18 Sep 2026). Proposals due 5 October 2026, 10:00 AM CDT.",
    keywords: [
      "SECO",
      "Navy",
      "military spouse",
      "web platform",
      "GovCloud",
      "Section 508",
      "RMF",
      "analytics",
      "help desk",
    ],
    contacts: [
      {
        name: "Jasmyn Payne",
        email: "jasmyn.m.payne.naf@us.navy.mil",
        phone: "901-874-6931",
        role: "Primary POC",
      },
      {
        name: "Steven Kaste",
        email: "steven.d.kaste.naf@us.navy.mil",
        phone: "901-305-3378",
        role: "Contracting POC",
      },
    ],
    attachments: [
      { name: "N4571A-26-R-0016.pdf", updated: "2026-07-29" },
      { name: "N4571A-26-R-0016 0001.pdf", updated: "2026-07-31" },
      { name: "N4571A-26-R-0016 0002.pdf", updated: "2026-08-25" },
      { name: "Clarifying Questions.docx", updated: "2026-08-28" },
      { name: "N4571A-26-R-0016 0003.pdf", updated: "2026-09-11" },
      { name: "N4571A-26-R-0016 0004.pdf", updated: "2026-09-16" },
      { name: "SECO DD 254 ENCL 3.pdf", updated: "2026-09-16" },
      { name: "N4571A-26-R-0016 0005.pdf", updated: "2026-09-18" },
    ],
    samUrl: "https://sam.gov/opp/33c64e266b8e457fb6512f991779da5a/view",
    notes:
      "Active as of 28 Sep 2026 — proposals due 5 Oct 2026 10:00 AM CDT (Amendment 0005). Archive/inactive ~6 Oct 2026.",
  },
  {
    id: "sam-dhs-nccs",
    noticeId: "70RTAC26R00000007",
    title: "DHS NCCS 2.0 — Network, Cloud, and Cybersecurity Services",
    noticeType: "Combined Synopsis/Solicitation",
    status: "Active",
    department: "HOMELAND SECURITY, DEPARTMENT OF",
    subtier: "Office of Procurement Operations (OPO)",
    office: "DHS Office of the Chief Information Officer (NOSC)",
    agencyCode: "DHS",
    naics: "541519",
    naicsTitle: "Other Computer Related Services",
    psc: "DF01",
    pscTitle: "IT and Telecom — IT Management Support Services (Labor)",
    setAside: "None",
    placeOfPerformance: "United States (DHS department-wide; NCR / MS / AZ NOSC footprint)",
    postedDate: "2026-09-17",
    responseDeadline: "2026-10-06",
    inactiveDate: "2026-12-15",
    awardCeiling: 625996046,
    awardFloor: 10000,
    awardCeilingLabel: "~$626M single-award department-wide IDIQ ($10K minimum)",
    periodOfPerformance: "Five-year ordering period (department-wide IDIQ)",
    description:
      "DHS Network, Cloud, and Cybersecurity Services (NCCS) 2.0 — department-wide single-award IDIQ consolidating NOSC network, cloud, and cyber operations. Final draft solicitation posted 17 Sep 2026 for industry review. Scope includes Tier 1/2 network, cloud, and cyber operations: NOC/SOC, threat hunting, incident response, vulnerability management, penetration testing, cyber forensics, log management, email security, and cloud/platform tenant support. Timeline (as published): industry questions on draft due 22 Sep 2026 (closed); final solicitation ~1 Oct 2026; Phase 1 proposals 6 Oct 2026 (pass/fail — reporting indicates Top Secret facility clearance gate); Phase 2 notification ~9 Oct; Phase 2 proposals 21 Oct; anticipated award late Nov 2026 ahead of bridge-order expiry ~8 Dec 2026. Cumulative task-order ceiling reported ~$625,996,046.",
    keywords: [
      "DHS",
      "cybersecurity",
      "cloud",
      "network",
      "NCCS",
      "NOSC",
      "SOC",
      "NOC",
      "IDIQ",
      "threat hunting",
      "facility clearance",
    ],
    contacts: [
      { name: "Nicole Belanger", email: "Nicole.Belanger@hq.dhs.gov", role: "POC" },
      { name: "Michael Lipperini", email: "Michael.Lipperini@hq.dhs.gov", role: "POC" },
    ],
    attachments: [
      { name: "DRAFT Attachment 1 NCCS SOW.pdf", updated: "2026-09-17" },
      { name: "DRAFT NCCS RFP_9-16-2026.docx", updated: "2026-09-17" },
      { name: "DRAFT Attachment 2 NCCS Pricing Template.xlsx", updated: "2026-09-17" },
      { name: "Draft Attachment 3 NCCS Labor Category Descriptions.xlsx", updated: "2026-09-17" },
      { name: "DRAFT Attachment 4 NCCS Reading Room Instructions.docx", updated: "2026-09-17" },
      { name: "Draft NCCS RFP Questions from Vendors.xlsx", updated: "2026-09-17" },
    ],
    samUrl: "https://sam.gov/opp/01d7d3901484484f9235e48c04327d0f/view",
    notes:
      "As of 28 Sep 2026: draft Q&A window closed (22 Sep). Watch final RFP ~1 Oct 2026; Phase 1 due ~6 Oct 2026. Verify live SAM.gov notice before bidding.",
  },
  {
    id: "sam-dhs-cumulus",
    noticeId: "70RTAC26R00000004",
    title: "DHS Cumulus — Department-Wide Cloud (XaaS) IDIQ",
    noticeType: "Solicitation",
    status: "Inactive",
    department: "HOMELAND SECURITY, DEPARTMENT OF",
    subtier: "Office of Procurement Operations",
    office: "DHS — Department-Wide Cloud (Cumulus) / Info Tech Acq Center",
    agencyCode: "DHS",
    naics: "518210",
    naicsTitle: "Computing Infrastructure Providers, Data Processing, Web Hosting, and Related Services",
    psc: "DH10",
    pscTitle: "IT and Telecom — Platform as a Service: Database, Mainframe, Middleware",
    setAside: "None",
    placeOfPerformance: "United States (DHS department-wide)",
    postedDate: "2026-09-10",
    responseDeadline: "2026-09-14",
    inactiveDate: "2026-09-29",
    awardCeiling: null,
    awardFloor: null,
    awardCeilingLabel: "Related awards: AWS ~$2.56B; Google Public Sector ~$876M (see notes)",
    periodOfPerformance: "Multiple-award / CSP IDIQ ordering — see award notices",
    description:
      "DHS Cumulus vehicle for commercial cloud solutions department-wide. Scope: commercially available Anything as a Service (XaaS) covering IaaS, PaaS, SaaS, professional services, marketplace solutions, and training — provided by Cloud Service Providers (CSPs). Solicitation 70RTAC26R00000004 proposal window closed mid-Sep 2026. Related award notices on SAM.gov include 70RTAC26D00000004 to Amazon Web Services, Inc. (~$2.565B, awarded ~11 Jun 2026) and 70RTAC26D00000007 to Google Public Sector LLC (~$875.6M, awarded ~14 Sep 2026). Retained for capture history and subcontract / task-order watch — verify live SAM award and ordering vehicles before pursuit.",
    keywords: [
      "Cumulus",
      "DHS",
      "cloud",
      "XaaS",
      "IaaS",
      "PaaS",
      "SaaS",
      "CSP",
      "IDIQ",
      "AWS",
      "Google",
    ],
    contacts: [
      { name: "Gregory Blaszko", email: "gregory.blaszko@hq.dhs.gov", role: "Contracting Officer" },
    ],
    attachments: [{ name: "Solicitation Amendment 0002", updated: "2026-09-10" }],
    samUrl: "https://sam.gov/opp/3e6ef0d1090448dd97081f7c868447ff/view",
    notes:
      "Solicitation inactive as of late Sep 2026. Related awards: AWS 70RTAC26D00000004 (~$2.56B); Google 70RTAC26D00000007 (~$876M, 14 Sep 2026). Re-check SAM before any Cumulus pursuit.",
  },
  {
    id: "sam-af-soar-rfi",
    noticeId: "AFLCMC-HNCD-SOAR-RFI-2026",
    title: "Next-Generation Security Orchestration, Automation, and Response (SOAR) — RFI",
    noticeType: "Sources Sought",
    status: "Active",
    department: "DEPT OF DEFENSE",
    subtier: "DEPT OF THE AIR FORCE",
    office: "AFLCMC Defensive Cyber Systems Branch (HNCD) — JBSA Lackland, TX",
    agencyCode: "DOD",
    naics: "541519",
    naicsTitle: "Other Computer Related Services",
    psc: "DF01",
    pscTitle: "IT and Telecom — IT Management Support Services (Labor)",
    setAside: "None",
    placeOfPerformance: "Joint Base San Antonio–Lackland, TX (enterprise / garrison / tactical edge)",
    postedDate: "2026-09-12",
    responseDeadline: null,
    inactiveDate: null,
    awardCeiling: null,
    awardFloor: null,
    awardCeilingLabel: null,
    periodOfPerformance: "Market research — no PoP yet",
    description:
      "RFI for market research under FAR Part 10 (RFO Part 10) to identify commercial sources for a next-generation, vendor-agnostic SOAR software solution for AFLCMC Defensive Cyber Systems Branch. Seeking platforms that meet or exceed enterprise orchestration capabilities (e.g. Cortex XSOAR class), avoid vendor ecosystem lock-in, support modular open architectures, and deploy across enterprise cloud, garrison, and tactical edge on COTS baselines (V+ architecture). Information/planning only — not a solicitation; no obligation to procure.",
    keywords: [
      "SOAR",
      "cyber",
      "Air Force",
      "AFLCMC",
      "orchestration",
      "automation",
      "vendor-agnostic",
      "RFI",
    ],
    contacts: [],
    attachments: [],
    samUrl: "https://sam.gov/opp/cbf53e623da947f3acd7220fdf448791/view",
    notes: "RFI only (as of 28 Sep 2026) — responses are not offers. Confirm live SAM status before responding.",
  },
];

/** Deterministic PRNG for hourly reshuffles (no network). */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getSamHourBucket(now = Date.now()) {
  return Math.floor(now / SAM_REFRESH_INTERVAL_MS);
}

/**
 * Client-only hourly refresh of the curated SAM list (shuffle + refresh timestamps).
 * No SAM.gov API — same underlying notices, new order each UTC hour.
 */
export function buildHourlySamView(now = Date.now()) {
  const bucket = getSamHourBucket(now);
  const rng = mulberry32(bucket ^ 0x5a30000);
  const list = SAM_CONTRACT_OPPORTUNITIES.map((o) => ({ ...o }));
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = list[i];
    list[i] = list[j];
    list[j] = tmp;
  }
  const refreshedAt = new Date(bucket * SAM_REFRESH_INTERVAL_MS);
  const nextRefreshAt = new Date((bucket + 1) * SAM_REFRESH_INTERVAL_MS);
  return {
    opportunities: list,
    bucket,
    refreshedAt,
    nextRefreshAt,
    refreshedLabel: refreshedAt.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

/**
 * Client-side filter for curated SAM opportunities.
 * Combines keyword + NAICS + PSC + agency + set-aside + notice type (all AND).
 */
export function filterSamOpportunities(opps, filters = {}) {
  const kw = String(filters.keyword || "")
    .trim()
    .toLowerCase();
  const naics = String(filters.naics || "")
    .trim()
    .replace(/\D/g, "");
  const psc = String(filters.psc || "")
    .trim()
    .toUpperCase();
  const agency = String(filters.agency || "")
    .trim()
    .toUpperCase();
  const setAside = String(filters.setAside || "").trim();
  const noticeType = String(filters.noticeType || "").trim();

  return (opps || []).filter((o) => {
    if (noticeType && o.noticeType !== noticeType) return false;
    if (setAside && setAside !== "Any") {
      if (setAside === "None") {
        if (o.setAside && o.setAside !== "None") return false;
      } else if (o.setAside !== setAside) return false;
    }
    if (agency) {
      const hay = `${o.agencyCode} ${o.department} ${o.subtier} ${o.office}`.toUpperCase();
      if (!hay.includes(agency)) return false;
    }
    if (naics && !String(o.naics || "").includes(naics)) return false;
    if (psc && !String(o.psc || "").toUpperCase().includes(psc)) return false;
    if (kw) {
      const blob = [
        o.title,
        o.noticeId,
        o.description,
        o.naics,
        o.naicsTitle,
        o.psc,
        o.pscTitle,
        o.setAside,
        o.department,
        o.office,
        ...(o.keywords || []),
      ]
        .join(" ")
        .toLowerCase();
      if (!blob.includes(kw)) return false;
    }
    return true;
  });
}
