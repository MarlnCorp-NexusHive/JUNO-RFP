import React, { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocalization } from "../../../hooks/useLocalization";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Scatter
} from "recharts";
import { directorFeatures } from '../../../components/directorFeatures';
import DirectorFinancialIntelligence from './ai/DirectorFinancialIntelligence';
import { 
  FiDollarSign, 
  FiTarget, 
  FiZap, 
  FiBarChart2,
  FiTrendingUp,
  FiUsers,
  FiShield,
  FiAward
} from 'react-icons/fi';

// Demo data for various charts
const departmentPerformance = [
  { dept: "Operations", KPI: 85, Budget: 500000, Revenue: 450000 },
  { dept: "HR", KPI: 78, Budget: 200000, Revenue: 180000 },
  { dept: "Finance", KPI: 90, Budget: 300000, Revenue: 280000 },
  { dept: "Recruitment", KPI: 82, Budget: 250000, Revenue: 220000 },
  { dept: "IT", KPI: 75, Budget: 150000, Revenue: 130000 },
  { dept: "R&D", KPI: 88, Budget: 400000, Revenue: 380000 },
];

const monthlyTrends = [
  { month: "Jan", Revenue: 120000, Expenses: 100000, Profit: 20000 },
  { month: "Feb", Revenue: 130000, Expenses: 105000, Profit: 25000 },
  { month: "Mar", Revenue: 140000, Expenses: 110000, Profit: 30000 },
  { month: "Apr", Revenue: 135000, Expenses: 108000, Profit: 27000 },
  { month: "May", Revenue: 150000, Expenses: 115000, Profit: 35000 },
  { month: "Jun", Revenue: 155000, Expenses: 118000, Profit: 37000 },
];

const employeeDemographics = {
  regions: [
    { name: "North", value: 35 },
    { name: "South", value: 25 },
    { name: "East", value: 20 },
    { name: "West", value: 20 },
  ],
  ageGroups: [
    { name: "25-30", value: 45 },
    { name: "31-35", value: 30 },
    { name: "36-40", value: 15 },
    { name: "41-45", value: 10 },
  ],
};

const teamAnalytics = [
  { year: "2019", FullTime: 400, PartTime: 200, Contract: 50 },
  { year: "2020", FullTime: 420, PartTime: 210, Contract: 60 },
  { year: "2026", FullTime: 430, PartTime: 220, Contract: 70 },
  { year: "2026", FullTime: 440, PartTime: 230, Contract: 80 },
  { year: "2026", FullTime: 450, PartTime: 240, Contract: 90 },
];

const recruitmentMetrics = {
  conversionFunnel: [
    { stage: "Inquiries", count: 5000, conversion: 100 },
    { stage: "Applications", count: 2500, conversion: 50 },
    { stage: "Interviews", count: 1500, conversion: 30 },
    { stage: "Offers", count: 1200, conversion: 24 },
    { stage: "Onboarding", count: 1000, conversion: 20 },
  ],
  teamEnrollment: [
    { team: "IT Team", onboarded: 250, capacity: 300, trend: "up" },
    { team: "Sales Team", onboarded: 180, capacity: 200, trend: "up" },
    { team: "Engineering Team", onboarded: 150, capacity: 200, trend: "down" },
    { team: "Operations Team", onboarded: 80, capacity: 100, trend: "stable" },
    { team: "Marketing Team", onboarded: 120, capacity: 150, trend: "up" },
  ],
  geographicDistribution: [
    { region: "North", employees: 35, applications: 1200 },
    { region: "South", employees: 25, applications: 900 },
    { region: "East", employees: 20, applications: 800 },
    { region: "West", employees: 20, applications: 700 },
  ],
  conversionRateByTeam: [
    { team: "IT Team", rate: 40 },
    { team: "Sales Team", rate: 36 },
    { team: "Engineering Team", rate: 32 },
    { team: "Operations Team", rate: 28 },
    { team: "Marketing Team", rate: 44 },
  ],
  onboardingTrend: [
    { month: "Jan", onboarded: 120 },
    { month: "Feb", onboarded: 140 },
    { month: "Mar", onboarded: 160 },
    { month: "Apr", onboarded: 180 },
    { month: "May", onboarded: 200 },
    { month: "Jun", onboarded: 220 },
  ],
  topSourceRegions: [
    { region: "North", employees: 1200 },
    { region: "South", employees: 900 },
    { region: "East", employees: 800 },
    { region: "West", employees: 700 },
  ],
};

