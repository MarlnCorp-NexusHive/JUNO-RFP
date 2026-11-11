import fs from "fs";

const off = (n) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

let n = 0;
const T = (p, title, status, owner, pri, s, d, est, clause, line, deps, sub, extra) =>
  Object.assign(
    {
      id: "demo-t" + ++n,
      p,
      title,
      status,
      owner,
      pri,
      start: off(s),
      due: off(d),
      est,
      clause: clause || "—",
      line: line || "—",
      deps: deps || [],
      sub: (sub || []).map((x) => ({ t: x.replace(/^\+/, ""), d: x[0] === "+" })),
      comments: [],
    },
    extra || {},
  );

const a = [
  T("p1", "Recruit cohort 4 (60 participants)", "doing", "maya", "high", -6, 18, 40, "§6.1", "Personnel", [], ["+Post outreach flyers", "+Partner referral calls", "Intake interviews", "Enroll in case system"]),
  T("p1", "Hire 2 career coaches", "doing", "ana", "urgent", -25, 4, 24, "§6.1", "Personnel", [], ["+Post roles", "+Interview finalists", "+Extend offers", "Background checks"]),
  T("p1", "Collect Q3 sign-in sheets", "review", "maya", "med", -20, 1, 6, "§4.3", "Other direct"),
  T("p1", "Reconcile Q3 general ledger", "done", "priya", "high", -20, -6, 12, "§4.2", "—"),
  T("p1", "Q3 SF-425 financial report", "doing", "priya", "urgent", -5, 3, 10, "§4.2", "—", ["demo-t4"], ["+Pull reconciled actuals", "Program income check", "Director review"]),
  T("p1", "Prepare subrecipient monitoring checklist", "todo", "dev", "med", 20, 28, 6, "§8.2", "—"),
  T("p1", "Q4 site visit to Eastside Training Co.", "todo", "dev", "high", 27, 32, 16, "§8.2", "Travel", ["demo-t6"]),
  T("p1", "Foreign travel prior-approval request", "todo", "ana", "high", 2, 9, 3, "§7.4", "Travel"),
  T("p1", "Close program data (roster, outcomes)", "todo", "sam", "high", 36, 52, 14, "§6.1", "—", ["demo-t1"]),
  T("p1", "Draft semi-annual narrative", "backlog", "ana", "high", 53, 70, 20, "§4.3", "—", ["demo-t9", "demo-t3"]),
  T("p1", "Reconcile figures for semi-annual report", "backlog", "priya", "med", 55, 64, 8, "§4.2", "—", ["demo-t5"]),
  T("p1", "Internal review of report", "backlog", "rosa", "med", 71, 74, 4, "§4.3", "—", ["demo-t10", "demo-t11"]),
  T("p1", "Submit semi-annual report to funder", "backlog", "ana", "urgent", 77, 77, 1, "§4.3", "—", ["demo-t12"], [], { ms: true }),
  T("p1", "Employer partner summit", "todo", "maya", "med", 12, 13, 10, "§6.1", "Other direct"),
  T("p1", "Cohort 3 graduation (58 completers)", "done", "maya", "med", -40, -26, 12, "§6.1", "Other direct"),
  T("p1", "Placement follow-up calls (41 placed)", "doing", "sam", "med", -8, 10, 12, "§6.1", "—"),
  T("p1", "Update evaluation dashboard", "backlog", "sam", "low", 14, 24, 8, "§6.1", "—"),
  T("p1", "Rebudget $40K Personnel → Contractual", "review", "priya", "high", -3, 5, 3, "§5.2", "Contractual"),
  T("p1", "Upload Q3 evidence to award file", "todo", "dev", "high", -9, -2, 3, "§4.3", "—"),
  T("p5", "Extract requirements and compliance matrix", "done", "ana", "high", -6, -5, 4, "NOFO"),
  T("p5", "Narrative: AI upskilling and technical assistance", "doing", "ana", "urgent", -4, 6, 16, "NOFO", "—", ["demo-t20"], ["+Need statement", "+Logic model", "Evaluation plan", "Sustainability"]),
  T("p5", "Letters of support from employers", "doing", "maya", "high", -3, 8, 8, "NOFO"),
  T("p5", "Budget and budget justification", "todo", "priya", "high", 2, 8, 10, "NOFO", "—", ["demo-t20"]),
  T("p5", "SF-424 forms and certifications", "todo", "dev", "med", 9, 11, 4, "NOFO", "—", ["demo-t23"]),
  T("p5", "Red team review", "todo", "rosa", "high", 12, 13, 6, "NOFO", "—", ["demo-t21", "demo-t23"]),
  T("p5", "Submit on Grants.gov", "backlog", "ana", "urgent", 15, 15, 2, "NOFO", "—", ["demo-t25", "demo-t24"], [], { ms: true }),
  T("p2", "Quarterly progress report", "doing", "ana", "high", -10, 9, 8, "—"),
  T("p2", "Navigator training session 3", "todo", "maya", "med", 6, 7, 12, "—"),
  T("p2", "Partner MOU renewal", "review", "rosa", "med", -12, 2, 4, "—"),
  T("p3", "Site visit with Hartwell Foundation", "todo", "ana", "high", 20, 20, 6, "—", "—", [], [], { ms: true }),
  T("p3", "Spring lab kit order", "todo", "priya", "low", 15, 22, 3, "—", "Supplies"),
  T("p4", "Spend-down plan for remaining $37,000", "todo", "ana", "urgent", -1, 6, 6, "—"),
  T("p4", "Final outcomes survey", "todo", "sam", "high", 20, 45, 10, "—"),
  T("p4", "Closeout checklist", "backlog", "dev", "med", 50, 66, 8, "—", "—", ["demo-t33"]),
];

