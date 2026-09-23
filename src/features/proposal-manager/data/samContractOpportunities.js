/**
 * Curated SAM.gov Contract Opportunities — public notice fields only.
 * Snapshot extracted from sam.gov opportunity pages (no API key / no live API calls).
 * Sourced ~2026-09-24 for JUNO demo capture desk.
 *
 * Each record keeps the Notice ID and sam.gov URL so users can verify on the source.
 */

export const SAM_DATA_SNAPSHOT = "2026-09-24";
export const SAM_SOURCE_LABEL = "SAM.gov (curated excerpt)";

export const SAM_QUICK_AGENCIES = ["DHS", "DOD", "IRS", "USMC", "ARMY", "NAVY"];

export const SAM_NOTICE_TYPES = [
  "Presolicitation",
  "Solicitation",
  "Sources Sought",
  "Special Notice",
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
    title: "EDCOM IT Support Services (USMC Education Command)",
    noticeType: "Presolicitation",
    status: "Active",
    department: "DEPT OF DEFENSE",
    subtier: "DEPT OF THE NAVY",
    office: "United States Marine Corps — Education Command (EDCOM)",
    agencyCode: "USMC",
    naics: "541512",
    naicsTitle: "Computer Systems Design Services",
    psc: "DA01",
    pscTitle: "IT and Telecom — Business Application / Application Development Support Services (Labor)",
    setAside: "Women-Owned Small Business (WOSB)",
    placeOfPerformance: "United States (EDCOM)",
    postedDate: "2026-09-01",
    responseDeadline: "2026-09-30",
    inactiveDate: null,
    awardCeiling: 45000000,
    awardFloor: null,
    awardCeilingLabel: "$45M ceiling (5-year IDIQ)",
    periodOfPerformance: "Five-year ordering period (FFP CLINs + CR travel)",
    description:
      "Technology Support Services for USMC Education Command (EDCOM). The Government intends to issue a single-award IDIQ with Firm Fixed-Price CLINs for services and Cost Reimbursement for travel. 100% Women-Owned Small Business set-aside. Solicitation M00264-26-R-0015 planned via PIEE Solicitation Module on or about 30 September 2026. Commercial contracting under FAR Part 12 and FAR 15; best-value trade-off; all-or-none award. Related to prior RFI M00264-26-RFI-0028. Offerors must be SAM-registered with current reps/certs and a CAGE code.",
    keywords: [
      "IT support",
      "EDCOM",
      "Marine Corps",
      "IDIQ",
      "WOSB",
      "education command",
      "PIEE",
    ],
    contacts: [
      { name: "Genia Fouts", email: "genia.fouts@usmc.mil", role: "Contract Specialist" },
      { name: "Jeffrey A. Sisk Sr.", email: "jeffrey.a.sisk@usmc.mil", role: "Team Lead" },
      { name: "Christian Hernandez", email: "christian.hernandezsoto@usmc.mil", role: "Contracting Officer" },
    ],
    attachments: [],
    samUrl: "https://sam.gov/opp/7c474918c191423f99e32039c4b7e006/view",
    notes: "Presolicitation — full RFP expected ~30 Sep 2026 on PIEE.",
  },
  {
    id: "sam-irs-data-pipeline",
    noticeId: "IRS-EDP-SS-2026",
    title: "IRS Enterprise Data Pipeline Modernization (Sources Sought)",
    noticeType: "Sources Sought",
    status: "Active",
    department: "DEPARTMENT OF THE TREASURY",
    subtier: "INTERNAL REVENUE SERVICE (IRS)",
    office: "IRS — Enterprise Data / IT",
    agencyCode: "IRS",
    naics: "541512",
    naicsTitle: "Computer Systems Design Services",
    psc: "DA01",
    pscTitle: "IT and Telecom — Business Application / Application Development Support Services (Labor)",
    setAside: "None",
    placeOfPerformance: "United States (IRS enterprise)",
    postedDate: "2026-09-10",
    responseDeadline: "2026-09-25",
    inactiveDate: null,
    awardCeiling: 20000000,
    awardFloor: 15000000,
    awardCeilingLabel: "$15M–$20M (market research estimate)",
    periodOfPerformance: "1-year base + two 12-month options",
    description:
      "IRS Sources Sought for market research on Enterprise Data Pipeline Modernization and related services. Scope includes enterprise data pipeline modernization; data engineering and integration; data product development and BI; metadata, governance, security, and data quality; self-service analytics and natural-language query; AI-assisted legacy modernization; DevSecOps and automation; testing and readiness; O&M; and transition / knowledge-transfer. Responses due Friday, September 25, 2026, 2:00 PM ET. This notice is for planning only — not a solicitation.",
    keywords: [
      "data pipeline",
      "IRS",
      "modernization",
      "analytics",
      "DevSecOps",
      "AI",
      "data engineering",
      "sources sought",
    ],
    contacts: [
      { name: "Jared Alexis", email: "jared.j.alexis@irs.gov", role: "POC" },
      { name: "Ebenezer Owusu", email: "ebenezer.k.owusu@irs.gov", role: "POC" },
    ],
    attachments: [{ name: "Draft Performance Work Statement (PWS)", updated: "2026-09" }],
    samUrl: "https://sam.gov/opp/6d4373433c504f7994f117458c9e3f9e/view",
    notes: "Market research only — no award from this notice.",
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
    placeOfPerformance: "CONUS and OCONUS (Army Intelligence enterprise)",
    postedDate: "2026-09-10",
    responseDeadline: "2036-09-11",
    inactiveDate: null,
    awardCeiling: null,
    awardFloor: null,
    awardCeilingLabel: null,
    periodOfPerformance: "Open CSO through 11 Sep 2036",
    description:
      "Commercial Solutions Opening (CSO) for Army Intelligence Enterprise Information Technology Services (AIE-ITS). Objective: enhance, secure, sustain, and modernize the global IT environment supporting Army Intelligence operations at Project, Activity, or Enterprise scale. Seeks outcome-oriented commercial solutions from innovators, small businesses, and nontraditional defense contractors. Multi-phase: Phase 1 written solution brief; Phase 2 presentation/pitch (if applicable); Phase 3 commercial solution proposal. Awards may be FAR Part 12 fixed-price or non-FAR agreements. Remains open until September 11, 2036.",
    keywords: [
      "Army Intelligence",
      "CSO",
      "IT services",
      "modernization",
      "cyber",
      "OCONUS",
      "commercial solutions",
    ],
    contacts: [],
    attachments: [],
    samUrl: "https://sam.gov/opp/907ad2ce08a243079f41847b51acebe0/view",
    notes: "Continuously open CSO — submissions accepted through 2036.",
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
    naics: "541512",
    naicsTitle: "Computer Systems Design Services",
    psc: "1130",
    pscTitle: "Conversion Kits, Nuclear Ordnance (as listed on notice)",
    setAside: "None",
    placeOfPerformance: "Millington, TN 38055 (remote work permitted; occasional onsite)",
    postedDate: "2026-09-18",
    responseDeadline: "2026-10-05",
    inactiveDate: "2026-10-06",
    awardCeiling: null,
    awardFloor: null,
    awardCeilingLabel: null,
    periodOfPerformance: "See solicitation package",
    description:
      "Navy/CNIC solicitation to unify and modernize military-spouse employment-support applications (SECO, MySECO, MSEP, MyCAA, SECO Administration Portal, VEMIS, PECS) into an integrated responsive web platform. Scope: application development and maintenance, migration/integration, PMO, data management and analytics, UX, accessibility (Section 508), O&M, help desk, cybersecurity compliance, automated security testing, RMF/ATO support, 24/7 availability in Government-furnished AWS GovCloud IL4. Best-value tradeoff. Multiple amendments through Sep 2026; verify current due date on SAM.gov.",
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
    ],
    attachments: [
      { name: "N4571A-26-R-0016.pdf", updated: "2026-07-29" },
      { name: "N4571A-26-R-0016 0005.pdf", updated: "2026-09-18" },
      { name: "SECO DD 254 ENCL 3.pdf", updated: "2026-09-16" },
      { name: "Clarifying Questions.docx", updated: "2026-08-28" },
    ],
    samUrl: "https://sam.gov/opp/33c64e266b8e457fb6512f991779da5a/view",
  },
  {
    id: "sam-dhs-nccs",
    noticeId: "70RTAC26R00000007",
    title: "DHS NCCS 2.0 — Network, Cloud, and Cybersecurity Services",
    noticeType: "Special Notice",
    status: "Active",
    department: "HOMELAND SECURITY, DEPARTMENT OF",
    subtier: "Office of Procurement Operations (OPO)",
    office: "DHS Office of the Chief Information Officer",
    agencyCode: "DHS",
    naics: "541519",
    naicsTitle: "Other Computer Related Services",
    psc: "DF01",
    pscTitle: "IT and Telecom — IT Management Support Services (Labor)",
    setAside: "None",
    placeOfPerformance: "United States (DHS department-wide)",
    postedDate: "2026-09-17",
    responseDeadline: "2026-10-06",
    inactiveDate: null,
    awardCeiling: 626000000,
    awardFloor: null,
    awardCeilingLabel: "~$626M single-award department-wide IDIQ (industry reporting)",
    periodOfPerformance: "Department-wide IDIQ — see draft RFP",
    description:
      "DHS intends to solicit Network, Cloud, and Cybersecurity Services (NCCS) 2.0 as a department-wide single-award IDIQ. Final draft solicitation posted for industry review. Scope spans Tier 1/2 network, cloud, and cyber operations including NOC/SOC, threat hunting, incident response, vulnerability management, penetration testing, cyber forensics, log management, email security, and cloud/platform tenant support. Timeline (from notice): questions on draft due 22 Sep 2026; final solicitation ~1 Oct 2026; Phase 1 proposals 6 Oct; Phase 2 notification 9 Oct; Phase 2 proposals 21 Oct; award late Nov 2026.",
    keywords: [
      "DHS",
      "cybersecurity",
      "cloud",
      "network",
      "NCCS",
      "SOC",
      "NOC",
      "IDIQ",
      "threat hunting",
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
    ],
    samUrl: "https://sam.gov/opp/01d7d3901484484f9235e48c04327d0f/view",
    notes: "Draft package for industry comment — final RFP expected ~1 Oct 2026.",
  },
  {
    id: "sam-dhs-cumulus",
    noticeId: "70RTAC26R00000004",
    title: "DHS Cumulus — Department-Wide Cloud (XaaS) IDIQ",
    noticeType: "Solicitation",
    status: "Active",
    department: "HOMELAND SECURITY, DEPARTMENT OF",
    subtier: "Office of Procurement Operations",
    office: "DHS — Department-Wide Cloud (Cumulus)",
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
    awardCeilingLabel: null,
    periodOfPerformance: "Multiple-award IDIQ — see solicitation",
    description:
      "DHS Cumulus multiple-award IDIQ for commercial cloud solutions department-wide. Scope: commercially available Anything as a Service (XaaS) covering IaaS, PaaS, SaaS, professional services, marketplace solutions, and training — provided by Cloud Service Providers (CSPs). Amendments posted through Sep 2026; verify current proposal due date and Q&A cutoffs on the live SAM.gov notice.",
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
    ],
    contacts: [
      { name: "Gregory Blaszko", email: "gregory.blaszko@hq.dhs.gov", role: "Contracting Officer" },
    ],
    attachments: [{ name: "Solicitation Amendment 0002", updated: "2026-09-10" }],
    samUrl: "https://sam.gov/opp/3e6ef0d1090448dd97081f7c868447ff/view",
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
    notes: "RFI only — responses are not offers.",
  },
];

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
