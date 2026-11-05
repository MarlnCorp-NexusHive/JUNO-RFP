/**
 * Static Ana portfolio — matches the Grant Pulse prototype screenshots.
 * Used only for demo proposal_manager login (not trial/walkthrough).
 */

export const DEMO_AWARDS = [
  {
    id: "demo-youth-workforce",
    title: "Youth Workforce Pathways",
    funder: "Dept. of Labor",
    amount: 1_200_000,
    timePct: 44,
    spentPct: 31,
    donePct: 46,
    periodStart: "2025-01-01",
    periodEnd: "2026-12-31",
    nextDeadlineIso: "2025-10-30",
    nextDeadlineDisplay: "Oct 30",
    nextDeadlineLabel: "SF-425",
    needsApproval: false,
  },
  {
    id: "demo-health-navigators",
    title: "Community Health Navigators",
    funder: "State Dept. of Health",
    amount: 480_000,
    timePct: 70,
    spentPct: 74,
    donePct: 66,
    periodStart: "2024-06-01",
    periodEnd: "2026-06-01",
    nextDeadlineIso: "2025-11-15",
    nextDeadlineDisplay: "Nov 15",
    nextDeadlineLabel: "Quarterly report",
    needsApproval: false,
  },
  {
    id: "demo-stem-labs",
    title: "After-School STEM Labs",
    funder: "Hartwell Foundation",
    amount: 150_000,
    timePct: 85,
    spentPct: 83,
    donePct: 88,
    periodStart: "2024-01-01",
    periodEnd: "2025-12-31",
    nextDeadlineIso: "2025-12-01",
    nextDeadlineDisplay: "Dec 1",
    nextDeadlineLabel: "Site visit",
    needsApproval: false,
  },
  {
    id: "demo-digital-literacy",
    title: "Digital Literacy for Seniors",
    funder: "City of Riverside",
    amount: 95_000,
    timePct: 92,
    spentPct: 61,
    donePct: 70,
    periodStart: "2024-03-01",
    periodEnd: "2025-12-31",
    nextDeadlineIso: "2025-12-31",
    nextDeadlineDisplay: "Dec 31",
    nextDeadlineLabel: "End of period",
    needsApproval: false,
  },
];

/** Prototype priority cards (exact copy). */
export const DEMO_PRIORITY_ACTIONS = [
  {
    id: "demo-action-sf425",
    kind: "dueSoon",
    tagKey: "tagDueInDays",
    tagParams: { count: 4 },
    title: "Q3 federal financial report (SF-425)",
    bodyFixed:
      "Draft is assembled from reconciled actuals. Review and submit by Oct 30.",
    awardId: "demo-youth-workforce",
  },
  {
    id: "demo-action-lisbon",
    kind: "needsApproval",
    tagKey: "tagNeedsApproval",
    tagParams: {},
    title: "Lisbon conference travel is on hold",
    bodyFixed: "Foreign travel needs prior approval under §7.4. A request is ready to send.",
    awardId: "demo-stem-labs",
  },
  {
    id: "demo-action-underspent",
    kind: "atRisk",
    tagKey: "tagAtRisk",
    tagParams: {},
    title: "Digital Literacy for Seniors is underspent",
    bodyFixed: "92% of time gone, 61% spent. 66 days left to use or return $37,000.",
    awardId: "demo-digital-literacy",
  },
];
