import React, { useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { directorFeatures } from './directorFeatures';

// Demo data for departments
const departments = [
  {
    id: 1,
    name: "Computer Science",
    enrollments: 1200,
    passRate: 82,
    revenue: 4200000,
    facultyStrength: 35,
    researchOutput: 12,
    gpa: 3.4,
    dropoutRate: 4.2,
    completionRate: 92,
    satisfactionScore: 4.2,
    facultyStudentRatio: 34,
    vacancies: 3,
    attritionRate: 5.2,
    budgetAllocated: 5000000,
    budgetSpent: 4200000,
    costPerStudent: 3500,
    roiLabs: 85,
    publications: 45,
    grantsSecured: 1200000,
    patentsFiled: 8,
    collaborations: 12,
    placementRate: 92,
    avgPackage: 85000,
    higherStudiesRate: 15,
    internships: 280,
    awards: 8,
    guestLectures: 24,
    industryMoUs: 6,
    outreachPrograms: 12
  },
  {
    id: 2,
    name: "Electronics & Communication",
    enrollments: 890,
    passRate: 78,
    revenue: 3100000,
    facultyStrength: 28,
    researchOutput: 9,
    gpa: 3.2,
    dropoutRate: 5.1,
    completionRate: 88,
    satisfactionScore: 3.9,
    facultyStudentRatio: 32,
    vacancies: 4,
    attritionRate: 6.1,
    budgetAllocated: 3800000,
    budgetSpent: 3100000,
    costPerStudent: 3800,
    roiLabs: 78,
    publications: 32,
    grantsSecured: 850000,
    patentsFiled: 5,
    collaborations: 8,
    placementRate: 88,
    avgPackage: 72000,
    higherStudiesRate: 12,
    internships: 210,
    awards: 6,
    guestLectures: 18,
    industryMoUs: 4,
    outreachPrograms: 8
  },
  {
    id: 3,
    name: "Business Administration",
    enrollments: 460,
    passRate: 91,
    revenue: 2800000,
    facultyStrength: 18,
    researchOutput: 6,
    gpa: 3.6,
    dropoutRate: 3.2,
    completionRate: 95,
    satisfactionScore: 4.4,
    facultyStudentRatio: 26,
    vacancies: 2,
    attritionRate: 4.8,
    budgetAllocated: 3200000,
    budgetSpent: 2800000,
    costPerStudent: 4200,
    roiLabs: 82,
    publications: 28,
    grantsSecured: 950000,
    patentsFiled: 3,
    collaborations: 10,
    placementRate: 95,
    avgPackage: 92000,
    higherStudiesRate: 18,
    internships: 180,
    awards: 9,
    guestLectures: 30,
    industryMoUs: 8,
    outreachPrograms: 15
  }
];

const COLORS = ["#6366f1", "#22c55e", "#f59e42", "#eab308", "#a3a3a3"];

export default function Departments() {
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [viewMode, setViewMode] = useState("overview");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedDepts, setSelectedDepts] = useState([]);
  const user = JSON.parse(localStorage.getItem('rbac_current_user'));

  const renderDepartmentOverview = () => (
    <div className="space-y-6">
      {/* Department Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <motion.div
            key={dept.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{dept.name}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Enrollments</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{dept.enrollments}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Pass Rate</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{dept.passRate}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Revenue</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">${(dept.revenue / 1000000).toFixed(1)}M</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Faculty</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{dept.facultyStrength}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Research</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{dept.researchOutput} papers</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Academic Health Indicators */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Academic Health Indicators</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">Pass/Fail Rate</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={departments} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="passRate" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">Student Satisfaction</h4>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={departments.map(dept => ({
                name: dept.name,
                GPA: dept.gpa,
                Satisfaction: dept.satisfactionScore,
                Completion: dept.completionRate,
                Dropout: 100 - dept.dropoutRate
              }))}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis />
                <Radar name="Metrics" dataKey="GPA" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
                <Radar name="Metrics" dataKey="Satisfaction" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">Completion vs Dropout</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={departments} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completionRate" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="dropoutRate" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Faculty & Staff Analytics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Faculty & Staff Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">Faculty Metrics</h4>
            <div className="grid grid-cols-2 gap-4">
              {departments.map((dept) => (
                <div key={dept.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">{dept.name}</h5>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Faculty-Student Ratio</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">1:{dept.facultyStudentRatio}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Vacancies</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{dept.vacancies}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Attrition Rate</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{dept.attritionRate}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">Faculty Workload Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departments} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="facultyStrength" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="researchOutput" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Financial Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">Budget Allocation vs Spent</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departments} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="budgetAllocated" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="budgetSpent" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">Cost & Revenue Analysis</h4>
            <div className="grid grid-cols-2 gap-4">
              {departments.map((dept) => (
                <div key={dept.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">{dept.name}</h5>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Cost per Student</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">${dept.costPerStudent}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">ROI on Labs</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{dept.roiLabs}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Revenue</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">${(dept.revenue / 1000000).toFixed(1)}M</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Research & Innovation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Research & Innovation Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">Research Output</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departments} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="publications" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="patentsFiled" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collaborations" fill="#f59e42" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">Grants & Funding</h4>
            <div className="grid grid-cols-2 gap-4">
              {departments.map((dept) => (
                <div key={dept.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">{dept.name}</h5>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Grants Secured</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">${(dept.grantsSecured / 1000000).toFixed(1)}M</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Patents Filed</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{dept.patentsFiled}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Collaborations</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{dept.collaborations}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Student Outcomes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Student Outcomes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">Placement & Higher Studies</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departments} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="placementRate" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="higherStudiesRate" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">Package & Internships</h4>
            <div className="grid grid-cols-2 gap-4">
              {departments.map((dept) => (
                <div key={dept.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">{dept.name}</h5>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Average Package</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">${dept.avgPackage.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Internships</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{dept.internships}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Department Achievements */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Department Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">Awards & Recognition</h4>
            <div className="grid grid-cols-2 gap-4">
              {departments.map((dept) => (
                <div key={dept.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">{dept.name}</h5>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Awards Won</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{dept.awards}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Guest Lectures</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{dept.guestLectures}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Industry MoUs</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{dept.industryMoUs}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Outreach Programs</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{dept.outreachPrograms}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
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
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Departments</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Comprehensive department analytics and management</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="All">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="overview">Overview</option>
              <option value="list">List View</option>
            </select>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1">
          {viewMode === "overview" ? renderDepartmentOverview() : renderDepartmentList()}
        </div>
      </main>
    </div>
  );
} 