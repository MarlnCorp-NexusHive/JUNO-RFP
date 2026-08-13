/**
 * Customer-environment topography templates (as-is infrastructure)
 * plus JUNO / Marln overlay nodes for to-be pursuit diagrams.
 */

export const ICON_LEGEND = [
  { id: "users", label: "Users / channels" },
  { id: "portal", label: "Portal / UX" },
  { id: "app", label: "Business system" },
  { id: "cloud", label: "Cloud / hosting" },
  { id: "database", label: "Data / records" },
  { id: "lock", label: "Identity / security" },
  { id: "network", label: "Network / integration" },
  { id: "document", label: "Content / records" },
  { id: "spark", label: "JUNO AI / drafting" },
  { id: "collab", label: "Review / collaboration" },
  { id: "export", label: "Submission export" },
];

export const OWNER_LEGEND = [
  { id: "customer", label: "Customer existing" },
  { id: "juno", label: "JUNO / Marln overlay" },
  { id: "integration", label: "Integration / data flow" },
];

const JUNO_OVERLAY = {
  nodes: [
    {
      id: "juno-ingest",
      label: "JUNO Ingest",
      layer: "JUNO overlay",
      icon: "document",
      owner: "juno",
      description: "Source Docs + Workspace extract",
    },
    {
      id: "juno-hub",
      label: "Content Hub",
      layer: "JUNO overlay",
      icon: "spark",
      owner: "juno",
      description: "Grounded Q&A + boilerplate",
    },
    {
      id: "juno-collab",
      label: "PM–Auditor",
      layer: "JUNO overlay",
      icon: "collab",
      owner: "juno",
      description: "Assign, draft, review",
    },
    {
      id: "juno-export",
      label: "Win exports",
      layer: "JUNO overlay",
      icon: "export",
      owner: "juno",
      description: "Word / PPTX / styled DOCX",
    },
  ],
  edges: [
    { from: "juno-ingest", to: "juno-hub", label: "extract" },
    { from: "juno-hub", to: "juno-collab", label: "review" },
    { from: "juno-collab", to: "juno-export", label: "submit" },
  ],
};

