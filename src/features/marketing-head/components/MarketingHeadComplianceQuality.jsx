import React, { useState } from "react";
import { motion } from "framer-motion";

// Demo data for compliance metrics
const complianceMetrics = [
  { metric: "Policy Compliance", value: "98%", change: "+2%" },
  { metric: "Quality Score", value: "95%", change: "+5%" },
  { metric: "Audit Score", value: "92%", change: "+3%" },
  { metric: "Training Completion", value: "100%", change: "+10%" },
];

// Demo data for compliance checks
const complianceChecks = [
  {
    id: 1,
    name: "Data Privacy Policy",
    status: "Compliant",
    lastChecked: "2026-03-15",
    nextCheck: "2026-06-15",
    score: 98,
    issues: 0,
    owner: "John Doe",
  },
  {
    id: 2,
    name: "Marketing Communications",
    status: "Warning",
    lastChecked: "2026-03-10",
    nextCheck: "2026-06-10",
    score: 85,
    issues: 2,
    owner: "Jane Smith",
  },
  {
    id: 3,
    name: "Lead Management",
    status: "Compliant",
    lastChecked: "2026-03-01",
    nextCheck: "2026-06-01",
    score: 95,
    issues: 0,
    owner: "Mike Johnson",
  },
];

// Demo data for quality metrics
const qualityMetrics = [
  { category: "Content Quality", score: 95, issues: 2 },
  { category: "Process Adherence", score: 92, issues: 3 },
  { category: "Documentation", score: 88, issues: 4 },
  { category: "Team Training", score: 96, issues: 1 },
];

export default function MarketingHeadComplianceQuality() {
  const user = JSON.parse(localStorage.getItem('rbac_current_user'));
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCheck, setSelectedCheck] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("All");

  const handleCheckClick = (check) => {
    setSelectedCheck(check);
    setShowModal(true);
  };

  const Modal = ({ check, onClose }) => {
    if (!check) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={onClose} />
        <div className="relative z-10 bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4">
          <button
            onClick={onClose}
            className="absolute top-2 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-3xl font-bold"
            aria-label="Close"
          >
            &times;
          </button>
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">{check.name}</h2>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              check.status === "Compliant" ? "bg-green-100 text-green-700" :
              check.status === "Warning" ? "bg-yellow-100 text-yellow-700" :
              "bg-red-100 text-red-700"
            }`}>
              {check.status}
            </span>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Compliance Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Last Check</p>
                  <p className="font-medium">{check.lastChecked}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Next Check</p>
                  <p className="font-medium">{check.nextCheck}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Owner</p>
                  <p className="font-medium">{check.owner}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Score</p>
                  <p className="font-medium">{check.score}%</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Issues Found</h3>
              {check.issues === 0 ? (
                <p className="text-green-600">No issues found</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-yellow-600">{check.issues} issues need attention</p>
                  <button className="text-blue-600 hover:text-blue-700">
                    View Issues
                  </button>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-2">Compliance Score</h3>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    check.score >= 90 ? "bg-green-600" :
                    check.score >= 80 ? "bg-yellow-600" :
                    "bg-red-600"
                  }`}
                  style={{ width: `${check.score}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">{check.score}% Compliant</p>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Update Status
            </button>
            <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
              View History
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Compliance & Quality</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Monitor compliance and quality metrics</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            New Check
          </button>
          <button className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
            Export Report
          </button>
        </div>
      </div>

      {/* Compliance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {complianceMetrics.map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{metric.metric}</span>
              <span className={`text-sm font-medium ${
                metric.change.startsWith("+") ? "text-green-600" : "text-red-600"
              }`}>
                {metric.change}
              </span>
            </div>
            <p className="text-2xl font-bold mt-2">{metric.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Quality Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {qualityMetrics.map((metric, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
            <h3 className="font-medium mb-2">{metric.category}</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Score</span>
                <span className={`font-medium ${
                  metric.score >= 90 ? "text-green-600" :
                  metric.score >= 80 ? "text-yellow-600" :
                  "text-red-600"
                }`}>
                  {metric.score}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Issues</span>
                <span className="font-medium">{metric.issues}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    metric.score >= 90 ? "bg-green-600" :
                    metric.score >= 80 ? "bg-yellow-600" :
                    "bg-red-600"
                  }`}
                  style={{ width: `${metric.score}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Checks List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Compliance Checks</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm"
            >
              <option value="All">All Checks</option>
              <option value="Compliant">Compliant</option>
              <option value="Warning">Warning</option>
              <option value="Non-Compliant">Non-Compliant</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b dark:border-gray-700">
                  <th className="pb-3 font-medium">Check</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Last Check</th>
                  <th className="pb-3 font-medium">Next Check</th>
                  <th className="pb-3 font-medium">Score</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {complianceChecks.map((check) => (
                  <tr key={check.id} className="border-b dark:border-gray-700">
                    <td className="py-4">
                      <div>
                        <p className="font-medium">{check.name}</p>
                        <p className="text-sm text-gray-500">{check.owner}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        check.status === "Compliant" ? "bg-green-100 text-green-700" :
                        check.status === "Warning" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {check.status}
                      </span>
                    </td>
                    <td className="py-4">{check.lastChecked}</td>
                    <td className="py-4">{check.nextCheck}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              check.score >= 90 ? "bg-green-600" :
                              check.score >= 80 ? "bg-yellow-600" :
                              "bg-red-600"
                            }`}
                            style={{ width: `${check.score}%` }}
                          />
                        </div>
                        <span className="text-sm">{check.score}%</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <button
                        onClick={() => handleCheckClick(check)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && <Modal check={selectedCheck} onClose={() => setShowModal(false)} />}
    </div>
  );
} 