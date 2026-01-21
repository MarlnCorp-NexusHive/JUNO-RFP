import React, { useState } from "react";
import { motion } from "framer-motion";

// Demo data for leads
const leads = [
  {
    id: 1,
    name: "Sarah Wilson",
    email: "sarah.wilson@example.com",
    phone: "+1 234 567 893",
    source: "Website",
    status: "New",
    assignedTo: "John Doe",
    lastContact: "2026-04-10",
    notes: "Interested in MBA program",
  },
  {
    id: 2,
    name: "David Brown",
    email: "david.brown@example.com",
    phone: "+1 234 567 894",
    source: "Social Media",
    status: "Contacted",
    assignedTo: "Jane Smith",
    lastContact: "2026-04-09",
    notes: "Requested program brochure",
  },
  {
    id: 3,
    name: "Emily Davis",
    email: "emily.davis@example.com",
    phone: "+1 234 567 895",
    source: "Referral",
    status: "Qualified",
    assignedTo: "Mike Johnson",
    lastContact: "2026-04-08",
    notes: "Scheduled campus visit",
  },
];

// Demo data for lead sources
const leadSources = [
  { source: "Website", count: 450, conversion: 25 },
  { source: "Social Media", count: 300, conversion: 20 },
  { source: "Referral", count: 200, conversion: 35 },
  { source: "Events", count: 150, conversion: 30 },
];

// Demo data for lead status
const leadStatus = [
  { status: "New", count: 120, color: "bg-blue-100 text-blue-700" },
  { status: "Contacted", count: 85, color: "bg-yellow-100 text-yellow-700" },
  { status: "Qualified", count: 65, color: "bg-green-100 text-green-700" },
  { status: "Converted", count: 45, color: "bg-purple-100 text-purple-700" },
];

export default function LeadsManagement() {
  const user = JSON.parse(localStorage.getItem('rbac_current_user'));
  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("All");

  const handleLeadClick = (lead) => {
    setSelectedLead(lead);
    setShowModal(true);
  };

  const Modal = ({ lead, onClose }) => {
    if (!lead) return null;
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
            <h2 className="text-xl font-bold mb-2">{lead.name}</h2>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              lead.status === "New" ? "bg-blue-100 text-blue-700" :
              lead.status === "Contacted" ? "bg-yellow-100 text-yellow-700" :
              lead.status === "Qualified" ? "bg-green-100 text-green-700" :
              "bg-purple-100 text-purple-700"
            }`}>
              {lead.status}
            </span>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Contact Information</h3>
              <p className="text-sm">{lead.email}</p>
              <p className="text-sm">{lead.phone}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Lead Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Source</p>
                  <p className="font-medium">{lead.source}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Assigned To</p>
                  <p className="font-medium">{lead.assignedTo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Contact</p>
                  <p className="font-medium">{lead.lastContact}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-sm">{lead.notes}</p>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Update Status
            </button>
            <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
              Add Note
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Track and manage your marketing leads</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Add Lead
          </button>
          <button className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
            Export Leads
          </button>
        </div>
      </div>

      {/* Lead Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {leadStatus.map((status, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${status.color} p-4 rounded-xl shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{status.status === "New" ? "🆕" : status.status === "Contacted" ? "📞" : status.status === "Qualified" ? "✅" : "🎯"}</span>
              <span className="text-2xl font-bold">{status.count}</span>
            </div>
            <p className="text-sm mt-2">{status.status} Leads</p>
          </motion.div>
        ))}
      </div>

      {/* Lead Sources Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Lead Sources Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {leadSources.map((source, index) => (
            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium mb-2">{source.source}</h3>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-semibold">{source.count}</p>
                <p className="text-sm text-green-600">{source.conversion}% conversion</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">All Leads</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm"
            >
              <option value="All">All Leads</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Converted">Converted</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b dark:border-gray-700">
                  <th className="pb-3 font-medium">Lead</th>
                  <th className="pb-3 font-medium">Source</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Assigned To</th>
                  <th className="pb-3 font-medium">Last Contact</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b dark:border-gray-700">
                    <td className="py-4">
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-sm text-gray-500">{lead.email}</p>
                      </div>
                    </td>
                    <td className="py-4">{lead.source}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        lead.status === "New" ? "bg-blue-100 text-blue-700" :
                        lead.status === "Contacted" ? "bg-yellow-100 text-yellow-700" :
                        lead.status === "Qualified" ? "bg-green-100 text-green-700" :
                        "bg-purple-100 text-purple-700"
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-4">{lead.assignedTo}</td>
                    <td className="py-4">{lead.lastContact}</td>
                    <td className="py-4">
                      <button
                        onClick={() => handleLeadClick(lead)}
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

      {showModal && <Modal lead={selectedLead} onClose={() => setShowModal(false)} />}
    </div>
  );
} 