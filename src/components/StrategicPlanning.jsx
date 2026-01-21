import React, { useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import { directorFeatures } from './directorFeatures';

// Demo data for filters
const departments = ["All Departments", "Computer Science", "EEE", "Mechanical", "Business", "Biotech"];
const years = ["2026", "2026", "2026", "2027", "2028"];

// Demo data for KPIs
const kpis = [
  { label: "Student-Faculty Ratio", value: 18, target: 15, unit: ":1" },
  { label: "Publications/Faculty", value: 2.8, target: 3.5 },
  { label: "Retention Rate", value: 92, target: 95, unit: "%" },
  { label: "Placement Rate", value: 81, target: 90, unit: "%" },
];

// Demo data for progress bars
const goals = [
  { label: "Research Output", progress: 70 },
  { label: "Accreditation Status", progress: 85 },
  { label: "Placements", progress: 81 },
  { label: "Faculty Hiring", progress: 60 },
];

// Demo data for Gantt chart (strategic roadmap)
const roadmap = [
  { name: "NCAAA Prep", start: "2026", end: "2026" },
  { name: "New BSc AI Program", start: "2026", end: "2026" },
  { name: "Office Expansion", start: "2026", end: "2028" },
  { name: "Green Office Initiative", start: "2026", end: "2027" },
];

// Demo data for trend analysis
const trends = [
  { label: "Enrollment", values: [1200, 1300, 1400, 1550, 1700] },
  { label: "Placements", values: [800, 900, 950, 1100, 1200] },
  { label: "Research Funding ($K)", values: [200, 250, 300, 350, 400] },
];

// Demo data for SWOT
const swot = {
  Strengths: ["Strong faculty base", "Modern labs"],
  Weaknesses: ["Limited hostel capacity"],
  Opportunities: ["AI/ML program demand", "Industry tie-ups"],
  Threats: ["Rising competition", "Changing regulations"],
};

export default function StrategicPlanning() {
  const user = JSON.parse(localStorage.getItem('rbac_current_user'));
  const [selectedDept, setSelectedDept] = useState("All Departments");
  const [selectedYear, setSelectedYear] = useState("2026");

  return (
    <div className="flex min-h-screen bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      <div className="sticky top-0 h-screen z-30">
        <Sidebar features={directorFeatures} userLabel={user?.displayName || user?.role || "Director"} />
      </div>
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-8 overflow-x-auto">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center mb-2">
          <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            {departments.map(d => <option key={d}>{d}</option>)}
          </select>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            {years.map(y => <option key={y}>{y}</option>)}
          </select>
        </div>

        {/* 1. Institutional Goals Dashboard */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Institutional Goals Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {kpis.map(kpi => (
              <div key={kpi.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow flex flex-col items-center">
                <div className="relative w-20 h-20 mb-2">
                  <svg className="w-full h-full" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                    <circle cx="20" cy="20" r="18" fill="none" stroke="#2563eb" strokeWidth="4" strokeDasharray={113} strokeDashoffset={113 - (kpi.value / (kpi.target || 100)) * 113} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-blue-700 dark:text-blue-300">{kpi.value}{kpi.unit || ''}</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300 text-center mb-1">{kpi.label}</div>
                <div className="text-xs text-gray-400">Target: {kpi.target}{kpi.unit || ''}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-2">Goal Progress Tracker</h3>
              {goals.map(goal => (
                <div key={goal.label} className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>{goal.label}</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: `${goal.progress}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-2">Strategic Roadmap Timeline</h3>
              <div className="flex flex-col gap-2">
                {roadmap.map(item => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-gray-700 dark:text-gray-200 w-40">{item.name}</span>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full relative">
                      <div className="h-2 rounded-full bg-green-500 absolute left-0" style={{ left: `${(parseInt(item.start)-2026)*25}%`, width: `${(parseInt(item.end)-parseInt(item.start)+1)*25}%` }}></div>
                    </div>
                    <span>{item.start}</span> - <span>{item.end}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 2. Data-Driven Decision Support */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Data-Driven Decision Support</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-2">Trend Analysis Reports</h3>
              <div className="flex flex-col gap-2">
                {trends.map(trend => (
                  <div key={trend.label} className="flex items-center gap-2 text-xs">
                    <span className="w-32 text-gray-700 dark:text-gray-200">{trend.label}</span>
                    <svg width="100" height="24">
                      <polyline
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="2"
                        points={trend.values.map((v, i) => `${i * 25},${24 - (v - Math.min(...trend.values)) / (Math.max(...trend.values) - Math.min(...trend.values) + 1) * 20}`).join(' ')}
                      />
                    </svg>
                    <span className="font-bold text-blue-700 dark:text-blue-300">{trend.values[trend.values.length-1]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow flex flex-col gap-2">
              <h3 className="font-semibold mb-2">AI-Powered Insights</h3>
              <div className="bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-200 rounded-lg p-3 text-sm mb-2">📈 Projected 25% enrollment rise in CSE dept. by 2026 – consider lab & staff expansion.</div>
              <div className="bg-yellow-50 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-200 rounded-lg p-3 text-sm mb-2">🧾 NCAAA due in 18 months – initiate curriculum audit next quarter.</div>
              <div className="bg-red-50 dark:bg-red-900 text-red-900 dark:text-red-200 rounded-lg p-3 text-sm">💼 Research output in EEE down by 20% YoY – consider internal funding push.</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-2">SWOT Analysis</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(swot).map(([key, arr]) => (
                  <div key={key} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
                    <span className="font-bold">{key}:</span>
                    <ul className="list-disc ml-4">
                      {arr.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow flex flex-col gap-2">
              <h3 className="font-semibold mb-2">Policy Impact Reports</h3>
              <div className="text-xs text-gray-700 dark:text-gray-200 mb-1">Revised attendance rules → Dropout rate dropped from 8% to 5% (2026-24)</div>
              <div className="text-xs text-gray-700 dark:text-gray-200">New research grant policy → Publications up 15% YoY</div>
            </div>
          </div>
        </section>

        {/* 3. Academic Planning Tools */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Academic Planning Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-2">Curriculum Development Matrix</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left">
                    <th>Course</th><th>Status</th><th>Lead</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>BSc AI</td><td>Proposal</td><td>Dr. Noura Al-Zahra</td></tr>
                  <tr><td>MBA FinTech</td><td>Review</td><td>Dr. Abdullah Al-Rashid</td></tr>
                  <tr><td>BSc EEE</td><td>Ongoing</td><td>Dr. Khalid Al-Sayed</td></tr>
                </tbody>
              </table>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-2">Program Evaluation Cycle</h3>
              <ul className="text-xs list-disc ml-4">
                <li>BSc CS: Review in 2026</li>
                <li>MBA: Review in 2026</li>
                <li>BSc EEE: Review in 2027</li>
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-2">New Program Feasibility Reports</h3>
              <div className="text-xs">BSc AI: High demand, ROI 3.2x, peer avg. 2.7x</div>
              <div className="text-xs">BBA Digital: Moderate demand, ROI 2.1x, peer avg. 2.0x</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-2">Faculty Hiring Plan</h3>
              <div className="text-xs">CSE: +4 faculty needed by 2026</div>
              <div className="text-xs">EEE: +2 faculty needed by 2027</div>
            </div>
          </div>
        </section>

        {/* 4. Infrastructure & Resource Planning */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Infrastructure & Resource Planning</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-2">Office Expansion Proposals</h3>
              <div className="text-xs">New CS block: 2026-2027</div>
              <div className="text-xs">Library extension: 2026</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-2">Technology Roadmap</h3>
              <div className="text-xs">LMS upgrade: 2026</div>
              <div className="text-xs">Smart classrooms: 2026</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-2">Library/Resource Growth Plans</h3>
              <div className="text-xs">Target: +10,000 books by 2028</div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                <div className="h-2 rounded-full bg-green-500" style={{ width: `60%` }}></div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-2">Sustainability Initiatives</h3>
              <div className="text-xs">Solar integration: 2026-2027</div>
              <div className="text-xs">Carbon reduction: Target 30% by 2028</div>
            </div>
          </div>
        </section>

        {/* 5. Financial Strategy Planning */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Financial Strategy Planning</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-2">Budget Allocation Forecasting</h3>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-2">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: `70%` }}></div>
              </div>
              <div className="text-xs">CSE: $1.2M | EEE: $0.8M | Business: $0.9M</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-2">Grant Strategy Board</h3>
              <div className="text-xs">ETEC: $200K (2026)</div>
              <div className="text-xs">NCAAA: $150K (2026)</div>
              <div className="text-xs">CSR: $100K (2027)</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-2">Cost-Benefit Dashboards</h3>
              <div className="text-xs">New lab: ROI 2.5x</div>
              <div className="text-xs">ERP upgrade: ROI 1.8x</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-2">Revenue Diversification Strategy</h3>
              <div className="text-xs">MOOC: $120K | Consultancy: $80K | Alumni: $60K</div>
            </div>
          </div>
        </section>

        {/* 6. External Partnerships & Rankings */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">External Partnerships & Rankings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-2">Industry Collaboration Map</h3>
              <div className="text-xs">15 active MoUs, 8 industry partners</div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                <div className="h-2 rounded-full bg-purple-500" style={{ width: `60%` }}></div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-2">MoU Tracker</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left">
                    <th>Partner</th><th>Goal</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Infosys</td><td>Internships</td><td>Active</td></tr>
                  <tr><td>Siemens</td><td>Lab Setup</td><td>Renewal Due</td></tr>
                  <tr><td>Google</td><td>Faculty Training</td><td>Active</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-2">Ranking Strategy Panel</h3>
              <div className="text-xs">NIRF: Target Top 100 (Current: 132)</div>
              <div className="text-xs">QS: Target 4-star (Current: 3-star)</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-2">Alumni Involvement Strategy</h3>
              <div className="text-xs">Mentorship: 120 alumni</div>
              <div className="text-xs">Funding: $60K pledged</div>
              <div className="text-xs">Placements: 30% via alumni network</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
} 