const financialMetrics = {
  revenueByDepartment: [
    { department: "IT Team", revenue: 5000000, grants: 1000000, other: 500000 },
    { department: "Sales Team", revenue: 4000000, grants: 800000, other: 400000 },
    { department: "Engineering Team", revenue: 4500000, grants: 900000, other: 450000 },
    { department: "Operations Team", revenue: 2000000, grants: 400000, other: 200000 },
    { department: "Marketing Team", revenue: 6000000, grants: 1200000, other: 600000 },
  ],
  costAnalysis: [
    { category: "Infrastructure", cost: 2000000, perEmployee: 2000 },
    { category: "Team", cost: 3000000, perEmployee: 3000 },
    { category: "Admin", cost: 1000000, perEmployee: 1000 },
    { category: "Research", cost: 1500000, perEmployee: 1500 },
    { category: "Employee Services", cost: 500000, perEmployee: 500 },
  ],
  budgetUtilization: [
    { department: "IT Team", allocated: 7000000, used: 6500000 },
    { department: "Sales Team", allocated: 6000000, used: 5200000 },
    { department: "Engineering Team", allocated: 6500000, used: 5900000 },
    { department: "Operations Team", allocated: 3000000, used: 2600000 },
    { department: "Marketing Team", allocated: 8000000, used: 7200000 },
  ],
  yearOverYear: [
    { year: "2026", revenue: 20000000, cost: 15000000 },
    { year: "2026", revenue: 23000000, cost: 17000000 },
    { year: "2026", revenue: 25000000, cost: 18000000 },
  ],
};

const operationsMetrics = {
  projectPerformance: [
    { project: "Data Analytics", completionRate: 85, avgScore: 3.5, participants: 120 },
    { project: "Business Strategy", completionRate: 78, avgScore: 3.2, participants: 90 },
    { project: "Engineering Solutions", completionRate: 72, avgScore: 3.0, participants: 150 },
    { project: "Operations Optimization", completionRate: 88, avgScore: 3.6, participants: 80 },
    { project: "Marketing Campaign", completionRate: 92, avgScore: 3.8, participants: 100 },
  ],
  teamPerformance: [
    { team: "IT Team", rating: 4.5, projects: 15, employees: 120 },
    { team: "Sales Team", rating: 4.3, projects: 12, employees: 100 },
    { team: "Engineering Team", rating: 4.7, projects: 18, employees: 150 },
    { team: "Operations Team", rating: 4.2, projects: 10, employees: 90 },
    { team: "Marketing Team", rating: 4.4, projects: 14, employees: 110 },
  ],
  avgScoreByDept: [
    { department: "IT", avgScore: 3.5 },
    { department: "Sales", avgScore: 3.2 },
    { department: "Engineering", avgScore: 3.0 },
    { department: "Operations", avgScore: 3.6 },
    { department: "Marketing", avgScore: 3.8 },
  ],
  completionRateTrend: [
    { month: "Jan", completionRate: 80 },
    { month: "Feb", completionRate: 82 },
    { month: "Mar", completionRate: 85 },
    { month: "Apr", completionRate: 83 },
    { month: "May", completionRate: 87 },
    { month: "Jun", completionRate: 89 },
  ],
  participantsByProject: [
    { project: "Data Analytics", participants: 120 },
    { project: "Business Strategy", participants: 90 },
    { project: "Engineering Solutions", participants: 150 },
    { project: "Operations Optimization", participants: 80 },
    { project: "Marketing Campaign", participants: 100 },
  ],
};

