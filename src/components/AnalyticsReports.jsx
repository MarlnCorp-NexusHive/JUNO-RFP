import React, { useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Scatter
} from "recharts";
import { directorFeatures } from './directorFeatures';

// Demo data for various charts
const departmentPerformance = [
  { dept: "Academics", KPI: 85, Budget: 500000, Revenue: 450000 },
  { dept: "HR", KPI: 78, Budget: 200000, Revenue: 180000 },
  { dept: "Finance", KPI: 90, Budget: 300000, Revenue: 280000 },
  { dept: "Admissions", KPI: 82, Budget: 250000, Revenue: 220000 },
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

const studentDemographics = {
  regions: [
    { name: "North", value: 35 },
    { name: "South", value: 25 },
    { name: "East", value: 20 },
    { name: "West", value: 20 },
  ],
  ageGroups: [
    { name: "18-20", value: 45 },
    { name: "21-25", value: 30 },
    { name: "26-30", value: 15 },
    { name: "31-35", value: 10 },
  ],
};

const staffAnalytics = [
  { year: "2019", Teaching: 400, NonTeaching: 200, Contract: 50 },
  { year: "2020", Teaching: 420, NonTeaching: 210, Contract: 60 },
  { year: "2026", Teaching: 430, NonTeaching: 220, Contract: 70 },
  { year: "2026", Teaching: 440, NonTeaching: 230, Contract: 80 },
  { year: "2026", Teaching: 450, NonTeaching: 240, Contract: 90 },
];

const admissionMetrics = {
  conversionFunnel: [
    { stage: "Inquiries", count: 5000, conversion: 100 },
    { stage: "Applications", count: 2500, conversion: 50 },
    { stage: "Interviews", count: 1500, conversion: 30 },
    { stage: "Offers", count: 1200, conversion: 24 },
    { stage: "Enrollments", count: 1000, conversion: 20 },
  ],
  programEnrollment: [
    { program: "Computer Science", enrolled: 250, capacity: 300, trend: "up" },
    { program: "Business Admin", enrolled: 180, capacity: 200, trend: "up" },
    { program: "Engineering", enrolled: 150, capacity: 200, trend: "down" },
    { program: "Arts", enrolled: 80, capacity: 100, trend: "stable" },
    { program: "Medicine", enrolled: 120, capacity: 150, trend: "up" },
  ],
  geographicDistribution: [
    { region: "North", students: 35, applications: 1200 },
    { region: "South", students: 25, applications: 900 },
    { region: "East", students: 20, applications: 800 },
    { region: "West", students: 20, applications: 700 },
  ],
};

const financialMetrics = {
  revenueByDepartment: [
    { department: "Computer Science", tuition: 5000000, grants: 1000000, other: 500000 },
    { department: "Business Admin", tuition: 4000000, grants: 800000, other: 400000 },
    { department: "Engineering", tuition: 4500000, grants: 900000, other: 450000 },
    { department: "Arts", tuition: 2000000, grants: 400000, other: 200000 },
    { department: "Medicine", tuition: 6000000, grants: 1200000, other: 600000 },
  ],
  costAnalysis: [
    { category: "Infrastructure", cost: 2000000, perStudent: 2000 },
    { category: "Faculty", cost: 3000000, perStudent: 3000 },
    { category: "Admin", cost: 1000000, perStudent: 1000 },
    { category: "Research", cost: 1500000, perStudent: 1500 },
    { category: "Student Services", cost: 500000, perStudent: 500 },
  ],
};

const academicMetrics = {
  coursePerformance: [
    { course: "Data Science", passRate: 85, avgGPA: 3.5, enrollment: 120 },
    { course: "Business Law", passRate: 78, avgGPA: 3.2, enrollment: 90 },
    { course: "Engineering Math", passRate: 72, avgGPA: 3.0, enrollment: 150 },
    { course: "Literature", passRate: 88, avgGPA: 3.6, enrollment: 80 },
    { course: "Medicine", passRate: 92, avgGPA: 3.8, enrollment: 100 },
  ],
  facultyPerformance: [
    { faculty: "Dr. Smith", rating: 4.5, publications: 15, students: 120 },
    { faculty: "Dr. Johnson", rating: 4.3, publications: 12, students: 100 },
    { faculty: "Dr. Williams", rating: 4.7, publications: 18, students: 150 },
    { faculty: "Dr. Brown", rating: 4.2, publications: 10, students: 90 },
    { faculty: "Dr. Davis", rating: 4.4, publications: 14, students: 110 },
  ],
};

const studentEngagement = {
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
};

const placementMetrics = {
  programPlacement: [
    { program: "Computer Science", placement: 95, avgSalary: 800000, companies: 25 },
    { program: "Business Admin", placement: 90, avgSalary: 700000, companies: 20 },
    { program: "Engineering", placement: 88, avgSalary: 750000, companies: 22 },
    { program: "Arts", placement: 85, avgSalary: 600000, companies: 15 },
    { program: "Medicine", placement: 98, avgSalary: 900000, companies: 30 },
  ],
  recruiterFeedback: [
    { company: "Tech Corp", satisfaction: 4.5, returnRate: 90, students: 50 },
    { company: "Finance Ltd", satisfaction: 4.3, returnRate: 85, students: 40 },
    { company: "Health Inc", satisfaction: 4.7, returnRate: 95, students: 45 },
    { company: "Edu Group", satisfaction: 4.4, returnRate: 88, students: 35 },
    { company: "Research Co", satisfaction: 4.6, returnRate: 92, students: 30 },
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
    { area: "Academic", status: "Compliant", issues: 2, resolved: 2 },
    { area: "Financial", status: "Compliant", issues: 1, resolved: 1 },
    { area: "Administrative", status: "Compliant", issues: 3, resolved: 3 },
    { area: "Infrastructure", status: "Compliant", issues: 2, resolved: 2 },
  ],
};

const COLORS = ["#6366f1", "#22c55e", "#f59e42", "#eab308", "#a3a3a3"];

export default function AnalyticsReports() {
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [timeRange, setTimeRange] = useState("6M");
  const [activeTab, setActiveTab] = useState("admissions");
  const user = JSON.parse(localStorage.getItem('rbac_current_user'));

  const renderAdmissionsSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Conversion Funnel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Admission Funnel</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={admissionMetrics.conversionFunnel} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="conversion" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Program-wise Enrollment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Program Enrollment</h3>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={admissionMetrics.programEnrollment} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="program" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="enrolled" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="capacity" stroke="#ef4444" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Geographic Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Geographic Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={admissionMetrics.geographicDistribution}
              dataKey="students"
              nameKey="region"
              cx="50%"
              cy="50%"
              outerRadius={60}
              label
            >
              {admissionMetrics.geographicDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Second Row - Additional Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Application Sources</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={[
                { name: "Website", value: 45 },
                { name: "Referral", value: 25 },
                { name: "Social Media", value: 20 },
                { name: "Direct", value: 10 }
              ]}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={60}
              label
            >
              {[
                { name: "Website", value: 45 },
                { name: "Referral", value: 25 },
                { name: "Social Media", value: 20 },
                { name: "Direct", value: 10 }
              ].map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Application Trends</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={[
              { month: "Jan", applications: 120, enrollments: 80 },
              { month: "Feb", applications: 150, enrollments: 100 },
              { month: "Mar", applications: 180, enrollments: 120 },
              { month: "Apr", applications: 160, enrollments: 110 },
              { month: "May", applications: 200, enrollments: 140 },
              { month: "Jun", applications: 220, enrollments: 160 }
            ]}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Area type="monotone" dataKey="applications" fill="#6366f1" stroke="#6366f1" />
            <Area type="monotone" dataKey="enrollments" fill="#22c55e" stroke="#22c55e" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Admission KPIs</h3>
        <div className="space-y-3">
          {[
            { label: "Application to Enrollment", value: "45%", change: "+5%" },
            { label: "Avg. Processing Time", value: "7 days", change: "-2 days" },
            { label: "Student Retention", value: "92%", change: "+3%" },
          ].map((stat) => (
            <div key={stat.label} className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{stat.value}</span>
                <span className={`text-xs ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderFinancialSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Revenue by Department */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Department Revenue</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={financialMetrics.revenueByDepartment} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="department" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="tuition" stackId="a" fill="#6366f1" />
            <Bar dataKey="grants" stackId="a" fill="#22c55e" />
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
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Cost per Student</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={financialMetrics.costAnalysis} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="perStudent" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Quick Financial Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Financial Overview</h3>
        <div className="space-y-3">
          {[
            { label: "Total Revenue", value: "₹12.5M", change: "+12%" },
            { label: "Total Expenses", value: "₹8.5M", change: "+8%" },
            { label: "Net Profit", value: "₹4.0M", change: "+15%" },
          ].map((stat) => (
            <div key={stat.label} className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{stat.value}</span>
                <span className={`text-xs ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Second Row - Additional Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Revenue Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={[
                { name: "Tuition", value: 60 },
                { name: "Grants", value: 25 },
                { name: "Research", value: 10 },
                { name: "Other", value: 5 }
              ]}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={60}
              label
            >
              {[
                { name: "Tuition", value: 60 },
                { name: "Grants", value: 25 },
                { name: "Research", value: 10 },
                { name: "Other", value: 5 }
              ].map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Expense Trends</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={[
              { month: "Jan", operational: 800000, capital: 200000 },
              { month: "Feb", operational: 850000, capital: 150000 },
              { month: "Mar", operational: 900000, capital: 300000 },
              { month: "Apr", operational: 850000, capital: 250000 },
              { month: "May", operational: 950000, capital: 200000 },
              { month: "Jun", operational: 1000000, capital: 250000 }
            ]}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Area type="monotone" dataKey="operational" fill="#6366f1" stroke="#6366f1" />
            <Area type="monotone" dataKey="capital" fill="#22c55e" stroke="#22c55e" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Financial KPIs</h3>
        <div className="space-y-3">
          {[
            { label: "Operating Margin", value: "28%", change: "+3%" },
            { label: "ROI", value: "15%", change: "+2%" },
            { label: "Debt Ratio", value: "0.4", change: "-0.1" },
          ].map((stat) => (
            <div key={stat.label} className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{stat.value}</span>
                <span className={`text-xs ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderAcademicSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Course Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Course Performance</h3>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={academicMetrics.coursePerformance} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="course" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="passRate" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="avgGPA" stroke="#22c55e" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Faculty Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Faculty Performance</h3>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={academicMetrics.facultyPerformance} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="faculty" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="rating" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="publications" stroke="#22c55e" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Academic Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Academic Overview</h3>
        <div className="space-y-3">
          {[
            { label: "Avg. Pass Rate", value: "85%", change: "+5%" },
            { label: "Avg. GPA", value: "3.4", change: "+0.2" },
            { label: "Research Output", value: "45", change: "+12%" },
          ].map((stat) => (
            <div key={stat.label} className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{stat.value}</span>
                <span className={`text-xs ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Second Row - Additional Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Research Output</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={[
              { year: "2020", publications: 45, citations: 120 },
              { year: "2026", publications: 55, citations: 150 },
              { year: "2026", publications: 65, citations: 180 },
              { year: "2026", publications: 75, citations: 220 }
            ]}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="publications" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="citations" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Student Performance</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={[
              { semester: "Fall 2026", avgGPA: 3.2, passRate: 85 },
              { semester: "Spring 2026", avgGPA: 3.3, passRate: 87 },
              { semester: "Fall 2026", avgGPA: 3.4, passRate: 89 },
              { semester: "Spring 2026", avgGPA: 3.5, passRate: 91 }
            ]}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="semester" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Area type="monotone" dataKey="avgGPA" fill="#6366f1" stroke="#6366f1" />
            <Area type="monotone" dataKey="passRate" fill="#22c55e" stroke="#22c55e" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Academic KPIs</h3>
        <div className="space-y-3">
          {[
            { label: "Research Impact", value: "2.8", change: "+0.3" },
            { label: "Student Success", value: "89%", change: "+4%" },
            { label: "Faculty Ratio", value: "1:15", change: "Optimal" },
          ].map((stat) => (
            <div key={stat.label} className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{stat.value}</span>
                <span className={`text-xs ${stat.change === "Optimal" ? 'text-blue-500' : stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderStudentEngagementSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Event Participation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Event Participation</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={studentEngagement.eventParticipation} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="event" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="participants" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Facility Feedback */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Facility Ratings</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={studentEngagement.feedbackMetrics} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="facility" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="rating" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Engagement Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Engagement Overview</h3>
        <div className="space-y-3">
          {[
            { label: "Avg. Event Participation", value: "520", change: "+15%" },
            { label: "Avg. Facility Rating", value: "4.3/5", change: "+0.2" },
            { label: "Active Clubs", value: "12", change: "+2" },
          ].map((stat) => (
            <div key={stat.label} className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{stat.value}</span>
                <span className={`text-xs ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Second Row - Additional Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Club Participation</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={[
              { club: "Sports", members: 250, activities: 15 },
              { club: "Cultural", members: 180, activities: 12 },
              { club: "Technical", members: 200, activities: 18 },
              { club: "Literary", members: 150, activities: 10 }
            ]}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="club" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="members" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="activities" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Student Satisfaction</h3>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart
            data={[
              { category: "Academic", score: 4.5 },
              { category: "Facilities", score: 4.2 },
              { category: "Support", score: 4.3 },
              { category: "Activities", score: 4.4 },
              { category: "Technology", score: 4.6 }
            ]}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <PolarGrid />
            <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
            <PolarRadiusAxis tick={{ fontSize: 10 }} />
            <Radar name="Satisfaction" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Engagement KPIs</h3>
        <div className="space-y-3">
          {[
            { label: "Event Attendance", value: "75%", change: "+8%" },
            { label: "Club Membership", value: "65%", change: "+5%" },
            { label: "Student Feedback", value: "4.4/5", change: "+0.2" },
          ].map((stat) => (
            <div key={stat.label} className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{stat.value}</span>
                <span className={`text-xs ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderPlacementSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Program Placement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Placement Rate</h3>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={placementMetrics.programPlacement} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="program" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="placement" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="avgSalary" stroke="#22c55e" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Recruiter Feedback */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Recruiter Satisfaction</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={placementMetrics.recruiterFeedback} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="company" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="satisfaction" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Placement Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Placement Overview</h3>
        <div className="space-y-3">
          {[
            { label: "Avg. Placement Rate", value: "91%", change: "+3%" },
            { label: "Avg. Salary", value: "₹7.5L", change: "+12%" },
            { label: "Active Recruiters", value: "25", change: "+5" },
          ].map((stat) => (
            <div key={stat.label} className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{stat.value}</span>
                <span className={`text-xs ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Second Row - Additional Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Industry Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={[
                { name: "Technology", value: 35 },
                { name: "Healthcare", value: 25 },
                { name: "Finance", value: 20 },
                { name: "Education", value: 15 },
                { name: "Other", value: 5 }
              ]}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={60}
              label
            >
              {[
                { name: "Technology", value: 35 },
                { name: "Healthcare", value: 25 },
                { name: "Finance", value: 20 },
                { name: "Education", value: 15 },
                { name: "Other", value: 5 }
              ].map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Salary Trends</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={[
              { year: "2020", avgSalary: 650000, maxSalary: 850000 },
              { year: "2026", avgSalary: 700000, maxSalary: 900000 },
              { year: "2026", avgSalary: 750000, maxSalary: 950000 },
              { year: "2026", avgSalary: 800000, maxSalary: 1000000 }
            ]}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="avgSalary" stroke="#6366f1" strokeWidth={2} />
            <Line type="monotone" dataKey="maxSalary" stroke="#22c55e" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Placement KPIs</h3>
        <div className="space-y-3">
          {[
            { label: "Placement Rate", value: "91%", change: "+3%" },
            { label: "Avg. Package", value: "₹8.5L", change: "+12%" },
            { label: "Top Recruiters", value: "25", change: "+5" },
          ].map((stat) => (
            <div key={stat.label} className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{stat.value}</span>
                <span className={`text-xs ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderComplianceSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Accreditation Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Accreditation Scores</h3>
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
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Audit Status</h3>
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

      {/* Compliance Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Compliance Overview</h3>
        <div className="space-y-3">
          {[
            { label: "Avg. Accreditation", value: "3.9/5", change: "+0.2" },
            { label: "Issues Resolved", value: "8/8", change: "100%" },
            { label: "Next Review", value: "2026", change: "On Track" },
          ].map((stat) => (
            <div key={stat.label} className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{stat.value}</span>
                <span className={`text-xs ${stat.change === "100%" ? 'text-green-500' : 'text-blue-500'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Second Row - Additional Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Compliance Timeline</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={[
              { month: "Jan", compliance: 85, audits: 3 },
              { month: "Feb", compliance: 88, audits: 4 },
              { month: "Mar", compliance: 90, audits: 5 },
              { month: "Apr", compliance: 92, audits: 4 },
              { month: "May", compliance: 95, audits: 3 },
              { month: "Jun", compliance: 98, audits: 2 }
            ]}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="compliance" stroke="#6366f1" strokeWidth={2} />
            <Line type="monotone" dataKey="audits" stroke="#22c55e" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Risk Assessment</h3>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart
            data={[
              { category: "Academic", risk: 2 },
              { category: "Financial", risk: 3 },
              { category: "Operational", risk: 2 },
              { category: "Legal", risk: 1 },
              { category: "Technical", risk: 2 }
            ]}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <PolarGrid />
            <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
            <PolarRadiusAxis tick={{ fontSize: 10 }} />
            <Radar name="Risk Level" dataKey="risk" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
      >
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Compliance KPIs</h3>
        <div className="space-y-3">
          {[
            { label: "Overall Compliance", value: "98%", change: "+2%" },
            { label: "Risk Score", value: "Low", change: "Stable" },
            { label: "Next Audit", value: "Q3 2026", change: "Scheduled" },
          ].map((stat) => (
            <div key={stat.label} className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{stat.value}</span>
                <span className={`text-xs ${stat.change === "Stable" || stat.change === "Scheduled" ? 'text-blue-500' : stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      <div className="sticky top-0 h-screen z-30">
        <Sidebar features={directorFeatures} userLabel={user?.displayName || user?.role || "Director"} />
      </div>
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-4 overflow-x-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Analytics & Reports</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Comprehensive insights and analytics dashboard</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="All">All Departments</option>
              {admissionMetrics.programEnrollment.map((dept) => (
                <option key={dept.program} value={dept.program}>
                  {dept.program}
                </option>
              ))}
            </select>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="1M">Last Month</option>
              <option value="3M">Last 3 Months</option>
              <option value="6M">Last 6 Months</option>
              <option value="1Y">Last Year</option>
            </select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
          {[
            { id: "admissions", label: "Admissions" },
            { id: "financial", label: "Financial" },
            { id: "academic", label: "Academic" },
            { id: "engagement", label: "Engagement" },
            { id: "placement", label: "Placement" },
            { id: "compliance", label: "Compliance" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-sm font-medium ${
                activeTab === tab.id
                  ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Section */}
        <div className="flex-1">
          {activeTab === "admissions" && renderAdmissionsSection()}
          {activeTab === "financial" && renderFinancialSection()}
          {activeTab === "academic" && renderAcademicSection()}
          {activeTab === "engagement" && renderStudentEngagementSection()}
          {activeTab === "placement" && renderPlacementSection()}
          {activeTab === "compliance" && renderComplianceSection()}
        </div>
      </main>
    </div>
  );
} 