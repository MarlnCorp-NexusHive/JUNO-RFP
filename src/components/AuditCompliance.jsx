import React from "react";
import Sidebar from "./Sidebar";
import { directorFeatures } from './directorFeatures';

// Demo data for compliance health
const complianceDomains = [
  { label: "Academic", value: 92, color: "#2563eb" },
  { label: "HR", value: 88, color: "#22c55e" },
  { label: "Finance", value: 95, color: "#f59e42" },
  { label: "Legal", value: 90, color: "#a21caf" },
];
const checklist = [
  { body: "ETEC", status: "Compliant" },
  { body: "MoE", status: "Compliant" },
  { body: "SCFHS", status: "Pending" },
  { body: "TVTC", status: "Compliant" },
];
const pendingItems = [
  { item: "SCFHS annual renewal", due: "2026-06-30" },
  { item: "Faculty contract updates", due: "2026-05-15" },
];
const riskAlerts = [
  { alert: "SCFHS compliance pending", severity: "High" },
  { alert: "Late fee policy update overdue", severity: "Medium" },
];
const auditLogs = [
  { date: "2026-04-10", user: "Dean Science", action: "Grade change approved" },
  { date: "2026-04-09", user: "Finance Admin", action: "Fund disbursement approved" },
];
const accessLogs = [
  { date: "2026-04-10", user: "HoD EEE", module: "Finance" },
  { date: "2026-04-09", user: "Dean HR", module: "HR" },
];
const configChanges = [
  { date: "2026-04-08", user: "Director", change: "Updated attendance policy" },
];
const anomaly = "Multiple logins from same staff ID across regions detected (AI flagged)";
const policies = [
  { name: "Academic Policy 2026", version: "v2.1", acknowledged: 8 },
  { name: "HR Policy 2026", version: "v1.3", acknowledged: 6 },
];
const auditCalendar = [
  { type: "Academic", date: "2026-05-10", team: "Internal" },
  { type: "Finance", date: "2026-06-15", team: "External" },
];
const violations = [
  { area: "Library", issue: "Fire safety non-compliance", status: "Escalated", due: "2026-04-30" },
  { area: "Transport", issue: "Driver background check overdue", status: "Open", due: "2026-05-05" },
];
const reports = [
  { name: "Compliance Report Q1 2026", type: "PDF" },
  { name: "Audit Summary 2026", type: "Excel" },
];
const scores = [
  { dept: "CSE", score: 95 },
  { dept: "EEE", score: 88 },
  { dept: "Business", score: 91 },
];
const aiSuggestions = [
  "SCFHS renewal overdue – prioritize documentation.",
  "Library fire safety non-compliance – escalate to Dean Infra.",
];
const accessMatrix = [
  { role: "Director", access: "All" },
  { role: "Dean", access: "Academic, HR, Finance" },
  { role: "Finance Admin", access: "Finance" },
];
const escalations = [
  { area: "Library", issue: "Fire safety", escalatedTo: "Dean Infra" },
];
const integrations = [
  { name: "LMS", desc: "Academic policy audit" },
  { name: "Finance System", desc: "Fund disbursement audit" },
  { name: "HRMS", desc: "HR contract renewals" },
  { name: "Library", desc: "Safety compliance logs" },
];