const employeeEngagement = {
  eventParticipation: [
    { event: "Tech Fest", participants: 500, satisfaction: 4.5 },
    { event: "Cultural Day", participants: 800, satisfaction: 4.7 },
    { event: "Sports Meet", participants: 600, satisfaction: 4.3 },
    { event: "Career Fair", participants: 400, satisfaction: 4.6 },
    { event: "Alumni Meet", participants: 300, satisfaction: 4.4 },
  ],
  feedbackMetrics: [
    { facility: "Cafeteria", rating: 4.2, complaints: 15 },
    { facility: "Library", rating: 4.5, complaints: 8 },
    { facility: "Sports", rating: 4.3, complaints: 12 },
    { facility: "Transport", rating: 4.0, complaints: 20 },
    { facility: "Hostel", rating: 4.1, complaints: 18 },
  ],
  participationRateTrend: [
    { month: "Jan", rate: 60 },
    { month: "Feb", rate: 65 },
    { month: "Mar", rate: 70 },
    { month: "Apr", rate: 68 },
    { month: "May", rate: 75 },
    { month: "Jun", rate: 80 },
  ],
  topRatedFacilities: [
    { facility: "Library", rating: 4.5 },
    { facility: "Cafeteria", rating: 4.2 },
    { facility: "Sports", rating: 4.3 },
    { facility: "Hostel", rating: 4.1 },
    { facility: "Transport", rating: 4.0 },
  ],
  satisfactionTrend: [
    { month: "Jan", satisfaction: 4.2 },
    { month: "Feb", satisfaction: 4.3 },
    { month: "Mar", satisfaction: 4.4 },
    { month: "Apr", satisfaction: 4.3 },
    { month: "May", satisfaction: 4.5 },
    { month: "Jun", satisfaction: 4.6 },
  ],
};

const clientMetrics = {
  teamClientSuccess: [
    { team: "IT Team", successRate: 95, avgRevenue: 800000, clients: 25 },
    { team: "Sales Team", successRate: 90, avgRevenue: 700000, clients: 20 },
    { team: "Engineering Team", successRate: 88, avgRevenue: 750000, clients: 22 },
    { team: "Operations Team", successRate: 85, avgRevenue: 600000, clients: 15 },
    { team: "Marketing Team", successRate: 98, avgRevenue: 900000, clients: 30 },
  ],
  clientFeedback: [
    { client: "Tech Corp", satisfaction: 4.5, returnRate: 90, employees: 50 },
    { client: "Finance Ltd", satisfaction: 4.3, returnRate: 85, employees: 40 },
    { client: "Health Inc", satisfaction: 4.7, returnRate: 95, employees: 45 },
    { client: "Edu Group", satisfaction: 4.4, returnRate: 88, employees: 35 },
    { client: "Research Co", satisfaction: 4.6, returnRate: 92, employees: 30 },
  ],
  successRateByTeam: [
    { team: "IT Team", rate: 95 },
    { team: "Sales Team", rate: 90 },
    { team: "Engineering Team", rate: 88 },
    { team: "Operations Team", rate: 85 },
    { team: "Marketing Team", rate: 98 },
  ],
  avgRevenueTrend: [
    { year: "2026", avgRevenue: 700000 },
    { year: "2026", avgRevenue: 800000 },
    { year: "2026", avgRevenue: 900000 },
  ],
  topClients: [
    { client: "Tech Corp", employees: 50 },
    { client: "Finance Ltd", employees: 40 },
    { client: "Health Inc", employees: 45 },
    { client: "Edu Group", employees: 35 },
    { client: "Research Co", employees: 30 },
  ],
};

