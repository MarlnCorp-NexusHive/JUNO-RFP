import API from "../../services/api.js";

const DEMO_STORAGE_KEY = "juno_demo_activity_log_v1";

function minsAgo(m) {
  return new Date(Date.now() - m * 60_000).toISOString();
}

export function seedDemoActivity() {
  return [
    {
      id: "da1",
      userId: "maya",
      userName: "Maya Reed",
      userEmail: "maya@brightfutures.org",
      area: "Scoring",
      action: "Recorded win: Workforce Board TA ($250K)",
      detail: "Public sector · Metro Workforce Inc.",
      at: minsAgo(6),
    },
    {
      id: "da2",
      userId: "ana",
      userName: "Ana López",
      userEmail: "ana@brightfutures.org",
      area: "Sage AI",
      action: "Drafted Organizational Capacity section",
      detail: "EDA AI-Ready Workforce · cited [L1]",
      at: minsAgo(19),
    },
    {
      id: "da3",
      userId: "dev",
      userName: "Dev Patel",
      userEmail: "dev@brightfutures.org",
      area: "Compliance",
      action: "Updated Data Security & Hosting controls",
      detail: "Statewide Case Management Platform",
      at: minsAgo(42),
    },
    {
      id: "da4",
      userId: "priya",
      userName: "Priya Shah",
      userEmail: "priya@brightfutures.org",
      area: "Pricing",
      action: "Confirmed 30% fringe rate in budget narrative",
      detail: "EDA AI-Ready Workforce",
      at: minsAgo(95),
    },
    {
      id: "da5",
      userId: "ana",
      userName: "Ana López",
      userEmail: "ana@brightfutures.org",
      area: "Settings",
      action: "Updated workspace AI budget alerts",
      detail: "80% and 100% monthly threshold enabled",
      at: minsAgo(180),
    },
    {
      id: "da6",
      userId: "rosa",
      userName: "Rosa Martín",
      userEmail: "rosa@brightfutures.org",
      area: "RFP Collaboration",
      action: "Completed Pink Team review on Past Performance",
      detail: "Added 2 action items for Sam Kim",
      at: minsAgo(260),
    },
  ];
}

export function loadDemoActivity() {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) {
      const seeded = seedDemoActivity();
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : seedDemoActivity();
  } catch {
    return seedDemoActivity();
  }
}

export function saveDemoActivity(items) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(items.slice(0, 200)));
  } catch {
    /* ignore */
  }
}

export async function fetchTrialActivity(scope = "team", limit = 80) {
  const res = await API.get("/trial/activity", {
    params: { scope, limit },
    timeout: 15_000,
  });
  return res.data;
}

export async function postTrialActivity({ area = "Team update", action, detail = "" }) {
  const res = await API.post(
    "/trial/activity",
    { area, action, detail },
    { timeout: 15_000 },
  );
  return res.data;
}
