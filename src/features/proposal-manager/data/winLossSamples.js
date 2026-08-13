/**
 * Seeded win/loss scoring records — Section M-style factors + product gaps for engineering.
 */

export const PRODUCT_AREAS = [
  "ingest",
  "content",
  "collab",
  "intel",
  "solutioning",
  "export",
  "compliance",
  "other",
];

export const WIN_LOSS_SAMPLES = [
  {
    id: "wl_water_wastewater",
    rfpName: "Final 2026 RFP — Water Wastewater Study",
    solicitationNumber: "WW-2026-01",
    agency: "Municipal utilities board",
    segment: "State/Local",
    outcome: "lost",
    submittedAt: "2026-03-12T00:00:00.000Z",
    awardedAt: "2026-04-20T00:00:00.000Z",
    contractValue: 1.8,
    debrief: {
      sourceType: "debrief",
      summary:
        "Technically acceptable but ranked second. Evaluators cited thinner local past performance and a less specific sampling/field methodology than the awardee.",
      whyWon: [],
      whyLost: [
        "Past performance did not show enough similar municipal wastewater studies in the last five years.",
        "Technical volume described JUNO capture tooling more than the field sampling plan Section M weighted at 40%.",
        "No local subcontractor named for laboratory QA — awardee had a city-adjacent lab on the team.",
      ],
      evaluatorComments:
        "Offeror’s proposal operations capability is mature; the study approach itself lacked site-specific hydrology and sampling density.",
    },
    factors: [
      { id: "fac_ww_tech", name: "Technical approach / methodology", sectionMRef: "M.1", weight: 40, ourScore: 3.1, winnerScore: 4.2, maxScore: 5, notes: "Lost on sampling density and local hydrology." },
      { id: "fac_ww_pp", name: "Past performance", sectionMRef: "M.2", weight: 30, ourScore: 2.7, winnerScore: 4.0, maxScore: 5, notes: "Insufficient municipal WW studies." },
      { id: "fac_ww_mgmt", name: "Management / staffing", sectionMRef: "M.3", weight: 15, ourScore: 3.6, winnerScore: 3.8, maxScore: 5, notes: "Close; missing named local lab." },
      { id: "fac_ww_price", name: "Price", sectionMRef: "M.4", weight: 15, ourScore: 4.4, winnerScore: 4.0, maxScore: 5, notes: "We were more competitive on price." },
    ],
    capabilityGaps: [
      {
        id: "gap_ww_pp_lib",
        title: "Municipal past-performance library by NAICS / utility type",
        description: "Writers could not pull scored WW study PP snippets with dates, agency, and relevance tags during volume build.",
        relatedFactorIds: ["fac_ww_pp"],
        productArea: "content",
        severity: "high",
        evidence: "M.2 score 2.7 vs winner 4.0; debrief: not enough similar municipal studies.",
        roadmapTheme: "Past performance intelligence",
        status: "open",
      },
      {
        id: "gap_ww_method",
        title: "Domain methodology canvases (sampling plans, field protocols)",
        description: "Technical Solutioning overlays architecture, not civil/environmental method statements the RFP actually scored.",
        relatedFactorIds: ["fac_ww_tech"],
        productArea: "solutioning",
        severity: "high",
        evidence: "M.1 3.1 vs 4.2; evaluators wanted site-specific hydrology and sampling density.",
        roadmapTheme: "Vertical solution kits",
        status: "open",
      },
      {
        id: "gap_ww_teaming",
        title: "Local teaming / lab-sub discovery on the capture record",
        description: "No product surface to attach a required local lab and show it on the org chart / topology.",
        relatedFactorIds: ["fac_ww_mgmt"],
        productArea: "other",
        severity: "medium",
        evidence: "Awardee named a city-adjacent lab; we did not.",
        roadmapTheme: "Teaming graph",
        status: "open",
      },
    ],
  },
  {
    id: "wl_landscape",
    rfpName: "Landscape Maintenance Services RFP",
    solicitationNumber: "CC-LM-2024",
    agency: "City parks department",
    segment: "State/Local",
    outcome: "won",
    submittedAt: "2024-10-02T00:00:00.000Z",
    awardedAt: "2024-11-15T00:00:00.000Z",
    contractValue: 0.62,
    debrief: {
      sourceType: "evaluation_scores",
      summary:
        "Highest combined score. Evaluators credited a complete compliance matrix, named crew plan, and a clear SLA mapping — price was not the lowest.",
      whyWon: [
        "Section L/M crosswalk was complete; zero administrative deficiencies.",
        "Staffing plan named crews, backups, and after-hours response — matched M.1 exactly.",
        "Boilerplate capability statement plus local references landed as past performance.",
      ],
      whyLost: [],
      evaluatorComments: "Best value. Technical and management superior; price fair and reasonable.",
    },
    factors: [
      { id: "fac_lm_tech", name: "Technical / operations plan", sectionMRef: "M.1", weight: 35, ourScore: 4.5, winnerScore: 4.5, maxScore: 5, notes: "We were the awardee." },
      { id: "fac_lm_pp", name: "Past performance", sectionMRef: "M.2", weight: 25, ourScore: 4.2, winnerScore: 4.2, maxScore: 5, notes: "Local parks references." },
      { id: "fac_lm_mgmt", name: "Management", sectionMRef: "M.3", weight: 20, ourScore: 4.4, winnerScore: 4.4, maxScore: 5, notes: "Named crews + SLA." },
      { id: "fac_lm_price", name: "Price", sectionMRef: "M.4", weight: 20, ourScore: 3.8, winnerScore: 3.8, maxScore: 5, notes: "Not lowest; still best value." },
    ],
    capabilityGaps: [
      {
        id: "gap_lm_sla",
        title: "SLA / compliance matrix generator from Section L",
        description: "Win depended on a manually built matrix. Product should emit a Section L/M crosswalk as a first-class export.",
        relatedFactorIds: ["fac_lm_tech", "fac_lm_mgmt"],
        productArea: "export",
        severity: "medium",
        evidence: "Debrief: complete compliance matrix; currently a Content Hub paste, not a generated artifact.",
        roadmapTheme: "Evaluator-ready matrices",
        status: "planned",
      },
    ],
  },
  {
    id: "wl_airport",
    rfpName: "Airport Restaurant Space Lease RFP",
    solicitationNumber: "AIR-F&B-2025",
    agency: "Airport authority",
    segment: "State/Local",
    outcome: "lost",
    submittedAt: "2025-02-28T00:00:00.000Z",
    awardedAt: "2025-04-08T00:00:00.000Z",
    contractValue: 4.1,
    debrief: {
      sourceType: "debrief",
      summary:
        "Lost on concept of operations and concession experience. Proposal ops quality was not the issue — the offer read like an IT response to a food-and-beverage concession.",
      whyWon: [],
      whyLost: [
        "No branded F&B concept, hours, or passenger-flow staffing model.",
        "Past performance was SI/IT rather than airport concession.",
        "Financials/pro forma weaker than the incumbent-adjacent operator.",
      ],
      evaluatorComments: "Strong document quality; weak industry fit for a lease concession.",
    },
    factors: [
      { id: "fac_air_concept", name: "Concept of operations", sectionMRef: "M.1", weight: 35, ourScore: 2.4, winnerScore: 4.6, maxScore: 5, notes: "Read as an IT proposal." },
      { id: "fac_air_exp", name: "Concession / F&B experience", sectionMRef: "M.2", weight: 30, ourScore: 2.0, winnerScore: 4.5, maxScore: 5, notes: "Wrong past performance set." },
      { id: "fac_air_fin", name: "Financial offer / MAG", sectionMRef: "M.3", weight: 25, ourScore: 3.3, winnerScore: 4.1, maxScore: 5, notes: "Pro forma not concession-grade." },
      { id: "fac_air_comp", name: "Completeness / admin", sectionMRef: "M.4", weight: 10, ourScore: 4.7, winnerScore: 4.4, maxScore: 5, notes: "We won the paperwork factor." },
    ],
    capabilityGaps: [
      {
        id: "gap_air_vertical",
        title: "Go/no-go vertical fit scoring before volume write",
        description: "System should flag when Section M factors (concession ops, MAG, brand) do not match JUNO’s SI/IT capability pack.",
        relatedFactorIds: ["fac_air_concept", "fac_air_exp"],
        productArea: "intel",
        severity: "high",
        evidence: "M.1 2.4 and M.2 2.0; debrief: IT response to an F&B lease.",
        roadmapTheme: "Bid qualification",
        status: "open",
      },
      {
        id: "gap_air_proforma",
        title: "Concession / MAG pro forma in Pricing",
        description: "Pricing today is labor/cost-volume charts, not lease MAG, percentage rent, or passenger-driven revenue.",
        relatedFactorIds: ["fac_air_fin"],
        productArea: "other",
        severity: "medium",
        evidence: "M.3 3.3 vs 4.1; financial offer not concession-grade.",
        roadmapTheme: "Pricing models by RFP class",
        status: "open",
      },
    ],
  },
];

