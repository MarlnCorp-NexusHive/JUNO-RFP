/** Demo seed from Juno Workspace prototype — proposal_manager demo login only. */
export const DEMO_PW_PEOPLE = {
  "ana": {
    "n": "Ana López",
    "i": "AL",
    "c": "#4F6BFF",
    "r": "Grants manager"
  },
  "maya": {
    "n": "Maya Reed",
    "i": "MR",
    "c": "#0EA5E9",
    "r": "Program lead"
  },
  "dev": {
    "n": "Dev Patel",
    "i": "DP",
    "c": "#8B5CF6",
    "r": "Compliance"
  },
  "priya": {
    "n": "Priya Shah",
    "i": "PS",
    "c": "#F59E0B",
    "r": "Finance"
  },
  "rosa": {
    "n": "Rosa Martín",
    "i": "RM",
    "c": "#EC4899",
    "r": "Executive director"
  },
  "sam": {
    "n": "Sam Kim",
    "i": "SK",
    "c": "#14B8A6",
    "r": "Data & evaluation"
  }
};

export function getDemoProjects() {
  return [
  {
    "id": "p1",
    "name": "Youth Workforce Pathways",
    "funder": "Dept. of Labor (sample)",
    "amount": 1200000,
    "start": "2025-07-17",
    "end": "2028-07-12",
    "spent": 31,
    "done": 46,
    "color": "#4F6BFF",
    "kind": "Award",
    "pm": "ana"
  },
  {
    "id": "p5",
    "name": "EDA AI-Ready Workforce",
    "funder": "U.S. Economic Development Administration",
    "amount": 0,
    "budget": 12000,
    "spent": 33,
    "start": "2026-11-03",
    "end": "2026-11-24",
    "color": "#8B5CF6",
    "kind": "Proposal",
    "pm": "ana"
  },
  {
    "id": "p2",
    "name": "Community Health Navigators",
    "funder": "State Dept. of Health",
    "amount": 480000,
    "start": "2025-06-16",
    "end": "2027-06-16",
    "spent": 74,
    "done": 66,
    "color": "#F59E0B",
    "kind": "Award",
    "pm": "maya"
  },
  {
    "id": "p3",
    "name": "After-School STEM Labs",
    "funder": "Hartwell Foundation",
    "amount": 150000,
    "start": "2025-02-27",
    "end": "2027-02-27",
    "spent": 83,
    "done": 88,
    "color": "#10B981",
    "kind": "Award",
    "pm": "maya"
  },
  {
    "id": "p4",
    "name": "Digital Literacy for Seniors",
    "funder": "City of Riverside",
    "amount": 95000,
    "start": "2024-10-11",
    "end": "2027-01-14",
    "spent": 61,
    "done": 70,
    "color": "#EC4899",
    "kind": "Award",
    "pm": "ana"
  }
];
}

