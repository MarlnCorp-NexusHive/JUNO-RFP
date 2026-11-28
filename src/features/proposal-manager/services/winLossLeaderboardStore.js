/**
 * Win/loss & leaderboard store.
 * - Demo login: seeded sample history, library impact, and team/people leaderboard from prototype.
 * - Trial & Walkthrough logins: clean slate stored on the backend per tenant (`scoring` feature key),
 *   shared across every user under the same tenant.
 */
import {
  loadTrialFeatureData,
  persistTrialFeatureData,
  resetTrialFeature,
} from "../../../services/trialFeatureApi.js";

const DEMO_STORAGE_KEY = "juno_winloss_leaderboard_demo_v1";

export const TURN = { ana: 1.4, maya: 2.1, dev: 1.2, priya: 2.6, rosa: 1.8, sam: 2.3 };

function off(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function seedDemoHistory() {
  const H = (id, name, buyer, sector, value, result, reason, competitor, d, people, ws) => ({
    id,
    name,
    buyer,
    sector,
    value,
    result,
    reason,
    competitor,
    at: off(d),
    people,
    ws,
  });
  return [
    H("h1", "Youth Workforce Pathways", "Dept. of Labor", "Public sector", 1200000, "won", "Strong past performance", "Metro Workforce Inc.", -480, ["ana", "maya", "sam"], "w1"),
    H("h2", "Community Health Navigators", "State Dept. of Health", "Health", 480000, "won", "Partnerships", "CarePath Partners", -511, ["maya", "sam"], "w1"),
    H("h3", "After-School STEM Labs", "Hartwell Foundation", "Education", 150000, "won", "Program design", "—", -620, ["maya"], "w1"),
    H("h4", "Digital Literacy for Seniors", "City of Riverside", "Public sector", 95000, "won", "Price", "TechBridge", -759, ["ana", "sam"], "w1"),
    H("h5", "Arts in Schools Expansion", "Riverside Arts Council", "Education", 60000, "lost", "Weak evaluation plan", "Arts Forward", -40, ["rosa"], "w1"),
    H("h6", "County Benefits Portal", "County of Riverside", "Public sector", 850000, "won", "Technical approach", "GovSoft", -200, ["maya", "dev"], "w3"),
    H("h7", "Transit Analytics RFP", "Metro Transit (sample)", "Public sector", 620000, "lost", "Price", "GovSoft", -150, ["dev", "priya"], "w3"),
    H("h8", "Clinic Scheduling RFP", "Valley Health (sample)", "Health", 300000, "lost", "Incumbent advantage", "CarePath Partners", -120, ["ana", "dev"], "w2"),
    H("h9", "Payer Data Exchange", "Northstar Health (sample)", "Health", 540000, "won", "Security posture", "HealthSync", -90, ["dev", "ana"], "w2"),
    H("h10", "University LMS RFI", "State University (sample)", "Education", 210000, "lost", "Feature gaps", "EduCloud", -75, ["ana"], "w2"),
    H("h11", "Retail Analytics RFP", "Brightmart (sample)", "Commercial", 400000, "lost", "Price", "DataPeak", -60, ["priya", "dev"], "w2"),
    H("h12", "Logistics Platform RFP", "ShipRight (sample)", "Commercial", 950000, "won", "Implementation plan", "DataPeak", -30, ["ana", "dev", "priya"], "w2"),
    H("h13", "Hospital Security Review", "Mercy Regional (sample)", "Health", 120000, "lost", "Missing certification", "HealthSync", -25, ["dev"], "w4"),
    H("h14", "Workforce Board TA", "Regional Workforce Board", "Public sector", 250000, "won", "Past performance", "Metro Workforce Inc.", -15, ["maya", "sam"], "w1"),
  ];
}

export function seedDemoLibrary() {
  const L = (id, ws, title, author, uses, wins) => ({ id, ws, title, author, uses, wins });
  return [
    L("L1", "w1", "Organization overview", "ana", 14, 6),
    L("L2", "w1", "Staffing approach and program management", "maya", 9, 4),
    L("L3", "w1", "Past performance: Youth Workforce Pathways", "sam", 7, 3),
    L("L4", "w1", "Evaluation and performance measurement", "sam", 8, 4),
    L("L5", "w1", "Employer partnerships", "maya", 6, 3),
    L("L6", "w1", "Budget justification approach", "priya", 11, 5),
    L("L7", "w1", "Sustainability plan", "rosa", 5, 2),
    L("L8", "w1", "Digital skills curriculum", "sam", 4, 2),
    L("L9", "w2", "Data security and privacy controls", "dev", 12, 5),
    L("L10", "w2", "Service levels and support", "dev", 8, 3),
    L("L11", "w2", "Implementation methodology", "ana", 10, 4),
    L("L12", "w3", "Case management experience", "maya", 3, 1),
  ];
}

export function loadDemoLeaderboard() {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) {
      const payload = { history: seedDemoHistory(), library: seedDemoLibrary() };
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(payload));
      return payload;
    }
    const parsed = JSON.parse(raw);
    return {
      history: Array.isArray(parsed?.history) && parsed.history.length ? parsed.history : seedDemoHistory(),
      library: Array.isArray(parsed?.library) && parsed.library.length ? parsed.library : seedDemoLibrary(),
    };
  } catch {
    return { history: seedDemoHistory(), library: seedDemoLibrary() };
  }
}

export function saveDemoLeaderboard(payload) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function emptyTenantLeaderboard() {
  return { history: [], library: [] };
}

export async function loadTenantLeaderboard() {
  const data = await loadTrialFeatureData("scoring", emptyTenantLeaderboard());
  return {
    history: Array.isArray(data?.history) ? data.history : [],
    library: Array.isArray(data?.library) ? data.library : [],
  };
}

export async function saveTenantLeaderboard(payload) {
  return persistTrialFeatureData("scoring", {
    history: Array.isArray(payload?.history) ? payload.history : [],
    library: Array.isArray(payload?.library) ? payload.library : [],
  });
}

export async function resetTenantLeaderboard() {
  return resetTrialFeature("scoring");
}

export function fmtK(n) {
  const v = Number(n) || 0;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(v >= 1e7 ? 1 : 2)}M`;
  if (v >= 1e3) return `$${Math.round(v / 1e3)}K`;
  return `$${Math.round(v).toLocaleString("en-US")}`;
}
