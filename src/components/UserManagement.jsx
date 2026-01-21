import React, { useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import { directorFeatures } from './directorFeatures';

const roles = [
  { name: "Dean", count: 5, permissions: ["Academic Oversight", "Department Management", "Budget Approval"], color: "#6366f1", description: "Senior academic leadership role responsible for faculty and department oversight" },
  { name: "HoD", count: 12, permissions: ["Department Operations", "Faculty Management", "Course Planning"], color: "#22c55e", description: "Department head managing academic and administrative operations" },
  { name: "Professor", count: 45, permissions: ["Course Management", "Student Evaluation", "Research Oversight"], color: "#f59e42", description: "Senior faculty member responsible for teaching and research" },
  { name: "Admin Staff", count: 20, permissions: ["Administrative Tasks", "Document Management", "Student Support"], color: "#a21caf", description: "Support staff handling administrative and operational tasks" },
  { name: "IT Staff", count: 8, permissions: ["System Maintenance", "Technical Support", "Security Management"], color: "#ef4444", description: "Technical staff managing IT infrastructure and support" },
];

const departments = [
  { name: "Science", count: 15, roles: ["Dean", "HoD", "Professor", "Admin Staff"] },
  { name: "Engineering", count: 20, roles: ["HoD", "Professor", "Admin Staff", "IT Staff"] },
  { name: "Business", count: 12, roles: ["HoD", "Professor", "Admin Staff"] },
  { name: "IT", count: 10, roles: ["HoD", "Professor", "IT Staff"] },
  { name: "Administration", count: 8, roles: ["Admin Staff", "IT Staff"] },
];

const users = [
  { id: 1, name: "Dr. Sarah Ahmed", role: "Dean", department: "Science", email: "sarah.ahmed@university.edu", status: "Active", lastActive: "2026-03-15 14:30" },
  { id: 2, name: "Prof. Mohammed Ali", role: "HoD", department: "Engineering", email: "mohammed.ali@university.edu", status: "Active", lastActive: "2026-03-15 13:45" },
  { id: 3, name: "Dr. Fatima Khan", role: "Professor", department: "Business", email: "fatima.khan@university.edu", status: "Inactive", lastActive: "2026-03-14 16:20" },
  { id: 4, name: "Ahmed Hassan", role: "Admin Staff", department: "Admissions", email: "ahmed.hassan@university.edu", status: "Active", lastActive: "2026-03-15 15:10" },
];

const permissions = [
  { category: "Academic", permissions: ["Course Management", "Student Records", "Grade Management", "Curriculum Planning"] },
  { category: "Administrative", permissions: ["User Management", "Document Management", "System Configuration", "Report Generation"] },
  { category: "Financial", permissions: ["Budget Management", "Expense Approval", "Financial Reports", "Payment Processing"] },
  { category: "Security", permissions: ["Access Control", "Audit Logs", "Security Settings", "Compliance Management"] },
];

const activityLogs = [
  { user: "Dr. Sarah Ahmed", action: "Updated course curriculum", timestamp: "2026-03-15 14:30", status: "Success" },
  { user: "Prof. Mohammed Ali", action: "Approved department budget", timestamp: "2026-03-15 13:45", status: "Success" },
  { user: "Dr. Fatima Khan", action: "Modified student grades", timestamp: "2026-03-14 16:20", status: "Failed" },
  { user: "Ahmed Hassan", action: "Generated admission report", timestamp: "2026-03-15 15:10", status: "Success" },
];

const userStats = {
  total: 90,
  active: 75,
  inactive: 15,
  newThisMonth: 8,
  departments: departments.map(d => ({ name: d.name, count: d.count })),
};

export default function UserManagement() {
  const user = JSON.parse(localStorage.getItem('rbac_current_user'));
  const [selectedRole, setSelectedRole] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedUsers, setSelectedUsers] = useState([]);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === "All" || u.department === selectedDepartment;
    const matchesStatus = selectedStatus === "All" || u.status === selectedStatus;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  return (
    <div className="flex min-h-screen bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      <div className="sticky top-0 h-screen z-30">
        <Sidebar features={directorFeatures} userLabel={user?.displayName || user?.role || "Director"} />
      </div>
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-8 overflow-x-auto">
        {/* User Statistics */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">User Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.total}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Users</h3>
              <p className="text-2xl font-bold text-green-600">{userStats.active}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Inactive Users</h3>
              <p className="text-2xl font-bold text-red-600">{userStats.inactive}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">New This Month</h3>
              <p className="text-2xl font-bold text-blue-600">{userStats.newThisMonth}</p>
            </div>
          </div>
        </section>

        {/* Department Distribution */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Department Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {departments.map((dept, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{dept.name}</h3>
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">{dept.count} users</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {dept.roles.map((role, j) => (
                    <span key={j} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{role}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 1. Role Management */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Role Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {roles.map((role, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow flex flex-col gap-2 border-l-4" style={{ borderColor: role.color }}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">{role.count} users</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.map((p, j) => (
                    <span key={j} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">{p}</span>
                  ))}
                </div>
                <button className="text-xs text-blue-600 hover:text-blue-700 mt-2" onClick={() => { setSelectedRole(role); setShowRoleModal(true); }}>View Details</button>
              </div>
            ))}
          </div>
        </section>

        {/* 2. User List */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">User List</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search users..."
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="All">All Departments</option>
                {departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
              </select>
              <select
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs">+ Add New User</button>
            </div>
          </div>
          {selectedUsers.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg mb-4 flex justify-between items-center">
              <span className="text-sm text-blue-700 dark:text-blue-200">{selectedUsers.length} users selected</span>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Activate</button>
                <button className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">Deactivate</button>
                <button className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700">Delete</button>
              </div>
            </div>
          )}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 dark:border-gray-700"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(filteredUsers.map(u => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-left">Department</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Last Active</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, i) => (
                  <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 dark:border-gray-700"
                        checked={selectedUsers.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, u.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-2">{u.name}</td>
                    <td className="px-4 py-2">{u.role}</td>
                    <td className="px-4 py-2">{u.department}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${u.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{u.lastActive}</td>
                    <td className="px-4 py-2">
                      <button className="text-blue-600 hover:text-blue-700 mr-2" onClick={() => { setSelectedUser(u); setShowUserModal(true); }}>Edit</button>
                      <button className="text-red-600 hover:text-red-700">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Permissions Matrix */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Permissions Matrix</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {permissions.map((category, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
                <h3 className="font-semibold mb-2">{category.category}</h3>
                <div className="flex flex-wrap gap-2">
                  {category.permissions.map((p, j) => (
                    <span key={j} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">{p}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Activity Logs */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Activity Logs</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">User</th>
                  <th className="px-4 py-2 text-left">Action</th>
                  <th className="px-4 py-2 text-left">Timestamp</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.map((log, i) => (
                  <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2">{log.user}</td>
                    <td className="px-4 py-2">{log.action}</td>
                    <td className="px-4 py-2">{log.timestamp}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${log.status === "Success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Role Details Modal */}
        {showRoleModal && selectedRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setShowRoleModal(false)} />
            <div className="relative z-10 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg w-full max-w-lg">
              <button onClick={() => setShowRoleModal(false)} className="absolute top-2 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-3xl font-bold">&times;</button>
              <h2 className="text-lg font-bold mb-4">{selectedRole.name} Role Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{selectedRole.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total Users</label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{selectedRole.count} users</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Permissions</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedRole.permissions.map((p, i) => (
                      <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">{p}</span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg" onClick={() => setShowRoleModal(false)}>Close</button>
                  <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">Edit Role</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setShowUserModal(false)} />
            <div className="relative z-10 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg w-full max-w-lg">
              <button onClick={() => setShowUserModal(false)} className="absolute top-2 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-3xl font-bold">&times;</button>
              <h2 className="text-lg font-bold mb-4">Edit User</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input type="text" className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800" defaultValue={selectedUser.name} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800" defaultValue={selectedUser.role}>
                    {roles.map(r => <option key={r.name}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <input type="text" className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800" defaultValue={selectedUser.department} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800" defaultValue={selectedUser.email} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800" defaultValue={selectedUser.status}>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg" onClick={() => setShowUserModal(false)}>Cancel</button>
                  <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 