export function getDemoTasks() {
  return [
  {
    "id": "demo-t1",
    "p": "p1",
    "title": "Recruit cohort 4 (60 participants)",
    "status": "doing",
    "owner": "maya",
    "pri": "high",
    "start": "2026-11-03",
    "due": "2026-11-27",
    "est": 40,
    "clause": "§6.1",
    "line": "Personnel",
    "deps": [],
    "sub": [
      {
        "t": "Post outreach flyers",
        "d": true
      },
      {
        "t": "Partner referral calls",
        "d": true
      },
      {
        "t": "Intake interviews",
        "d": false
      },
      {
        "t": "Enroll in case system",
        "d": false
      }
    ],
    "comments": [],
    "bStart": "2026-11-03",
    "bDue": "2026-11-21",
    "base": true
  },
  {
    "id": "demo-t2",
    "p": "p1",
    "title": "Hire 2 career coaches",
    "status": "doing",
    "owner": "ana",
    "pri": "urgent",
    "start": "2026-10-15",
    "due": "2026-11-13",
    "est": 24,
    "clause": "§6.1",
    "line": "Personnel",
    "deps": [],
    "sub": [
      {
        "t": "Post roles",
        "d": true
      },
      {
        "t": "Interview finalists",
        "d": true
      },
      {
        "t": "Extend offers",
        "d": true
      },
      {
        "t": "Background checks",
        "d": false
      }
    ],
    "comments": [
      {
        "w": "rosa",
        "x": "Both offers accepted. Start dates are confirmed.",
        "d": -2
      }
    ],
    "bStart": "2026-10-05",
    "bDue": "2026-10-30",
    "base": true
  },
  {
    "id": "demo-t3",
    "p": "p1",
    "title": "Collect Q3 sign-in sheets",
    "status": "review",
    "owner": "maya",
    "pri": "med",
    "start": "2026-10-20",
    "due": "2026-11-10",
    "est": 6,
    "clause": "§4.3",
    "line": "Other direct",
    "deps": [],
    "sub": [],
    "comments": [],
    "bStart": "2026-10-20",
    "bDue": "2026-11-10",
    "base": true
  },
  {
    "id": "demo-t4",
    "p": "p1",
    "title": "Reconcile Q3 general ledger",
    "status": "done",
    "owner": "priya",
    "pri": "high",
    "start": "2026-10-20",
    "due": "2026-11-03",
    "est": 12,
    "clause": "§4.2",
    "line": "—",
    "deps": [],
    "sub": [],
    "comments": [],
    "bStart": "2026-10-20",
    "bDue": "2026-11-03",
    "base": true
  },
  {
    "id": "demo-t5",
    "p": "p1",
    "title": "Q3 SF-425 financial report",
    "status": "doing",
    "owner": "priya",
    "pri": "urgent",
    "start": "2026-11-04",
    "due": "2026-11-12",
    "est": 10,
    "clause": "§4.2",
    "line": "—",
    "deps": [
      "demo-t4"
    ],
    "sub": [
      {
        "t": "Pull reconciled actuals",
        "d": true
      },
      {
        "t": "Program income check",
        "d": false
      },
      {
        "t": "Director review",
        "d": false
      }
    ],
    "comments": [
      {
        "w": "priya",
        "x": "Draft is ready once program income is confirmed.",
        "d": -1
      }
    ],
    "bStart": "2026-11-04",
    "bDue": "2026-11-10",
    "base": true
  },
  {
    "id": "demo-t6",
    "p": "p1",
    "title": "Prepare subrecipient monitoring checklist",
    "status": "todo",
    "owner": "dev",
    "pri": "med",
    "start": "2026-11-29",
    "due": "2026-12-07",
    "est": 6,
    "clause": "§8.2",
    "line": "—",
    "deps": [],
    "sub": [],
    "comments": [],
    "bStart": "2026-11-29",
    "bDue": "2026-12-07",
    "base": true
  },
  {
    "id": "demo-t7",
    "p": "p1",
    "title": "Q4 site visit to Eastside Training Co.",
    "status": "todo",
    "owner": "dev",
    "pri": "high",
    "start": "2026-12-06",
    "due": "2026-12-11",
    "est": 16,
    "clause": "§8.2",
    "line": "Travel",
    "deps": [
      "demo-t6"
    ],
    "sub": [],
    "comments": [],
    "bStart": "2026-12-06",
    "bDue": "2026-12-11",
    "base": true
  },
  {
    "id": "demo-t8",
    "p": "p1",
    "title": "Foreign travel prior-approval request",
    "status": "todo",
    "owner": "ana",
    "pri": "high",
    "start": "2026-11-11",
    "due": "2026-11-18",
    "est": 3,
    "clause": "§7.4",
    "line": "Travel",
    "deps": [],
    "sub": [],
    "comments": [],
    "bStart": "2026-11-11",
    "bDue": "2026-11-18",
    "base": true
  },
  {
    "id": "demo-t9",
    "p": "p1",
    "title": "Close program data (roster, outcomes)",
    "status": "todo",
    "owner": "sam",
    "pri": "high",
    "start": "2026-12-15",
    "due": "2026-12-31",
    "est": 14,
    "clause": "§6.1",
    "line": "—",
    "deps": [
      "demo-t1"
    ],
    "sub": [],
    "comments": [],
    "bStart": "2026-12-15",
    "bDue": "2026-12-31",
    "base": true
  },
  {
    "id": "demo-t10",
    "p": "p1",
    "title": "Draft semi-annual narrative",
    "status": "backlog",
    "owner": "ana",
    "pri": "high",
    "start": "2027-01-01",
    "due": "2027-01-18",
    "est": 20,
    "clause": "§4.3",
    "line": "—",
    "deps": [
      "demo-t9",
      "demo-t3"
    ],
    "sub": [],
    "comments": [],
    "bStart": "2027-01-01",
    "bDue": "2027-01-18",
    "base": true
  },
  {
    "id": "demo-t11",
    "p": "p1",
    "title": "Reconcile figures for semi-annual report",
    "status": "backlog",
    "owner": "priya",
    "pri": "med",
    "start": "2027-01-03",
    "due": "2027-01-12",
    "est": 8,
    "clause": "§4.2",
    "line": "—",
    "deps": [
      "demo-t5"
    ],
    "sub": [],
    "comments": [],
    "bStart": "2027-01-03",
    "bDue": "2027-01-12",
    "base": true
  },
  {
    "id": "demo-t12",
    "p": "p1",
    "title": "Internal review of report",
    "status": "backlog",
    "owner": "rosa",
    "pri": "med",
    "start": "2027-01-19",
    "due": "2027-01-22",
    "est": 4,
    "clause": "§4.3",
    "line": "—",
    "deps": [
      "demo-t10",
      "demo-t11"
    ],
    "sub": [],
    "comments": [],
    "bStart": "2027-01-19",
    "bDue": "2027-01-22",
    "base": true
  },
  {
    "id": "demo-t13",
    "p": "p1",
    "title": "Submit semi-annual report to funder",
    "status": "backlog",
    "owner": "ana",
    "pri": "urgent",
    "start": "2027-01-25",
    "due": "2027-01-25",
    "est": 1,
    "clause": "§4.3",
    "line": "—",
    "deps": [
      "demo-t12"
    ],
    "sub": [],
    "comments": [],
    "ms": true,
    "bStart": "2027-01-25",
    "bDue": "2027-01-25",
    "base": true
  },
  {
    "id": "demo-t14",
    "p": "p1",
    "title": "Employer partner summit",
    "status": "todo",
    "owner": "maya",
    "pri": "med",
    "start": "2026-11-21",
    "due": "2026-11-22",
    "est": 10,
    "clause": "§6.1",
    "line": "Other direct",
    "deps": [],
    "sub": [],
    "comments": [],
    "bStart": "2026-11-21",
    "bDue": "2026-11-22",
    "base": true
  },
  {
    "id": "demo-t15",
    "p": "p1",
    "title": "Cohort 3 graduation (58 completers)",
    "status": "done",
    "owner": "maya",
    "pri": "med",
    "start": "2026-09-30",
    "due": "2026-10-14",
    "est": 12,
    "clause": "§6.1",
    "line": "Other direct",
    "deps": [],
    "sub": [],
    "comments": [],
    "bStart": "2026-09-30",
    "bDue": "2026-10-14",
    "base": true
  },
  {
    "id": "demo-t16",
    "p": "p1",
    "title": "Placement follow-up calls (41 placed)",
    "status": "doing",
    "owner": "sam",
    "pri": "med",
    "start": "2026-11-01",
    "due": "2026-11-19",
    "est": 12,
    "clause": "§6.1",
    "line": "—",
    "deps": [],
    "sub": [],
    "comments": [],
    "bStart": "2026-11-01",
    "bDue": "2026-11-19",
    "base": true
  },
  {
    "id": "demo-t17",
    "p": "p1",
    "title": "Update evaluation dashboard",
    "status": "backlog",
    "owner": "sam",
    "pri": "low",
    "start": "2026-11-23",
    "due": "2026-12-03",
    "est": 8,
    "clause": "§6.1",
    "line": "—",
    "deps": [],
    "sub": [],
    "comments": [],
    "bStart": "2026-11-23",
    "bDue": "2026-12-03",
    "base": true
  },
  {
    "id": "demo-t18",
    "p": "p1",
    "title": "Rebudget $40K Personnel → Contractual",
    "status": "review",
    "owner": "priya",
    "pri": "high",
    "start": "2026-11-06",
    "due": "2026-11-14",
    "est": 3,
    "clause": "§5.2",
    "line": "Contractual",
    "deps": [],
    "sub": [],
    "comments": [],
    "bStart": "2026-11-06",
    "bDue": "2026-11-14",
    "base": false
  },
  {
    "id": "demo-t19",
    "p": "p1",
    "title": "Upload Q3 evidence to award file",
    "status": "todo",
    "owner": "dev",
    "pri": "high",
    "start": "2026-10-31",
    "due": "2026-11-07",
    "est": 3,
    "clause": "§4.3",
    "line": "—",
    "deps": [],
    "sub": [],
    "comments": [],
    "bStart": "2026-10-31",
    "bDue": "2026-11-07",
    "base": false
  },
  {
    "id": "demo-t20",
    "p": "p5",
    "title": "Extract requirements and compliance matrix",
    "status": "done",
    "owner": "ana",
    "pri": "high",
    "start": "2026-11-03",
    "due": "2026-11-04",
    "est": 4,
    "clause": "NOFO",
    "line": "—",
    "deps": [],
    "sub": [],
    "comments": [],
    "bStart": "2026-11-03",
    "bDue": "2026-11-04",
    "base": true
  },
  {
    "id": "demo-t21",
    "p": "p5",
    "title": "Narrative: AI upskilling and technical assistance",
    "status": "doing",
    "owner": "ana",
    "pri": "urgent",
    "start": "2026-11-05",
    "due": "2026-11-15",
    "est": 16,
    "clause": "NOFO",
    "line": "—",
    "deps": [
      "demo-t20"
    ],
    "sub": [
      {
        "t": "Need statement",
        "d": true
      },
      {
        "t": "Logic model",
        "d": true
      },
      {
        "t": "Evaluation plan",
        "d": false
      },
      {
        "t": "Sustainability",
        "d": false
      }
    ],
    "comments": [],
    "bStart": "2026-11-05",
    "bDue": "2026-11-13",
    "base": true
  },
  {
    "id": "demo-t22",
    "p": "p5",
    "title": "Letters of support from employers",
    "status": "doing",
    "owner": "maya",
    "pri": "high",
    "start": "2026-11-06",
    "due": "2026-11-17",
    "est": 8,
    "clause": "NOFO",
    "line": "—",
    "deps": [],
    "sub": [],
    "comments": [],
    "bStart": "2026-11-06",
    "bDue": "2026-11-17",
    "base": true
  },
  {
    "id": "demo-t23",
    "p": "p5",
    "title": "Budget and budget justification",
    "status": "todo",
    "owner": "priya",
    "pri": "high",
    "start": "2026-11-11",
    "due": "2026-11-17",
    "est": 10,
    "clause": "NOFO",
    "line": "—",
    "deps": [
      "demo-t20"
    ],
    "sub": [],
    "comments": [],
    "bStart": "2026-11-11",
    "bDue": "2026-11-17",
    "base": true
  },
  {
    "id": "demo-t24",
    "p": "p5",
    "title": "SF-424 forms and certifications",
    "status": "todo",
    "owner": "dev",
    "pri": "med",
    "start": "2026-11-18",
    "due": "2026-11-20",
    "est": 4,
    "clause": "NOFO",
    "line": "—",
    "deps": [
      "demo-t23"
    ],
    "sub": [],
    "comments": [],
    "bStart": "2026-11-18",
    "bDue": "2026-11-20",
    "base": true
  },
  {
    "id": "demo-t25",
    "p": "p5",
    "title": "Red team review",
    "status": "todo",
    "owner": "rosa",
    "pri": "high",
    "start": "2026-11-21",
    "due": "2026-11-22",
    "est": 6,
    "clause": "NOFO",
    "line": "—",
    "deps": [
      "demo-t21",
      "demo-t23"
    ],
    "sub": [],
    "comments": [],
    "bStart": "2026-11-21",
    "bDue": "2026-11-22",
    "base": true
  },
  {
    "id": "demo-t26",
    "p": "p5",
    "title": "Submit on Grants.gov",
    "status": "backlog",
    "owner": "ana",
    "pri": "urgent",
    "start": "2026-11-24",
    "due": "2026-11-24",
    "est": 2,
    "clause": "NOFO",
    "line": "—",
    "deps": [
      "demo-t25",
      "demo-t24"
    ],
    "sub": [],
    "comments": [],
    "ms": true,
    "bStart": "2026-11-24",
    "bDue": "2026-11-24",
    "base": true
  },
  {
    "id": "demo-t27",
    "p": "p2",
    "title": "Quarterly progress report",
    "status": "doing",
    "owner": "ana",
    "pri": "high",
    "start": "2026-10-30",
    "due": "2026-11-18",
    "est": 8,
    "clause": "—",
    "line": "—",
    "deps": [],
    "sub": [],
    "comments": [],
    "bStart": "2026-10-30",
    "bDue": "2026-11-18",
    "base": true
  },
  {
    "id": "demo-t28",
    "p": "p2",
    "title": "Navigator training session 3",
    "status": "todo",
    "owner": "maya",
    "pri": "med",
    "start": "2026-11-15",
    "due": "2026-11-16",
    "est": 12,
    "clause": "—",
    "line": "—",
    "deps": [],
    "sub": [],
    "comments": [],
    "bStart": "2026-11-15",
    "bDue": "2026-11-16",
    "base": true
  },
  {
    "id": "demo-t29",
    "p": "p2",
    "title": "Partner MOU renewal",
    "status": "review",
    "owner": "rosa",
    "pri": "med",
    "start": "2026-10-28",
    "due": "2026-11-11",
    "est": 4,
    "clause": "—",
    "line": "—",
    "deps": [],
    "sub": [],
    "comments": [],
    "bStart": "2026-10-28",
    "bDue": "2026-11-11",
    "base": true
  },
  {
    "id": "demo-t30",
    "p": "p3",
    "title": "Site visit with Hartwell Foundation",
    "status": "todo",
    "owner": "ana",
    "pri": "high",
    "start": "2026-11-29",
    "due": "2026-11-29",
    "est": 6,
    "clause": "—",
    "line": "—",
    "deps": [],
    "sub": [],
    "comments": [],
    "ms": true,
    "bStart": "2026-11-29",
    "bDue": "2026-11-29",
    "base": true
  },
  {
    "id": "demo-t31",
    "p": "p3",
    "title": "Spring lab kit order",
    "status": "todo",
    "owner": "priya",
    "pri": "low",
    "start": "2026-11-24",
    "due": "2026-12-01",
    "est": 3,
    "clause": "—",
    "line": "Supplies",
    "deps": [],
    "sub": [],
    "comments": [],
    "bStart": "2026-11-24",
    "bDue": "2026-12-01",
    "base": true
  },
  {
    "id": "demo-t32",
    "p": "p4",
    "title": "Spend-down plan for remaining $37,000",
    "status": "todo",
    "owner": "ana",
    "pri": "urgent",
    "start": "2026-11-08",
    "due": "2026-11-15",
    "est": 6,
    "clause": "—",
    "line": "—",
    "deps": [],
    "sub": [],
    "comments": [],
    "bStart": "2026-11-08",
    "bDue": "2026-11-15",
    "base": false
  },
  {
    "id": "demo-t33",
    "p": "p4",
    "title": "Final outcomes survey",
    "status": "todo",
    "owner": "sam",
    "pri": "high",
    "start": "2026-11-29",
    "due": "2026-12-24",
    "est": 10,
    "clause": "—",
    "line": "—",
    "deps": [],
    "sub": [],
    "comments": [],
    "bStart": "2026-11-29",
    "bDue": "2026-12-24",
    "base": true
  },
  {
    "id": "demo-t34",
    "p": "p4",
    "title": "Closeout checklist",
    "status": "backlog",
    "owner": "dev",
    "pri": "med",
    "start": "2026-12-29",
    "due": "2027-01-14",
    "est": 8,
    "clause": "—",
    "line": "—",
    "deps": [
      "demo-t33"
    ],
    "sub": [],
    "comments": [],
    "bStart": "2026-12-29",
    "bDue": "2027-01-14",
    "base": true
  }
];
}

export function getDemoUpdates() {
  return [
  {
    "id": "demo-u1",
    "p": "p1",
    "rag": "y",
    "w": "ana",
    "d": "2026-11-08",
    "t": "Cohort 4 recruiting is on track; coach hires accepted. SF-425 draft waits on program income confirmation."
  },
  {
    "id": "demo-u2",
    "p": "p5",
    "rag": "g",
    "w": "ana",
    "d": "2026-11-09",
    "t": "Narrative in progress; employer letters underway. Submission window still comfortable."
  },
  {
    "id": "demo-u3",
    "p": "p4",
    "rag": "r",
    "w": "ana",
    "d": "2026-11-07",
    "t": "Spend lagging vs. time elapsed — spend-down plan due this week."
  }
];
}