a.forEach((t) => {
  t.bStart = t.start;
  t.bDue = t.due;
  t.base = true;
});
a[0].bDue = off(12);
a[1].bStart = off(-35);
a[1].bDue = off(-10);
a[4].bDue = off(1);
a[20].bDue = off(4);
a[17].base = false;
a[18].base = false;
a[31].base = false;
a[1].comments = [{ w: "rosa", x: "Both offers accepted. Start dates are confirmed.", d: -2 }];
a[4].comments = [{ w: "priya", x: "Draft is ready once program income is confirmed.", d: -1 }];

const projects = [
  { id: "p1", name: "Youth Workforce Pathways", funder: "Dept. of Labor (sample)", amount: 1200000, start: off(-480), end: off(611), spent: 31, done: 46, color: "#4F6BFF", kind: "Award", pm: "ana" },
  { id: "p5", name: "EDA AI-Ready Workforce", funder: "U.S. Economic Development Administration", amount: 0, budget: 12000, spent: 33, start: off(-6), end: off(15), color: "#8B5CF6", kind: "Proposal", pm: "ana" },
  { id: "p2", name: "Community Health Navigators", funder: "State Dept. of Health", amount: 480000, start: off(-511), end: off(219), spent: 74, done: 66, color: "#F59E0B", kind: "Award", pm: "maya" },
  { id: "p3", name: "After-School STEM Labs", funder: "Hartwell Foundation", amount: 150000, start: off(-620), end: off(110), spent: 83, done: 88, color: "#10B981", kind: "Award", pm: "maya" },
  { id: "p4", name: "Digital Literacy for Seniors", funder: "City of Riverside", amount: 95000, start: off(-759), end: off(66), spent: 61, done: 70, color: "#EC4899", kind: "Award", pm: "ana" },
];

const people = {
  ana: { n: "Ana López", i: "AL", c: "#4F6BFF", r: "Grants manager" },
  maya: { n: "Maya Reed", i: "MR", c: "#0EA5E9", r: "Program lead" },
  dev: { n: "Dev Patel", i: "DP", c: "#8B5CF6", r: "Compliance" },
  priya: { n: "Priya Shah", i: "PS", c: "#F59E0B", r: "Finance" },
  rosa: { n: "Rosa Martín", i: "RM", c: "#EC4899", r: "Executive director" },
  sam: { n: "Sam Kim", i: "SK", c: "#14B8A6", r: "Data & evaluation" },
};

const updates = [
  { id: "demo-u1", p: "p1", rag: "y", w: "ana", d: off(-1), t: "Cohort 4 recruiting is on track; coach hires accepted. SF-425 draft waits on program income confirmation." },
  { id: "demo-u2", p: "p5", rag: "g", w: "ana", d: off(0), t: "Narrative in progress; employer letters underway. Submission window still comfortable." },
  { id: "demo-u3", p: "p4", rag: "r", w: "ana", d: off(-2), t: "Spend lagging vs. time elapsed — spend-down plan due this week." },
];

const out = `/** Demo seed from Juno Workspace prototype — proposal_manager demo login only. */
export const DEMO_PW_PEOPLE = ${JSON.stringify(people, null, 2)};

export function getDemoProjects() {
  return ${JSON.stringify(projects, null, 2)};
}

export function getDemoTasks() {
  return ${JSON.stringify(a, null, 2)};
}

export function getDemoUpdates() {
  return ${JSON.stringify(updates, null, 2)};
}
`;

const dest = new URL("../src/features/proposal-manager/data/projectWorkspaceDemoData.js", import.meta.url);
fs.writeFileSync(dest, out);
console.log("wrote", dest.pathname, "tasks", a.length);