export function parseScoringText(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const factors = [];
  for (const line of lines) {
    if (/^(name|factor|section)/i.test(line) && /weight/i.test(line)) continue;
    const parts = line.split(/[|\t,;]/).map((p) => p.trim()).filter((p) => p.length);
    if (parts.length < 4) continue;
    const num = (v) => {
      const n = Number(String(v).replace(/[^0-9.+-]/g, ""));
      return Number.isFinite(n) ? n : null;
    };
    const [name, refOrWeight, maybeWeight, maybeOurs, maybeWinner, maybeMax] = parts;
    const refIsCode = /[A-Za-z]/.test(refOrWeight) && !/^\d+(\.\d+)?$/.test(refOrWeight);
    const sectionMRef = refIsCode ? refOrWeight : "";
    const weight = refIsCode ? num(maybeWeight) : num(refOrWeight);
    const ourScore = refIsCode ? num(maybeOurs) : num(maybeWeight);
    const winnerScore = refIsCode ? num(maybeWinner) : num(maybeOurs);
    const maxScore = (refIsCode ? num(maybeMax) : num(maybeWinner)) || 5;
    if (!name || ourScore == null) continue;
    factors.push({
      id: `fac_${Date.now()}_${factors.length}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      sectionMRef,
      weight: weight ?? 0,
      ourScore,
      winnerScore: winnerScore ?? ourScore,
      maxScore,
      notes: "",
    });
  }
  return factors;
}

export function rollupRoadmap(records) {
  const map = new Map();
  for (const rec of records || []) {
    for (const gap of rec.capabilityGaps || []) {
      const key = `${gap.productArea}::${gap.title}`.toLowerCase();
      const existing = map.get(key);
      const loss = rec.outcome === "lost" ? 1 : 0;
      if (!existing) {
        map.set(key, {
          title: gap.title,
          description: gap.description,
          productArea: gap.productArea,
          severity: gap.severity,
          roadmapTheme: gap.roadmapTheme,
          status: gap.status,
          lossCount: loss,
          pursuitCount: 1,
          evidence: [gap.evidence].filter(Boolean),
          rfpNames: [rec.rfpName],
        });
      } else {
        existing.pursuitCount += 1;
        existing.lossCount += loss;
        existing.rfpNames.push(rec.rfpName);
        if (gap.evidence) existing.evidence.push(gap.evidence);
        const rank = { high: 3, medium: 2, low: 1 };
        if ((rank[gap.severity] || 0) > (rank[existing.severity] || 0)) existing.severity = gap.severity;
      }
    }
  }
  return [...map.values()].sort((a, b) => {
    const rank = { high: 3, medium: 2, low: 1 };
    return (rank[b.severity] || 0) - (rank[a.severity] || 0) || b.lossCount - a.lossCount;
  });
}