const complianceMetrics = {
  accreditationStatus: [
    { standard: "ETEC", score: 4.2, status: "Accredited", nextReview: "2026" },
    { standard: "MoE", score: 4.0, status: "Accredited", nextReview: "2026" },
    { standard: "SCFHS", score: 4.5, status: "Accredited", nextReview: "2026" },
    { standard: "TVTC", score: 4.3, status: "Accredited", nextReview: "2026" },
  ],
  auditStatus: [
    { area: "Operations", status: "Compliant", issues: 2, resolved: 2 },
    { area: "Financial", status: "Compliant", issues: 1, resolved: 1 },
    { area: "Administrative", status: "Compliant", issues: 3, resolved: 3 },
    { area: "Infrastructure", status: "Compliant", issues: 2, resolved: 2 },
  ],
  issueTrends: [
    { month: "Jan", issues: 5, resolved: 3 },
    { month: "Feb", issues: 4, resolved: 4 },
    { month: "Mar", issues: 6, resolved: 5 },
    { month: "Apr", issues: 3, resolved: 3 },
    { month: "May", issues: 2, resolved: 2 },
    { month: "Jun", issues: 1, resolved: 1 },
  ],
  upcomingReviews: [
    { department: "CS", review: 2026 },
    { department: "Business", review: 2026 },
    { department: "Engineering", review: 2026 },
    { department: "Arts", review: 2026 },
    { department: "Medicine", review: 2026 },
  ],
  resolvedVsUnresolved: [
    { department: "CS", resolved: 10, unresolved: 2 },
    { department: "Business", resolved: 8, unresolved: 1 },
    { department: "Engineering", resolved: 9, unresolved: 3 },
    { department: "Arts", resolved: 7, unresolved: 2 },
    { department: "Medicine", resolved: 12, unresolved: 0 },
  ],
  complianceScore: [
    { department: "CS", score: 95 },
    { department: "Business", score: 92 },
    { department: "Engineering", score: 90 },
    { department: "Arts", score: 88 },
    { department: "Medicine", score: 98 },
  ],
};

const COLORS = ["#6366f1", "#22c55e", "#f59e42", "#eab308", "#a3a3a3"];

// Proposal Manager – Bid Vault (RFP submissions, win/loss, pipeline)
const bidVaultData = {
  submissionFunnel: [
    { stage: "RFPs Identified", count: 48, conversion: 100 },
    { stage: "Go/No-Go", count: 32, conversion: 67 },
    { stage: "Proposal Submitted", count: 22, conversion: 46 },
    { stage: "Shortlisted", count: 12, conversion: 25 },
    { stage: "Won", count: 7, conversion: 15 },
  ],
  winLossBySegment: [
    { segment: "Federal", won: 4, lost: 6, pending: 2 },
    { segment: "State/Local", won: 2, lost: 5, pending: 1 },
    { segment: "Commercial", won: 1, lost: 3, pending: 2 },
    { segment: "International", won: 0, lost: 2, pending: 1 },
  ],
  pipelineByStage: [
    { stage: "Qualification", value: 12, count: 8 },
    { stage: "Capture", value: 18, count: 6 },
    { stage: "Proposal", value: 8, count: 4 },
    { stage: "Submitted", value: 5, count: 3 },
  ],
  submissionsTrend: [
    { month: "Jan", submitted: 4, won: 1 },
    { month: "Feb", submitted: 5, won: 2 },
    { month: "Mar", submitted: 6, won: 1 },
    { month: "Apr", submitted: 3, won: 2 },
    { month: "May", submitted: 7, won: 1 },
    { month: "Jun", submitted: 5, won: 0 },
  ],
  winRateByFiscal: [
    { year: "FY24", rate: 28, submissions: 18 },
    { year: "FY25", rate: 32, submissions: 22 },
    { year: "FY26", rate: 35, submissions: 24 },
  ],
};

// Proposal Manager – Content Hub (past performance, boilerplate, library)
const contentHubData = {
  pastPerformanceByCategory: [
    { category: "IT/Software", projects: 12, reuseRate: 85 },
    { category: "Professional Services", projects: 8, reuseRate: 72 },
    { category: "Construction", projects: 5, reuseRate: 60 },
    { category: "Research", projects: 6, reuseRate: 78 },
  ],
  boilerplateUsage: [
    { section: "Technical Approach", uses: 45, lastUpdated: "2026-02" },
    { section: "Management", uses: 38, lastUpdated: "2026-01" },
    { section: "Past Performance", uses: 52, lastUpdated: "2026-02" },
    { section: "Pricing", uses: 28, lastUpdated: "2025-12" },
  ],
  contentLibrary: [
    { type: "Resumes", count: 120, updated: 35 },
    { type: "Project Summaries", count: 48, updated: 12 },
    { type: "Case Studies", count: 24, updated: 8 },
    { type: "Certifications", count: 18, updated: 5 },
  ],
  reuseTrend: [
    { month: "Jan", reuseCount: 85 },
    { month: "Feb", reuseCount: 92 },
    { month: "Mar", reuseCount: 88 },
    { month: "Apr", reuseCount: 95 },
    { month: "May", reuseCount: 102 },
    { month: "Jun", reuseCount: 98 },
  ],
};

