/**
 * Curated RFP-industry peer competitors for Competitive Intelligence.
 * Figures are illustrative industry estimates / public-filing averages for demo —
 * not live market data. Verify before using in a live bid.
 */

export const METRIC_KEYS = [
  "revenueUsdB",
  "employeesK",
  "operatingMarginPct",
  "publicSectorSharePct",
  "offshoreMixPct",
  "growthYoYPct",
  "keyVehicles",
];

export const DEFAULT_VISIBLE_METRICS = [
  "revenueUsdB",
  "employeesK",
  "operatingMarginPct",
  "publicSectorSharePct",
  "growthYoYPct",
  "keyVehicles",
];

const SOURCE_NOTE =
  "Industry estimates / public filings (illustrative). Verify before bid submission.";

export const COMPETITORS = [
  {
    id: "accenture",
    name: "Accenture",
    shortName: "Accenture",
    hq: "Dublin / global",
    segment: "Global SI",
    datasheet: {
      revenueUsdB: 64.9,
      employeesK: 740,
      operatingMarginPct: 15.2,
      publicSectorSharePct: 12,
      offshoreMixPct: 55,
      growthYoYPct: 2.1,
      keyVehicles: "GSA MAS, Alliant 2, CIO-SP3 (sub), SEWP",
    },
    valueProposition:
      "End-to-end transformation at scale — strategy through managed services — with industry depth and a large certified delivery bench.",
    keyDifferentiators: [
      "Industry-aligned towers with deep public-sector practices",
      "Strong brand for C-suite transformation narratives",
      "Global delivery + local account teams for hybrid models",
      "Heavy investment in GenAI / Synops platforms for ops efficiency",
    ],
    typicalWinThemes: [
      "Transformation partner, not just a staff-aug vendor",
      "Proven large-program governance and change management",
    ],
    sourceNote: SOURCE_NOTE,
  },
  {
    id: "deloitte",
    name: "Deloitte Consulting",
    shortName: "Deloitte",
    hq: "London / US",
    segment: "Big Four consulting",
    datasheet: {
      revenueUsdB: 28.0,
      employeesK: 150,
      operatingMarginPct: 18.0,
      publicSectorSharePct: 22,
      offshoreMixPct: 35,
      growthYoYPct: 4.5,
      keyVehicles: "GSA MAS, CIO-SP3, Alliant 2, OASIS+",
    },
    valueProposition:
      "Audit-grade trust plus strategy-tech-ops integration — preferred when the issuer wants advisor credibility with delivery muscle.",
    keyDifferentiators: [
      "Integrated risk, cyber, and finance consulting adjacency",
      "Strong federal civilian and defense advisory heritage",
      "Partner model that sells outcome narratives over rate cards",
      "Alliance ecosystem (hyperscalers, SAP, Salesforce)",
    ],
    typicalWinThemes: [
      "Trusted advisor with audit-grade controls",
      "Strategy-to-execution continuity under one brand",
    ],
    sourceNote: SOURCE_NOTE,
  },
  {
    id: "ibm",
    name: "IBM Consulting",
    shortName: "IBM",
    hq: "Armonk, NY",
    segment: "Global SI / hybrid cloud",
    datasheet: {
      revenueUsdB: 20.5,
      employeesK: 160,
      operatingMarginPct: 11.5,
      publicSectorSharePct: 18,
      offshoreMixPct: 50,
      growthYoYPct: 1.8,
      keyVehicles: "GSA MAS, CIO-SP3, SEWP, NASA SEWP, Alliant 2",
    },
    valueProposition:
      "Hybrid cloud, mainframe modernization, and AI (watsonx) packaged for regulated enterprises that cannot rip-and-replace overnight.",
    keyDifferentiators: [
      "Deep legacy / mainframe and mission-critical modernisation IP",
      "watsonx + Red Hat hybrid cloud story for controlled AI rollout",
      "Long-tenured federal systems integrator relationships",
      "Hardware-to-services adjacency for complex estates",
    ],
    typicalWinThemes: [
      "Modernize without disrupting the mission",
      "Responsible enterprise AI on hybrid infrastructure",
    ],
    sourceNote: SOURCE_NOTE,
  },
  {
    id: "dxc",
    name: "DXC Technology",
    shortName: "DXC",
    hq: "Ashburn, VA",
    segment: "ITO / managed services",
    datasheet: {
      revenueUsdB: 13.7,
      employeesK: 130,
      operatingMarginPct: 8.5,
      publicSectorSharePct: 25,
      offshoreMixPct: 60,
      growthYoYPct: -3.2,
      keyVehicles: "GSA MAS, Alliant 2, CIO-SP3, SEWP, NASA SEWP",
    },
    valueProposition:
      "Cost-efficient run-and-transform for large heritage estates — strong when the buyer prioritizes operations takeout and modernization in place.",
    keyDifferentiators: [
      "Heritage ITO scale for multi-tower managed services",
      "Public-sector and aerospace/defense account concentration",
      "Aggressive TCO reduction messaging vs premium brands",
      "Platform partnerships for cloud migration factories",
    ],
    typicalWinThemes: [
      "Lower cost to serve without losing mission continuity",
      "Migrate + modernize inheritance estates at scale",
    ],
    sourceNote: SOURCE_NOTE,
  },
  {
    id: "cognizant",
    name: "Cognizant",
    shortName: "Cognizant",
    hq: "Teaneck, NJ",
    segment: "Global SI",
    datasheet: {
      revenueUsdB: 19.3,
      employeesK: 350,
      operatingMarginPct: 14.8,
      publicSectorSharePct: 8,
      offshoreMixPct: 75,
      growthYoYPct: 3.0,
      keyVehicles: "GSA MAS, CIO-SP3 (sub), Alliant 2 (sub)",
    },
    valueProposition:
      "Industry process depth with large offshore engineering capacity — competitive on application modernization and digital engineering rates.",
    keyDifferentiators: [
      "Deep healthcare / financial services process IP transferable to adjacent RFPs",
      "Large digital engineering and product engineering benches",
      "Competitive blended rates vs Big Four / Accenture",
      "GenAI-assisted delivery tooling for productivity claims",
    ],
    typicalWinThemes: [
      "Industry solutions with digital engineering scale",
      "Better cost-to-quality ratio than premium brand primes",
    ],
    sourceNote: SOURCE_NOTE,
  },
  {
    id: "infosys",
    name: "Infosys",
    shortName: "Infosys",
    hq: "Bengaluru",
    segment: "Global SI / digital",
    datasheet: {
      revenueUsdB: 18.6,
      employeesK: 250,
      operatingMarginPct: 20.5,
      publicSectorSharePct: 6,
      offshoreMixPct: 80,
      growthYoYPct: 4.2,
      keyVehicles: "GSA MAS, CIO-SP3 (sub), Alliant 2 (sub)",
    },
    valueProposition:
      "Digital-first engineering with Cobalt/Topaz platforms — strong when the RFP rewards modernization factories and outcome SLAs at competitive rates.",
    keyDifferentiators: [
      "High operating margin enabling aggressive commercial postures",
      "Strong cloud, data, and digital experience portfolios",
      "Cobalt / Topaz platform narrative for repeatable delivery",
      "Growing US onshore / nearshore mix for clearance-sensitive work",
    ],
    typicalWinThemes: [
      "Digital transformation factory with measurable productivity",
      "Platform-led delivery beats one-off custom builds",
    ],
    sourceNote: SOURCE_NOTE,
  },
  {
    id: "capgemini",
    name: "Capgemini",
    shortName: "Capgemini",
    hq: "Paris",
    segment: "Global SI / Europe-strong",
    datasheet: {
      revenueUsdB: 23.5,
      employeesK: 340,
      operatingMarginPct: 13.0,
      publicSectorSharePct: 15,
      offshoreMixPct: 45,
      growthYoYPct: 2.8,
      keyVehicles: "GSA MAS, EU frameworks, CIO-SP3 (sub)",
    },
    valueProposition:
      "European public-sector strength plus engineering and cloud practices — differentiated when multi-region or EU sovereignty themes matter.",
    keyDifferentiators: [
      "Strong EU / NATO-aligned public sector footprint",
      "Engineering (Altran heritage) for complex systems RFPs",
      "Cloud and data practices with hyperscaler depth",
      "Competitive alternative to US-centric primes on multinational bids",
    ],
    typicalWinThemes: [
      "Sovereign / multi-region delivery partner",
      "Engineering + consulting under one contract",
    ],
    sourceNote: SOURCE_NOTE,
  },
  {
    id: "hcltech",
    name: "HCLTech",
    shortName: "HCLTech",
    hq: "Noida",
    segment: "Global SI / mode-2",
    datasheet: {
      revenueUsdB: 13.3,
      employeesK: 220,
      operatingMarginPct: 17.5,
      publicSectorSharePct: 7,
      offshoreMixPct: 78,
      growthYoYPct: 5.1,
      keyVehicles: "GSA MAS, SEWP, CIO-SP3 (sub)",
    },
    valueProposition:
      "Mode-1/Mode-2 dual speed — infrastructure + digital product engineering — often priced aggressively against Tier-1 SIs.",
    keyDifferentiators: [
      "Strong infra / workplace / ER&D combination",
      "Competitive commercials on large AMS/ITO takeouts",
      "Product engineering for digital experience RFPs",
      "Growing GenAI and cloud native practice",
    ],
    typicalWinThemes: [
      "Dual-speed IT: stabilize core, accelerate digital",
      "Better commercial leverage vs Accenture-class pricing",
    ],
    sourceNote: SOURCE_NOTE,
  },
  {
    id: "tcs",
    name: "Tata Consultancy Services",
    shortName: "TCS",
    hq: "Mumbai",
    segment: "Global SI",
    datasheet: {
      revenueUsdB: 29.0,
      employeesK: 600,
      operatingMarginPct: 24.0,
      publicSectorSharePct: 5,
      offshoreMixPct: 82,
      growthYoYPct: 3.5,
      keyVehicles: "GSA MAS, CIO-SP3 (sub), Alliant 2 (sub)",
    },
    valueProposition:
      "Scale, process maturity, and long-horizon partnership — default shortlist for large application estates seeking predictable run costs.",
    keyDifferentiators: [
      "Largest global delivery bench among peers listed",
      "Industry solution units with mature ADMS playbooks",
      "Best-in-class operating margins fund commercial flexibility",
      "Long multi-year client tenures as proof of stickiness",
    ],
    typicalWinThemes: [
      "Predictable delivery at industrial scale",
      "Partnership longevity over chase-and-replace cycles",
    ],
    sourceNote: SOURCE_NOTE,
  },
  {
    id: "wipro",
    name: "Wipro",
    shortName: "Wipro",
    hq: "Bengaluru",
    segment: "Global SI",
    datasheet: {
      revenueUsdB: 10.8,
      employeesK: 230,
      operatingMarginPct: 15.5,
      publicSectorSharePct: 6,
      offshoreMixPct: 77,
      growthYoYPct: 0.5,
      keyVehicles: "GSA MAS, CIO-SP3 (sub), SEWP (sub)",
    },
    valueProposition:
      "Full-stack IT with consulting + engineering — often positioned as a cost-and-capability challenge to Tier-1 primes on digital and cloud.",
    keyDifferentiators: [
      "Consulting + Wipro FullStride cloud offerings",
      "Competitive rate structures for digital programmes",
      "Domain solutions in BFSI, healthcare, consumer",
      "Capco heritage for financial-services transformations",
    ],
    typicalWinThemes: [
      "Challenge the incumbent with better digital economics",
      "Cloud and consulting under one commercial vehicle",
    ],
    sourceNote: SOURCE_NOTE,
  },
  {
    id: "boozallen",
    name: "Booz Allen Hamilton",
    shortName: "Booz Allen",
    hq: "McLean, VA",
    segment: "Federal integrator / consulting",
    datasheet: {
      revenueUsdB: 10.7,
      employeesK: 33,
      operatingMarginPct: 10.5,
      publicSectorSharePct: 97,
      offshoreMixPct: 5,
      growthYoYPct: 12.0,
      keyVehicles: "OASIS+, CIO-SP3, Alliant 2, SEWP, NASA SEWP, GSA MAS",
    },
    valueProposition:
      "Mission-first federal consulting and cyber — the peer to beat when clearance, classification, and National Security Agency adjacency dominate evaluation.",
    keyDifferentiators: [
      "Dominant cleared workforce and SCIF-ready delivery",
      "Cyber, AI, and mission analytics deep in DoD / IC",
      "Prime-ready on high-sensitivity federal RFPs",
      "Consulting brand trusted by government C-suites",
    ],
    typicalWinThemes: [
      "Mission outcomes with cleared professionals",
      "Cyber and AI that meet federal assurance bars",
    ],
    sourceNote: SOURCE_NOTE,
  },
  {
    id: "leidos",
    name: "Leidos",
    shortName: "Leidos",
    hq: "Reston, VA",
    segment: "Federal integrator / defense",
    datasheet: {
      revenueUsdB: 15.4,
      employeesK: 47,
      operatingMarginPct: 9.8,
      publicSectorSharePct: 95,
      offshoreMixPct: 8,
      growthYoYPct: 8.5,
      keyVehicles: "OASIS+, Alliant 2, CIO-SP3, SEWP, NASA SEWP, GSA MAS",
    },
    valueProposition:
      "Mission IT, logistics, and health — systems integration for programs where domain systems engineering outweighs pure commercial digital narratives.",
    keyDifferentiators: [
      "Deep DoD, civil, and health mission systems pedigree",
      "Engineering-heavy vs pure labor-arbitrage SI model",
      "Strong past performance on large federal IDIQs",
      "Integrated cyber for operational technology estates",
    ],
    typicalWinThemes: [
      "Mission systems engineering, not generic staff aug",
      "Proven past performance on similar federal SOWs",
    ],
    sourceNote: SOURCE_NOTE,
  },
];

export function formatMetricValue(key, value) {
  if (value == null || value === "") return "—";
  switch (key) {
    case "revenueUsdB":
      return `$${Number(value).toFixed(1)}B`;
    case "employeesK":
      return `${Number(value).toFixed(0)}K`;
    case "operatingMarginPct":
    case "publicSectorSharePct":
    case "offshoreMixPct":
    case "growthYoYPct": {
      const n = Number(value);
      const sign = n > 0 && key === "growthYoYPct" ? "+" : "";
      return `${sign}${n.toFixed(1)}%`;
    }
    case "keyVehicles":
      return String(value);
    default:
      return String(value);
  }
}
