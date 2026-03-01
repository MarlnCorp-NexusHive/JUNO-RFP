import React, { useState } from "react";
import { motion } from "framer-motion";

// Initial demo data for team members
const initialTeamMembers = [
  { id: 1, name: "John Doe", role: "Senior Marketing Executive", email: "john.doe@example.com", phone: "+1 234 567 890", performance: 92, status: "Active", avatar: "👨‍💼", skills: ["Digital Marketing", "Content Strategy", "Social Media"], projects: ["Q2 Campaign", "Brand Refresh"] },
  { id: 2, name: "Jane Smith", role: "Content Strategist", email: "jane.smith@example.com", phone: "+1 234 567 891", performance: 88, status: "Active", avatar: "👩‍💼", skills: ["Content Creation", "SEO", "Copywriting"], projects: ["Blog Series", "Email Campaign"] },
  { id: 3, name: "Mike Johnson", role: "Social Media Manager", email: "mike.johnson@example.com", phone: "+1 234 567 892", performance: 85, status: "On Leave", avatar: "👨‍💼", skills: ["Social Media", "Community Management", "Analytics"], projects: ["Social Campaign", "Influencer Outreach"] },
];

// Demo data for performance metrics
const performanceMetrics = [
  { metric: "Lead Generation", target: 1000, achieved: 850 },
  { metric: "Conversion Rate", target: 35, achieved: 32 },
  { metric: "Campaign ROI", target: 300, achieved: 285 },
  { metric: "Social Engagement", target: 5000, achieved: 4800 },
];

export default function TeamManagement() {
  const user = JSON.parse(localStorage.getItem('rbac_current_user'));
  const [members, setMembers] = useState(initialTeamMembers);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", role: "Team Member", email: "", phone: "", skills: "", projects: "", status: "Active" });

  const handleMemberClick = (member) => {
    setSelectedMember(member);
    setShowModal(true);
  };

  const openAddModal = () => {
    setNewMember({ name: "", role: "Team Member", email: "", phone: "", skills: "", projects: "", status: "Active" });
    setShowAddModal(true);
  };

  const handleAddMemberSubmit = (e) => {
    e.preventDefault();
    const name = newMember.name.trim();
    const email = newMember.email.trim();
    if (!name || !email) return;
    const nextId = Math.max(0, ...members.map((m) => m.id)) + 1;
    setMembers((prev) => [
      ...prev,
      {
        id: nextId,
        name,
        role: newMember.role.trim() || "Team Member",
        email,
        phone: newMember.phone.trim() || "",
        performance: 80,
        status: newMember.status,
        avatar: "👤",
        skills: newMember.skills ? newMember.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
        projects: newMember.projects ? newMember.projects.split(",").map((p) => p.trim()).filter(Boolean) : [],
      },
    ]);
    setShowAddModal(false);
  };

  const Modal = ({ member, onClose }) => {
    if (!member) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={onClose} />
        <div className="relative z-10 bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4">
          <button type="button" onClick={onClose} className="absolute top-2 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-3xl font-bold" aria-label="Close">&times;</button>
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{member.avatar}</span>
              <div>
                <h2 className="text-xl font-bold">{member.name}</h2>
                <p className="text-gray-600 dark:text-gray-300">{member.role}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Contact Information</h3>
              <p className="text-sm">{member.email}</p>
              <p className="text-sm">{member.phone || "—"}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {(member.skills || []).length > 0 ? member.skills.map((skill, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">{skill}</span>
                )) : <span className="text-sm text-gray-500">—</span>}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Current Projects</h3>
              <div className="space-y-2">
                {(member.projects || []).length > 0 ? member.projects.map((project, index) => (
                  <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">{project}</div>
                )) : <span className="text-sm text-gray-500">—</span>}
              </div>
            </div>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Manage your marketing team and track performance</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={openAddModal} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Add Team Member
          </button>
          <button className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
            Export Report
          </button>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
          >
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{metric.metric}</h3>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-semibold">{metric.achieved}</p>
              <p className="text-sm text-gray-500">Target: {metric.target}</p>
            </div>
            <div className="mt-2">
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                <div
                  className="h-2 bg-blue-600 rounded-full"
                  style={{ width: `${(metric.achieved / metric.target) * 100}%` }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Team Members Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Team Members</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b dark:border-gray-700">
                  <th className="pb-3 font-medium">Member</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Performance</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b dark:border-gray-700">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{member.avatar}</span>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">{member.role}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                          <div
                            className="h-2 bg-green-500 rounded-full"
                            style={{ width: `${member.performance}%` }}
                          />
                        </div>
                        <span className="text-sm">{member.performance}%</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.status === "Active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <button
                        onClick={() => handleMemberClick(member)}
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

      {showModal && <Modal member={selectedMember} onClose={() => setShowModal(false)} />}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setShowAddModal(false)} />
          <div className="relative z-10 bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Team Member</h2>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl font-bold" aria-label="Close">&times;</button>
            </div>
            <form onSubmit={handleAddMemberSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input type="text" required value={newMember.name} onChange={(e) => setNewMember((p) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <select value={newMember.role} onChange={(e) => setNewMember((p) => ({ ...p, role: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <option>Senior Marketing Executive</option>
                  <option>Content Strategist</option>
                  <option>Social Media Manager</option>
                  <option>Team Member</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                <input type="email" required value={newMember.email} onChange={(e) => setNewMember((p) => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <input type="tel" value={newMember.phone} onChange={(e) => setNewMember((p) => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="+1 234 567 890" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skills (comma-separated)</label>
                <input type="text" value={newMember.skills} onChange={(e) => setNewMember((p) => ({ ...p, skills: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="e.g. SEO, Social Media" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Projects (comma-separated)</label>
                <input type="text" value={newMember.projects} onChange={(e) => setNewMember((p) => ({ ...p, projects: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="e.g. Q3 Campaign" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select value={newMember.status} onChange={(e) => setNewMember((p) => ({ ...p, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <option>Active</option>
                  <option>On Leave</option>
                  <option>Pending</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 