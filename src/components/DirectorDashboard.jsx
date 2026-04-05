import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { directorFeatures } from './directorFeatures';
import DirectorAnalyticsReports from '../features/director/components/DirectorAnalyticsReports';
import DirectorDepartments from '../features/director/components/DirectorDepartments';
import DirectorApprovalCenter from '../features/director/components/DirectorApprovalCenter';
import DirectorStrategicPlanning from '../features/director/components/DirectorStrategicPlanning';
import DirectorAuditCompliance from '../features/director/components/DirectorAuditCompliance';
import DirectorMeetingsCalendar from '../features/director/components/DirectorMeetingsCalendar';
import DirectorUserManagement from '../features/director/components/DirectorUserManagement';
import DirectorCommunicationHub from '../features/director/components/DirectorCommunicationHub';

const features = [
  { label: "Dashboard", icon: "📊", route: "/rbac/director", description: "Corporate Performance Overview, KPI Summary, Alerts & Notices" },
  { label: "Analytics & Reports", icon: "📈", route: "/rbac/director/analytics", description: "Department-wise Reports, Statistics, Finance, Trends, HR Insights" },
  { label: "Departments", icon: "🏢", route: "/rbac/director/departments", description: "Business Operations, HR, Finance, Recruitment, IT, R&D" },
  { label: "Approval Center", icon: "✅", route: "/rbac/director/approvals", description: "Budget, Policy, Recruitment, Procurement Approvals" },
  { label: "Strategic Planning", icon: "🗺️", route: "/rbac/director/strategic-planning", description: "Annual Plans, Accreditation, Risk Management" },
  { label: "Communication", icon: "📢", route: "/rbac/director/communication", description: "Notices, Circulars, External Comms" },
  { label: "Audit & Compliance", icon: "🕵️", route: "/rbac/director/audit", description: "Audit Reports, Accreditation, Legal Docs" },
  { label: "Meetings & Calendar", icon: "🗓️", route: "/rbac/director/calendar", description: "Scheduler, Minutes, Events" },
  { label: "User Management", icon: "👥", route: "/rbac/director/users", description: "Roles, Permissions, Admin Controls" },
  { label: "Settings", icon: "⚙️", route: "/rbac/director/settings", description: "Profile, Branding, Notifications" },
  { label: "Help & Support", icon: "🆘", route: "/rbac/director/support", description: "Technical Support, Handbook" },
  { label: "Communication Hub", icon: "💬", route: "/rbac/director/comm-hub", description: "Internal Communication Hub" },
  { label: "Training & Development", icon: "🎓", route: "/rbac/director/training", description: "Team Training, Knowledge Mgmt" },
  { label: "Compliance & Quality", icon: "🏅", route: "/rbac/director/compliance", description: "Quality Assurance, Risk Mgmt" },
  { label: "Account Management", icon: "👤", route: "/rbac/director/account", description: "Profile, HR Board, Tasks, Events, Attendance, Recruitment, HelpDesk, Geo-fencing" },
  { label: "Support Tickets", icon: "🎫", route: "/rbac/director/tickets", description: "My Tickets, Raise a Ticket" },
  { label: "Help / Documentation", icon: "📖", route: "/rbac/director/help", description: "Help, Documentation" },
];

// Demo data for KPI cards - will be generated dynamically with translations

// Demo data for charts
const recruitmentTrend = [
  { month: "Jan", Applications: 200, Hired: 120 },
  { month: "Feb", Applications: 250, Hired: 140 },
  { month: "Mar", Applications: 300, Hired: 180 },
  { month: "Apr", Applications: 350, Hired: 200 },
  { month: "May", Applications: 400, Hired: 220 },
  { month: "Jun", Applications: 420, Hired: 240 },
];

// Rolling Win Rate by Procurement Type (Proposal Manager) — 12 months, realistic %
const rollingWinRateByProcurement = [
  { month: "Jul", "FAR Part 15 (Best Value)": 26, "FAR Part 15 (LPTA)": 35, "FAR Part 16 (Task Orders)": 41, "Sole Source": 91, "Full & Open": 19 },
  { month: "Aug", "FAR Part 15 (Best Value)": 28, "FAR Part 15 (LPTA)": 37, "FAR Part 16 (Task Orders)": 44, "Sole Source": 93, "Full & Open": 21 },
  { month: "Sep", "FAR Part 15 (Best Value)": 29, "FAR Part 15 (LPTA)": 38, "FAR Part 16 (Task Orders)": 46, "Sole Source": 94, "Full & Open": 22 },
  { month: "Oct", "FAR Part 15 (Best Value)": 31, "FAR Part 15 (LPTA)": 40, "FAR Part 16 (Task Orders)": 48, "Sole Source": 95, "Full & Open": 24 },
  { month: "Nov", "FAR Part 15 (Best Value)": 32, "FAR Part 15 (LPTA)": 41, "FAR Part 16 (Task Orders)": 50, "Sole Source": 96, "Full & Open": 25 },
  { month: "Dec", "FAR Part 15 (Best Value)": 33, "FAR Part 15 (LPTA)": 42, "FAR Part 16 (Task Orders)": 51, "Sole Source": 95, "Full & Open": 26 },
  { month: "Jan", "FAR Part 15 (Best Value)": 34, "FAR Part 15 (LPTA)": 43, "FAR Part 16 (Task Orders)": 52, "Sole Source": 97, "Full & Open": 27 },
  { month: "Feb", "FAR Part 15 (Best Value)": 35, "FAR Part 15 (LPTA)": 44, "FAR Part 16 (Task Orders)": 53, "Sole Source": 96, "Full & Open": 28 },
  { month: "Mar", "FAR Part 15 (Best Value)": 36, "FAR Part 15 (LPTA)": 45, "FAR Part 16 (Task Orders)": 54, "Sole Source": 98, "Full & Open": 29 },
  { month: "Apr", "FAR Part 15 (Best Value)": 37, "FAR Part 15 (LPTA)": 46, "FAR Part 16 (Task Orders)": 55, "Sole Source": 97, "Full & Open": 30 },
  { month: "May", "FAR Part 15 (Best Value)": 38, "FAR Part 15 (LPTA)": 47, "FAR Part 16 (Task Orders)": 56, "Sole Source": 98, "Full & Open": 31 },
  { month: "Jun", "FAR Part 15 (Best Value)": 39, "FAR Part 15 (LPTA)": 48, "FAR Part 16 (Task Orders)": 57, "Sole Source": 99, "Full & Open": 32 },
];
const WIN_RATE_COLORS = { "FAR Part 15 (Best Value)": "#6366f1", "FAR Part 15 (LPTA)": "#22c55e", "FAR Part 16 (Task Orders)": "#f59e0b", "Sole Source": "#ec4899", "Full & Open": "#14b8a6" };
const WIN_RATE_KEYS = ["FAR Part 15 (Best Value)", "FAR Part 15 (LPTA)", "FAR Part 16 (Task Orders)", "Sole Source", "Full & Open"];
const WIN_RATE_GRADIENT_IDS = ["winRate-far15best", "winRate-far15lpta", "winRate-far16task", "winRate-solesource", "winRate-fullopen"];
const financeData = [
  { name: "Operations", value: 40 },
  { name: "HR", value: 20 },
  { name: "Infra", value: 15 },
  { name: "R&D", value: 10 },
  { name: "Other", value: 15 },
];
// Win Rate vs Capture Lead Time (Proposal Manager): lead time in days vs win rate %
const winRateVsLeadTimeData = [
  { winRate: 22, label: "0–30 days" },
  { winRate: 31, label: "31–60 days" },
  { winRate: 38, label: "61–90 days" },
  { winRate: 45, label: "91–180 days" },
];
const COLORS = ["#6366f1", "#22c55e", "#f59e42", "#eab308", "#a3a3a3"];
const deptPerformance = [
  { dept: "Operations", KPI: 85 },
  { dept: "HR", KPI: 78 },
  { dept: "Finance", KPI: 90 },
  { dept: "Recruitment", KPI: 82 },
  { dept: "IT", KPI: 75 },
  { dept: "R&D", KPI: 88 },
];
// Proposal Quality Intelligence (Proposal Manager): bar labels and scores
const proposalQualityIntelligenceData = [
  { dept: "Core Evaluation Intelligence", KPI: 88 },
  { dept: "Risk & Compliance", KPI: 92 },
  { dept: "Competitive", KPI: 79 },
  { dept: "Weakness & Debrief", KPI: 85 },
  { dept: "Operational Quality", KPI: 86 },
  { dept: "Financial & RO", KPI: 90 },
];

// Slim, colorful summary cards data - will be generated dynamically with translations

// Business Operations Insights demo data
const businessTrends = [
  { year: '2019', Onboarded: 11000, Completed: 9500 },
  { year: '2020', Onboarded: 11500, Completed: 9800 },
  { year: '2026', Onboarded: 12000, Completed: 10200 },
  { year: '2026', Onboarded: 12200, Completed: 11000 },
  { year: '2026', Onboarded: 12400, Completed: 11500 },
];
// Section M–Driven Scoring Optimization (Proposal Manager): 7 intelligence metrics, spread across range for clarity
const sectionMScoringData = [
  { period: '2021', competitiveIntelligence: 88, competitiveDifferentiation: 42, incumbentAdvantage: 91, priceTechnical: 55, bidDensity: 28, agencyWinPattern: 78, discriminatorStrength: 64 },
  { period: '2022', competitiveIntelligence: 89, competitiveDifferentiation: 48, incumbentAdvantage: 90, priceTechnical: 58, bidDensity: 35, agencyWinPattern: 80, discriminatorStrength: 68 },
  { period: '2023', competitiveIntelligence: 90, competitiveDifferentiation: 54, incumbentAdvantage: 92, priceTechnical: 62, bidDensity: 41, agencyWinPattern: 82, discriminatorStrength: 71 },
  { period: '2024', competitiveIntelligence: 91, competitiveDifferentiation: 59, incumbentAdvantage: 91, priceTechnical: 66, bidDensity: 46, agencyWinPattern: 84, discriminatorStrength: 74 },
  { period: '2025', competitiveIntelligence: 92, competitiveDifferentiation: 63, incumbentAdvantage: 93, priceTechnical: 70, bidDensity: 52, agencyWinPattern: 86, discriminatorStrength: 77 },
];
const SECTION_M_COLORS = {
  competitiveIntelligence: '#6366f1',
  competitiveDifferentiation: '#22c55e',
  incumbentAdvantage: '#f59e0b',
  priceTechnical: '#ec4899',
  bidDensity: '#14b8a6',
  agencyWinPattern: '#8b5cf6',
  discriminatorStrength: '#ef4444',
};
const deptLeaderboard = [
  { dept: 'Engineering Team', Performance: 8.7 },
  { dept: 'IT Team', Performance: 8.5 },
  { dept: 'Sales Team', Performance: 8.3 },
  { dept: 'Operations Team', Performance: 8.1 },
  { dept: 'Marketing Team', Performance: 7.9 },
];
// Risk & Compliance Intelligence (Proposal Manager): 8 tracked metrics with score 0–100
const riskComplianceIntelligenceData = [
  { name: "Elimination Risk & FAR Conformance", score: 92 },
  { name: "Technical Elimination Risk Monitor", score: 88 },
  { name: "Compliance Integrity Analyzer", score: 94 },
  { name: "Amendment Impact Tracker", score: 85 },
  { name: "FAR Conformance Engine", score: 90 },
  { name: "Page Limit & Format Risk Detection", score: 87 },
  { name: "OCI Exposure Indicator", score: 91 },
  { name: "Proposal Deficiency Alert System", score: 89 },
];
// Operational Quality Intelligence (Proposal Manager): 7 metrics, score 0–100
const operationalQualityData = [
  { name: "Proposal Readiness Score", score: 84 },
  { name: "Red Team Defect Analytics", score: 79 },
  { name: "Content Maturity Index", score: 88 },
  { name: "Review Cycle Efficiency Monitor", score: 82 },
  { name: "SME Responsiveness Tracker", score: 91 },
  { name: "Production Velocity Dashboard", score: 76 },
  { name: "Rework & Iteration Density Index", score: 73 },
];
const operationalQualityTrend = [
  { period: "2021", Readiness: 72, Velocity: 68 },
  { period: "2022", Readiness: 76, Velocity: 74 },
  { period: "2023", Readiness: 79, Velocity: 77 },
  { period: "2024", Readiness: 82, Velocity: 80 },
  { period: "2025", Readiness: 84, Velocity: 83 },
];
// Competitive Intelligence (Proposal Manager): 6 metrics, score 0–100
const competitiveIntelligenceData = [
  { name: "Competitive Differentiation Index", score: 62 },
  { name: "Incumbent Advantage Modeling", score: 78 },
  { name: "Price–Technical Competitiveness Matrix", score: 71 },
  { name: "Bid Density & Market Saturation Analytics", score: 58 },
  { name: "Agency Win Pattern Intelligence", score: 85 },
  { name: "Discriminator Strength Benchmarking", score: 69 },
];
const competitiveIntelligenceTrend = [
  { period: "2021", Position: 58 },
  { period: "2022", Position: 63 },
  { period: "2023", Position: 67 },
  { period: "2024", Position: 72 },
  { period: "2025", Position: 76 },
];
// Financial Overview demo data
const monthlyFees = [
  { month: 'Jan', Fees: 120000 },
  { month: 'Feb', Fees: 130000 },
  { month: 'Mar', Fees: 140000 },
  { month: 'Apr', Fees: 135000 },
  { month: 'May', Fees: 150000 },
  { month: 'Jun', Fees: 155000 },
];
const budgetUsage = [
  { dept: 'Engineering Team', budget: 500000, used: 420000 },
  { dept: 'IT Team', budget: 300000, used: 250000 },
  { dept: 'Sales Team', budget: 200000, used: 180000 },
  { dept: 'Operations Team', budget: 150000, used: 120000 },
];
// HR & Team Analytics demo data
const teamTypes = [
  { year: '2019', FullTime: 400, PartTime: 200, Contract: 50 },
  { year: '2020', FullTime: 420, PartTime: 210, Contract: 60 },
  { year: '2026', FullTime: 430, PartTime: 220, Contract: 70 },
  { year: '2026', FullTime: 440, PartTime: 230, Contract: 80 },
  { year: '2026', FullTime: 450, PartTime: 240, Contract: 90 },
];
const attritionTrend = [
  { year: '2019', Attrition: 4.2 },
  { year: '2020', Attrition: 4.5 },
  { year: '2026', Attrition: 4.1 },
  { year: '2026', Attrition: 3.8 },
  { year: '2026', Attrition: 3.5 },
];
// Proposal Manager: Capture & Pipeline analytics (replaces HR & Team in this section)
const proposalPipelineByStage = [
  { period: '2021', Pending: 18, InProgress: 7, Approved: 4, Delivered: 3 },
  { period: '2022', Pending: 12, InProgress: 14, Approved: 5, Delivered: 6 },
  { period: '2023', Pending: 22, InProgress: 9, Approved: 8, Delivered: 4 },
  { period: '2024', Pending: 15, InProgress: 16, Approved: 6, Delivered: 9 },
  { period: '2025', Pending: 19, InProgress: 12, Approved: 11, Delivered: 7 },
];
const proposalWinRateTrend = [
  { period: '2021', WinRate: 28 },
  { period: '2022', WinRate: 31 },
  { period: '2023', WinRate: 29 },
  { period: '2024', WinRate: 34 },
  { period: '2025', WinRate: 37 },
];
// Alerts & Notifications demo data - will be generated dynamically with translations

// Predictive Recruitment Forecast demo data
const forecastData = [
  { month: 'Jan', Actual: 200, Forecast: 210 },
  { month: 'Feb', Actual: 250, Forecast: 260 },
  { month: 'Mar', Actual: 300, Forecast: 320 },
  { month: 'Apr', Actual: 350, Forecast: 370 },
  { month: 'May', Actual: 400, Forecast: 420 },
  { month: 'Jun', Actual: 420, Forecast: 440 },
  { month: 'Jul', Actual: null, Forecast: 470 },
  { month: 'Aug', Actual: null, Forecast: 500 },
];

// Employee Retention Risk Forecast demo data
const retentionForecast = [
  { quarter: '2026-Q1', Actual: 3.8, Forecast: 3.8 },
  { quarter: '2026-Q2', Actual: 3.5, Forecast: 3.5 },
  { quarter: '2026-Q3', Actual: null, Forecast: 3.3 },
  { quarter: '2026-Q4', Actual: null, Forecast: 3.1 },
  { quarter: '2027-Q1', Actual: null, Forecast: 3.0 },
];
// Financial Surplus/Deficit Forecast demo data
const surplusForecast = [
  { month: 'Mar', Actual: 12000, Forecast: 12000 },
  { month: 'Apr', Actual: 15000, Forecast: 15000 },
  { month: 'May', Actual: null, Forecast: 18000 },
  { month: 'Jun', Actual: null, Forecast: 17000 },
  { month: 'Jul', Actual: null, Forecast: 16500 },
  { month: 'Aug', Actual: null, Forecast: 16000 },
];