export const TOPOLOGY_TEMPLATES = [
  {
    id: "federal",
    name: "Federal / civilian agency",
    sectorHints: ["government", "federal", "public", "defense", "civilian"],
    legendNote: "Icons follow typical federal RFP volumes: channels, mission systems, ICAM, records.",
    layers: ["Users & channels", "Mission systems", "Identity & security", "Hosting & data", "JUNO overlay"],
    nodes: [
      { id: "citizens", label: "Citizens / staff", layer: "Users & channels", icon: "users", owner: "customer", description: "Requestors & CORs" },
      { id: "portal", label: "Agency portal", layer: "Users & channels", icon: "portal", owner: "customer", description: "Public / intranet" },
      { id: "case", label: "Case / mission app", layer: "Mission systems", icon: "app", owner: "customer", description: "Line-of-business" },
      { id: "erp", label: "Financial ERP", layer: "Mission systems", icon: "app", owner: "customer", description: "Comptroller systems" },
      { id: "icam", label: "ICAM / PIV", layer: "Identity & security", icon: "lock", owner: "customer", description: "HSPD-12 identity" },
      { id: "siem", label: "SOC / SIEM", layer: "Identity & security", icon: "lock", owner: "customer", description: "Continuous monitoring" },
      { id: "dc", label: "Agency cloud", layer: "Hosting & data", icon: "cloud", owner: "customer", description: "FedRAMP landing zone" },
      { id: "records", label: "Records / NARA", layer: "Hosting & data", icon: "database", owner: "customer", description: "Authoritative data" },
    ],
    edges: [
      { from: "citizens", to: "portal" },
      { from: "portal", to: "case" },
      { from: "portal", to: "erp" },
      { from: "case", to: "icam" },
      { from: "erp", to: "icam" },
      { from: "case", to: "records" },
      { from: "dc", to: "records" },
      { from: "siem", to: "dc" },
    ],
    overlayEdges: [
      { from: "portal", to: "juno-ingest", label: "RFP packs" },
      { from: "records", to: "juno-hub", label: "past perf." },
      { from: "juno-export", to: "case", label: "volumes" },
    ],
    placements: [
      { capability: "Source Docs / Workspace", sitsOn: "Agency portal & records", why: "Solicitations and amendments land as PDFs; JUNO extracts Section L/M without a new agency system of record." },
      { capability: "Content Hub + boilerplate", sitsOn: "Mission knowledge workers", why: "Reusable win themes sit beside case/ERP users — not a second content silo." },
      { capability: "PM–auditor collab", sitsOn: "ICAM-gated reviewers", why: "Reviewers keep PIV-style ownership; JUNO adds assignment states, not a new IdP." },
      { capability: "Styled export", sitsOn: "Proposal volumes back to the portal", why: "Word/PPTX leave JUNO in evaluator format; agency systems stay systems of record." },
    ],
  },
  {
    id: "healthcare",
    name: "Healthcare / payer-provider",
    sectorHints: ["health", "hospital", "payer", "provider", "pharma"],
    legendNote: "Legend aligned to clinical + revenue-cycle stacks common in health IT RFPs.",
    layers: ["Care & access", "Clinical / admin systems", "Trust & compliance", "Platform", "JUNO overlay"],
    nodes: [
      { id: "patients", label: "Patients / clinicians", layer: "Care & access", icon: "users", owner: "customer", description: "Front door" },
      { id: "portal", label: "Patient portal", layer: "Care & access", icon: "portal", owner: "customer", description: "MyChart-class" },
      { id: "ehr", label: "EHR", layer: "Clinical / admin systems", icon: "app", owner: "customer", description: "Epic / Cerner class" },
      { id: "claims", label: "Claims / RCM", layer: "Clinical / admin systems", icon: "app", owner: "customer", description: "Revenue cycle" },
      { id: "iam", label: "SSO / IAM", layer: "Trust & compliance", icon: "lock", owner: "customer", description: "BAA-bound identity" },
      { id: "hipaa", label: "Privacy / HIPAA", layer: "Trust & compliance", icon: "lock", owner: "customer", description: "Compliance zone" },
      { id: "cloud", label: "HITRUST cloud", layer: "Platform", icon: "cloud", owner: "customer", description: "Clinical hosting" },
      { id: "cdr", label: "Clinical data", layer: "Platform", icon: "database", owner: "customer", description: "CDR / lake" },
    ],
    edges: [
      { from: "patients", to: "portal" },
      { from: "portal", to: "ehr" },
      { from: "ehr", to: "claims" },
      { from: "ehr", to: "iam" },
      { from: "claims", to: "iam" },
      { from: "ehr", to: "cdr" },
      { from: "cloud", to: "cdr" },
      { from: "hipaa", to: "cloud" },
    ],
    overlayEdges: [
      { from: "portal", to: "juno-ingest", label: "IT RFPs" },
      { from: "cdr", to: "juno-hub", label: "prior work" },
      { from: "juno-export", to: "claims", label: "IT volumes" },
    ],
    placements: [
      { capability: "JUNO Ingest", sitsOn: "Health IT PMO, not the EHR", why: "EHR remains clinical system of record; JUNO only consumes RFP PDFs and architecture exhibits." },
      { capability: "Content Hub", sitsOn: "Privacy-aware proposal library", why: "Boilerplate is proposal language — PHI never needs to enter JUNO." },
      { capability: "Collaboration", sitsOn: "SSO-gated capture team", why: "Auditors review outside the EHR; IAM stays the customer’s." },
      { capability: "Exports", sitsOn: "Procurement / RCM adjacent IT bids", why: "Submission files return as documents, not HL7 messages." },
    ],
  },
  {
    id: "financial",
    name: "Financial services",
    sectorHints: ["financial", "bank", "insurance", "capital"],
    legendNote: "Channels, core, risk, and data — the four boxes most FS RFPs expect on a topology slide.",
    layers: ["Clients & channels", "Core & digital", "Risk & control", "Data platform", "JUNO overlay"],
    nodes: [
      { id: "clients", label: "Clients / RMs", layer: "Clients & channels", icon: "users", owner: "customer", description: "Front office" },
      { id: "digital", label: "Digital bank", layer: "Clients & channels", icon: "portal", owner: "customer", description: "Web / mobile" },
      { id: "core", label: "Core banking", layer: "Core & digital", icon: "app", owner: "customer", description: "System of record" },
      { id: "crm", label: "Wealth / CRM", layer: "Core & digital", icon: "app", owner: "customer", description: "Salesforce-class" },
      { id: "risk", label: "Risk / AML", layer: "Risk & control", icon: "lock", owner: "customer", description: "Model & surveillance" },
      { id: "iam", label: "Workforce IAM", layer: "Risk & control", icon: "lock", owner: "customer", description: "Privileged access" },
      { id: "cloud", label: "Private cloud", layer: "Data platform", icon: "cloud", owner: "customer", description: "Regulated landing zone" },
      { id: "lake", label: "Risk data lake", layer: "Data platform", icon: "database", owner: "customer", description: "BCBS 239-style" },
    ],
    edges: [
      { from: "clients", to: "digital" },
      { from: "digital", to: "core" },
      { from: "digital", to: "crm" },
      { from: "core", to: "risk" },
      { from: "crm", to: "iam" },
      { from: "core", to: "lake" },
      { from: "cloud", to: "lake" },
      { from: "risk", to: "lake" },
    ],
    overlayEdges: [
      { from: "digital", to: "juno-ingest", label: "RFPs" },
      { from: "lake", to: "juno-hub", label: "prior bids" },
      { from: "juno-export", to: "crm", label: "deal room" },
    ],
    placements: [
      { capability: "JUNO Ingest", sitsOn: "Change-the-bank PMO", why: "Core and AML stay production; JUNO reads solicitation packs and architecture appendices only." },
      { capability: "Intel + Content Hub", sitsOn: "Capture next to CRM", why: "Issuer/competitor intel informs win themes without touching customer PII in the core." },
      { capability: "Auditor workflow", sitsOn: "2LOD-style review", why: "Proposal review mimics control challenge — named owners, not a shared drive." },
      { capability: "Exports", sitsOn: "Deal / procurement room", why: "Evaluator-ready DOCX/PPTX, not a core posting." },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise / global SI customer",
    sectorHints: ["technology", "information", "industrial", "consumer", "diversified"],
    legendNote: "Typical enterprise estate: IdP, SaaS, ERP, landing zone — plus JUNO as the pursuit control plane.",
    layers: ["Workforce", "SaaS & ERP", "Identity & ops", "Cloud estate", "JUNO overlay"],
    nodes: [
      { id: "employees", label: "Employees / partners", layer: "Workforce", icon: "users", owner: "customer", description: "Knowledge workers" },
      { id: "intranet", label: "Intranet / M365", layer: "Workforce", icon: "portal", owner: "customer", description: "Collaboration suite" },
      { id: "erp", label: "ERP / SAP", layer: "SaaS & ERP", icon: "app", owner: "customer", description: "Record to report" },
      { id: "crm", label: "CRM / SFDC", layer: "SaaS & ERP", icon: "app", owner: "customer", description: "Lead to cash" },
      { id: "idp", label: "Entra / Okta", layer: "Identity & ops", icon: "lock", owner: "customer", description: "Workforce IdP" },
      { id: "itsm", label: "ITSM", layer: "Identity & ops", icon: "network", owner: "customer", description: "ServiceNow-class" },
      { id: "cloud", label: "Hyperscaler LZ", layer: "Cloud estate", icon: "cloud", owner: "customer", description: "Landing zone" },
      { id: "lake", label: "Enterprise data", layer: "Cloud estate", icon: "database", owner: "customer", description: "Lakehouse" },
    ],
    edges: [
      { from: "employees", to: "intranet" },
      { from: "intranet", to: "idp" },
      { from: "erp", to: "idp" },
      { from: "crm", to: "idp" },
      { from: "intranet", to: "itsm" },
      { from: "erp", to: "lake" },
      { from: "cloud", to: "lake" },
      { from: "itsm", to: "cloud" },
    ],
    overlayEdges: [
      { from: "intranet", to: "juno-ingest", label: "RFP library" },
      { from: "crm", to: "juno-hub", label: "pursuit" },
      { from: "juno-export", to: "itsm", label: "bid package" },
    ],
    placements: [
      { capability: "JUNO Ingest + Workspace", sitsOn: "Beside M365 — not inside it", why: "SharePoint keeps files; JUNO extracts requirements and facts for writers." },
      { capability: "Content Hub", sitsOn: "CRM-adjacent capture", why: "Win library tagged to the opportunity, not buried in a drive." },
      { capability: "Technical Solutioning", sitsOn: "Cloud LZ patterns", why: "Reference architectures overlay the customer landing zone instead of a generic Visio." },
      { capability: "Exports", sitsOn: "ITSM / bid desk", why: "Packages attach to the ticket/opportunity, customer systems remain SoR." },
    ],
  },
  {
    id: "municipal",
    name: "Municipal / public works",
    sectorHints: ["municipal", "city", "county", "utilities", "water"],
    legendNote: "Matches city/county RFPs (public works, GIS, finance) like the Source Docs sample set.",
    layers: ["Residents & staff", "City systems", "Trust", "Facilities & data", "JUNO overlay"],
    nodes: [
      { id: "residents", label: "Residents / council", layer: "Residents & staff", icon: "users", owner: "customer", description: "Constituents" },
      { id: "web", label: "City website", layer: "Residents & staff", icon: "portal", owner: "customer", description: "Notices & bids" },
      { id: "gis", label: "GIS / assets", layer: "City systems", icon: "app", owner: "customer", description: "Public works map" },
      { id: "finance", label: "Finance / AP", layer: "City systems", icon: "app", owner: "customer", description: "Munibilling" },
      { id: "iam", label: "Staff login", layer: "Trust", icon: "lock", owner: "customer", description: "City AD" },
      { id: "backup", label: "Records vault", layer: "Trust", icon: "document", owner: "customer", description: "Retention" },
      { id: "dc", label: "City DC / cloud", layer: "Facilities & data", icon: "cloud", owner: "customer", description: "On-prem + SaaS" },
      { id: "data", label: "Work-order data", layer: "Facilities & data", icon: "database", owner: "customer", description: "Assets & tickets" },
    ],
    edges: [
      { from: "residents", to: "web" },
      { from: "web", to: "gis" },
      { from: "web", to: "finance" },
      { from: "gis", to: "iam" },
      { from: "finance", to: "iam" },
      { from: "gis", to: "data" },
      { from: "dc", to: "data" },
      { from: "backup", to: "dc" },
    ],
    overlayEdges: [
      { from: "web", to: "juno-ingest", label: "posted RFP" },
      { from: "backup", to: "juno-hub", label: "prior bids" },
      { from: "juno-export", to: "finance", label: "response" },
    ],
    placements: [
      { capability: "JUNO Ingest", sitsOn: "The posted RFP on the city site", why: "Same PDFs already in Source Docs (water, landscape, airport) become structured Q&A." },
      { capability: "Content Hub boilerplate", sitsOn: "Public-works pursuit team", why: "Capability statements are shared with leads without touching GIS or AP." },
      { capability: "Collaboration", sitsOn: "Staff AD accounts", why: "Auditors review city RFPs with named owners." },
      { capability: "Exports", sitsOn: "Finance / clerk submission", why: "Word volumes go out the same path as today’s paper/PDF response." },
    ],
  },
];

export function matchTemplateForIssuer(issuer) {
  if (!issuer) return TOPOLOGY_TEMPLATES.find((t) => t.id === "enterprise");
  const blob = `${issuer.sector || ""} ${issuer.name || ""} ${issuer.customers || ""} ${issuer.region || ""}`.toLowerCase();
  const scored = TOPOLOGY_TEMPLATES.map((t) => ({
    t,
    n: t.sectorHints.filter((h) => blob.includes(h)).length,
  })).sort((a, b) => b.n - a.n);
  return scored[0].n > 0 ? scored[0].t : TOPOLOGY_TEMPLATES.find((t) => t.id === "enterprise");
}

export function buildTopology({ templateId, companyName, overlay }) {
  const template =
    TOPOLOGY_TEMPLATES.find((t) => t.id === templateId) || TOPOLOGY_TEMPLATES.find((t) => t.id === "enterprise");
  const layers = overlay ? template.layers : template.layers.filter((l) => l !== "JUNO overlay");
  const customerNodes = template.nodes.map((n) => ({
    ...n,
    label: n.id === "portal" && companyName ? `${shortName(companyName)} portal` : n.label,
  }));
  const nodes = overlay ? [...customerNodes, ...JUNO_OVERLAY.nodes] : customerNodes;
  const edges = overlay
    ? [
        ...template.edges.map((e) => ({ ...e, owner: "customer" })),
        ...JUNO_OVERLAY.edges.map((e) => ({ ...e, owner: "juno" })),
        ...template.overlayEdges.map((e) => ({ ...e, owner: "integration" })),
      ]
    : template.edges.map((e) => ({ ...e, owner: "customer" }));

  return {
    templateId: template.id,
    templateName: template.name,
    legendNote: template.legendNote,
    companyName: companyName || "Customer",
    overlay: !!overlay,
    layers,
    nodes,
    edges,
    placements: overlay ? template.placements : [],
  };
}

function shortName(name) {
  const n = String(name || "").trim();
  if (n.length <= 18) return n;
  return `${n.slice(0, 16)}…`;
}