export default function AuditCompliance() {
  const user = JSON.parse(localStorage.getItem('rbac_current_user'));
  const ViewAllBtn = ({ onClick }) => (
    <button
      className="ml-auto mb-2 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition float-right"
      onClick={onClick || (() => {})}
      style={{ minWidth: 60 }}
    >
      View All
    </button>
  );
  return (
    <div className="flex min-h-screen bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      <div className="sticky top-0 h-screen z-30">
        <Sidebar features={directorFeatures} userLabel={user?.displayName || user?.role || "Director"} />
      </div>
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-8 overflow-x-auto">
        {/* 1. Compliance Dashboard */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Compliance Dashboard</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {complianceDomains.map(d => (
              <div key={d.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow flex flex-col items-center">
                <svg className="w-16 h-16 mb-2" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="18" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                  <circle cx="20" cy="20" r="18" fill="none" stroke={d.color} strokeWidth="4" strokeDasharray={113} strokeDashoffset={113 - (d.value / 100) * 113} strokeLinecap="round" />
                </svg>
                <span className="text-xl font-bold" style={{ color: d.color }}>{d.value}%</span>
                <span className="text-xs text-gray-600 dark:text-gray-300">{d.label}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow relative">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">Pending Action Items</h3>
                <ViewAllBtn />
              </div>
              <ul className="text-xs">
                {pendingItems.map((p, i) => <li key={i}>⏳ {p.item} <span className="text-gray-400">(Due: {p.due})</span></li>)}
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow relative">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">Risk Alerts</h3>
                <ViewAllBtn />
              </div>
              <ul className="text-xs">
                {riskAlerts.map((r, i) => <li key={i} className={r.severity === "High" ? "text-red-600" : "text-yellow-600"}>⚠️ {r.alert}</li>)}
              </ul>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow mb-4 relative">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold">Regulatory Checklist Tracker</h3>
              <ViewAllBtn />
            </div>
            <table className="w-full text-xs">
              <thead><tr><th>Body</th><th>Status</th></tr></thead>
              <tbody>
                {checklist.map((c, i) => <tr key={i}><td>{c.body}</td><td>{c.status}</td></tr>)}
              </tbody>
            </table>
          </div>
        </section>

        {/* 2. Audit Logs */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Audit Logs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow relative">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">System-wide Audit Trails</h3>
                <ViewAllBtn />
              </div>
              <ul className="text-xs">
                {auditLogs.map((l, i) => <li key={i}>{l.date} – {l.user}: {l.action}</li>)}
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow relative">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">User Access Logs</h3>
                <ViewAllBtn />
              </div>
              <ul className="text-xs">
                {accessLogs.map((l, i) => <li key={i}>{l.date} – {l.user} accessed {l.module}</li>)}
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow relative">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">Configuration Changes</h3>
                <ViewAllBtn />
              </div>
              <ul className="text-xs">
                {configChanges.map((c, i) => <li key={i}>{c.date} – {c.user}: {c.change}</li>)}
              </ul>
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-200 rounded-lg p-3 text-xs mb-2">🧠 AI-based Anomaly Detection: {anomaly}</div>
        </section>

        {/* 3. Policy & Document Management */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Policy & Document Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow relative">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">Central Repository of Policies</h3>
                <ViewAllBtn />
              </div>
              <ul className="text-xs">
                {policies.map((p, i) => <li key={i}>{p.name} ({p.version}) <a href="#" className="text-blue-600 underline ml-2">Download</a></li>)}
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow relative">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">Policy Acknowledgement Tracker</h3>
                <ViewAllBtn />
              </div>
              <ul className="text-xs">
                {policies.map((p, i) => <li key={i}>{p.name}: {p.acknowledged} depts acknowledged</li>)}
              </ul>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow mb-4 relative">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold">Policy Version Control</h3>
              <ViewAllBtn />
            </div>
            <div className="text-xs">Compare v2.1 (2026) vs v2.0 (2026): <span className="text-green-600">+Updated grading policy</span></div>
          </div>
        </section>

        {/* 4. Scheduled Audits */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Scheduled Audits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow relative">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">Audit Calendar</h3>
                <ViewAllBtn />
              </div>
              <ul className="text-xs">
                {auditCalendar.map((a, i) => <li key={i}>{a.type} – {a.date} ({a.team})</li>)}
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow relative">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">Audit Team Assignment</h3>
                <ViewAllBtn />
              </div>
              <ul className="text-xs">
                {auditCalendar.map((a, i) => <li key={i}>{a.type}: {a.team} team</li>)}
              </ul>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow mb-4 relative">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold">Audit Checklist Templates</h3>
              <ViewAllBtn />
            </div>
            <ul className="text-xs"><li>Academic Audit Template</li><li>HR Audit Template</li></ul>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow mb-4 relative">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold">Audit Findings Submission</h3>
              <ViewAllBtn />
            </div>
            <div className="text-xs">Departments upload self-audit reports or evidence here. <span className="text-gray-400">(Demo only)</span></div>
          </div>
        </section>

        {/* 5. Non-Compliance Tracker */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Non-Compliance Tracker</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow mb-4 relative">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold">Violation Registry</h3>
              <ViewAllBtn />
            </div>
            <table className="w-full text-xs">
              <thead><tr><th>Area</th><th>Issue</th><th>Status</th><th>Due</th></tr></thead>
              <tbody>
                {violations.map((v, i) => <tr key={i}><td>{v.area}</td><td>{v.issue}</td><td>{v.status}</td><td>{v.due}</td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow mb-4 relative">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold">Resolution Timeline</h3>
              <ViewAllBtn />
            </div>
            <ul className="text-xs">
              {violations.map((v, i) => <li key={i}>{v.area}: {v.status} (Due: {v.due})</li>)}
            </ul>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow mb-4 relative">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold">Root Cause & Corrective Actions</h3>
              <ViewAllBtn />
            </div>
            <ul className="text-xs"><li>Library: Fire safety – Corrective action assigned to Dean Infra</li></ul>
          </div>
        </section>

        {/* 6. Reporting & Analytics */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Reporting & Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow flex flex-col gap-2 relative">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">Compliance Reports</h3>
                <ViewAllBtn />
              </div>
              {reports.map((r, i) => <div key={i}><button className="text-blue-600 underline text-xs">Download {r.type}</button> {r.name}</div>)}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow flex flex-col gap-2 relative">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">Compliance Scores</h3>
                <ViewAllBtn />
              </div>
              {scores.map((s, i) => <div key={i} className="text-xs">{s.dept}: <span className="font-bold">{s.score}</span></div>)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow mb-4 relative">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold">AI Suggestion Engine</h3>
              <ViewAllBtn />
            </div>
            <ul className="text-xs">
              {aiSuggestions.map((s, i) => <li key={i}>🧠 {s}</li>)}
            </ul>
          </div>
        </section>

        {/* 7. Role-based Access & Escalation */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Role-based Access & Escalation</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow mb-4 relative">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold">Access Control Matrix</h3>
              <ViewAllBtn />
            </div>
            <table className="w-full text-xs">
              <thead><tr><th>Role</th><th>Access</th></tr></thead>
              <tbody>
                {accessMatrix.map((a, i) => <tr key={i}><td>{a.role}</td><td>{a.access}</td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow mb-4 relative">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold">Escalation Triggers</h3>
              <ViewAllBtn />
            </div>
            <ul className="text-xs">
              {escalations.map((e, i) => <li key={i}>{e.area}: {e.issue} escalated to {e.escalatedTo}</li>)}
            </ul>
          </div>
        </section>

        {/* 8. Integration */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Integration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {integrations.map(card => (
              <div key={card.name} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow flex flex-col gap-1">
                <div className="font-semibold text-xs mb-1">{card.name}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">{card.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
} 