// Add new chart modal cases
const leadConversionData = [
  { month: 'Jan', Rate: 24 },
  { month: 'Feb', Rate: 25 },
  { month: 'Mar', Rate: 26 },
  { month: 'Apr', Rate: 27 },
  { month: 'May', Rate: 28 },
  { month: 'Jun', Rate: 29 },
];

const applicationFeeData = [
  { month: 'Jan', Revenue: 100000, Discounts: 10000 },
  { month: 'Feb', Revenue: 105000, Discounts: 10500 },
  { month: 'Mar', Revenue: 110000, Discounts: 11000 },
  { month: 'Apr', Revenue: 115000, Discounts: 11500 },
  { month: 'May', Revenue: 120000, Discounts: 12000 },
  { month: 'Jun', Revenue: 125000, Discounts: 12500 },
];

const deptRevenueData = [
  { dept: 'Operations', Revenue: 500000, Projected: 550000 },
  { dept: 'HR', Revenue: 200000, Projected: 220000 },
  { dept: 'Finance', Revenue: 150000, Projected: 165000 },
  { dept: 'Recruitment', Revenue: 300000, Projected: 330000 },
  { dept: 'IT', Revenue: 100000, Projected: 110000 },
  { dept: 'R&D', Revenue: 100000, Projected: 115000 },
];

const departmentProfitData = [
  { department: 'IT Team', Profit: 100000 },
  { department: 'Sales Team', Profit: 75000 },
  { department: 'Engineering Team', Profit: 120000 },
  { department: 'Operations Team', Profit: 50000 },
];

// Proposal Manager: AI-Powered Forecasts & Revenue data (realistic, non-linear)
const proposalSubmissionForecast = [
  { month: 'Jan', Actual: 5, Forecast: 6 },
  { month: 'Feb', Actual: 7, Forecast: 7 },
  { month: 'Mar', Actual: 4, Forecast: 5 },
  { month: 'Apr', Actual: 8, Forecast: 8 },
  { month: 'May', Actual: 6, Forecast: 7 },
  { month: 'Jun', Actual: 9, Forecast: 9 },
  { month: 'Jul', Actual: null, Forecast: 10 },
  { month: 'Aug', Actual: null, Forecast: 11 },
];
const proposalEliminationRiskForecast = [
  { quarter: 'Q1', Actual: 14, Forecast: 13 },
  { quarter: 'Q2', Actual: 12, Forecast: 12 },
  { quarter: 'Q3', Actual: null, Forecast: 11 },
  { quarter: 'Q4', Actual: null, Forecast: 10 },
  { quarter: 'Q1+1', Actual: null, Forecast: 9 },
];
const pipelineValueForecast = [
  { month: 'Jan', Actual: 5.8, Forecast: 6.2 },
  { month: 'Feb', Actual: 6.4, Forecast: 6.8 },
  { month: 'Mar', Actual: 6.1, Forecast: 6.9 },
  { month: 'Apr', Actual: 7.2, Forecast: 7.5 },
  { month: 'May', Actual: 7.5, Forecast: 7.9 },
  { month: 'Jun', Actual: 8.1, Forecast: 8.4 },
  { month: 'Jul', Actual: null, Forecast: 8.6 },
  { month: 'Aug', Actual: null, Forecast: 8.9 },
];
const proposalWinProbabilityTrend = [
  { month: 'Jan', Rate: 28 },
  { month: 'Feb', Rate: 31 },
  { month: 'Mar', Rate: 29 },
  { month: 'Apr', Rate: 33 },
  { month: 'May', Rate: 31 },
  { month: 'Jun', Rate: 35 },
];
const revenueFromWinsData = [
  { month: 'Jan', Revenue: 420000, Pending: 180000 },
  { month: 'Feb', Revenue: 510000, Pending: 220000 },
  { month: 'Mar', Revenue: 380000, Pending: 190000 },
  { month: 'Apr', Revenue: 550000, Pending: 240000 },
  { month: 'May', Revenue: 490000, Pending: 210000 },
  { month: 'Jun', Revenue: 580000, Pending: 260000 },
];
const winValueByVehicleData = [
  { vehicle: 'FAR 15 Best Value', Revenue: 1.2, Projected: 1.4 },
  { vehicle: 'FAR 15 LPTA', Revenue: 0.9, Projected: 1.0 },
  { vehicle: 'FAR 16 Task', Revenue: 1.8, Projected: 2.0 },
  { vehicle: 'Sole Source', Revenue: 0.8, Projected: 0.9 },
  { vehicle: 'Full & Open', Revenue: 1.4, Projected: 1.6 },
];
const winRateByProcurementRadarData = [
  { name: 'FAR 15 BV', value: 36, fullMark: 50 },
  { name: 'FAR 15 LPTA', value: 42, fullMark: 50 },
  { name: 'FAR 16', value: 48, fullMark: 50 },
  { name: 'Sole Source', value: 94, fullMark: 100 },
  { name: 'Full & Open', value: 28, fullMark: 50 },
];
const proposalPipelineByAgencyData = [
  { agency: 'DoD', Pipeline: 3.2, Wins: 1.1 },
  { agency: 'DHS', Pipeline: 1.8, Wins: 0.6 },
  { agency: 'GSA', Pipeline: 2.1, Wins: 0.8 },
  { agency: 'NASA', Pipeline: 0.9, Wins: 0.3 },
  { agency: 'Civilian', Pipeline: 2.4, Wins: 0.9 },
];

const employeeDemographicsData = {
  regions: [
    { name: 'North', value: 35 },
    { name: 'South', value: 25 },
    { name: 'East', value: 20 },
    { name: 'West', value: 20 },
  ],
  ageGroups: [
    { name: '25-30', value: 45 },
    { name: '31-35', value: 30 },
    { name: '36-40', value: 15 },
    { name: '41-45', value: 10 },
  ],
};

