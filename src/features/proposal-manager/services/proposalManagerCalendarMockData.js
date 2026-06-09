const COLORS = {
  deadline: "#dc2626",
  milestone: "#ea580c",
  meeting: "#2563eb",
  assignment: "#7c3aed",
  submission: "#16a34a",
  review: "#0891b2",
  task: "#6366f1",
};

const BIDS = [
  "Water Wastewater RFP",
  "Landscape Maintenance",
  "Airport Restaurant Concession",
  "Balsitis Playground",
  "Surplus Tanks IDIQ",
  "Innospec Chemical Services",
  "DoD IT Services — Solicitation 2026-084",
];

const AUDITORS = ["Aiyana Yazzie", "Chayton Bitsui", "Talise Nez", "Kiona Tsosie"];
const WRITERS = ["Jordan Mitchell", "Michael Anderson", "Sarah Chen", "David Park"];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function dateAtOffset(base, dayOffset) {
  const d = new Date(base);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  return d;
}

function isoDay(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function isoDateTime(d, hour, minute = 0) {
  const x = new Date(d);
  x.setHours(hour, minute, 0, 0);
  return x.toISOString();
}

function ev(partial) {
  const type = partial.type || "meeting";
  return {
    source: "demo",
    allDay: partial.allDay ?? true,
    color: COLORS[type],
    assigneeNames: partial.assigneeNames || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
    type,
  };
}

/** Rich demo schedule anchored to the current date — fills month/week views. */
export function generateMockCalendarEvents() {
  const today = new Date();
  const events = [];
  let seq = 0;
  const id = (suffix) => `mock_${seq++}_${suffix}`;

  const addDay = (dayOffset, items) => {
    const day = dateAtOffset(today, dayOffset);
    const dayIso = isoDay(day);
    for (const item of items) {
      events.push(
        ev({
          id: id(`${dayIso}_${item.type}`),
          start: item.time ? isoDateTime(day, item.time[0], item.time[1]) : dayIso,
          allDay: !item.time,
          ...item,
        }),
      );
    }
  };

  // —— Past 3 weeks ——
  addDay(-18, [
    { type: "milestone", title: "Capture decision — Surplus Tanks", bidName: BIDS[4], description: "Go decision recorded. Pursuit approved." },
    { type: "meeting", title: "Kickoff — Water Wastewater", bidName: BIDS[0], time: [10, 0], location: "Conference Room A", assigneeNames: WRITERS.slice(0, 3), description: "RFP review, assignments, schedule." },
  ]);
  addDay(-15, [
    { type: "assignment", title: "Q1–Q6 assigned to writers", bidName: BIDS[0], assigneeNames: [AUDITORS[0], AUDITORS[1]] },
    { type: "task", title: "Pricing model draft started", bidName: BIDS[1], assigneeNames: [WRITERS[2]] },
  ]);
  addDay(-12, [
    { type: "meeting", title: "Color team — Landscape Maintenance", bidName: BIDS[1], time: [14, 0], location: "Project Center", assigneeNames: WRITERS },
    { type: "submission", title: "Chayton submitted Q4", bidName: BIDS[0], assigneeNames: [AUDITORS[1]] },
  ]);
  addDay(-10, [
    { type: "review", title: "PM approved Q4 — Water Wastewater", bidName: BIDS[0], assigneeNames: [WRITERS[0]] },
    { type: "deadline", title: "Questions due — Airport Restaurant", bidName: BIDS[2], description: "Final date for written inquiries to contracting officer." },
  ]);
  addDay(-7, [
    { type: "meeting", title: "Compliance sync", bidName: BIDS[2], time: [11, 0], location: "Teams", assigneeNames: [AUDITORS[2], WRITERS[1]] },
    { type: "submission", title: "Aiyana submitted Q12", bidName: BIDS[5], assigneeNames: [AUDITORS[0]] },
  ]);
  addDay(-5, [
    { type: "milestone", title: "Pink team review complete", bidName: BIDS[1], description: "Draft 60% complete. Gap list issued." },
    { type: "assignment", title: "Graphics package assigned", bidName: BIDS[2], assigneeNames: [WRITERS[3]] },
  ]);
  addDay(-3, [
    { type: "review", title: "Changes requested — Q12 Innospec", bidName: BIDS[5], assigneeNames: [AUDITORS[0]] },
    { type: "task", title: "BOE refresh — Landscape", bidName: BIDS[1], assigneeNames: [WRITERS[2]] },
  ]);
  addDay(-1, [
    { type: "submission", title: "Talise submitted Q9", bidName: BIDS[2], assigneeNames: [AUDITORS[2]] },
    { type: "meeting", title: "Daily stand-up", bidName: "All active bids", time: [9, 0], location: "War Room", assigneeNames: WRITERS },
  ]);

  // —— Current week (dense) ——
  addDay(0, [
    { type: "meeting", title: "Proposal war room — today", bidName: BIDS[0], time: [9, 30], location: "War Room", assigneeNames: WRITERS },
    { type: "task", title: "Kiona in progress — Q7", bidName: BIDS[5], assigneeNames: [AUDITORS[3]] },
    { type: "review", title: "Awaiting PM review — Q9", bidName: BIDS[2], assigneeNames: [AUDITORS[2]] },
    { type: "milestone", title: "48h to internal draft freeze", bidName: BIDS[1], description: "All sections locked except pricing." },
  ]);
  addDay(1, [
    { type: "meeting", title: "Red team prep", bidName: BIDS[2], time: [13, 0], location: "Main Conference", assigneeNames: WRITERS.slice(0, 3) },
    { type: "assignment", title: "Q15–Q18 → auditors", bidName: BIDS[5], assigneeNames: AUDITORS },
  ]);
  addDay(2, [
    { type: "deadline", title: "Internal draft due — Landscape", bidName: BIDS[1], description: "Complete technical + management volumes." },
    { type: "submission", title: "Chayton submitted Q15", bidName: BIDS[5], assigneeNames: [AUDITORS[1]] },
  ]);
  addDay(3, [
    { type: "meeting", title: "Pricing lock meeting", bidName: BIDS[1], time: [10, 0], location: "CFO office", assigneeNames: [WRITERS[2], WRITERS[0]] },
    { type: "task", title: "Graphics final pass", bidName: BIDS[2], assigneeNames: [WRITERS[3]] },
  ]);
  addDay(4, [
    { type: "meeting", title: "Red team — Airport Restaurant", bidName: BIDS[2], time: [9, 30], location: "Main Conference", assigneeNames: [...WRITERS, ...AUDITORS.slice(0, 2)] },
    { type: "review", title: "Red team findings issued", bidName: BIDS[2], description: "12 action items; owners assigned." },
  ]);
  addDay(5, [
    { type: "milestone", title: "Compliance matrix 100%", bidName: BIDS[0], assigneeNames: [AUDITORS[2]] },
    { type: "submission", title: "Aiyana submitted Q18", bidName: BIDS[5], assigneeNames: [AUDITORS[0]] },
  ]);
  addDay(6, [
    { type: "meeting", title: "Executive read-through", bidName: BIDS[1], time: [15, 0], location: "Board room", assigneeNames: [WRITERS[0]] },
    { type: "task", title: "Print & bind prep", bidName: BIDS[1], assigneeNames: [WRITERS[3]] },
  ]);

  // —— Next 5 weeks ——
  addDay(8, [
    { type: "deadline", title: "Site visit — Water Wastewater", bidName: BIDS[0], description: "Mandatory pre-proposal conference." },
    { type: "assignment", title: "Final QA sweep assigned", bidName: BIDS[1], assigneeNames: AUDITORS },
  ]);
  addDay(11, [
    { type: "meeting", title: "Gold team review", bidName: BIDS[0], time: [10, 0], location: "War Room", assigneeNames: WRITERS },
    { type: "milestone", title: "90% draft complete", bidName: BIDS[0] },
  ]);
  addDay(14, [
    { type: "deadline", title: "Proposal submission — Landscape", bidName: BIDS[1], description: "SAM upload + hard copy to agency." },
    { type: "meeting", title: "Submission rehearsal", bidName: BIDS[1], time: [8, 0], location: "War Room", assigneeNames: WRITERS },
  ]);
  addDay(17, [
    { type: "review", title: "Final PM sign-off — Balsitis", bidName: BIDS[3], assigneeNames: [WRITERS[0]] },
    { type: "submission", title: "All volumes submitted", bidName: BIDS[3], assigneeNames: WRITERS },
  ]);
  addDay(18, [
    { type: "deadline", title: "Submission deadline — Balsitis Playground", bidName: BIDS[3], description: "Final packaging, upload, sign-off." },
  ]);
  addDay(21, [
    { type: "meeting", title: "Lessons learned — Landscape", bidName: BIDS[1], time: [14, 0], location: "Teams", assigneeNames: WRITERS },
    { type: "milestone", title: "Debrief scheduled — Airport", bidName: BIDS[2] },
  ]);
  addDay(24, [
    { type: "deadline", title: "Proposal due — Airport Restaurant", bidName: BIDS[2] },
    { type: "task", title: "Ship hard copies", bidName: BIDS[2], assigneeNames: [WRITERS[3]] },
  ]);
  addDay(28, [
    { type: "meeting", title: "Oral presentation prep", bidName: BIDS[0], time: [11, 0], location: "Studio B", assigneeNames: WRITERS.slice(0, 2) },
    { type: "milestone", title: "Oral presentation scheduled", bidName: BIDS[0], description: "June 30 — 45 min + Q&A." },
  ]);
  addDay(32, [
    { type: "deadline", title: "Submission — DoD IT Services", bidName: BIDS[6] },
    { type: "review", title: "Final compliance check", bidName: BIDS[6], assigneeNames: [AUDITORS[2]] },
  ]);
  addDay(35, [
    { type: "meeting", title: "Industry day follow-up", bidName: BIDS[4], time: [13, 30], location: "Virtual", assigneeNames: [WRITERS[0]] },
  ]);
  addDay(40, [
    { type: "deadline", title: "IDIQ response due — Surplus Tanks", bidName: BIDS[4] },
    { type: "milestone", title: "Pipeline review Q3", bidName: "Portfolio", description: "Director + capture leads." },
  ]);
  addDay(45, [
    { type: "meeting", title: "Award notification window opens", bidName: BIDS[1], time: [9, 0], location: "—", assigneeNames: [WRITERS[0]] },
  ]);

  // Sprinkle extra tasks on weekdays in current month
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    const off = Math.round((d - today) / 86400000);
    if (off < -20 || off > 25) continue;
    const bid = BIDS[Math.abs(off) % BIDS.length];
    const aud = AUDITORS[Math.abs(off) % AUDITORS.length];
    if (off % 4 === 0) {
      events.push(
        ev({
          id: id(`daily_${isoDay(d)}`),
          type: "task",
          title: `Writer check-in — ${aud.split(" ")[0]}`,
          start: isoDay(d),
          bidName: bid,
          assigneeNames: [aud],
          description: "Daily progress ping on assigned sections.",
        }),
      );
    }
  }

  return events;
}

export function getMockTeamSummary() {
  return {
    workspaces: 7,
    auditors: [
      { id: "demo_1", name: "Aiyana Yazzie", email: "aiyana@juno", assigned: 2, inProgress: 4, submitted: 3, approved: 11, changesRequested: 1, total: 21 },
      { id: "demo_2", name: "Chayton Bitsui", email: "chayton@juno", assigned: 1, inProgress: 3, submitted: 2, approved: 9, changesRequested: 0, total: 15 },
      { id: "demo_3", name: "Talise Nez", email: "talise@juno", assigned: 3, inProgress: 2, submitted: 4, approved: 8, changesRequested: 2, total: 19 },
      { id: "demo_4", name: "Kiona Tsosie", email: "kiona@juno", assigned: 2, inProgress: 5, submitted: 1, approved: 6, changesRequested: 1, total: 15 },
    ],
    totals: {
      unassigned: 12,
      assigned: 22,
      submitted: 10,
      approved: 34,
    },
  };
}

export const EVENT_TYPE_ICONS = {
  deadline: "⏰",
  meeting: "📅",
  milestone: "🎯",
  assignment: "📌",
  submission: "✅",
  review: "🔍",
  task: "📋",
};
