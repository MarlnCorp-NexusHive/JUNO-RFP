import { getDocuments } from "./proposalManagerStorage.js";
import { calendarApi } from "../../../services/calendarApi.js";
import {
  generateMockCalendarEvents,
  getMockTeamSummary,
} from "./proposalManagerCalendarMockData.js";

/** Demo schedule merged with live API data for a full, polished calendar view. */
const USE_MOCK_CALENDAR = true;

const MONTHS = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** @returns {string|null} YYYY-MM-DD */
export function parseDateToISO(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) {
    let y = Number(slash[3]);
    if (y < 100) y += 2000;
    const m = Number(slash[1]);
    const d = Number(slash[2]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return `${y}-${pad2(m)}-${pad2(d)}`;
  }

  const named = raw.match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (named) {
    const mon = MONTHS[named[1].toLowerCase()];
    if (mon != null) {
      const d = Number(named[2]);
      const y = Number(named[3]);
      return `${y}-${pad2(mon + 1)}-${pad2(d)}`;
    }
  }

  const dmy = raw.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (dmy) {
    const mon = MONTHS[dmy[2].toLowerCase()];
    if (mon != null) {
      return `${dmy[3]}-${pad2(mon + 1)}-${pad2(dmy[1])}`;
    }
  }

  const dt = new Date(raw);
  if (!Number.isNaN(dt.getTime())) {
    return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
  }
  return null;
}

const DEADLINE_FACT_KEYS = new Set([
  "proposal_due_date",
  "questions_due_date",
]);

const DEADLINE_KEY_RE = /due|deadline|submission|questions?_due/i;

const DEADLINE_LABELS = {
  proposal_due_date: "Proposal submission deadline",
  questions_due_date: "Questions due",
};

/** Build deadline payloads for /calendar/sync-deadlines from workspace source docs. */
export function buildDeadlineSyncPayload() {
  const docs = getDocuments();
  const events = [];

  for (const doc of docs) {
    const bidName = doc.name || "RFP document";
    for (const fact of doc.extractedFacts || []) {
      if (!fact?.key || !fact?.value) continue;
      const isDeadline =
        DEADLINE_FACT_KEYS.has(fact.key) || DEADLINE_KEY_RE.test(String(fact.key));
      if (!isDeadline) continue;
      const iso = parseDateToISO(fact.value);
      if (!iso) continue;
      const label = DEADLINE_LABELS[fact.key] || String(fact.key).replace(/_/g, " ");
      events.push({
        stableKey: `${doc.id}_${fact.key}_${iso}`,
        title: `${label}: ${bidName}`,
        start: iso,
        allDay: true,
        documentId: doc.id,
        bidName,
        description: fact.value,
        type: "deadline",
      });
    }
  }

  return events;
}

export async function syncRfpDeadlinesFromStorage() {
  const events = buildDeadlineSyncPayload();
  if (events.length === 0) return { synced: 0 };
  const { data } = await calendarApi.syncDeadlines(events);
  return data;
}

function mergeEvents(live, mock) {
  const byId = new Map();
  for (const ev of mock) byId.set(ev.id, ev);
  for (const ev of live) byId.set(ev.id, ev);
  return [...byId.values()].sort((a, b) => String(a.start).localeCompare(String(b.start)));
}

function mergeTeamSummary(live, mock) {
  if (!live?.auditors?.length) return mock;
  const mockAuditors = mock.auditors || [];
  const mergedAuditors = live.auditors.map((a, i) => ({
    ...mockAuditors[i % mockAuditors.length],
    ...a,
    name: a.name || mockAuditors[i % mockAuditors.length]?.name,
  }));
  return {
    ...mock,
    ...live,
    auditors: mergedAuditors.length ? mergedAuditors : mock.auditors,
    totals: {
      ...mock.totals,
      ...live.totals,
    },
  };
}

export async function loadCalendarBundle() {
  await syncRfpDeadlinesFromStorage().catch(() => {});
  const mockEvents = USE_MOCK_CALENDAR ? generateMockCalendarEvents() : [];
  const mockTeam = USE_MOCK_CALENDAR ? getMockTeamSummary() : null;

  try {
    const [eventsRes, teamRes] = await Promise.all([
      calendarApi.listEvents(),
      calendarApi.teamSummary(),
    ]);
    const liveEvents = eventsRes.data?.events || [];
    const liveTeam = teamRes.data || null;
    return {
      events: USE_MOCK_CALENDAR ? mergeEvents(liveEvents, mockEvents) : liveEvents,
      team: USE_MOCK_CALENDAR ? mergeTeamSummary(liveTeam, mockTeam) : liveTeam,
      hasDemo: USE_MOCK_CALENDAR,
    };
  } catch {
    return {
      events: mockEvents,
      team: mockTeam,
      hasDemo: USE_MOCK_CALENDAR,
    };
  }
}

export function toFullCalendarEvent(ev) {
  const start = ev.allDay ? String(ev.start).slice(0, 10) : ev.start;
  const end = ev.end ? (ev.allDay ? String(ev.end).slice(0, 10) : ev.end) : undefined;
  return {
    id: ev.id,
    title: ev.title,
    start,
    end,
    allDay: Boolean(ev.allDay),
    backgroundColor: ev.color,
    borderColor: ev.color,
    extendedProps: { ...ev },
  };
}