export default function DirectorDashboard({ basePath = "/rbac/director", dashboardTitle, welcomeMessage: welcomeMessageProp }) {
  const { t, ready, i18n } = useTranslation(['director', 'welcome']);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('rbac_current_user'));
  const welcomeMessage = welcomeMessageProp ?? t(`welcome:${user?.username || 'director'}`);
  const [modalCard, setModalCard] = useState(null);
  const [modalChart, setModalChart] = useState(null);
  const isArabic = String(i18n?.resolvedLanguage || i18n?.language || 'en').toLowerCase().startsWith('ar');
  const pmText = (en, ar) => (isArabic ? ar : en);
  const pmLabel = (text) => {
    const map = {
      "Pending": "معلّق",
      "In Progress": "قيد التنفيذ",
      "Approved": "معتمد",
      "Delivered": "مسلّم",
      "Win Rate": "معدل الفوز",
      "Win Rate %": "معدل الفوز %",
      "Score": "النتيجة",
      "Readiness": "الجاهزية",
      "Velocity": "السرعة",
      "Position": "المركز",
      "Actual": "الفعلي",
      "Forecast": "التوقع",
      "Revenue": "الإيرادات",
      "Projected": "المتوقع",
      "Discounts": "الخصومات",
      "Rate": "المعدل",
      "Trend": "الاتجاه",
      "Stable": "مستقر",
    };
    if (!isArabic) return text;
    return map[text] || text;
  };
  const pmGraphLabel = (value) => {
    if (!isArabic) return value;
    const key = String(value ?? "");
    const map = {
      Jan: "يناير",
      Feb: "فبراير",
      Mar: "مارس",
      Apr: "أبريل",
      May: "مايو",
      Jun: "يونيو",
      Jul: "يوليو",
      Aug: "أغسطس",
      Sep: "سبتمبر",
      Oct: "أكتوبر",
      Nov: "نوفمبر",
      Dec: "ديسمبر",
      "Sole Source": "مصدر وحيد",
      "Full & Open": "مفتوح بالكامل",
      "FAR Part 15 (Best Value)": "FAR الجزء 15 (أفضل قيمة)",
      "FAR Part 15 (LPTA)": "FAR الجزء 15 (أقل سعر مقبول فنيًا)",
      "FAR Part 16 (Task Orders)": "FAR الجزء 16 (أوامر المهام)",
      Pending: "معلّق",
      InProgress: "قيد التنفيذ",
      Approved: "معتمد",
      Delivered: "مسلّم",
      WinRate: "معدل الفوز",
      Actual: "الفعلي",
      Forecast: "التوقع",
      Revenue: "الإيرادات",
      Projected: "المتوقع",
      Current: "الحالي",
      Pipeline: "خط الأنابيب",
      Wins: "الفوز",
      DoD: "وزارة الدفاع",
      DHS: "الأمن الداخلي",
      GSA: "إدارة الخدمات العامة",
      NASA: "ناسا",
      Civilian: "المدني",
      "FAR 15 Best Value": "FAR 15 أفضل قيمة",
      "FAR 15 LPTA": "FAR 15 أقل سعر مقبول فنيًا",
      "FAR 16 Task": "FAR 16 أوامر المهام",
    };
    if (map[key]) return map[key];
    if (/^Q\d$/i.test(key)) return `الربع ${key.slice(1)}`;
    return key;
  };
  const displayWelcomeMessage =
    basePath === "/rbac/proposal-manager"
      ? pmText(
          welcomeMessage,
          "مرحبًا بك في JUNO RFP - جاهز للتدقيق. جاهز للتسليم. جاهز للفوز."
        )
      : welcomeMessage;

  const displayDashboardTitle =
    basePath === "/rbac/proposal-manager"
      ? pmText(dashboardTitle ?? "JUNO RFP Dashboard", "لوحة JUNO RFP")
      : dashboardTitle ?? (t('dashboard.title') || 'Director Dashboard');

  if (!ready) {
    return <div className="flex min-h-screen bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 items-center justify-center">
      <div className="text-lg text-gray-600 dark:text-gray-300">Loading...</div>
    </div>;
  }

  // Generate translated features array (basePath allows reuse for e.g. Proposal Manager)
  const features = [
    { label: t('dashboard.features.dashboard'), icon: "📊", route: basePath, description: t('dashboard.featureDescriptions.dashboard') },
    { label: t('dashboard.features.analyticsReports'), icon: "📈", route: `${basePath}/analytics`, description: t('dashboard.featureDescriptions.analyticsReports') },
    { label: t('dashboard.features.departments'), icon: "🏢", route: `${basePath}/departments`, description: t('dashboard.featureDescriptions.departments') },
    { label: t('dashboard.features.approvalCenter'), icon: "✅", route: `${basePath}/approvals`, description: t('dashboard.featureDescriptions.approvalCenter') },
    { label: t('dashboard.features.strategicPlanning'), icon: "🗺️", route: `${basePath}/strategic-planning`, description: t('dashboard.featureDescriptions.strategicPlanning') },
    { label: t('dashboard.features.communication'), icon: "📢", route: `${basePath}/communication`, description: t('dashboard.featureDescriptions.communication') },
    { label: t('dashboard.features.auditCompliance'), icon: "🕵️", route: `${basePath}/audit`, description: t('dashboard.featureDescriptions.auditCompliance') },
    { label: t('dashboard.features.meetingsCalendar'), icon: "🗓️", route: `${basePath}/calendar`, description: t('dashboard.featureDescriptions.meetingsCalendar') },
    { label: t('dashboard.features.userManagement'), icon: "👥", route: `${basePath}/users`, description: t('dashboard.featureDescriptions.userManagement') },
    { label: t('dashboard.features.settings'), icon: "⚙️", route: `${basePath}/settings`, description: t('dashboard.featureDescriptions.settings') },
    { label: t('dashboard.features.helpSupport'), icon: "🆘", route: `${basePath}/support`, description: t('dashboard.featureDescriptions.helpSupport') },
    { label: t('dashboard.features.communicationHub'), icon: "💬", route: `${basePath}/comm-hub`, description: t('dashboard.featureDescriptions.communicationHub') },
    { label: t('dashboard.features.trainingDevelopment'), icon: "🎓", route: `${basePath}/training`, description: t('dashboard.featureDescriptions.trainingDevelopment') },
    { label: t('dashboard.features.complianceQuality'), icon: "🏅", route: `${basePath}/compliance`, description: t('dashboard.featureDescriptions.complianceQuality') },
    { label: t('dashboard.features.accountManagement'), icon: "👤", route: `${basePath}/account`, description: t('dashboard.featureDescriptions.accountManagement') },
    { label: t('dashboard.features.supportTickets'), icon: "🎫", route: `${basePath}/tickets`, description: t('dashboard.featureDescriptions.supportTickets') },
    { label: t('dashboard.features.helpDocumentation'), icon: "📖", route: `${basePath}/help`, description: t('dashboard.featureDescriptions.helpDocumentation') },
  ];

  // KPI cards: Proposal Manager = bid/compliance row; Director = translated KPIs
  const directorKpis = [
    { label: t('dashboard.kpis.admissions'), value: 1240, icon: "🎓", color: "bg-blue-100 text-blue-700" },
    { label: t('dashboard.kpis.finance'), value: 98500, icon: "💰", color: "bg-green-100 text-green-700" },
    { label: t('dashboard.kpis.hr'), value: 210, icon: "👥", color: "bg-purple-100 text-purple-700" },
    { label: t('dashboard.kpis.academics'), value: 8.2, icon: "📚", color: "bg-yellow-100 text-yellow-700" },
    { label: t('dashboard.kpis.attendance'), value: 92, icon: "📅", color: "bg-pink-100 text-pink-700" },
  ];
  const proposalManagerKpis = [
    { label: pmText("Bid/No-Bid Ratio", "نسبة تقديم/عدم تقديم العطاء"), value: 2.1, formatType: "ratio", icon: "⚖️", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" },
    { label: pmText("Compliance Coverage %", "نسبة تغطية الامتثال"), value: 94, formatType: "percent", icon: "✅", color: "bg-green-100 text-green-700" },
    { label: pmText("Unaddressed Mandatory Clauses", "البنود الإلزامية غير المعالجة"), value: 2, formatType: "number", icon: "⚠️", color: "bg-amber-100 text-amber-700" },
    { label: pmText("FAR / Regulatory Risk Flag (if federal)", "مؤشر مخاطر FAR / المخاطر التنظيمية"), value: pmText("Low", "منخفض"), formatType: "text", icon: "🚩", color: "bg-purple-100 text-purple-700" },
    { label: pmText("Past Performance Alignment Score", "درجة توافق الأداء السابق"), value: 87, formatType: "percent", icon: "🎯", color: "bg-pink-100 text-pink-700" },
  ];
  const kpis = basePath === "/rbac/proposal-manager" ? proposalManagerKpis : directorKpis;

  // Proposal Manager dashboard: RFP-focused summary cards; Director: translated summary cards
  const proposalManagerSummaryCards = [
    { label: pmText("Active RFPs in Pipeline", "طلبات العروض النشطة في خط الأنابيب"), value: 18, formatType: "number", icon: "📋", color: "from-blue-400 to-blue-600", trend: "", trendColor: "", sub: pmText("In progress", "قيد التنفيذ"), spark: [12, 14, 15, 16, 17, 18], sparkColor: { light: "#3b82f6", dark: "#fff" } },
    { label: pmText("Total Pipeline Value ($)", "إجمالي قيمة خط الأنابيب ($)"), value: 8450000, formatType: "currency", icon: "💰", color: "from-green-400 to-green-600", trend: "", trendColor: "", sub: pmText("Combined opportunity value", "القيمة الإجمالية للفرص"), spark: [6200000, 6800000, 7200000, 7800000, 8100000, 8450000], sparkColor: { light: "#22c55e", dark: "#fff" } },
    { label: pmText("Average Deal Size", "متوسط حجم الصفقة"), value: 425000, formatType: "currency", icon: "📊", color: "from-purple-400 to-purple-600", trend: "", trendColor: "", sub: pmText("Per RFP", "لكل طلب عروض"), spark: [380000, 392000, 398000, 405000, 412000, 425000], sparkColor: { light: "#a78bfa", dark: "#fff" } },
    { label: pmText("Win Rate (Trailing 6–12 Months)", "معدل الفوز (آخر 6-12 شهراً)"), value: 31, formatType: "percent", icon: "🏆", color: "from-pink-400 to-pink-600", trend: "", trendColor: "", sub: pmText("Percentage", "نسبة مئوية"), spark: [26, 27, 28, 29, 30, 31], sparkColor: { light: "#ec4899", dark: "#fff" } },
    { label: pmText("Bid/No-Bid Ratio", "نسبة تقديم/عدم تقديم العطاء"), value: 2.1, formatType: "ratio", icon: "⚖️", color: "from-teal-400 to-teal-600", trend: "", trendColor: "", sub: pmText("Bids per no-bid", "عدد العطاءات لكل عدم تقديم"), spark: [1.7, 1.8, 1.9, 2.0, 2.05, 2.1], sparkColor: { light: "#2dd4bf", dark: "#fff" } },
    { label: pmText("Weighted Win Probability (%)", "احتمالية الفوز الموزونة (%)"), value: 64, formatType: "percent", icon: "📈", color: "from-orange-400 to-orange-600", trend: "", trendColor: "", sub: pmText("Across pipeline", "عبر خط الأنابيب"), spark: [52, 55, 58, 60, 62, 64], sparkColor: { light: "#fb923c", dark: "#fff" } },
  ];
  const directorSummaryCards = [
    { label: t('dashboard.summaryCards.totalStudents'), value: 12400, icon: "👨‍🎓", color: "from-blue-400 to-blue-600", trend: "", trendColor: "", sub: t('dashboard.summaryCards.changeFromLastMonth'), spark: [11000, 11200, 11500, 12000, 12200, 12400], sparkColor: { light: "#3b82f6", dark: "#fff" } },
    { label: t('dashboard.summaryCards.totalFacultyStaff'), value: 890, icon: "👩‍🏫", color: "from-purple-400 to-purple-600", trend: "", trendColor: "", sub: `${t('dashboard.summaryCards.vacancy')}: 12`, spark: [850, 860, 870, 880, 885, 890], sparkColor: { light: "#a78bfa", dark: "#fff" } },
    { label: t('dashboard.summaryCards.collegesDepartments'), value: 18, icon: "🏫", color: "from-pink-400 to-pink-600", trend: "", trendColor: "", sub: t('dashboard.summaryCards.newThisYear'), spark: [15, 15, 16, 16, 17, 18], sparkColor: { light: "#ec4899", dark: "#fff" } },
    { label: t('dashboard.summaryCards.coursesOffered'), value: 320, icon: "📚", color: "from-yellow-400 to-yellow-600", trend: "", trendColor: "", sub: t('dashboard.summaryCards.addedThisYear'), spark: [290, 295, 300, 310, 315, 320], sparkColor: { light: "#facc15", dark: "#fff" } },
    { label: t('dashboard.summaryCards.vehiclesRunning'), value: 42, icon: "🚌", color: "from-green-400 to-green-600", trend: "", trendColor: "", sub: t('dashboard.summaryCards.routesActive'), spark: [40, 41, 43, 44, 43, 42], sparkColor: { light: "#22c55e", dark: "#fff" } },
    { label: t('dashboard.summaryCards.upcomingEvents'), value: 7, icon: "📅", color: "from-orange-400 to-orange-600", trend: "", trendColor: "", sub: t('dashboard.summaryCards.next7Days'), spark: [3, 4, 5, 6, 7, 7], sparkColor: { light: "#fb923c", dark: "#fff" } },
  ];
  const summaryCards = basePath === "/rbac/proposal-manager" ? proposalManagerSummaryCards : directorSummaryCards;

  // Generate translated alerts: Proposal Manager = RFP/bid/compliance alerts; Director = budget/compliance/HR
  const isPM = basePath === "/rbac/proposal-manager";
  const alerts = isPM
    ? [
        { text: t('dashboard.alerts.proposalManager.rfpSubmissionDeadline'), color: 'text-red-500' },
        { text: t('dashboard.alerts.proposalManager.complianceReviewDue'), color: 'text-amber-500' },
        { text: t('dashboard.alerts.proposalManager.bidApprovalPending'), color: 'text-blue-500' },
        { text: t('dashboard.alerts.proposalManager.teamAssignmentNeeded'), color: 'text-indigo-500' },
        { text: t('dashboard.alerts.proposalManager.pastPerformanceUpdate'), color: 'text-purple-500' },
        { text: t('dashboard.alerts.proposalManager.pricingReviewRequired'), color: 'text-green-600 dark:text-green-400' },
      ]
    : [
        { icon: '🚨', text: t('dashboard.alerts.pendingBudgetApprovals'), color: 'text-red-500' },
        { icon: '⚠️', text: t('dashboard.alerts.complianceAlert'), color: 'text-yellow-500' },
        { icon: '⏳', text: t('dashboard.alerts.upcomingExamDeadline'), color: 'text-blue-500' },
        { icon: '💬', text: t('dashboard.alerts.newFeedbackStudents'), color: 'text-green-500' },
      ];

  // Modal content generator
  const renderModalContent = (card) => {
    if (!card) return null;
    // Example extra details for each card type
    let extraDetails = null;
    let insight = null;
    if (card.label.includes('Employee') || card.label.includes('Team')) {
      extraDetails = (
        <table className="w-full text-sm mb-2">
          <tbody>
            <tr><td className="font-medium">Full-Time</td><td className="text-right">8,200</td></tr>
            <tr><td className="font-medium">Part-Time</td><td className="text-right">3,100</td></tr>
            <tr><td className="font-medium">Contract</td><td className="text-right">1,100</td></tr>
          </tbody>
        </table>
      );
      insight = <div className="text-xs text-blue-600 dark:text-blue-300 mb-2">Steady growth in employee population, with a 2.5% increase this month. Contract employee ratio is 8.9%.</div>;
    } else if (card.label.includes('Team') || card.label.includes('Member')) {
      extraDetails = (
        <table className="w-full text-sm mb-2">
          <tbody>
            <tr><td className="font-medium">Full-Time</td><td className="text-right">650</td></tr>
            <tr><td className="font-medium">Part-Time</td><td className="text-right">200</td></tr>
            <tr><td className="font-medium">Contractual</td><td className="text-right">40</td></tr>
          </tbody>
        </table>
      );
      insight = <div className="text-xs text-purple-600 dark:text-purple-300 mb-2">Vacancy rate is low. Recruitment drive ongoing for 12 open positions.</div>;
    } else if (card.label.includes('Department') || card.label.includes('Division')) {
      extraDetails = (
        <ul className="text-sm mb-2 list-disc ml-5">
          <li>New: Data Analytics Division</li>
          <li>Largest: Engineering Team (3,200 employees)</li>
          <li>Smallest: Legal Team (400 employees)</li>
        </ul>
      );
      insight = <div className="text-xs text-pink-600 dark:text-pink-300 mb-2">1 new department added this year. Most growth in Technology and Operations fields.</div>;
    } else if (card.label.includes('Project') || card.label.includes('Position')) {
      extraDetails = (
        <ul className="text-sm mb-2 list-disc ml-5">
          <li>Active Projects: 180</li>
          <li>Ongoing Positions: 110</li>
          <li>R&D Initiatives: 30</li>
        </ul>
      );
      insight = <div className="text-xs text-yellow-600 dark:text-yellow-300 mb-2">8 new projects launched this year, mostly in AI, Data Science, and Business Intelligence.</div>;
    } else if (card.label.includes('Vehicles')) {
      extraDetails = (
        <table className="w-full text-sm mb-2">
          <tbody>
            <tr><td className="font-medium">Buses</td><td className="text-right">30</td></tr>
            <tr><td className="font-medium">Vans</td><td className="text-right">8</td></tr>
            <tr><td className="font-medium">Ambulances</td><td className="text-right">4</td></tr>
          </tbody>
        </table>
      );
      insight = <div className="text-xs text-green-600 dark:text-green-300 mb-2">1 vehicle out of service. All routes running on time.</div>;
    } else if (card.label.includes('Event')) {
      extraDetails = (
        <ul className="text-sm mb-2 list-disc ml-5">
          <li>Convocation: 2 days left</li>
          <li>Sports Meet: 5 days left</li>
          <li>Faculty Workshop: 6 days left</li>
        </ul>
      );
      insight = <div className="text-xs text-orange-600 dark:text-orange-300 mb-2">Busy week ahead! 7 major events scheduled in the next 7 days.</div>;
    }
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{card.icon}</span>
          <span className="text-lg font-bold uppercase tracking-wide">{card.label}</span>
        </div>
        <div className="text-2xl font-bold mb-2">
          {card.formatType === 'currency'
            ? `$${Number(card.value).toLocaleString()}`
            : card.formatType === 'percent'
              ? `${card.value}%`
              : card.value}
        </div>
        <div className="mb-2 text-sm text-gray-400 dark:text-gray-300">{card.sub}</div>
        {/* Modal sparkline */}
        <div className="w-full h-20 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={card.spark.map((v, idx) => ({ idx, v }))} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`modal-spark-gradient`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={card.sparkColor.light} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={card.sparkColor.light} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={card.sparkColor.light}
                fill={`url(#modal-spark-gradient)`}
                strokeWidth={3.2}
                dot={{ r: 4, stroke: card.sparkColor.light, strokeWidth: 2, fill: '#fff' }}
                className="block dark:hidden"
              />
              <Area
                type="monotone"
                dataKey="v"
                stroke={card.sparkColor.dark}
                fill="none"
                strokeWidth={3.2}
                dot={{ r: 4, stroke: card.sparkColor.dark, strokeWidth: 2, fill: '#222' }}
                className="hidden dark:block"
                style={{ filter: 'drop-shadow(0 0 4px #fff8)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {insight}
        {extraDetails}
        <div className="text-sm text-gray-700 dark:text-gray-200">
          <ul className="list-disc ml-5">
            <li>{pmText("Trend", "الاتجاه")}: <span className={card.trendColor}>{card.trend || pmText('Stable', 'مستقر')}</span></li>
            <li>{pmText("Last 6 periods", "آخر 6 فترات")}: {card.spark.map((v, i) => <span key={i} className="inline-block mx-1">{card.formatType === 'currency' ? `$${Number(v).toLocaleString()}` : v}</span>)}</li>
          </ul>
        </div>
      </div>
    );
  };

  // Modal component
  const Modal = ({ card, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full relative animate-fadeInUp">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl font-bold"
          aria-label="Close"
        >
          &times;
        </button>
        {renderModalContent(card)}
      </div>
    </div>
  );

  // Add extra details for KPI cards
  const renderKpiModalContent = (kpi) => {
    if (!kpi) return null;
    let extraDetails = null;
    let insight = null;
    if (kpi.label.includes('Recruitment') || kpi.label.includes('Hiring')) {
      extraDetails = (
        <ul className="text-sm mb-2 list-disc ml-5">
          <li>Applications this month: 1,500</li>
          <li>Hiring rate: 82%</li>
          <li>Top position: Software Engineer</li>
        </ul>
      );
      insight = <div className="text-xs text-blue-600 dark:text-blue-300 mb-2">Recruitment is up 5% compared to last month. Most applications from major cities.</div>;
    } else if (kpi.label.includes('Finance')) {
      extraDetails = (
        <ul className="text-sm mb-2 list-disc ml-5">
          <li>Revenue Collection (YTD): $600,000</li>
          <li>Outstanding Payments: $12,000</li>
          <li>Employee Benefits: $45,000</li>
        </ul>
      );
      insight = <div className="text-xs text-green-600 dark:text-green-300 mb-2">Finance is healthy. Outstanding payments are at a record low. Employee benefits allocation up 10%.</div>;
    } else if (kpi.label.includes('HR')) {
      extraDetails = (
        <ul className="text-sm mb-2 list-disc ml-5">
          <li>Full-Time Staff: 650</li>
          <li>Part-Time: 200</li>
          <li>Open Positions: 12</li>
        </ul>
      );
      insight = <div className="text-xs text-purple-600 dark:text-purple-300 mb-2">Staff attrition is at 3.5%. Recruitment drive for new team members ongoing.</div>;
    } else if (kpi.label.includes('Operations') || kpi.label.includes('Business')) {
      extraDetails = (
        <ul className="text-sm mb-2 list-disc ml-5">
          <li>Avg Performance Score: 8.2</li>
          <li>Project Completion Rate: 8.5</li>
          <li>Top Department: Engineering Team (8.7)</li>
        </ul>
      );
      insight = <div className="text-xs text-yellow-600 dark:text-yellow-300 mb-2">Operational performance is stable. Engineering Team leads in project completion.</div>;
    } else if (kpi.label.includes('Attendance')) {
      extraDetails = (
        <ul className="text-sm mb-2 list-disc ml-5">
          <li>Employee Attendance: 92%</li>
          <li>Management Attendance: 95%</li>
          <li>Lowest: Legal Team (88%)</li>
        </ul>
      );
      insight = <div className="text-xs text-pink-600 dark:text-pink-300 mb-2">Attendance is above target. Law department needs improvement.</div>;
    }
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{kpi.icon}</span>
          <span className="text-lg font-bold uppercase tracking-wide">{kpi.label}</span>
        </div>
        <div className="text-2xl font-bold mb-2">
          {typeof kpi.value === 'string'
            ? kpi.value
            : kpi.formatType === 'currency'
              ? `$${Number(kpi.value).toLocaleString()}`
              : kpi.formatType === 'percent'
                ? `${kpi.value}%`
                : kpi.value}
        </div>
        <div className="mb-2 text-sm text-gray-400 dark:text-gray-300">{kpi.label}</div>
        {insight}
        {extraDetails}
      </div>
    );
  };

  // Modal for KPI cards
  const KpiModal = ({ kpi, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full relative animate-fadeInUp">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl font-bold"
          aria-label="Close"
        >
          &times;
        </button>
        {renderKpiModalContent(kpi)}
      </div>
    </div>
  );

  // Modal for large chart view (titles and data vary by basePath for Proposal Manager)
  const ChartModal = ({ chartId, onClose }) => {
    const isPM = basePath === '/rbac/proposal-manager';
    let content = null;
    if (!chartId) return null;
    if (chartId === 'admission') {
      content = (
        <div className="w-[90vw] max-w-3xl h-[60vh] bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-bold mb-2 text-blue-700 dark:text-blue-300">{isPM ? pmText('Submission Forecast', 'توقعات التقديم') : 'Predictive Recruitment Forecast'}</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={isPM ? proposalSubmissionForecast : forecastData} margin={{ top: 20, right: 40, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={isPM ? pmGraphLabel : undefined} />
              <YAxis />
              <Tooltip formatter={isPM ? ((value, name) => [value, pmGraphLabel(name)]) : undefined} labelFormatter={isPM ? ((label) => pmGraphLabel(label)) : undefined} />
              <Legend formatter={isPM ? ((value) => pmGraphLabel(value)) : undefined} />
              <Line type="monotone" dataKey="Actual" name={isPM ? pmGraphLabel("Actual") : undefined} stroke="#6366f1" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 10 }} connectNulls />
              <Line type="monotone" dataKey="Forecast" name={isPM ? pmGraphLabel("Forecast") : undefined} stroke="#22c55e" strokeDasharray="5 5" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 10 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    } else if (chartId === 'dropout') {
      content = (
        <div className="w-[90vw] max-w-3xl h-[60vh] bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-bold mb-2 text-pink-700 dark:text-pink-300">{isPM ? pmText('Elimination Risk Forecast', 'توقعات مخاطر الإقصاء') : 'Employee Retention Risk Forecast'}</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={isPM ? proposalEliminationRiskForecast : retentionForecast} margin={{ top: 20, right: 40, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quarter" tickFormatter={isPM ? pmGraphLabel : undefined} />
              <YAxis domain={isPM ? [8, 16] : [2.5, 5]} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={isPM ? ((v, name) => [`${v}%`, pmGraphLabel(name)]) : (v => `${v}%`)} labelFormatter={isPM ? ((label) => pmGraphLabel(label)) : undefined} />
              <Legend formatter={isPM ? ((value) => pmGraphLabel(value)) : undefined} />
              <Line type="monotone" dataKey="Actual" name={isPM ? pmGraphLabel("Actual") : undefined} stroke="#ef4444" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 10 }} connectNulls />
              <Line type="monotone" dataKey="Forecast" name={isPM ? pmGraphLabel("Forecast") : undefined} stroke="#f472b6" strokeDasharray="5 5" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 10 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    } else if (chartId === 'surplus') {
      content = (
        <div className="w-[90vw] max-w-3xl h-[60vh] bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-bold mb-2 text-green-700 dark:text-green-300">{isPM ? pmText('Pipeline Value Forecast', 'توقعات قيمة خط الأنابيب') : 'Financial Surplus/Deficit Forecast'}</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={isPM ? pipelineValueForecast : surplusForecast} margin={{ top: 20, right: 40, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={isPM ? pmGraphLabel : undefined} />
              <YAxis tickFormatter={isPM ? (v => `$${v}M`) : (v => `$${v.toLocaleString()}`)} />
              <Tooltip formatter={isPM ? ((v, name) => [`$${v}M`, pmGraphLabel(name)]) : (v => `$${v.toLocaleString()}`)} labelFormatter={isPM ? ((label) => pmGraphLabel(label)) : undefined} />
              <Bar dataKey="Actual" name={isPM ? pmGraphLabel("Actual") : undefined} fill="#22c55e" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Forecast" name={isPM ? pmGraphLabel("Forecast") : undefined} fill="#6366f1" radius={[8, 8, 0, 0]} fillOpacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    } else if (chartId === 'placement') {
      content = (
        <div className="w-[90vw] max-w-3xl h-[60vh] bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-bold mb-2 text-indigo-700 dark:text-indigo-300">Placement Success Forecast</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={[
              { year: '2026', Actual: 88, Forecast: 88 },
              { year: '2026', Actual: 90, Forecast: 90 },
              { year: '2026', Actual: 91, Forecast: 91 },
              { year: '2026', Actual: null, Forecast: 92 },
            ]} margin={{ top: 20, right: 40, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis domain={[80, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={v => `${v}%`} />
              <Bar dataKey="Actual" fill="#6366f1" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Forecast" fill="#22c55e" radius={[8, 8, 0, 0]} fillOpacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    } else if (chartId === 'sentiment') {
      content = (
        <div className="w-[90vw] max-w-2xl h-[60vh] bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold mb-2 text-yellow-700 dark:text-yellow-300">Employee Sentiment Analysis</h3>
          <ResponsiveContainer width="60%" height="80%">
            <PieChart>
              <Pie data={[
                { name: 'Positive', value: 78 },
                { name: 'Neutral', value: 15 },
                { name: 'Negative', value: 7 },
              ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                <Cell fill="#22c55e" />
                <Cell fill="#facc15" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip formatter={v => `${v}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    } else if (chartId === 'benchmark') {
      content = (
        <div className="w-[90vw] max-w-2xl h-[60vh] bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold mb-2 text-orange-700 dark:text-orange-300">Competitor Benchmarking</h3>
          <ResponsiveContainer width="80%" height="80%">
            <RadarChart cx="50%" cy="50%" outerRadius={120} data={[
              { kpi: 'Research', You: 90, Peer: 80 },
              { kpi: 'Placements', You: 85, Peer: 88 },
              { kpi: 'Int. Recruitment', You: 70, Peer: 80 },
              { kpi: 'Team Size', You: 88, Peer: 85 },
              { kpi: 'Infra', You: 80, Peer: 78 },
            ]}>
              <PolarGrid />
              <PolarAngleAxis dataKey="kpi" />
              <PolarRadiusAxis angle={30} domain={[60, 100]} />
              <Radar name="You" dataKey="You" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
              <Radar name="Peer" dataKey="Peer" stroke="#f59e42" fill="#f59e42" fillOpacity={0.3} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      );
    } else if (chartId === 'leadConversion') {
      content = (
        <div className="w-[90vw] max-w-3xl h-[60vh] bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-bold mb-2 text-blue-700 dark:text-blue-300">{isPM ? pmText('Win Probability Trend', 'اتجاه احتمالية الفوز') : t('dashboard.aiWidgets.leadConversion')}</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={isPM ? proposalWinProbabilityTrend : leadConversionData} margin={{ top: 20, right: 40, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={isPM ? pmGraphLabel : undefined} />
              <YAxis domain={isPM ? [25, 40] : undefined} tickFormatter={isPM ? (v => `${v}%`) : undefined} />
              <Tooltip formatter={isPM ? (v => [`${v}%`, pmText('Win rate', 'معدل الفوز')]) : undefined} labelFormatter={isPM ? ((label) => pmGraphLabel(label)) : undefined} />
              <Legend formatter={isPM ? ((value) => pmGraphLabel(value)) : undefined} />
              <Line type="monotone" dataKey="Rate" stroke="#6366f1" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 10 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    } else if (chartId === 'applicationFee') {
      content = (
        <div className="w-[90vw] max-w-3xl h-[60vh] bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-bold mb-2 text-green-700 dark:text-green-300">{isPM ? pmText('Revenue from Wins', 'إيرادات من الفوز') : t('dashboard.aiWidgets.applicationFeeRevenue')}</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={isPM ? revenueFromWinsData : applicationFeeData} margin={{ top: 20, right: 40, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={isPM ? pmGraphLabel : undefined} />
              <YAxis tickFormatter={isPM ? (v => `$${(v / 1000).toFixed(0)}k`) : (v => `$${v.toLocaleString()}`)} />
              <Tooltip formatter={isPM ? ((v, name) => [`$${Number(v).toLocaleString()}`, pmGraphLabel(name)]) : (v => `$${v.toLocaleString()}`)} labelFormatter={isPM ? ((label) => pmGraphLabel(label)) : undefined} />
              <Bar dataKey="Revenue" name={isPM ? pmGraphLabel("Revenue") : undefined} fill="#22c55e" radius={[8, 8, 0, 0]} />
              <Bar dataKey={isPM ? 'Pending' : 'Discounts'} name={isPM ? pmGraphLabel("Pending") : undefined} fill={isPM ? '#f59e0b' : '#ef4444'} radius={[8, 8, 0, 0]} fillOpacity={isPM ? 0.8 : 1} />
              <Legend formatter={isPM ? ((value) => pmGraphLabel(value)) : undefined} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    } else if (chartId === 'deptRevenue') {
      content = (
        <div className="w-[90vw] max-w-3xl h-[60vh] bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-bold mb-2 text-indigo-700 dark:text-indigo-300">{isPM ? pmText('Win Value by Vehicle', 'قيمة الفوز حسب وسيلة التعاقد') : t('dashboard.aiWidgets.departmentRevenue')}</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={isPM ? winValueByVehicleData : deptRevenueData} margin={{ top: 20, right: 40, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={isPM ? 'vehicle' : 'dept'} tick={isPM ? { fontSize: 10 } : undefined} tickFormatter={isPM ? pmGraphLabel : undefined} />
              <YAxis tickFormatter={isPM ? (v => `$${v}M`) : (v => `$${v.toLocaleString()}`)} />
              <Tooltip formatter={isPM ? ((v, name) => [`$${v}M`, pmGraphLabel(name)]) : (v => `$${v.toLocaleString()}`)} labelFormatter={isPM ? ((label) => pmGraphLabel(label)) : undefined} />
              <Legend formatter={isPM ? ((value) => pmGraphLabel(value)) : undefined} />
              <Bar dataKey="Revenue" name={isPM ? pmGraphLabel("Revenue") : undefined} fill={isPM ? '#74c69d' : '#6366f1'} radius={[8, 8, 0, 0]} />
              <Bar dataKey="Projected" name={isPM ? pmGraphLabel("Projected") : undefined} fill="#22c55e" radius={[8, 8, 0, 0]} fillOpacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    } else if (chartId === 'subjectProfit') {
      content = (
        <div className="w-[90vw] max-w-3xl h-[60vh] bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 gap-4 items-stretch min-h-[260px] border border-gray-100 dark:border-gray-800">
          <div className="flex-1 min-w-[140px] flex items-center justify-center cursor-pointer group" onClick={() => setModalChart('subjectProfit')} title={t('dashboard.aiLabels.clickToEnlarge')}>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={departmentProfitData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis tickFormatter={v => `$${v.toLocaleString()}`} />
                <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                <Bar dataKey="Profit" fill="#22c55e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <span className="hidden group-hover:block absolute text-xs text-green-500 bg-white dark:bg-gray-900 px-2 py-1 rounded shadow top-2 left-2">{t('dashboard.aiLabels.clickToEnlarge')}</span>
          </div>
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-green-700 dark:text-green-300">{t('dashboard.aiWidgets.subjectProfitability')}</span>
                <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900 text-xs text-green-700 dark:text-green-200 font-semibold">{t('dashboard.aiLabels.ai')}</span>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                Visualizes profit margins for each subject.<br />
                Instantly spot most/least profitable subjects.
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.confidence')}: <span className="font-bold text-green-500">94%</span> | {t('dashboard.aiLabels.model')}: v2.1</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.keyDrivers')}: <span className="font-medium">Enrollment, Tuition, Operating Costs</span></div>
            </div>
                            <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                  <span>{t('dashboard.aiLabels.interactiveBarChart')}</span>
                  <span className="italic">{t('dashboard.aiLabels.poweredByNexusAI')}</span>
                </div>
          </div>
        </div>
      );
    } else if (chartId === 'demographics') {
      content = isPM ? (
        <div className="w-[90vw] max-w-3xl h-[60vh] bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-bold mb-2 text-blue-700 dark:text-blue-300">Pipeline Value Trend</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={pipelineValueForecast} margin={{ top: 20, right: 40, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={pmGraphLabel} />
              <YAxis tickFormatter={v => `$${v}M`} />
              <Tooltip formatter={(v, name) => [`$${v}M`, pmGraphLabel(name)]} labelFormatter={(label) => pmGraphLabel(label)} />
              <Legend formatter={(value) => pmGraphLabel(value)} />
              <Bar dataKey="Actual" name={pmGraphLabel("Actual")} fill="#22c55e" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Forecast" name={pmGraphLabel("Forecast")} fill="#6366f1" radius={[8, 8, 0, 0]} fillOpacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="w-[90vw] max-w-3xl h-[60vh] bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-bold mb-2 text-blue-700 dark:text-blue-300">{t('dashboard.aiWidgets.studentDemographics')}</h3>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={employeeDemographicsData.regions} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                <Cell fill="#6366f1" />
                <Cell fill="#22c55e" />
                <Cell fill="#f59e42" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip formatter={v => `${v}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    } else if (chartId === 'deptRevenueRadar') {
      content = isPM ? (
        <div className="w-[90vw] max-w-3xl h-[60vh] bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-bold mb-2 text-indigo-700 dark:text-indigo-300">Pipeline & Wins by Agency</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={proposalPipelineByAgencyData} margin={{ top: 20, right: 40, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="agency" tickFormatter={pmGraphLabel} />
              <YAxis tickFormatter={v => `$${v}M`} />
              <Tooltip formatter={(v, name) => [`$${v}M`, pmGraphLabel(name)]} labelFormatter={(label) => pmGraphLabel(label)} />
              <Legend formatter={(value) => pmGraphLabel(value)} />
              <Bar dataKey="Pipeline" name={pmGraphLabel("Pipeline")} fill="#6366f1" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Wins" name={pmGraphLabel("Wins")} fill="#22c55e" radius={[8, 8, 0, 0]} fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="w-[90vw] max-w-3xl h-[60vh] bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-bold mb-2 text-indigo-700 dark:text-indigo-300">{t('dashboard.aiWidgets.departmentRevenueRadar')}</h3>
          <ResponsiveContainer width="100%" height="90%">
            <RadarChart cx="50%" cy="50%" outerRadius={120} data={deptRevenueData.map(d => ({ dept: d.dept, Revenue: d.Revenue, Projected: d.Projected }))}>
              <PolarGrid />
              <PolarAngleAxis dataKey="dept" />
              <PolarRadiusAxis angle={30} />
              <Radar name="Current" dataKey="Revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
              <Radar name="Projected" dataKey="Projected" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      );
    } else if (chartId === 'subjectProfitRadar') {
      const pmRadarData = winValueByVehicleData.map(d => ({ vehicle: d.vehicle, Revenue: d.Revenue, Projected: d.Projected }));
      const maxVal = isPM ? Math.max(2.5, ...pmRadarData.flatMap(d => [d.Revenue, d.Projected])) : undefined;
      content = (
        <div className="w-[90vw] max-w-3xl min-h-[480px] h-[60vh] bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 flex flex-col">
          <h3 className="text-lg font-bold mb-2 text-green-700 dark:text-green-300 shrink-0">{isPM ? pmText('Win Value by Vehicle (Radar)', 'قيمة الفوز حسب وسيلة التعاقد (رادار)') : t('dashboard.aiWidgets.subjectProfitabilityRadar')}</h3>
          <div className="flex-1 min-h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius={isPM ? 120 : 80} data={isPM ? pmRadarData : departmentProfitData.map(s => ({ department: s.department, Profit: s.Profit }))}>
                <PolarGrid />
                <PolarAngleAxis dataKey={isPM ? 'vehicle' : 'department'} tick={isPM ? { fontSize: 12 } : undefined} tickFormatter={isPM ? pmGraphLabel : undefined} />
                <PolarRadiusAxis angle={30} domain={isPM ? [0, maxVal] : undefined} tickFormatter={isPM ? (v => `$${v}M`) : undefined} />
                {isPM ? (
                  <>
                    <Radar name={pmGraphLabel("Current")} dataKey="Revenue" stroke="#74c69d" fill="#74c69d" fillOpacity={0.5} />
                    <Radar name={pmGraphLabel("Projected")} dataKey="Projected" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                  </>
                ) : (
                  <Radar name="Profit" dataKey="Profit" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
                )}
                <Legend formatter={isPM ? ((value) => pmGraphLabel(value)) : undefined} />
                <Tooltip formatter={isPM ? ((v, name) => [`$${v}M`, pmGraphLabel(name)]) : undefined} labelFormatter={isPM ? ((label) => pmGraphLabel(label)) : undefined} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={onClose} />
        <div className="relative z-10">
          <button
            onClick={onClose}
            className="absolute top-2 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-3xl font-bold"
            aria-label="Close"
            style={{ zIndex: 20 }}
          >
            &times;
          </button>
          {content}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      <main className="flex-1 p-6 md:p-10 flex flex-col gap-8 overflow-x-auto">
        {/* Dashboard Header - Tour Target */}
        <div
          className="dashboard-header"
          data-tour="1"
          data-tour-title-en="Dashboard Header"
          data-tour-content-en="Your page title and context"
          data-tour-title-ar="رأس اللوحة"
          data-tour-content-ar="عنوان الصفحة والسياق"
          data-tour-position="bottom"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {displayDashboardTitle}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {displayWelcomeMessage}
          </p>
            {basePath === "/rbac/proposal-manager" && (
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mt-4">
              {pmText("Bids Portfolio Health Overview", "نظرة عامة على صحة محفظة العطاءات")}
            </h2>
          )}
        </div>

        {/* Slim, Colorful Summary Cards */}
        <div
          className="summary-cards grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
          data-tour="2"
          data-tour-title-en="KPI Cards"
          data-tour-content-en="Instant insights. Click any card for details."
          data-tour-title-ar="بطاقات مؤشرات الأداء"
          data-tour-content-ar="رؤى فورية. اضغط على بطاقة للتفاصيل."
          data-tour-position="top"
        >
          {summaryCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`flex flex-col justify-between rounded-xl shadow-lg px-4 py-3 bg-gradient-to-br ${card.color} text-white min-h-[100px] ${basePath === "/rbac/proposal-manager" ? "min-h-[120px]" : ""} relative overflow-visible cursor-pointer hover:scale-[1.03] active:scale-95 transition-transform`}
              style={{ boxShadow: '0 4px 16px 0 rgba(60,60,100,0.10)' }}
              onClick={() => setModalCard(card)}
            >
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <span className="text-2xl drop-shadow flex-shrink-0">{card.icon}</span>
                <span className="text-xs font-semibold uppercase tracking-wide opacity-95 break-words line-clamp-3 leading-tight">{card.label}</span>
              </div>
              <div className="flex items-end justify-between mt-2">
                <span className="text-2xl md:text-3xl font-bold">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                  >
                    {card.formatType === 'currency'
                      ? `$${Number(card.value).toLocaleString()}`
                      : card.formatType === 'percent'
                        ? `${card.value}%`
                        : card.value}
                  </motion.span>
                </span>
                {card.trend && (
                  <span className={`ml-2 text-xs font-bold ${card.trendColor}`}>{card.trend}</span>
                )}
              </div>
              {/* Mini sparkline */}
              <div className="absolute bottom-2 right-2 w-16 h-6 opacity-90 pointer-events-none">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={card.spark.map((v, idx) => ({ idx, v }))} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`spark-gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={card.sparkColor.light} stopOpacity={0.5} />
                        <stop offset="100%" stopColor={card.sparkColor.light} stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke={card.sparkColor.light}
                      fill={`url(#spark-gradient-${i})`}
                      strokeWidth={3.2}
                      dot={false}
                      className="block dark:hidden"
                    />
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke={card.sparkColor.dark}
                      fill="none"
                      strokeWidth={3.2}
                      dot={false}
                      className="hidden dark:block"
                      style={{ filter: 'drop-shadow(0 0 4px #fff8)' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <span className="text-xs opacity-80 mt-1 z-10 break-words">{card.sub}</span>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions removed per request */}

        {/* Animated KPI Cards */}
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6"
          data-tour="3"
          data-tour-title-en="KPI Grid"
          data-tour-content-en="Deeper metrics with interactive cards. Click any to expand."
          data-tour-title-ar="شبكة مؤشرات الأداء"
          data-tour-content-ar="مقاييس أعمق ببطاقات تفاعلية. اضغط للتوسيع."
          data-tour-position="bottom"
        >
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl shadow-lg p-6 flex flex-col items-center ${kpi.color} bg-opacity-80 backdrop-blur-md cursor-pointer hover:scale-[1.03] active:scale-95 transition-transform`}
              onClick={() => setModalCard({ ...kpi, isKpi: true })}
            >
              <span className="text-3xl mb-2">{kpi.icon}</span>
              <span className="text-2xl font-bold">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  {typeof kpi.value === 'string'
                    ? kpi.value
                    : kpi.formatType === 'currency'
                      ? `$${Number(kpi.value).toLocaleString()}`
                      : kpi.formatType === 'percent'
                        ? `${kpi.value}%`
                        : kpi.value}
                </motion.span>
              </span>
              <span className="text-sm font-medium mt-1 opacity-80">{kpi.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Animated Charts Section */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          data-tour="4"
          data-tour-title-en="Recruitment & Finance Charts"
          data-tour-content-en="Visualize recruitment trends and finance distribution."
          data-tour-title-ar="مخططات القبول والمالية"
          data-tour-content-ar="عرض اتجاهات القبول وتوزيع المالية."
          data-tour-position="top"
        >
          {/* Rolling Win Rate by Procurement Type (Proposal Manager) / Recruitment Trend (Director) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6"
          >
            {basePath === "/rbac/proposal-manager" ? (
              <>
                <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-gray-100">{pmText("Rolling Win Rate by Procurement Type", "معدل الفوز المتحرك حسب نوع الشراء")}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{pmText("Trailing 12 months — win rate %", "آخر 12 شهراً — نسبة معدل الفوز %")}</p>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={rollingWinRateByProcurement} margin={{ top: 12, right: 24, left: 0, bottom: 0 }}>
                    <defs>
                      {WIN_RATE_KEYS.map((key, idx) => (
                        <linearGradient key={key} id={WIN_RATE_GRADIENT_IDS[idx]} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={WIN_RATE_COLORS[key]} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={WIN_RATE_COLORS[key]} stopOpacity={0.05} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={pmGraphLabel} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(value, name) => [`${value}%`, pmGraphLabel(name)]} labelFormatter={(label) => pmGraphLabel(label)} contentStyle={{ borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value) => <span className="text-gray-700 dark:text-gray-200">{pmGraphLabel(value)}</span>} />
                    <Area type="monotone" dataKey="FAR Part 15 (Best Value)" stroke={WIN_RATE_COLORS["FAR Part 15 (Best Value)"]} strokeWidth={2.5} fill={`url(#${WIN_RATE_GRADIENT_IDS[0]})`} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="FAR Part 15 (LPTA)" stroke={WIN_RATE_COLORS["FAR Part 15 (LPTA)"]} strokeWidth={2.5} fill={`url(#${WIN_RATE_GRADIENT_IDS[1]})`} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="FAR Part 16 (Task Orders)" stroke={WIN_RATE_COLORS["FAR Part 16 (Task Orders)"]} strokeWidth={2.5} fill={`url(#${WIN_RATE_GRADIENT_IDS[2]})`} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="Sole Source" stroke={WIN_RATE_COLORS["Sole Source"]} strokeWidth={2.5} fill={`url(#${WIN_RATE_GRADIENT_IDS[3]})`} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="Full & Open" stroke={WIN_RATE_COLORS["Full & Open"]} strokeWidth={2.5} fill={`url(#${WIN_RATE_GRADIENT_IDS[4]})`} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{t('dashboard.charts.admissionsTrend')}</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={recruitmentTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Applications" stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="Hired" stroke="#22c55e" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}
          </motion.div>

          {/* Win Rate vs Capture Lead Time (Proposal Manager) / Finance Overview (Director) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6"
          >
            {basePath === "/rbac/proposal-manager" ? (
              <>
                <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-gray-100">{pmText("Win Rate vs Capture Lead Time", "معدل الفوز مقابل مدة الالتقاط")}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{pmText("Win rate % by proposal lead time (days)", "نسبة الفوز حسب مدة تجهيز العرض (بالأيام)")}</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={winRateVsLeadTimeData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickFormatter={pmGraphLabel} />
                    <YAxis domain={[0, 60]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(value) => [`${value}%`, pmText("Win Rate", "معدل الفوز")]} labelFormatter={(label) => `${pmText("Lead time", "مدة الالتقاط")}: ${label}`} contentStyle={{ borderRadius: 8 }} />
                    <Legend formatter={(value) => pmGraphLabel(value)} />
                    <Line type="monotone" dataKey="winRate" name={pmText("Win Rate %", "معدل الفوز %")} stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{t('dashboard.charts.financeOverview')}</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={financeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} fill="#8884d8" label>
                      {financeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
          </motion.div>
        </div>

        {/* Department Performance Bar Chart */}
        <motion.div
          data-tour="5"
          data-tour-title-en="Department Performance"
          data-tour-content-en="Compare department KPIs at a glance."
          data-tour-title-ar="أداء الأقسام"
          data-tour-content-ar="قارن مؤشرات الأقسام بسرعة."
          data-tour-position="top"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{basePath === "/rbac/proposal-manager" ? pmText("Proposal Quality Intelligence", "ذكاء جودة العروض") : t('dashboard.charts.departmentPerformance')}</h3>
          <ResponsiveContainer width="100%" height={basePath === "/rbac/proposal-manager" ? 300 : 220}>
            <BarChart data={basePath === "/rbac/proposal-manager" ? proposalQualityIntelligenceData : deptPerformance} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dept" tick={{ fontSize: 12 }} tickFormatter={basePath === "/rbac/proposal-manager" ? pmGraphLabel : undefined} />
              <YAxis />
              <Tooltip formatter={basePath === "/rbac/proposal-manager" ? ((value, name) => [value, pmGraphLabel(name)]) : undefined} labelFormatter={basePath === "/rbac/proposal-manager" ? ((label) => pmGraphLabel(label)) : undefined} />
              <Legend formatter={basePath === "/rbac/proposal-manager" ? ((value) => pmGraphLabel(value)) : undefined} />
              <Bar dataKey="KPI" fill="#74c69d" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Academic Insights Section */}
        <section
          className="mt-8"
          data-tour="6"
          data-tour-title-en="Academic Insights"
          data-tour-content-en="Longer-term academic trends and top departments."
          data-tour-title-ar="رؤى أكاديمية"
          data-tour-content-ar="اتجاهات أكاديمية طويلة الأجل وأفضل الأقسام."
          data-tour-position="bottom"
        >
          <div className="flex items-center gap-2 mb-2">
            {basePath !== "/rbac/proposal-manager" && <span className="text-xl">🧪</span>}
            <h2 className="text-lg font-bold tracking-wide" title={basePath === "/rbac/proposal-manager" ? pmText("Section M–Driven Scoring Optimization", "تحسين التقييم المدفوع بالقسم M") : undefined}>{basePath === "/rbac/proposal-manager" ? pmText("Core Evaluation Intelligence", "ذكاء التقييم الأساسي") : t('dashboard.sections.academicInsights')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Multi-year Enrollment/Graduation Chart */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 col-span-3">
              <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100">{basePath === "/rbac/proposal-manager" ? pmText("Section M–Driven Scoring Optimization", "تحسين التقييم المدفوع بالقسم M") : t('dashboard.charts.enrollmentGraduation')}</h3>
              <ResponsiveContainer width="100%" height={basePath === "/rbac/proposal-manager" ? 340 : 180}>
                {basePath === "/rbac/proposal-manager" ? (
                  <LineChart data={sectionMScoringData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}`} />
                    <Tooltip formatter={(value) => [value, undefined]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} formatter={(value) => <span className="text-gray-700 dark:text-gray-200">{value}</span>} />
                    <Line type="monotone" dataKey="competitiveIntelligence" name="Competitive Intelligence (Positioning & Win Probability)" stroke={SECTION_M_COLORS.competitiveIntelligence} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="competitiveDifferentiation" name="Competitive Differentiation Index" stroke={SECTION_M_COLORS.competitiveDifferentiation} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="incumbentAdvantage" name="Incumbent Advantage Modeling" stroke={SECTION_M_COLORS.incumbentAdvantage} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="priceTechnical" name="Price–Technical Competitiveness Matrix" stroke={SECTION_M_COLORS.priceTechnical} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="bidDensity" name="Bid Density & Market Saturation Analytics" stroke={SECTION_M_COLORS.bidDensity} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="agencyWinPattern" name="Agency Win Pattern Intelligence" stroke={SECTION_M_COLORS.agencyWinPattern} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="discriminatorStrength" name="Discriminator Strength Benchmarking" stroke={SECTION_M_COLORS.discriminatorStrength} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                ) : (
                  <LineChart data={businessTrends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Onboarded" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Completed" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Risk & Compliance Intelligence (Proposal Manager) / Financial Overview (Director) */}
        <section
          className="mt-8"
          data-tour="7"
          data-tour-title-en={basePath === "/rbac/proposal-manager" ? "Risk & Compliance Intelligence" : "Financial Overview"}
          data-tour-content-en={basePath === "/rbac/proposal-manager" ? "Elimination risk, FAR conformance, and compliance metrics." : "Monthly fees and budget usage overview."}
          data-tour-title-ar="نظرة عامة مالية"
          data-tour-content-ar="الرسوم الشهرية واستخدام الميزانية."
          data-tour-position="top"
        >
          <div className="flex items-center gap-2 mb-2">
            {basePath !== "/rbac/proposal-manager" && <span className="text-xl">💸</span>}
            <h2 className="text-lg font-bold tracking-wide">{basePath === "/rbac/proposal-manager" ? pmText("Risk & Compliance Intelligence", "ذكاء المخاطر والامتثال") : t('dashboard.sections.financialOverview')}</h2>
          </div>
          {basePath === "/rbac/proposal-manager" ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 w-full">
              <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100">{pmText("Risk & Compliance — Tracked Metrics", "المخاطر والامتثال — المؤشرات المتتبعة")}</h3>
              <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={riskComplianceIntelligenceData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} tickFormatter={pmGraphLabel} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [value, pmText("Score", "النتيجة")]} />
                    <Bar dataKey="score" fill="#74c69d" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Monthly Fee Collection Bar Chart */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 col-span-2">
              <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100">{t('dashboard.charts.monthlyFeeCollection')}</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthlyFees} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={v => `$${v.toLocaleString()}`} />
                  <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                  <Bar dataKey="Fees" fill="#22c55e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Budget vs Usage Progress Bars */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 flex flex-col">
              <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100">{t('dashboard.charts.budgetAllocationUsage')}</h3>
              <ul className="flex-1 flex flex-col gap-3 mt-2">
                {budgetUsage.map((b) => (
                  <li key={b.dept} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{b.dept}</span>
                      <span className="text-gray-500 dark:text-gray-300">${b.used.toLocaleString()} / ${b.budget.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all"
                        style={{ width: `${(b.used / b.budget) * 100}%` }}
                      ></div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          )}
        </section>

        {/* Capture & Proposal Pipeline Intelligence (Proposal Manager) / HR & Staff Analytics (Director) */}
        <section
          className="mt-8"
          data-tour="8"
          data-tour-title-en={basePath === "/rbac/proposal-manager" ? "Capture & Proposal Pipeline Intelligence" : "HR & Staff Analytics"}
          data-tour-content-en={basePath === "/rbac/proposal-manager" ? "Pipeline by stage and win rate trend." : "Staff mix and attrition trends."}
          data-tour-title-ar="تحليلات الموارد البشرية والموظفين"
          data-tour-content-ar="مزيج الموظفين واتجاهات التسرب."
          data-tour-position="bottom"
        >
          <div className="flex items-center gap-2 mb-2">
            {basePath !== "/rbac/proposal-manager" && <span className="text-xl">🧑‍💼</span>}
            <h2 className="text-lg font-bold tracking-wide">{basePath === "/rbac/proposal-manager" ? pmText("Capture & Proposal Pipeline Intelligence", "ذكاء الالتقاط وخط أنابيب العروض") : t('dashboard.sections.hrStaffAnalytics')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {basePath === "/rbac/proposal-manager" ? (
              <>
                {/* Proposal Pipeline by Stage (stacked) */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 col-span-2">
                  <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100">{pmText("Proposal Pipeline by Stage", "خط أنابيب العروض حسب المرحلة")}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={proposalPipelineByStage} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" tickFormatter={pmGraphLabel} />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [value, pmGraphLabel(name)]} labelFormatter={(label) => pmGraphLabel(label)} />
                      <Legend formatter={(value) => pmGraphLabel(value)} />
                      <Bar dataKey="Pending" name={pmText("Pending", "معلّق")} stackId="a" fill="#6366f1" />
                      <Bar dataKey="InProgress" name={pmText("In Progress", "قيد التنفيذ")} stackId="a" fill="#8b5cf6" />
                      <Bar dataKey="Approved" name={pmText("Approved", "معتمد")} stackId="a" fill="#f59e0b" />
                      <Bar dataKey="Delivered" name={pmText("Delivered", "مسلّم")} stackId="a" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Win Rate Trend (%) */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 flex flex-col">
                  <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100">{pmText("Win Rate Trend (%)", "اتجاه معدل الفوز (%)")}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={proposalWinRateTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" tickFormatter={pmGraphLabel} />
                      <YAxis domain={[0, 50]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(value) => [`${value}%`, pmText("Win Rate", "معدل الفوز")]} labelFormatter={(label) => pmGraphLabel(label)} />
                      <Line type="monotone" dataKey="WinRate" name={pmText("Win Rate %", "معدل الفوز %")} stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <>
                {/* Staff Types Stacked Bar */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 col-span-2">
                  <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100">{t('dashboard.charts.staffStrengthByType')}</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={teamTypes} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="FullTime" stackId="a" fill="#6366f1" />
                      <Bar dataKey="PartTime" stackId="a" fill="#a3a3a3" />
                      <Bar dataKey="Contract" stackId="a" fill="#f59e42" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Attrition Trend Line */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 flex flex-col">
                  <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100">{t('dashboard.charts.attritionRateTrend')}</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={attritionTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="Attrition" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        </section>

        {basePath === "/rbac/proposal-manager" && (
          <>
            {/* Operational Quality Intelligence (Production Discipline & Efficiency) */}
            <section className="mt-8" data-tour-position="bottom">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-bold tracking-wide">{pmText("Operational Quality Intelligence (Production Discipline & Efficiency)", "ذكاء الجودة التشغيلية (انضباط الإنتاج والكفاءة)")}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 col-span-2">
                  <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100">{pmText("Operational Quality - Tracked Metrics", "الجودة التشغيلية - المؤشرات المتتبعة")}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={operationalQualityData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} tickFormatter={pmGraphLabel} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [value, pmText("Score", "النتيجة")]} />
                      <Bar dataKey="score" fill="#74c69d" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 flex flex-col">
                  <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100">{pmText("Readiness & Velocity Trend", "اتجاه الجاهزية والسرعة")}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={operationalQualityTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" tickFormatter={pmGraphLabel} />
                      <YAxis domain={[60, 100]} />
                      <Tooltip formatter={(value, name) => [value, pmGraphLabel(name)]} labelFormatter={(label) => pmGraphLabel(label)} />
                      <Legend formatter={(value) => pmGraphLabel(value)} />
                      <Line type="monotone" dataKey="Readiness" name={pmLabel("Readiness")} stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="Velocity" name={pmLabel("Velocity")} stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* Competitive Intelligence (Positioning & Win Probability) */}
            <section className="mt-8" data-tour-position="bottom">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-bold tracking-wide">{pmText("Competitive Intelligence (Positioning & Win Probability)", "الذكاء التنافسي (التموضع واحتمالية الفوز)")}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 col-span-2">
                  <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100">{pmText("Competitive Intelligence - Tracked Metrics", "الذكاء التنافسي - المؤشرات المتتبعة")}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={competitiveIntelligenceData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} tickFormatter={pmGraphLabel} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [value, pmText("Score", "النتيجة")]} />
                      <Bar dataKey="score" fill="#74c69d" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 flex flex-col">
                  <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100">{pmText("Competitive Position Trend", "اتجاه المركز التنافسي")}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={competitiveIntelligenceTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" tickFormatter={pmGraphLabel} />
                      <YAxis domain={[50, 90]} />
                      <Tooltip formatter={(value) => [value, pmText("Position", "المركز")]} />
                      <Line type="monotone" dataKey="Position" name={pmText("Position", "المركز")} stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Alerts & Notifications Widget */}
        <section
          className="mt-8"
          data-tour="9"
          data-tour-title-en={isPM ? "RFP Alerts & Notifications" : "Alerts & Notifications"}
          data-tour-content-en={isPM ? "Submission deadlines, compliance, bid approvals, and team assignments." : "System alerts and important updates."}
          data-tour-title-ar={isPM ? "تنبيهات وعروض RFP والإشعارات" : "التنبيهات والإشعارات"}
          data-tour-content-ar={isPM ? "مواعيد التقديم، الامتثال، موافقات العروض، وتعيينات الفريق." : "تنبيهات النظام والتحديثات المهمة."}
          data-tour-position="top"
        >
          <div className="flex items-center gap-2 mb-2">
            {!isPM && <span className="text-xl">🔔</span>}
            <h2 className="text-lg font-bold tracking-wide">{isPM ? t('dashboard.sections.alertsNotificationsProposalManager') : t('dashboard.sections.alertsNotifications')}</h2>
          </div>
          <div className="w-full">
            <div className={`w-full rounded-2xl shadow-lg p-6 flex flex-col gap-3 ${isPM ? 'bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-900' : 'bg-gradient-to-r from-blue-100 to-blue-50 dark:from-gray-800 dark:to-gray-900 animate-pulse'}`}>
              {alerts.map((alert, idx) => (
                <div key={idx} className={`flex items-center gap-3 font-medium ${alert.color}`}>
                  {isPM ? (
                    <span className="shrink-0 w-6 text-gray-600 dark:text-gray-400 font-semibold">{idx + 1}.</span>
                  ) : (
                    <span className="text-xl">{alert.icon}</span>
                  )}
                  <span>{alert.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Widgets: Modern Side-by-Side Layout */}
        <section
          className="mt-8"
          data-tour="10"
          data-tour-title-en="AI-Powered Forecasts"
          data-tour-content-en="Predictive insights: recruitment, retention risk, surplus forecasts."
          data-tour-title-ar="توقعات مدعومة بالذكاء الاصطناعي"
          data-tour-content-ar="رؤى تنبؤية: القبول، مخاطر الانسحاب، الفائض."
          data-tour-position="bottom"
        >
          <div className="flex items-center gap-2 mb-2">
            {basePath !== "/rbac/proposal-manager" && <span className="text-xl">🤖</span>}
            <h2 className="text-lg font-bold tracking-wide flex items-center gap-2">
              {t('dashboard.sections.aiPoweredForecasts')}
              <span className="ml-2 px-2 py-0.5 rounded bg-gradient-to-r from-blue-500 to-purple-500 text-xs text-white font-semibold uppercase">{t('dashboard.aiLabels.ai')}</span>
            </h2>
          </div>
          {basePath === '/rbac/proposal-manager' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Submission Forecast */}
                <div className="flex flex-col md:flex-row bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 gap-4 items-stretch min-h-[260px] border border-gray-100 dark:border-gray-800">
                  <div className="flex-1 min-w-[140px] flex items-center justify-center cursor-pointer group" onClick={() => setModalChart('admission')} title={t('dashboard.aiLabels.clickToEnlarge')}>
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={proposalSubmissionForecast} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tickFormatter={pmGraphLabel} />
                        <YAxis />
                        <Tooltip formatter={(value, name) => [value, pmGraphLabel(name)]} labelFormatter={(label) => pmGraphLabel(label)} />
                        <Line type="monotone" dataKey="Actual" name={pmGraphLabel("Actual")} stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                        <Line type="monotone" dataKey="Forecast" name={pmGraphLabel("Forecast")} stroke="#22c55e" strokeDasharray="5 5" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-blue-700 dark:text-blue-300">{pmText("Submission Forecast", "توقعات التقديم")}</span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-xs text-blue-700 dark:text-blue-200 font-semibold">{t('dashboard.aiLabels.ai')}</span>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                        <span className="font-bold text-green-600 dark:text-green-400">~10-11</span> {pmText("submissions next month", "تقديمات الشهر القادم")}; <span className="text-xs">(+15%)</span>.<br />
                        {pmText("Highest volume", "الأعلى حجماً")}: <span className="font-semibold">FAR 15 Best Value, FAR 16 Task</span>.
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.confidence')}: <span className="font-bold text-green-500">89%</span> | {t('dashboard.aiLabels.model')}: v2.1</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.keyDrivers')}: <span className="font-medium">{pmText("Pipeline Stage, Due Dates, Capture Lead Time", "مرحلة خط الأنابيب، تواريخ الاستحقاق، مهلة الالتقاط")}</span></div>
                      <div className="text-xs text-blue-600 dark:text-blue-300 mb-1">{pmText("What-if: +2 capture staff -> +1.2 submissions/month", "ماذا لو: +2 من فريق الالتقاط -> +1.2 تقديم/شهر")}</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                      <span>{t('dashboard.aiLabels.lastUpdated')}: 2h ago</span>
                      <span className="italic">{t('dashboard.aiLabels.poweredByNexusAI')}</span>
                    </div>
                  </div>
                </div>
                {/* Elimination Risk Forecast */}
                <div className="flex flex-col md:flex-row bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 gap-4 items-stretch min-h-[260px] border border-gray-100 dark:border-gray-800">
                  <div className="flex-1 min-w-[140px] flex items-center justify-center cursor-pointer group" onClick={() => setModalChart('dropout')} title={t('dashboard.aiLabels.clickToEnlarge')}>
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={proposalEliminationRiskForecast} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="quarter" tickFormatter={pmGraphLabel} />
                        <YAxis domain={[8, 16]} tickFormatter={v => `${v}%`} />
                        <Tooltip formatter={(v, name) => [`${v}%`, pmGraphLabel(name)]} labelFormatter={(label) => pmGraphLabel(label)} />
                        <Line type="monotone" dataKey="Actual" name={pmGraphLabel("Actual")} stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                        <Line type="monotone" dataKey="Forecast" name={pmGraphLabel("Forecast")} stroke="#f472b6" strokeDasharray="5 5" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-pink-700 dark:text-pink-300">{pmText("Elimination Risk Forecast", "توقعات مخاطر الإقصاء")}</span>
                        <span className="px-2 py-0.5 rounded bg-pink-100 dark:bg-pink-900 text-xs text-pink-700 dark:text-pink-200 font-semibold">{t('dashboard.aiLabels.ai')}</span>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                        {pmText("Elimination risk expected to fall to", "من المتوقع أن تنخفض مخاطر الإقصاء إلى")} <span className="font-bold text-red-600 dark:text-red-400">~9%</span> {pmText("next quarter", "الربع القادم")}.<br />
                        {pmText("Highest risk", "أعلى مخاطرة")}: <span className="font-semibold">Full & Open, LPTA</span>.
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.confidence')}: <span className="font-bold text-green-500">87%</span> | {t('dashboard.aiLabels.model')}: v2.1</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.keyDrivers')}: <span className="font-medium">{pmText("Compliance Coverage, Mandatory Clauses, FAR Conformance", "تغطية الامتثال، البنود الإلزامية، مطابقة FAR")}</span></div>
                      <div className="text-xs text-pink-600 dark:text-pink-300 mb-1">{pmText("What-if: +5% compliance coverage -> -0.8% elimination risk", "ماذا لو: +5% تغطية امتثال -> -0.8% مخاطر إقصاء")}</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                      <span>{t('dashboard.aiLabels.lastUpdated')}: 2h ago</span>
                      <span className="italic">{t('dashboard.aiLabels.poweredByNexusAI')}</span>
                    </div>
                  </div>
                </div>
                {/* Pipeline Value Forecast */}
                <div className="flex flex-col md:flex-row bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 gap-4 items-stretch min-h-[260px] border border-gray-100 dark:border-gray-800">
                  <div className="flex-1 min-w-[140px] flex items-center justify-center cursor-pointer group" onClick={() => setModalChart('surplus')} title={t('dashboard.aiLabels.clickToEnlarge')}>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={pipelineValueForecast} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tickFormatter={pmGraphLabel} />
                        <YAxis tickFormatter={v => `$${v}M`} />
                        <Tooltip formatter={(v, name) => [`$${v}M`, pmGraphLabel(name)]} labelFormatter={(label) => pmGraphLabel(label)} />
                        <Bar dataKey="Actual" name={pmGraphLabel("Actual")} fill="#22c55e" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="Forecast" name={pmGraphLabel("Forecast")} fill="#6366f1" radius={[8, 8, 0, 0]} fillOpacity={0.7} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-green-700 dark:text-green-300">{pmText("Pipeline Value Forecast", "توقعات قيمة خط الأنابيب")}</span>
                        <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900 text-xs text-green-700 dark:text-green-200 font-semibold">{t('dashboard.aiLabels.ai')}</span>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                        {pmText("Pipeline value expected", "قيمة خط الأنابيب المتوقعة")} <span className="font-bold text-blue-600 dark:text-blue-400">~$8.9M</span> {pmText("by Aug.", "بحلول أغسطس")}.<br />
                        {pmText("Monitor", "راقب")} <span className="font-semibold">DoD, GSA</span> {pmText("opportunities", "الفرص")}.
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.confidence')}: <span className="font-bold text-green-500">88%</span> | {t('dashboard.aiLabels.model')}: v2.1</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.keyDrivers')}: <span className="font-medium">{pmText("New RFPs, Win/Loss, Contract Values", "طلبات عروض جديدة، فوز/خسارة، قيم العقود")}</span></div>
                      <div className="text-xs text-green-600 dark:text-green-300 mb-1">{pmText("What-if: +3 wins -> +$1.2M pipeline value", "ماذا لو: +3 انتصارات -> +$1.2M قيمة خط الأنابيب")}</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                      <span>{t('dashboard.aiLabels.lastUpdated')}: 2h ago</span>
                      <span className="italic">{t('dashboard.aiLabels.poweredByNexusAI')}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {/* Win Probability Trend */}
                <div className="flex flex-col md:flex-row bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 gap-4 items-stretch min-h-[260px] border border-gray-100 dark:border-gray-800">
                  <div className="flex-1 min-w-[140px] flex items-center justify-center cursor-pointer group" onClick={() => setModalChart('leadConversion')} title={t('dashboard.aiLabels.clickToEnlarge')}>
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={proposalWinProbabilityTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tickFormatter={pmGraphLabel} />
                        <YAxis domain={[25, 40]} tickFormatter={v => `${v}%`} />
                        <Tooltip formatter={v => `${v}%`} labelFormatter={(label) => pmGraphLabel(label)} />
                        <Line type="monotone" dataKey="Rate" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-blue-700 dark:text-blue-300">{pmText("Win Probability Trend", "اتجاه احتمالية الفوز")}</span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-xs text-blue-700 dark:text-blue-200 font-semibold">{t('dashboard.aiLabels.ai')}</span>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                        {pmText("Weighted win rate trending to", "اتجاه معدل الفوز الموزون نحو")} <span className="font-bold text-green-600 dark:text-green-400">~35%</span> (+2%).<br />
                        {pmText("Strongest", "الأقوى")}: <span className="font-semibold">Sole Source, FAR 16 Task</span>.
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.confidence')}: <span className="font-bold text-green-500">90%</span> | {t('dashboard.aiLabels.model')}: v2.1</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.keyDrivers')}: <span className="font-medium">{pmText("Past Performance, Price Position, Technical Score", "الأداء السابق، تموضع السعر، الدرجة الفنية")}</span></div>
                      <div className="text-xs text-blue-600 dark:text-blue-300 mb-1">{pmText("What-if: +5% technical score -> +1.5% win rate", "ماذا لو: +5% في الدرجة الفنية -> +1.5% معدل فوز")}</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                      <span>{t('dashboard.aiLabels.lastUpdated')}: 1h ago</span>
                      <span className="italic">{t('dashboard.aiLabels.poweredByNexusAI')}</span>
                    </div>
                  </div>
                </div>
                {/* Revenue from Wins */}
                <div className="flex flex-col md:flex-row bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 gap-4 items-stretch min-h-[260px] border border-gray-100 dark:border-gray-800">
                  <div className="flex-1 min-w-[140px] flex items-center justify-center cursor-pointer group" onClick={() => setModalChart('applicationFee')} title={t('dashboard.aiLabels.clickToEnlarge')}>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={revenueFromWinsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tickFormatter={pmGraphLabel} />
                        <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v, name) => [`$${Number(v).toLocaleString()}`, pmGraphLabel(name)]} labelFormatter={(label) => pmGraphLabel(label)} />
                        <Bar dataKey="Revenue" name={pmGraphLabel("Revenue")} fill="#22c55e" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="Pending" name={pmGraphLabel("Pending")} fill="#f59e0b" radius={[8, 8, 0, 0]} fillOpacity={0.8} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-green-700 dark:text-green-300">{pmText("Revenue from Wins", "إيرادات من الفوز")}</span>
                        <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900 text-xs text-green-700 dark:text-green-200 font-semibold">{t('dashboard.aiLabels.ai')}</span>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                        {pmText("YTD revenue from won proposals", "إيرادات السنة حتى الآن من العروض الفائزة")}: <span className="font-bold text-blue-600 dark:text-blue-400">~$2.93M</span>.<br />
                        {pmText("Pending (award not yet funded)", "معلّق (ترسية غير ممولة بعد)")}: <span className="font-semibold">~$1.28M</span>.
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.confidence')}: <span className="font-bold text-green-500">91%</span> | {t('dashboard.aiLabels.model')}: v2.1</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.keyDrivers')}: <span className="font-medium">{pmText("Win Rate, Contract Value, Award Timing", "معدل الفوز، قيمة العقد، توقيت الترسية")}</span></div>
                      <div className="text-xs text-green-600 dark:text-green-300 mb-1">{pmText("What-if: +2 wins/month -> +$0.4M revenue", "ماذا لو: +2 فوز/شهر -> +$0.4M إيرادات")}</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                      <span>{t('dashboard.aiLabels.lastUpdated')}: 2h ago</span>
                      <span className="italic">{t('dashboard.aiLabels.poweredByNexusAI')}</span>
                    </div>
                  </div>
                </div>
                {/* Win Value by Vehicle */}
                <div className="flex flex-col md:flex-row bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 gap-4 items-stretch min-h-[260px] border border-gray-100 dark:border-gray-800">
                  <div className="flex-1 min-w-[140px] flex items-center justify-center cursor-pointer group" title={t('dashboard.aiLabels.clickToEnlarge')}>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={winValueByVehicleData} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={v => `$${v}M`} />
                        <YAxis type="category" dataKey="vehicle" width={90} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={v => [`$${v}M`, '']} />
                        <Bar dataKey="Revenue" fill="#74c69d" radius={[0, 8, 8, 0]} />
                        <Bar dataKey="Projected" fill="#6366f1" radius={[0, 8, 8, 0]} fillOpacity={0.6} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-indigo-700 dark:text-indigo-300">{pmText("Win Value by Vehicle", "قيمة الفوز حسب وسيلة التعاقد")}</span>
                        <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-xs text-indigo-700 dark:text-indigo-200 font-semibold">{t('dashboard.aiLabels.ai')}</span>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                        {pmText("Current vs projected win value by procurement type.", "قيمة الفوز الحالية مقابل المتوقعة حسب نوع الشراء.")}<br />
                        {pmText("Top", "الأعلى")}: <span className="font-semibold">FAR 16 Task ($1.8M -&gt; $2.0M)</span>.
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.confidence')}: <span className="font-bold text-green-500">88%</span> | {t('dashboard.aiLabels.model')}: v2.1</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.keyDrivers')}: <span className="font-medium">{pmText("Vehicle Mix, Win Rate by Type, Deal Size", "مزيج وسائل التعاقد، معدل الفوز حسب النوع، حجم الصفقة")}</span></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                      <span>{t('dashboard.aiLabels.lastUpdated')}: 3h ago</span>
                      <span className="italic">{t('dashboard.aiLabels.poweredByNexusAI')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Predictive Admission Forecast */}
                <div className="flex flex-col md:flex-row bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 gap-4 items-stretch min-h-[260px] border border-gray-100 dark:border-gray-800">
                  <div className="flex-1 min-w-[140px] flex items-center justify-center cursor-pointer group" onClick={() => setModalChart('admission')} title={t('dashboard.aiLabels.clickToEnlarge')}>
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={forecastData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="Actual" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="Forecast" stroke="#22c55e" strokeDasharray="5 5" strokeWidth={2.5} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                    <span className="hidden group-hover:block absolute text-xs text-blue-500 bg-white dark:bg-gray-900 px-2 py-1 rounded shadow top-2 left-2">{t('dashboard.aiLabels.clickToEnlarge')}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-blue-700 dark:text-blue-300">{t('dashboard.aiWidgets.predictiveAdmission')}</span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-xs text-blue-700 dark:text-blue-200 font-semibold">{t('dashboard.aiLabels.ai')}</span>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                        <span className="font-bold text-green-600 dark:text-green-400">1,320</span> {t('dashboard.aiLabels.nextSemesterIntake')} <span className="text-xs">(+8%)</span>.<br />
                        {t('dashboard.aiLabels.highestGrowth')}: <span className="font-semibold">Engineering, Business</span>.
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.confidence')}: <span className="font-bold text-green-500">92%</span> | {t('dashboard.aiLabels.model')}: v2.1</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.keyDrivers')}: <span className="font-medium">Marketing Spend, Conversion Rate, Discounts</span></div>
                      <div className="text-xs text-blue-600 dark:text-blue-300 mb-1">{t('dashboard.aiLabels.whatIf')}: +10% marketing budget → +3% recruitment</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                      <span>{t('dashboard.aiLabels.lastUpdated')}: 2h ago</span>
                      <span className="italic">{t('dashboard.aiLabels.poweredByNexusAI')}</span>
                    </div>
                  </div>
                </div>
                {/* Dropout Risk Forecast */}
                <div className="flex flex-col md:flex-row bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 gap-4 items-stretch min-h-[260px] border border-gray-100 dark:border-gray-800">
                  <div className="flex-1 min-w-[140px] flex items-center justify-center cursor-pointer group" onClick={() => setModalChart('dropout')} title={t('dashboard.aiLabels.clickToEnlarge')}>
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={retentionForecast} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="quarter" />
                        <YAxis domain={[2.5, 5]} tickFormatter={v => `${v}%`} />
                        <Tooltip formatter={v => `${v}%`} />
                        <Line type="monotone" dataKey="Actual" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="Forecast" stroke="#f472b6" strokeDasharray="5 5" strokeWidth={2.5} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                    <span className="hidden group-hover:block absolute text-xs text-pink-500 bg-white dark:bg-gray-900 px-2 py-1 rounded shadow top-2 left-2">{t('dashboard.aiLabels.clickToEnlarge')}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-pink-700 dark:text-pink-300">{t('dashboard.aiWidgets.dropoutRisk')}</span>
                        <span className="px-2 py-0.5 rounded bg-pink-100 dark:bg-pink-900 text-xs text-pink-700 dark:text-pink-200 font-semibold">{t('dashboard.aiLabels.ai')}</span>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                        Dropout rate expected to decrease to <span className="font-bold text-red-600 dark:text-red-400">3.1%</span> next semester.<br />
                        Highest risk: <span className="font-semibold">Law Dept</span>.
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.confidence')}: <span className="font-bold text-green-500">88%</span> | {t('dashboard.aiLabels.model')}: v2.1</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.keyDrivers')}: <span className="font-medium">Attendance, Academic Stress, Financial Aid</span></div>
                      <div className="text-xs text-pink-600 dark:text-pink-300 mb-1">{t('dashboard.aiLabels.whatIf')}: -5% attendance → +0.7% dropout risk</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                      <span>{t('dashboard.aiLabels.lastUpdated')}: 2h ago</span>
                      <span className="italic">{t('dashboard.aiLabels.poweredByNexusAI')}</span>
                    </div>
                  </div>
                </div>
                {/* Financial Surplus/Deficit Forecast */}
                <div className="flex flex-col md:flex-row bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 gap-4 items-stretch min-h-[260px] border border-gray-100 dark:border-gray-800">
                  <div className="flex-1 min-w-[140px] flex items-center justify-center cursor-pointer group" onClick={() => setModalChart('surplus')} title={t('dashboard.aiLabels.clickToEnlarge')}>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={surplusForecast} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={v => `$${v.toLocaleString()}`} />
                        <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                        <Bar dataKey="Actual" fill="#22c55e" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="Forecast" fill="#6366f1" radius={[8, 8, 0, 0]} fillOpacity={0.7} />
                      </BarChart>
                    </ResponsiveContainer>
                    <span className="hidden group-hover:block absolute text-xs text-green-500 bg-white dark:bg-gray-900 px-2 py-1 rounded shadow top-2 left-2">{t('dashboard.aiLabels.clickToEnlarge')}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-green-700 dark:text-green-300">{t('dashboard.aiWidgets.financialSurplusDeficit')}</span>
                        <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900 text-xs text-green-700 dark:text-green-200 font-semibold">{t('dashboard.aiLabels.ai')}</span>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                        Surplus expected to peak in <span className="font-bold text-blue-600 dark:text-blue-400">May</span>, then stabilize.<br />
                        Monitor <span className="font-semibold">IT, R&D</span> spending.
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.confidence')}: <span className="font-bold text-green-500">90%</span> | {t('dashboard.aiLabels.model')}: v2.1</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.keyDrivers')}: <span className="font-medium">Fee Collection, Grants, Infra Spend</span></div>
                      <div className="text-xs text-green-600 dark:text-green-300 mb-1">{t('dashboard.aiLabels.whatIf')}: +$10k infra spend → -$7k surplus</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                      <span>{t('dashboard.aiLabels.lastUpdated')}: 2h ago</span>
                      <span className="italic">{t('dashboard.aiLabels.poweredByNexusAI')}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {/* Lead Conversion Forecast */}
                <div className="flex flex-col md:flex-row bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 gap-4 items-stretch min-h-[260px] border border-gray-100 dark:border-gray-800">
                  <div className="flex-1 min-w-[140px] flex items-center justify-center cursor-pointer group" onClick={() => setModalChart('leadConversion')} title={t('dashboard.aiLabels.clickToEnlarge')}>
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={leadConversionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="Rate" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                    <span className="hidden group-hover:block absolute text-xs text-blue-500 bg-white dark:bg-gray-900 px-2 py-1 rounded shadow top-2 left-2">{t('dashboard.aiLabels.clickToEnlarge')}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-blue-700 dark:text-blue-300">{t('dashboard.aiWidgets.leadConversion')}</span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-xs text-blue-700 dark:text-blue-200 font-semibold">{t('dashboard.aiLabels.ai')}</span>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                        Conversion rate expected to reach <span className="font-bold text-green-600 dark:text-green-400">26%</span> (+2%).<br />
                        {t('dashboard.aiLabels.highestGrowth')}: <span className="font-semibold">Engineering, Business</span>.
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.confidence')}: <span className="font-bold text-green-500">91%</span> | {t('dashboard.aiLabels.model')}: v2.1</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.keyDrivers')}: <span className="font-medium">Follow-up Response, Lead Quality, Marketing</span></div>
                      <div className="text-xs text-blue-600 dark:text-blue-300 mb-1">{t('dashboard.aiLabels.whatIf')}: +10% follow-up budget → +1.5% conversion rate</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                      <span>{t('dashboard.aiLabels.lastUpdated')}: 1h ago</span>
                      <span className="italic">{t('dashboard.aiLabels.poweredByNexusAI')}</span>
                    </div>
                  </div>
                </div>
                {/* Application Fee Revenue Forecast */}
                <div className="flex flex-col md:flex-row bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 gap-4 items-stretch min-h-[260px] border border-gray-100 dark:border-gray-800">
                  <div className="flex-1 min-w-[140px] flex items-center justify-center cursor-pointer group" onClick={() => setModalChart('applicationFee')} title={t('dashboard.aiLabels.clickToEnlarge')}>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={applicationFeeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={v => `$${v.toLocaleString()}`} />
                        <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                        <Bar dataKey="Revenue" fill="#22c55e" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="Discounts" fill="#ef4444" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <span className="hidden group-hover:block absolute text-xs text-green-500 bg-white dark:bg-gray-900 px-2 py-1 rounded shadow top-2 left-2">{t('dashboard.aiLabels.clickToEnlarge')}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-green-700 dark:text-green-300">{t('dashboard.aiWidgets.applicationFeeRevenue')}</span>
                        <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900 text-xs text-green-700 dark:text-green-200 font-semibold">{t('dashboard.aiLabels.ai')}</span>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                        Expected revenue: <span className="font-bold text-blue-600 dark:text-blue-400">$180,000</span> (+5%).<br />
                        Discounts impact: <span className="font-semibold">10% of revenue</span>.
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.confidence')}: <span className="font-bold text-green-500">89%</span> | {t('dashboard.aiLabels.model')}: v2.1</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.keyDrivers')}: <span className="font-medium">Applications, Pricing Structure, Discounts</span></div>
                      <div className="text-xs text-green-600 dark:text-green-300 mb-1">{t('dashboard.aiLabels.whatIf')}: +15% fee waivers → -$25k revenue</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                      <span>{t('dashboard.aiLabels.lastUpdated')}: 2h ago</span>
                      <span className="italic">{t('dashboard.aiLabels.poweredByNexusAI')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        {basePath !== '/rbac/proposal-manager' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Department Revenue Breakdown */}
            <div className="flex flex-col md:flex-row bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 gap-4 items-stretch min-h-[260px] border border-gray-100 dark:border-gray-800">
              <div className="flex-1 min-w-[140px] flex items-center justify-center cursor-pointer group" onClick={() => setModalChart('deptRevenue')} title={t('dashboard.aiLabels.clickToEnlarge')}>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={deptRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dept" />
                    <YAxis tickFormatter={v => `$${v.toLocaleString()}`} />
                    <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                    <Bar dataKey="Revenue" fill="#6366f1" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Projected" fill="#22c55e" radius={[8, 8, 0, 0]} fillOpacity={0.7} />
                  </BarChart>
                </ResponsiveContainer>
                <span className="hidden group-hover:block absolute text-xs text-indigo-500 bg-white dark:bg-gray-900 px-2 py-1 rounded shadow top-2 left-2">{t('dashboard.aiLabels.clickToEnlarge')}</span>
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-indigo-700 dark:text-indigo-300">{t('dashboard.aiWidgets.departmentRevenue')}</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-xs text-indigo-700 dark:text-indigo-200 font-semibold">{t('dashboard.aiLabels.ai')}</span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                    Total projected: <span className="font-bold text-green-600 dark:text-green-400">$17.05M</span> (+10%).<br />
                    Underperforming: <span className="font-semibold">Law, Arts</span>.
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.confidence')}: <span className="font-bold text-green-500">92%</span> | {t('dashboard.aiLabels.model')}: v2.1</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.keyDrivers')}: <span className="font-medium">Enrollment, Tuition, Grants</span></div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-300 mb-1">{t('dashboard.aiLabels.whatIf')}: +20% scholarships → -$1.2M revenue</div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                  <span>{t('dashboard.aiLabels.lastUpdated')}: 3h ago</span>
                  <span className="italic">{t('dashboard.aiLabels.poweredByNexusAI')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- New Section: AI-Powered Revenue & Conversion Analytics --- */}
        <section
          className="mt-12"
          data-tour="11"
          data-tour-title-en="AI-Powered Revenue & Conversion"
          data-tour-content-en="Revenue projections and conversion analytics powered by AI."
          data-tour-title-ar="تحليلات الإيرادات والتحويلات المدعومة بالذكاء الاصطناعي"
          data-tour-content-ar="توقعات الإيرادات وتحليلات التحويل باستخدام الذكاء الاصطناعي."
          data-tour-position="top"
        >
          <div className="flex items-center gap-2 mb-2">
            {basePath !== "/rbac/proposal-manager" && <span className="text-xl">📈</span>}
            <h2 className="text-lg font-bold tracking-wide flex items-center gap-2">
              {t('dashboard.sections.aiPoweredRevenue')}
              <span className="ml-2 px-2 py-0.5 rounded bg-gradient-to-r from-green-500 to-blue-500 text-xs text-white font-semibold uppercase">{t('dashboard.aiLabels.ai')}</span>
            </h2>
          </div>
          {basePath === '/rbac/proposal-manager' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Win Rate Trend (Conversion) */}
              <div className="flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 gap-4 min-h-[260px] border border-gray-100 dark:border-gray-800">
                <div className="flex-1 flex items-center justify-center cursor-pointer group" onClick={() => setModalChart('leadConversion')} title={t('dashboard.aiLabels.clickToEnlarge')}>
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={proposalWinProbabilityTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tickFormatter={pmGraphLabel} />
                      <YAxis domain={[25, 40]} tickFormatter={v => `${v}%`} />
                      <Tooltip formatter={v => [`${v}%`, pmText('Win rate', 'معدل الفوز')]} labelFormatter={(label) => pmGraphLabel(label)} />
                      <Line type="monotone" dataKey="Rate" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-blue-700 dark:text-blue-300">{pmText("Bid-to-Win Rate Trend", "اتجاه معدل التحول إلى فوز")}</span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-xs text-blue-700 dark:text-blue-200 font-semibold">{t('dashboard.aiLabels.ai')}</span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                      {pmText("Win rate trending to", "اتجاه معدل الفوز نحو")} <span className="font-bold text-green-600 dark:text-green-400">~35%</span> (+2%).<br />
                      {pmText("Strongest", "الأقوى")}: <span className="font-semibold">Sole Source, FAR 16 Task</span>.
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.confidence')}: <span className="font-bold text-green-500">90%</span> | {t('dashboard.aiLabels.model')}: v2.1</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.keyDrivers')}: <span className="font-medium">{pmText("Past Performance, Price Position, Technical Score", "الأداء السابق، تموضع السعر، الدرجة الفنية")}</span></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                    <span>{t('dashboard.aiLabels.lastUpdated')}: 1h ago</span>
                    <span className="italic">{t('dashboard.aiLabels.poweredByNexusAI')}</span>
                  </div>
                </div>
              </div>

              {/* Revenue from Wins */}
              <div className="flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 gap-4 min-h-[260px] border border-gray-100 dark:border-gray-800">
                <div className="flex-1 flex items-center justify-center cursor-pointer group" onClick={() => setModalChart('applicationFee')} title={t('dashboard.aiLabels.clickToEnlarge')}>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={revenueFromWinsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tickFormatter={pmGraphLabel} />
                      <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v, name) => [`$${Number(v).toLocaleString()}`, pmGraphLabel(name)]} labelFormatter={(label) => pmGraphLabel(label)} />
                      <Bar dataKey="Revenue" name={pmGraphLabel("Revenue")} fill="#22c55e" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="Pending" name={pmGraphLabel("Pending")} fill="#f59e0b" radius={[8, 8, 0, 0]} fillOpacity={0.8} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-green-700 dark:text-green-300">{pmText("Revenue from Wins", "إيرادات من الفوز")}</span>
                      <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900 text-xs text-green-700 dark:text-green-200 font-semibold">{t('dashboard.aiLabels.ai')}</span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                      {pmText("YTD from won proposals", "إيرادات السنة حتى الآن من العروض الفائزة")}: <span className="font-bold text-blue-600 dark:text-blue-400">~$2.93M</span>.<br />
                      {pmText("Pending (award not funded)", "معلّق (ترسية غير ممولة)")}: <span className="font-semibold">~$1.28M</span>.
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.confidence')}: <span className="font-bold text-green-500">91%</span> | {t('dashboard.aiLabels.model')}: v2.1</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.keyDrivers')}: <span className="font-medium">{pmText("Win Rate, Contract Value, Award Timing", "معدل الفوز، قيمة العقد، توقيت الترسية")}</span></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                    <span>{t('dashboard.aiLabels.lastUpdated')}: 2h ago</span>
                    <span className="italic">{t('dashboard.aiLabels.poweredByNexusAI')}</span>
                  </div>
                </div>
              </div>

              {/* Pipeline by Agency */}
              <div className="flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 gap-4 min-h-[260px] border border-gray-100 dark:border-gray-800">
                <div className="flex-1 flex items-center justify-center cursor-pointer group" onClick={() => setModalChart('deptRevenueRadar')} title={t('dashboard.aiLabels.clickToEnlarge')}>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={proposalPipelineByAgencyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="agency" tickFormatter={pmGraphLabel} />
                      <YAxis tickFormatter={v => `$${v}M`} />
                      <Tooltip formatter={(v, name) => [`$${v}M`, pmGraphLabel(name)]} labelFormatter={(label) => pmGraphLabel(label)} />
                      <Bar dataKey="Pipeline" name={pmGraphLabel("Pipeline")} fill="#6366f1" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="Wins" name={pmGraphLabel("Wins")} fill="#22c55e" radius={[8, 8, 0, 0]} fillOpacity={0.8} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-indigo-700 dark:text-indigo-300">{pmText("Pipeline & Wins by Agency", "خط الأنابيب والفوز حسب الجهة")}</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-xs text-indigo-700 dark:text-indigo-200 font-semibold">{t('dashboard.aiLabels.ai')}</span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                      {pmText("Pipeline value vs win value by customer agency.", "قيمة خط الأنابيب مقابل قيمة الفوز حسب جهة العميل.")}<br />
                      {pmText("Top", "الأعلى")}: <span className="font-semibold">DoD ($3.2M pipeline, $1.1M wins)</span>.
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.confidence')}: <span className="font-bold text-green-500">89%</span> | {t('dashboard.aiLabels.model')}: v2.1</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.keyDrivers')}: <span className="font-medium">{pmText("Agency Budget, Win Rate by Agency, Contract Type", "ميزانية الجهة، معدل الفوز حسب الجهة، نوع العقد")}</span></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                    <span>{t('dashboard.aiLabels.lastUpdated')}: 3h ago</span>
                    <span className="italic">{t('dashboard.aiLabels.poweredByNexusAI')}</span>
                  </div>
                </div>
              </div>

              {/* Win Value by Vehicle (Bar) */}
              <div className="flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 gap-4 min-h-[260px] border border-gray-100 dark:border-gray-800">
                <div className="flex-1 flex items-center justify-center cursor-pointer group" onClick={() => setModalChart('deptRevenue')} title={t('dashboard.aiLabels.clickToEnlarge')}>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={winValueByVehicleData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="vehicle" tick={{ fontSize: 9 }} tickFormatter={pmGraphLabel} />
                      <YAxis tickFormatter={v => `$${v}M`} />
                      <Tooltip formatter={(v, name) => [`$${v}M`, pmGraphLabel(name)]} labelFormatter={(label) => pmGraphLabel(label)} />
                      <Bar dataKey="Revenue" name={pmGraphLabel("Revenue")} fill="#74c69d" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="Projected" name={pmGraphLabel("Projected")} fill="#6366f1" radius={[8, 8, 0, 0]} fillOpacity={0.6} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-indigo-700 dark:text-indigo-300">{pmText("Win Value by Vehicle", "قيمة الفوز حسب وسيلة التعاقد")}</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-xs text-indigo-700 dark:text-indigo-200 font-semibold">{t('dashboard.aiLabels.ai')}</span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                      {pmText("Current vs projected win value by procurement type.", "قيمة الفوز الحالية مقابل المتوقعة حسب نوع الشراء.")}<br />
                      {pmText("Top", "الأعلى")}: <span className="font-semibold">FAR 16 Task ($1.8M -&gt; $2.0M)</span>.
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.confidence')}: <span className="font-bold text-green-500">88%</span> | {t('dashboard.aiLabels.model')}: v2.1</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.keyDrivers')}: <span className="font-medium">{pmText("Vehicle Mix, Win Rate by Type, Deal Size", "مزيج وسائل التعاقد، معدل الفوز حسب النوع، حجم الصفقة")}</span></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                    <span>{t('dashboard.aiLabels.lastUpdated')}: 3h ago</span>
                    <span className="italic">{t('dashboard.aiLabels.poweredByNexusAI')}</span>
                  </div>
                </div>
              </div>

              {/* Win Rate by Procurement (Radar) */}
              <div className="flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 gap-4 min-h-[260px] border border-gray-100 dark:border-gray-800">
                <div className="flex-1 flex items-center justify-center cursor-pointer group" onClick={() => setModalChart('subjectProfitRadar')} title={t('dashboard.aiLabels.clickToEnlarge')}>
                  <ResponsiveContainer width="100%" height={120}>
                    <RadarChart cx="50%" cy="50%" outerRadius={50} data={winValueByVehicleData.map(d => ({ vehicle: d.vehicle, Revenue: d.Revenue, Projected: d.Projected }))}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="vehicle" tick={{ fontSize: 8 }} tickFormatter={pmGraphLabel} />
                      <PolarRadiusAxis angle={30} tickFormatter={v => `$${v}M`} />
                      <Radar name="Current" dataKey="Revenue" stroke="#74c69d" fill="#74c69d" fillOpacity={0.5} />
                      <Radar name="Projected" dataKey="Projected" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                      <Legend />
                      <Tooltip formatter={v => [`$${v}M`, '']} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-green-700 dark:text-green-300">{pmText("Win Value by Vehicle (Radar)", "قيمة الفوز حسب وسيلة التعاقد (رادار)")}</span>
                      <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900 text-xs text-green-700 dark:text-green-200 font-semibold">{t('dashboard.aiLabels.ai')}</span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                      {pmText("Current vs projected win value by procurement type.", "قيمة الفوز الحالية مقابل المتوقعة حسب نوع الشراء.")}<br />
                      {pmText("Instantly spot strongest/weakest vehicles.", "اكتشف فوراً أقوى/أضعف وسائل التعاقد.")}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.confidence')}: <span className="font-bold text-green-500">88%</span> | {t('dashboard.aiLabels.model')}: v2.1</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.keyDrivers')}: <span className="font-medium">{pmText("Vehicle Mix, Win Rate, Deal Size", "مزيج وسائل التعاقد، معدل الفوز، حجم الصفقة")}</span></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                    <span>{t('dashboard.aiLabels.interactiveRadar')}</span>
                    <span className="italic">{t('dashboard.aiLabels.poweredByNexusAI')}</span>
                  </div>
                </div>
              </div>

              {/* Pipeline Value Summary */}
              <div className="flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 gap-4 min-h-[260px] border border-gray-100 dark:border-gray-800">
                <div className="flex-1 flex items-center justify-center cursor-pointer group" onClick={() => setModalChart('demographics')} title={t('dashboard.aiLabels.clickToEnlarge')}>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={pipelineValueForecast} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={v => `$${v}M`} />
                      <Tooltip formatter={v => [`$${v}M`, '']} />
                      <Bar dataKey="Actual" fill="#22c55e" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="Forecast" fill="#6366f1" radius={[8, 8, 0, 0]} fillOpacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-blue-700 dark:text-blue-300">{pmText("Pipeline Value Trend", "اتجاه قيمة خط الأنابيب")}</span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-xs text-blue-700 dark:text-blue-200 font-semibold">{t('dashboard.aiLabels.ai')}</span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                      {pmText("Pipeline value expected", "قيمة خط الأنابيب المتوقعة")} <span className="font-bold text-green-600 dark:text-green-400">~$8.9M</span> {pmText("by Aug.", "بحلول أغسطس")}.<br />
                      {pmText("Monitor", "راقب")} <span className="font-semibold">DoD, GSA</span> {pmText("opportunities", "الفرص")}.
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.confidence')}: <span className="font-bold text-green-500">88%</span> | {t('dashboard.aiLabels.model')}: v2.1</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.keyDrivers')}: <span className="font-medium">{pmText("New RFPs, Win/Loss, Contract Values", "طلبات عروض جديدة، فوز/خسارة، قيم العقود")}</span></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                    <span>{t('dashboard.aiLabels.lastUpdated')}: 2h ago</span>
                    <span className="italic">{t('dashboard.aiLabels.poweredByNexusAI')}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Lead Conversion Forecast */}
              <div className="flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 gap-4 min-h-[260px] border border-gray-100 dark:border-gray-800">
                <div className="flex-1 flex items-center justify-center cursor-pointer group" onClick={() => setModalChart('leadConversion')} title={t('dashboard.aiLabels.clickToEnlarge')}>
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={leadConversionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="Rate" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-blue-700 dark:text-blue-300">{t('dashboard.aiWidgets.leadConversion')}</span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-xs text-blue-700 dark:text-blue-200 font-semibold">{t('dashboard.aiLabels.ai')}</span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                      Conversion rate expected to reach <span className="font-bold text-green-600 dark:text-green-400">26%</span> (+2%).<br />
                      {t('dashboard.aiLabels.highestGrowth')}: <span className="font-semibold">Engineering, Business</span>.
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.confidence')}: <span className="font-bold text-green-500">91%</span> | {t('dashboard.aiLabels.model')}: v2.1</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.keyDrivers')}: <span className="font-medium">Follow-up Response, Lead Quality, Marketing</span></div>
                    <div className="text-xs text-blue-600 dark:text-blue-300 mb-1">{t('dashboard.aiLabels.whatIf')}: +10% follow-up budget → +1.5% conversion rate</div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                    <span>{t('dashboard.aiLabels.lastUpdated')}: 1h ago</span>
                    <span className="italic">{t('dashboard.aiLabels.poweredByNexusAI')}</span>
                  </div>
                </div>
              </div>

              {/* Application Fee Revenue Forecast */}
              <div className="flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 gap-4 min-h-[260px] border border-gray-100 dark:border-gray-800">
                <div className="flex-1 flex items-center justify-center cursor-pointer group" onClick={() => setModalChart('applicationFee')} title={t('dashboard.aiLabels.clickToEnlarge')}>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={applicationFeeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={v => `$${v.toLocaleString()}`} />
                      <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                      <Bar dataKey="Revenue" fill="#22c55e" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="Discounts" fill="#ef4444" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-green-700 dark:text-green-300">{t('dashboard.aiWidgets.applicationFeeRevenue')}</span>
                      <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900 text-xs text-green-700 dark:text-green-200 font-semibold">{t('dashboard.aiLabels.ai')}</span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                      Expected revenue: <span className="font-bold text-blue-600 dark:text-blue-400">$180,000</span> (+5%).<br />
                      Discounts impact: <span className="font-semibold">10% of revenue</span>.
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.confidence')}: <span className="font-bold text-green-500">89%</span> | {t('dashboard.aiLabels.model')}: v2.1</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.keyDrivers')}: <span className="font-medium">Applications, Pricing Structure, Discounts</span></div>
                    <div className="text-xs text-green-600 dark:text-green-300 mb-1">{t('dashboard.aiLabels.whatIf')}: +15% fee waivers → -$25k revenue</div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                    <span>{t('dashboard.aiLabels.lastUpdated')}: 2h ago</span>
                    <span className="italic">{t('dashboard.aiLabels.poweredByNexusAI')}</span>
                  </div>
                </div>
              </div>

              {/* Department Revenue Radar Chart */}
              <div className="flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 gap-4 min-h-[260px] border border-gray-100 dark:border-gray-800">
                <div className="flex-1 flex items-center justify-center cursor-pointer group" onClick={() => setModalChart('deptRevenueRadar')} title={t('dashboard.aiLabels.clickToEnlarge')}>
                  <ResponsiveContainer width="100%" height={120}>
                    <RadarChart cx="50%" cy="50%" outerRadius={50} data={deptRevenueData.map(d => ({ dept: d.dept, Revenue: d.Revenue, Projected: d.Projected }))}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="dept" />
                      <PolarRadiusAxis angle={30} />
                      <Radar name="Current" dataKey="Revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                      <Radar name="Projected" dataKey="Projected" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-indigo-700 dark:text-indigo-300">{t('dashboard.aiWidgets.departmentRevenueRadar')}</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-xs text-indigo-700 dark:text-indigo-200 font-semibold">{t('dashboard.aiLabels.ai')}</span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                      Visualizes current vs projected revenue for each department.<br />
                      Instantly spot outliers and growth areas.
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.confidence')}: <span className="font-bold text-green-500">92%</span> | {t('dashboard.aiLabels.model')}: v2.1</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.keyDrivers')}: <span className="font-medium">Enrollment, Tuition, Grants</span></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                    <span>{t('dashboard.aiLabels.interactiveRadar')}</span>
                    <span className="italic">{t('dashboard.aiLabels.poweredByNexusAI')}</span>
                  </div>
                </div>
              </div>

              {/* Subject Profitability Radar Chart */}
              <div className="flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 gap-4 min-h-[260px] border border-gray-100 dark:border-gray-800">
                <div className="flex-1 flex items-center justify-center cursor-pointer group" onClick={() => setModalChart('subjectProfitRadar')} title={t('dashboard.aiLabels.clickToEnlarge')}>
                  <ResponsiveContainer width="100%" height={120}>
                    <RadarChart cx="50%" cy="50%" outerRadius={50} data={departmentProfitData.map(s => ({ department: s.department, Profit: s.Profit }))}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="department" />
                      <PolarRadiusAxis angle={30} />
                      <Radar name="Profit" dataKey="Profit" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-green-700 dark:text-green-300">{t('dashboard.aiWidgets.subjectProfitabilityRadar')}</span>
                      <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900 text-xs text-green-700 dark:text-green-200 font-semibold">{t('dashboard.aiLabels.ai')}</span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                      Visualizes profit margins for each subject.<br />
                      Instantly spot most/least profitable subjects.
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.confidence')}: <span className="font-bold text-green-500">94%</span> | {t('dashboard.aiLabels.model')}: v2.1</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.keyDrivers')}: <span className="font-medium">Enrollment, Tuition, Operating Costs</span></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                    <span>{t('dashboard.aiLabels.interactiveRadar')}</span>
                    <span className="italic">{t('dashboard.aiLabels.poweredByNexusAI')}</span>
                  </div>
                </div>
              </div>

              {/* Department Revenue Bar Chart */}
              <div className="flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 gap-4 min-h-[260px] border border-gray-100 dark:border-gray-800">
                <div className="flex-1 flex items-center justify-center cursor-pointer group" onClick={() => setModalChart('deptRevenue')} title={t('dashboard.aiLabels.clickToEnlarge')}>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={deptRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dept" />
                      <YAxis tickFormatter={v => `$${v.toLocaleString()}`} />
                      <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                      <Bar dataKey="Revenue" fill="#6366f1" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="Projected" fill="#22c55e" radius={[8, 8, 0, 0]} fillOpacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-indigo-700 dark:text-indigo-300">{t('dashboard.aiWidgets.departmentRevenue')}</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-xs text-indigo-700 dark:text-indigo-200 font-semibold">{t('dashboard.aiLabels.ai')}</span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                      Total projected: <span className="font-bold text-green-600 dark:text-green-400">$17.05M</span> (+10%).<br />
                      Underperforming: <span className="font-semibold">Law, Arts</span>.
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.confidence')}: <span className="font-bold text-green-500">92%</span> | {t('dashboard.aiLabels.model')}: v2.1</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.keyDrivers')}: <span className="font-medium">Enrollment, Tuition, Grants</span></div>
                    <div className="text-xs text-indigo-600 dark:text-indigo-300 mb-1">{t('dashboard.aiLabels.whatIf')}: +20% scholarships → -$1.2M revenue</div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                    <span>{t('dashboard.aiLabels.lastUpdated')}: 3h ago</span>
                    <span className="italic">{t('dashboard.aiLabels.poweredByNexusAI')}</span>
                  </div>
                </div>
              </div>

              {/* Employee Demographics Analytics */}
              <div className="flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 gap-4 min-h-[260px] border border-gray-100 dark:border-gray-800">
                <div className="flex-1 flex items-center justify-center cursor-pointer group" onClick={() => setModalChart('demographics')} title={t('dashboard.aiLabels.clickToEnlarge')}>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie data={employeeDemographicsData.regions} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={40} label>
                        <Cell fill="#6366f1" />
                        <Cell fill="#22c55e" />
                        <Cell fill="#f59e42" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip formatter={v => `${v}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-blue-700 dark:text-blue-300">{t('dashboard.aiWidgets.studentDemographics')}</span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-xs text-blue-700 dark:text-blue-200 font-semibold">{t('dashboard.aiLabels.ai')}</span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                      Top region: <span className="font-bold text-green-600 dark:text-green-400">North (35%)</span>.<br />
                      Age group: <span className="font-semibold">18-20 (45%)</span>.
                  </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.confidence')}: <span className="font-bold text-green-500">96%</span> | {t('dashboard.aiLabels.model')}: v2.1</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.aiLabels.keyDrivers')}: <span className="font-medium">Region, Age, Gender, Education</span></div>
                    <div className="text-xs text-blue-600 dark:text-blue-300 mb-1">{t('dashboard.aiLabels.whatIf')}: Target East region → +15% applications</div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
                    <span>{t('dashboard.aiLabels.lastUpdated')}: 1h ago</span>
                    <span className="italic">{t('dashboard.aiLabels.poweredByNexusAI')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      {/* Modal for card details */}
      {modalCard && !modalCard.isKpi && <Modal card={modalCard} onClose={() => setModalCard(null)} />}
      {modalCard && modalCard.isKpi && <KpiModal kpi={modalCard} onClose={() => setModalCard(null)} />}
      {/* Modal for large chart view */}
      {modalChart && <ChartModal chartId={modalChart} onClose={() => setModalChart(null)} />}
    </div>
  );
} 