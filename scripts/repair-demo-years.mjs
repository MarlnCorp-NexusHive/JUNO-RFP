/**
 * Repair demo year axes / academic cycles broken by an earlier bare-year remap,
 * and bump remaining stale demo labels for a Sep 2026 demo.
 *
 * Usage: node scripts/repair-demo-years.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function write(rel, transform) {
  const file = path.join(ROOT, rel);
  const raw = fs.readFileSync(file, "utf8");
  const out = transform(raw);
  if (out === raw) {
    console.log(`unchanged\t${rel}`);
    return;
  }
  fs.writeFileSync(file, out, "utf8");
  console.log(`updated\t${rel}`);
}

// --- DirectorDashboard.jsx ---
write("src/components/DirectorDashboard.jsx", (s) => {
  s = s.replace(
    `const businessTrends = [
  { year: '2019', Onboarded: 11000, Completed: 9500 },
  { year: '2020', Onboarded: 11500, Completed: 9800 },
  { year: '2026', Onboarded: 12000, Completed: 10200 },
  { year: '2026', Onboarded: 12200, Completed: 11000 },
  { year: '2026', Onboarded: 12400, Completed: 11500 },
];`,
    `const businessTrends = [
  { year: '2022', Onboarded: 11000, Completed: 9500 },
  { year: '2023', Onboarded: 11500, Completed: 9800 },
  { year: '2024', Onboarded: 12000, Completed: 10200 },
  { year: '2025', Onboarded: 12200, Completed: 11000 },
  { year: '2026', Onboarded: 12400, Completed: 11500 },
];`
  );
  s = s.replace(
    `const sectionMScoringData = [
  { period: '2021', competitiveIntelligence: 88, competitiveDifferentiation: 42, incumbentAdvantage: 91, priceTechnical: 55, bidDensity: 28, agencyWinPattern: 78, discriminatorStrength: 64 },
  { period: '2022', competitiveIntelligence: 89, competitiveDifferentiation: 48, incumbentAdvantage: 90, priceTechnical: 58, bidDensity: 35, agencyWinPattern: 80, discriminatorStrength: 68 },
  { period: '2023', competitiveIntelligence: 90, competitiveDifferentiation: 54, incumbentAdvantage: 92, priceTechnical: 62, bidDensity: 41, agencyWinPattern: 82, discriminatorStrength: 71 },
  { period: '2024', competitiveIntelligence: 91, competitiveDifferentiation: 59, incumbentAdvantage: 91, priceTechnical: 66, bidDensity: 46, agencyWinPattern: 84, discriminatorStrength: 74 },
  { period: '2025', competitiveIntelligence: 92, competitiveDifferentiation: 63, incumbentAdvantage: 93, priceTechnical: 70, bidDensity: 52, agencyWinPattern: 86, discriminatorStrength: 77 },
];`,
    `const sectionMScoringData = [
  { period: '2022', competitiveIntelligence: 88, competitiveDifferentiation: 42, incumbentAdvantage: 91, priceTechnical: 55, bidDensity: 28, agencyWinPattern: 78, discriminatorStrength: 64 },
  { period: '2023', competitiveIntelligence: 89, competitiveDifferentiation: 48, incumbentAdvantage: 90, priceTechnical: 58, bidDensity: 35, agencyWinPattern: 80, discriminatorStrength: 68 },
  { period: '2024', competitiveIntelligence: 90, competitiveDifferentiation: 54, incumbentAdvantage: 92, priceTechnical: 62, bidDensity: 41, agencyWinPattern: 82, discriminatorStrength: 71 },
  { period: '2025', competitiveIntelligence: 91, competitiveDifferentiation: 59, incumbentAdvantage: 91, priceTechnical: 66, bidDensity: 46, agencyWinPattern: 84, discriminatorStrength: 74 },
  { period: '2026', competitiveIntelligence: 92, competitiveDifferentiation: 63, incumbentAdvantage: 93, priceTechnical: 70, bidDensity: 52, agencyWinPattern: 86, discriminatorStrength: 77 },
];`
  );
  s = s.replace(
    `const operationalQualityTrend = [
  { period: "2021", Readiness: 72, Velocity: 68 },
  { period: "2022", Readiness: 76, Velocity: 74 },
  { period: "2023", Readiness: 79, Velocity: 77 },
  { period: "2024", Readiness: 82, Velocity: 80 },
  { period: "2025", Readiness: 84, Velocity: 83 },
];`,
    `const operationalQualityTrend = [
  { period: "2022", Readiness: 72, Velocity: 68 },
  { period: "2023", Readiness: 76, Velocity: 74 },
  { period: "2024", Readiness: 79, Velocity: 77 },
  { period: "2025", Readiness: 82, Velocity: 80 },
  { period: "2026", Readiness: 84, Velocity: 83 },
];`
  );
  s = s.replace(
    `const competitiveIntelligenceTrend = [
  { period: "2021", Position: 58 },
  { period: "2022", Position: 63 },
  { period: "2023", Position: 67 },
  { period: "2024", Position: 72 },
  { period: "2025", Position: 76 },
];`,
    `const competitiveIntelligenceTrend = [
  { period: "2022", Position: 58 },
  { period: "2023", Position: 63 },
  { period: "2024", Position: 67 },
  { period: "2025", Position: 72 },
  { period: "2026", Position: 76 },
];`
  );
  s = s.replace(
    `const teamTypes = [
  { year: '2019', FullTime: 400, PartTime: 200, Contract: 50 },
  { year: '2020', FullTime: 420, PartTime: 210, Contract: 60 },
  { year: '2026', FullTime: 430, PartTime: 220, Contract: 70 },
  { year: '2026', FullTime: 440, PartTime: 230, Contract: 80 },
  { year: '2026', FullTime: 450, PartTime: 240, Contract: 90 },
];`,
    `const teamTypes = [
  { year: '2022', FullTime: 400, PartTime: 200, Contract: 50 },
  { year: '2023', FullTime: 420, PartTime: 210, Contract: 60 },
  { year: '2024', FullTime: 430, PartTime: 220, Contract: 70 },
  { year: '2025', FullTime: 440, PartTime: 230, Contract: 80 },
  { year: '2026', FullTime: 450, PartTime: 240, Contract: 90 },
];`
  );
  s = s.replace(
    `const attritionTrend = [
  { year: '2019', Attrition: 4.2 },
  { year: '2020', Attrition: 4.5 },
  { year: '2026', Attrition: 4.1 },
  { year: '2026', Attrition: 3.8 },
  { year: '2026', Attrition: 3.5 },
];`,
    `const attritionTrend = [
  { year: '2022', Attrition: 4.2 },
  { year: '2023', Attrition: 4.5 },
  { year: '2024', Attrition: 4.1 },
  { year: '2025', Attrition: 3.8 },
  { year: '2026', Attrition: 3.5 },
];`
  );
  s = s.replace(
    `const proposalPipelineByStage = [
  { period: '2021', Pending: 18, InProgress: 7, Approved: 4, Delivered: 3 },
  { period: '2022', Pending: 12, InProgress: 14, Approved: 5, Delivered: 6 },
  { period: '2023', Pending: 22, InProgress: 9, Approved: 8, Delivered: 4 },
  { period: '2024', Pending: 15, InProgress: 16, Approved: 6, Delivered: 9 },
  { period: '2025', Pending: 19, InProgress: 12, Approved: 11, Delivered: 7 },
];`,
    `const proposalPipelineByStage = [
  { period: '2022', Pending: 18, InProgress: 7, Approved: 4, Delivered: 3 },
  { period: '2023', Pending: 12, InProgress: 14, Approved: 5, Delivered: 6 },
  { period: '2024', Pending: 22, InProgress: 9, Approved: 8, Delivered: 4 },
  { period: '2025', Pending: 15, InProgress: 16, Approved: 6, Delivered: 9 },
  { period: '2026', Pending: 19, InProgress: 12, Approved: 11, Delivered: 7 },
];`
  );
  s = s.replace(
    `const proposalWinRateTrend = [
  { period: '2021', WinRate: 28 },
  { period: '2022', WinRate: 31 },
  { period: '2023', WinRate: 29 },
  { period: '2024', WinRate: 34 },
  { period: '2025', WinRate: 37 },
];`,
    `const proposalWinRateTrend = [
  { period: '2022', WinRate: 28 },
  { period: '2023', WinRate: 31 },
  { period: '2024', WinRate: 29 },
  { period: '2025', WinRate: 34 },
  { period: '2026', WinRate: 37 },
];`
  );
  s = s.replace(
    `            <BarChart data={[
              { year: '2026', Actual: 88, Forecast: 88 },
              { year: '2026', Actual: 90, Forecast: 90 },
              { year: '2026', Actual: 91, Forecast: 91 },
              { year: '2026', Actual: null, Forecast: 92 },
            ]} margin={{ top: 20, right: 40, left: 0, bottom: 0 }}>`,
    `            <BarChart data={[
              { year: '2023', Actual: 88, Forecast: 88 },
              { year: '2024', Actual: 90, Forecast: 90 },
              { year: '2025', Actual: 91, Forecast: 91 },
              { year: '2026', Actual: null, Forecast: 92 },
            ]} margin={{ top: 20, right: 40, left: 0, bottom: 0 }}>`
  );
  return s;
});

// --- AnalyticsReports.jsx ---
write("src/components/AnalyticsReports.jsx", (s) => {
  s = s.replace(
    `const staffAnalytics = [
  { year: "2019", Teaching: 400, NonTeaching: 200, Contract: 50 },
  { year: "2020", Teaching: 420, NonTeaching: 210, Contract: 60 },
  { year: "2026", Teaching: 430, NonTeaching: 220, Contract: 70 },
  { year: "2026", Teaching: 440, NonTeaching: 230, Contract: 80 },
  { year: "2026", Teaching: 450, NonTeaching: 240, Contract: 90 },
];`,
    `const staffAnalytics = [
  { year: "2022", Teaching: 400, NonTeaching: 200, Contract: 50 },
  { year: "2023", Teaching: 420, NonTeaching: 210, Contract: 60 },
  { year: "2024", Teaching: 430, NonTeaching: 220, Contract: 70 },
  { year: "2025", Teaching: 440, NonTeaching: 230, Contract: 80 },
  { year: "2026", Teaching: 450, NonTeaching: 240, Contract: 90 },
];`
  );
  s = s.replace(
    `            data={[
              { year: "2020", publications: 45, citations: 120 },
              { year: "2026", publications: 55, citations: 150 },
              { year: "2026", publications: 65, citations: 180 },
              { year: "2026", publications: 75, citations: 220 }
            ]}`,
    `            data={[
              { year: "2023", publications: 45, citations: 120 },
              { year: "2024", publications: 55, citations: 150 },
              { year: "2025", publications: 65, citations: 180 },
              { year: "2026", publications: 75, citations: 220 }
            ]}`
  );
  s = s.replace(
    `            data={[
              { year: "2020", avgSalary: 650000, maxSalary: 850000 },
              { year: "2026", avgSalary: 700000, maxSalary: 900000 },
              { year: "2026", avgSalary: 750000, maxSalary: 950000 },
              { year: "2026", avgSalary: 800000, maxSalary: 1000000 }
            ]}`,
    `            data={[
              { year: "2023", avgSalary: 650000, maxSalary: 850000 },
              { year: "2024", avgSalary: 700000, maxSalary: 900000 },
              { year: "2025", avgSalary: 750000, maxSalary: 950000 },
              { year: "2026", avgSalary: 800000, maxSalary: 1000000 }
            ]}`
  );
  return s;
});

// --- DirectorAnalyticsReports.jsx ---
write("src/features/director/components/DirectorAnalyticsReports.jsx", (s) => {
  s = s.replace(
    `const teamAnalytics = [
  { year: "2019", FullTime: 400, PartTime: 200, Contract: 50 },
  { year: "2020", FullTime: 420, PartTime: 210, Contract: 60 },
  { year: "2026", FullTime: 430, PartTime: 220, Contract: 70 },
  { year: "2026", FullTime: 440, PartTime: 230, Contract: 80 },
  { year: "2026", FullTime: 450, PartTime: 240, Contract: 90 },
];`,
    `const teamAnalytics = [
  { year: "2022", FullTime: 400, PartTime: 200, Contract: 50 },
  { year: "2023", FullTime: 420, PartTime: 210, Contract: 60 },
  { year: "2024", FullTime: 430, PartTime: 220, Contract: 70 },
  { year: "2025", FullTime: 440, PartTime: 230, Contract: 80 },
  { year: "2026", FullTime: 450, PartTime: 240, Contract: 90 },
];`
  );
  s = s.replace(
    `  yearOverYear: [
    { year: "2026", revenue: 20000000, cost: 15000000 },
    { year: "2026", revenue: 23000000, cost: 17000000 },
    { year: "2026", revenue: 25000000, cost: 18000000 },
  ],`,
    `  yearOverYear: [
    { year: "2024", revenue: 20000000, cost: 15000000 },
    { year: "2025", revenue: 23000000, cost: 17000000 },
    { year: "2026", revenue: 25000000, cost: 18000000 },
  ],`
  );
  s = s.replace(
    `  avgRevenueTrend: [
    { year: "2026", avgRevenue: 700000 },
    { year: "2026", avgRevenue: 800000 },
    { year: "2026", avgRevenue: 900000 },
  ],`,
    `  avgRevenueTrend: [
    { year: "2024", avgRevenue: 700000 },
    { year: "2025", avgRevenue: 800000 },
    { year: "2026", avgRevenue: 900000 },
  ],`
  );
  return s;
});

// --- Strategic planning year filters / trends ---
write("src/features/director/components/DirectorStrategicPlanning.jsx", (s) => {
  s = s.replace(
    `const years = ["2026", "2026", "2026", "2027", "2028"];`,
    `const years = ["2024", "2025", "2026", "2027", "2028"];`
  );
  s = s.replaceAll(
    `years: ["2020","2026","2026","2026","2026"]`,
    `years: ["2022","2023","2024","2025","2026"]`
  );
  return s;
});

write("src/components/StrategicPlanning.jsx", (s) =>
  s.replace(
    `const years = ["2026", "2026", "2026", "2027", "2028"];`,
    `const years = ["2024", "2025", "2026", "2027", "2028"];`
  )
);

// --- Locale year labels ---
for (const rel of ["src/locales/en/director.json", "src/locales/ar/director.json"]) {
  write(rel, (s) =>
    s.replace(
      `"years": {
        "2019": "2019",
        "2020": "2020",
        "2021": "2026",
        "2022": "2026",
        "2023": "2026",
        "2024": "2026"
      }`,
      `"years": {
        "2019": "2019",
        "2020": "2020",
        "2021": "2021",
        "2022": "2022",
        "2023": "2023",
        "2024": "2024",
        "2025": "2025",
        "2026": "2026"
      }`
    )
  );
}

// --- Academic cycles 2026-2026 → distinct years ---
write("src/components/DirectorSettings.jsx", (s) =>
  s.replace(`value: "2026-2026"`, `value: "2026-2027"`)
);

write("src/features/admission-head/components/course-management/VisibilitySettings.jsx", (s) => {
  s = s.replace(`useState('2026-2026')`, `useState('2026-2027')`);
  s = s.replace(
    `admissionCycles: ['2026-2026', '2026-2026']`,
    `admissionCycles: ['2025-2026', '2026-2027']`
  );
  s = s.replaceAll(`admissionCycles: ['2026-2026']`, `admissionCycles: ['2026-2027']`);
  s = s.replace(
    `    '2026-2026',
    '2026-2026',`,
    `    '2025-2026',
    '2026-2027',`
  );
  return s;
});

write("src/features/admission-head/components/course-management/SeatMonitoring.jsx", (s) => {
  s = s.replace(`useState('2026-2026')`, `useState('2026-2027')`);
  s = s.replaceAll(`admissionCycle: '2026-2026'`, `admissionCycle: '2026-2027'`);
  s = s.replace(
    `    '2026-2026',
    '2026-2026',`,
    `    '2025-2026',
    '2026-2027',`
  );
  return s;
});

write("src/features/admission-head/components/course-management/LinkedApplications.jsx", (s) => {
  s = s.replaceAll(`admissionCycle: '2026-2026'`, `admissionCycle: '2026-2027'`);
  s = s.replace(
    `admissionCycles: ['2026-2026', '2026-2026']`,
    `admissionCycles: ['2025-2026', '2026-2027']`
  );
  return s;
});

// --- Win/loss solicitation years ---
write("src/features/proposal-manager/data/winLossSamples.js", (s) => {
  s = s.replace(`solicitationNumber: "CC-LM-2024"`, `solicitationNumber: "CC-LM-2026"`);
  s = s.replace(`solicitationNumber: "AIR-F&B-2025"`, `solicitationNumber: "AIR-F&B-2026"`);
  return s;
});

// --- Company intel synthetic periods ---
write("src/features/proposal-manager/data/companyIntelligenceSamples.js", (s) =>
  s.replace(
    `const PERIODS = ["2024", "2023", "2022", "2021"];`,
    `const PERIODS = ["2025", "2024", "2023", "2022"];`
  )
);

console.log("\nDone.");