export default function DirectorAnalyticsReports() {
  const location = useLocation();
  const { t, ready } = useTranslation('director');
  const { isRTLMode } = useLocalization();
  const isBidVault = location.pathname.includes("/rbac/proposal-manager/bid-vault");
  const isContentHub = location.pathname.includes("/rbac/proposal-manager/content-hub");
  const isPM = isBidVault || isContentHub;
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [timeRange, setTimeRange] = useState("6M");
  const [activeTab, setActiveTab] = useState(isBidVault ? "submissions" : isContentHub ? "pastPerformance" : "recruitment");
  const user = JSON.parse(localStorage.getItem('rbac_current_user'));

  // AI Features State
  const [showFinancialIntelligence, setShowFinancialIntelligence] = useState(false);
  const [financialAnalysis, setFinancialAnalysis] = useState(null);

  // Refs for auto-scroll functionality
  const financialRef = useRef(null);

  // Auto-scroll to AI sections
  const scrollToAISection = (sectionRef) => {
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  // Handle AI button clicks with auto-scroll
  const handleShowFinancialIntelligence = () => {
    setShowFinancialIntelligence(!showFinancialIntelligence);
    if (!showFinancialIntelligence) {
      setTimeout(() => scrollToAISection(financialRef), 100);
    }
  };

  if (!ready) {
    return <div className="flex min-h-screen bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 items-center justify-center">
      <div className="text-lg text-gray-600 dark:text-gray-300">Loading...</div>
    </div>;
  }

  const renderRecruitmentSection = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Conversion Funnel */}
        <motion.div data-tour="3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.admissions.admissionFunnel')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={recruitmentMetrics.conversionFunnel} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="conversion" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Program-wise Enrollment */}
        <motion.div data-tour="4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.admissions.programEnrollment')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={recruitmentMetrics.teamEnrollment} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="team" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="onboarded" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="capacity" stroke="#ef4444" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Geographic Distribution */}
        <motion.div data-tour="5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.admissions.geographicDistribution')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={recruitmentMetrics.geographicDistribution}
                dataKey="employees"
                nameKey="region"
                cx="50%"
                cy="50%"
                outerRadius={60}
                label
              >
                {recruitmentMetrics.geographicDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {/* Application Conversion Rate by Program */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.admissions.applicationConversionRate')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={recruitmentMetrics.conversionRateByTeam} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="team" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="rate" fill="#eab308" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Enrollment Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.admissions.enrollmentTrend')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={recruitmentMetrics.onboardingTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="onboarded" stroke="#6366f1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Top Source Regions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.admissions.topSourceRegions')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={recruitmentMetrics.topSourceRegions} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="region" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="employees" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </>
  );

  const renderFinancialSection = () => (
    <>
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        data-tour="6"
        data-tour-title-en="Financial Overview (Row 1)"
        data-tour-title-ar="نظرة عامة مالية (الصف الأول)"
        data-tour-content-en="Revenue by department, cost analysis, and monthly trends give you a snapshot of financial health."
        data-tour-content-ar="يوفر الإيرادات حسب القسم، وتحليل التكاليف، والاتجاهات الشهرية لمحة عن الصحة المالية."
        data-tour-position="bottom"
      >
        {/* Revenue by Department */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.financial.revenueByDepartment')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={financialMetrics.revenueByDepartment} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="grants" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="other" fill="#f59e42" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Cost Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.financial.costAnalysis')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={financialMetrics.costAnalysis} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="cost" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="perEmployee" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Monthly Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.financial.monthlyTrends')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="Revenue" stroke="#6366f1" strokeWidth={2} />
              <Line type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="Profit" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
      {/* Second Row */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4"
        data-tour="7"
        data-tour-title-en="Financial Overview (Row 2)"
        data-tour-title-ar="نظرة عامة مالية (الصف الثاني)"
        data-tour-content-en="Profit by department, budget utilization, and year-over-year growth help you track performance."
        data-tour-content-ar="يساعد الربح حسب القسم، واستخدام الميزانية، والنمو السنوي على تتبع الأداء."
        data-tour-position="bottom"
      >
        {/* Profit Margin by Department */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.financial.profitMarginByDepartment')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={financialMetrics.revenueByDepartment.map(dep => ({
              department: dep.department,
              profit: (dep.revenue || 0) + (dep.grants || 0) + (dep.other || 0)
            }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Budget Utilization by Department */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.financial.budgetUtilizationByDepartment')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={financialMetrics.budgetUtilization} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="allocated" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="used" fill="#f59e42" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Year-over-Year Growth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.financial.yearOverYearGrowth')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={financialMetrics.yearOverYear} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} />
              <Line type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </>
  );

  const renderOperationsSection = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Course Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.academic.coursePerformance')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={operationsMetrics.projectPerformance} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="project" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="completionRate" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avgScore" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Faculty Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.academic.facultyPerformance')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={operationsMetrics.teamPerformance} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="team" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="rating" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="projects" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Student Demographics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.academic.studentDemographics')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={employeeDemographics.regions}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={60}
                label
              >
                {employeeDemographics.regions.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {/* Average GPA by Department */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.academic.averageGPAByDepartment')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={operationsMetrics.avgScoreByDept} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="avgScore" fill="#eab308" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Pass Rate Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.academic.passRateTrend')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={operationsMetrics.completionRateTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="completionRate" stroke="#6366f1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Enrollment by Course */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.academic.enrollmentByCourse')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={operationsMetrics.participantsByProject} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="project" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="participants" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </>
  );

  const renderEmployeeEngagementSection = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Event Participation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.engagement.eventParticipation')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={employeeEngagement.eventParticipation} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="event" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="participants" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="satisfaction" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Feedback Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.engagement.feedbackMetrics')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={employeeEngagement.feedbackMetrics} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="facility" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="rating" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="complaints" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Staff Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.engagement.staffAnalytics')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={teamAnalytics} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="FullTime" stroke="#6366f1" strokeWidth={2} />
              <Line type="monotone" dataKey="PartTime" stroke="#22c55e" strokeWidth={2} />
              <Line type="monotone" dataKey="Contract" stroke="#f59e42" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {/* Event Participation Rate Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.engagement.eventParticipationRateOverTime')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={employeeEngagement.participationRateTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Top Rated Facilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.engagement.topRatedFacilities')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={employeeEngagement.topRatedFacilities} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="facility" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="rating" fill="#eab308" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Student Satisfaction Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.engagement.studentSatisfactionTrend')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={employeeEngagement.satisfactionTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="satisfaction" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </>
  );

  const renderClientSection = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Program Placement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.placement.programPlacement')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={clientMetrics.teamClientSuccess} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="team" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="successRate" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avgRevenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Recruiter Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.placement.recruiterFeedback')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={clientMetrics.clientFeedback} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="client" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="satisfaction" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="returnRate" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Department Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.placement.departmentPerformance')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={departmentPerformance} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dept" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="KPI" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Budget" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Revenue" fill="#f59e42" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {/* Placement Rate by Program */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.placement.placementRateByProgram')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={clientMetrics.successRateByTeam} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="team" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="rate" fill="#eab308" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Average Salary Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.placement.averageSalaryTrend')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={clientMetrics.avgRevenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="avgRevenue" stroke="#6366f1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Top Recruiting Companies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.placement.topRecruitingCompanies')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={clientMetrics.topClients} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="client" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="employees" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </>
  );

  const renderComplianceSection = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Accreditation Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.compliance.accreditationStatus')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={complianceMetrics.accreditationStatus} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="standard" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Audit Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.compliance.auditStatus')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={complianceMetrics.auditStatus} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="area" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="issues" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Compliance Issue Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.compliance.complianceIssueTrends')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={complianceMetrics.issueTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="issues" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {/* Upcoming Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.compliance.upcomingReviews')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={complianceMetrics.upcomingReviews} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="review" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Resolved vs Unresolved Issues */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.compliance.resolvedVsUnresolvedIssues')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={complianceMetrics.resolvedVsUnresolved} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="resolved" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="unresolved" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Department Compliance Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
        >
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{t('analyticsReports.sections.compliance.departmentComplianceScore')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={complianceMetrics.complianceScore} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="score" fill="#eab308" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </>
  );

  const renderBidVaultSubmissions = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Proposal Submission Funnel</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bidVaultData.submissionFunnel} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="conversion" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Submissions vs Wins (6M)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={bidVaultData.submissionsTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="submitted" stroke="#6366f1" strokeWidth={2} name="Submitted" />
              <Line type="monotone" dataKey="won" stroke="#22c55e" strokeWidth={2} name="Won" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Win Rate by Fiscal Year</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bidVaultData.winRateByFiscal} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="rate" fill="#10b981" radius={[4, 4, 0, 0]} name="Win %" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </>
  );
  const renderBidVaultWinLoss = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Win/Loss by Segment</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={bidVaultData.winLossBySegment} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="segment" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="won" fill="#22c55e" radius={[4, 4, 0, 0]} name="Won" />
              <Bar dataKey="lost" fill="#ef4444" radius={[4, 4, 0, 0]} name="Lost" />
              <Bar dataKey="pending" fill="#eab308" radius={[4, 4, 0, 0]} name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Pipeline by Stage ($M)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={bidVaultData.pipelineByStage} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} name="Value ($M)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </>
  );
  const renderBidVaultPipeline = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Pipeline Value by Stage</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bidVaultData.pipelineByStage} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Submission Funnel</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={bidVaultData.submissionFunnel} dataKey="count" nameKey="stage" cx="50%" cy="50%" outerRadius={80} label>
                {bidVaultData.submissionFunnel.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </>
  );
  const renderContentHubPastPerformance = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Past Performance by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={contentHubData.pastPerformanceByCategory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="projects" fill="#6366f1" radius={[4, 4, 0, 0]} name="Projects" />
              <Bar dataKey="reuseRate" fill="#22c55e" radius={[4, 4, 0, 0]} name="Reuse %" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Content Reuse Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={contentHubData.reuseTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="reuseCount" stroke="#6366f1" strokeWidth={2} name="Reuses" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Content Library Overview</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={contentHubData.contentLibrary} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Total" />
              <Bar dataKey="updated" fill="#22c55e" radius={[4, 4, 0, 0]} name="Updated (6M)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </>
  );
  const renderContentHubBoilerplate = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Boilerplate Usage by Section</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={contentHubData.boilerplateUsage} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="section" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="uses" fill="#6366f1" radius={[4, 4, 0, 0]} name="Uses (6M)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Content Library by Type</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={contentHubData.contentLibrary} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </>
  );
  const renderContentHubLibrary = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Resumes & Project Summaries</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={contentHubData.contentLibrary} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={60} label>
                {contentHubData.contentLibrary.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Boilerplate Last Updated</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={contentHubData.boilerplateUsage} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="section" tick={{ fontSize: 9 }} />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="uses" fill="#22c55e" radius={[4, 4, 0, 0]} name="Uses" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </>
  );

  return (
    <div className={`flex min-h-screen bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 ${isRTLMode ? 'rtl' : 'ltr'}`}>
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-8 overflow-x-auto">
        {/* Header Section */}
        <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${isRTLMode ? 'flex-row-reverse' : ''}`} data-tour="1">
          <div className={`flex-1 min-w-0 ${isRTLMode ? 'text-right' : 'text-left'}`}>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isBidVault ? "Bid Vault" : isContentHub ? "Content Hub" : t('analyticsReports.title')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {isBidVault ? "Bid repository, submission tracking, and win/loss analytics." : isContentHub ? "Past performance library, boilerplate, and reusable content." : t('analyticsReports.subtitle')}
            </p>
          </div>
          
          <div className={`flex flex-col sm:flex-row gap-3 ${isRTLMode ? 'flex-row-reverse' : ''}`}>
            {/* AI Features Button – hidden for Proposal Manager */}
            {!isPM && (
            <div className={`flex-shrink-0 ${isRTLMode ? 'text-right' : 'text-left'}`}>
              <button 
                className={`px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors whitespace-nowrap ${isRTLMode ? 'flex-row-reverse' : ''}`}
                onClick={handleShowFinancialIntelligence}
              >
                <FiDollarSign className="w-4 h-4 flex-shrink-0" /> 
                <span className="hidden sm:inline">
                  {isRTLMode ? 'الذكاء المالي' : 'Financial Intelligence'}
                </span>
                <span className="sm:hidden">
                  {isRTLMode ? 'مالي' : 'Financial'}
                </span>
              </button>
            </div>
            )}

            {/* Filter Controls – hide for PM or show segment/time */}
            {!isPM && (
            <div className={`flex flex-wrap gap-2 ${isRTLMode ? 'flex-row-reverse' : ''}`}>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="All">{t('analyticsReports.allDepartments')}</option>
                {recruitmentMetrics.teamEnrollment.map((dept) => (
                  <option key={dept.team} value={dept.team}>
                    {dept.team}
                  </option>
                ))}
              </select>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="1M">{t('analyticsReports.lastMonth')}</option>
                <option value="3M">{t('analyticsReports.last3Months')}</option>
                <option value="6M">{t('analyticsReports.last6Months')}</option>
                <option value="1Y">{t('analyticsReports.lastYear')}</option>
              </select>
            </div>
            )}
            {isPM && (
            <div className={`flex flex-wrap gap-2 ${isRTLMode ? 'flex-row-reverse' : ''}`}>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="6M">Last 6 months</option>
                <option value="1Y">Last year</option>
              </select>
            </div>
            )}
          </div>
        </div>

        {/* AI Financial Intelligence Section – hidden for Proposal Manager */}
        {!isPM && showFinancialIntelligence && (
          <section 
            ref={financialRef}
            className="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
            dir={isRTLMode ? 'rtl' : 'ltr'}
          >
            <div className={`flex items-center gap-2 mb-4 ${isRTLMode ? 'flex-row-reverse' : ''}`}>
              <FiDollarSign className="text-green-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isRTLMode ? 'الذكاء المالي والتحليل الاستراتيجي' : 'Financial Intelligence & Strategic Analysis'}
              </h2>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isRTLMode 
                  ? 'تحليل مالي متقدم مدعوم بالذكاء الاصطناعي لاتخاذ قرارات استراتيجية مدروسة' 
                  : 'Advanced AI-powered financial analysis for strategic decision making'
                }
              </p>
            </div>
            <DirectorFinancialIntelligence 
              onAnalysisComplete={(analysis) => {
                setFinancialAnalysis(analysis);
                console.log('Financial analysis completed:', analysis);
              }}
            />
          </section>
        )}

        {/* Navigation Tabs */}
        <div className={`flex flex-wrap gap-2 ${isRTLMode ? 'flex-row-reverse' : ''}`} data-tour="2">
          {isBidVault && ["submissions", "winLoss", "pipeline"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900"
              }`}
            >
              {tab === "submissions" ? "Submissions" : tab === "winLoss" ? "Win/Loss" : "Pipeline"}
            </button>
          ))}
          {isContentHub && ["pastPerformance", "boilerplate", "library"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900"
              }`}
            >
              {tab === "pastPerformance" ? "Past Performance" : tab === "boilerplate" ? "Boilerplate" : "Library"}
            </button>
          ))}
          {!isPM && ["recruitment", "financial", "operations", "engagement", "clients", "compliance"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900"
              }`}
            >
              {t(`analyticsReports.tabs.${tab}`)}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        {isBidVault && activeTab === "submissions" && renderBidVaultSubmissions()}
        {isBidVault && activeTab === "winLoss" && renderBidVaultWinLoss()}
        {isBidVault && activeTab === "pipeline" && renderBidVaultPipeline()}
        {isContentHub && activeTab === "pastPerformance" && renderContentHubPastPerformance()}
        {isContentHub && activeTab === "boilerplate" && renderContentHubBoilerplate()}
        {isContentHub && activeTab === "library" && renderContentHubLibrary()}
        {!isPM && activeTab === "recruitment" && renderRecruitmentSection()}
        {!isPM && activeTab === "financial" && renderFinancialSection()}
        {!isPM && activeTab === "operations" && renderOperationsSection()}
        {!isPM && activeTab === "engagement" && renderEmployeeEngagementSection()}
        {!isPM && activeTab === "clients" && renderClientSection()}
        {!isPM && activeTab === "compliance" && renderComplianceSection()}
      </main>
    </div>
  );

} 