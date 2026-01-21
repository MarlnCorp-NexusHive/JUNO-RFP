import React, { useState } from 'react';

// --- Merged Data from Project ---
const allUsers = [
  // preloadDemoUsers.js
  { id: 1, name: 'Super Admin', email: 'superadmin@org.com', team: null, role: 'Super Admin', status: 'Active' },
  { id: 2, name: 'Marketing Head', email: 'marketing_head@org.com', team: 'Marketing Team', role: 'Head', status: 'Active' },
  { id: 3, name: 'Marketing Manager', email: 'marketing_manager@org.com', team: 'Marketing Team', role: 'Manager', status: 'Active' },
  { id: 4, name: 'Admission Head', email: 'admission_head@org.com', team: 'Admission Team', role: 'Head', status: 'Active' },
  { id: 5, name: 'Admission SPOC', email: 'admission_spoc@org.com', team: 'Admission Team', role: 'SPOC', status: 'Active' },
  { id: 6, name: 'HR Head', email: 'hr_head@org.com', team: 'HR & Payroll Team', role: 'CFO/Head', status: 'Active' },
  { id: 7, name: 'HR Manager', email: 'hr_manager@org.com', team: 'HR & Payroll Team', role: 'Manager', status: 'Active' },
  { id: 8, name: 'Admin Head', email: 'admin_head@org.com', team: 'Admin Team', role: 'Head', status: 'Active' },
  { id: 9, name: 'Admin Manager', email: 'admin_manager@org.com', team: 'Admin Team', role: 'Manager', status: 'Active' },
  { id: 10, name: 'IT Head', email: 'it_head@org.com', team: 'IT & Support Team', role: 'Head', status: 'Active' },
  { id: 11, name: 'Director', email: 'director@org.com', team: 'Director and Deans', role: 'Director', status: 'Active' },
  { id: 12, name: 'Dean', email: 'dean@org.com', team: 'Director and Deans', role: 'Dean', status: 'Active' },
  { id: 13, name: 'HoD', email: 'hod@org.com', team: 'HoD', role: 'HoD', status: 'Active' },
  { id: 14, name: 'Senior Professor', email: 'senior_professor@org.com', team: 'Teacher/Professor', role: 'Senior Professor', status: 'Active' },
  { id: 15, name: 'Professor', email: 'professor@org.com', team: 'Teacher/Professor', role: 'Professor', status: 'Active' },
  { id: 16, name: 'Student', email: 'student@org.com', team: 'Students', role: 'Students', status: 'Active' },
  { id: 17, name: 'Parent', email: 'parent@org.com', team: 'Parents', role: 'Parents', status: 'Active' },
  { id: 18, name: 'Exam Head', email: 'exam_head@org.com', team: 'Exam Team', role: 'Head', status: 'Active' },
  { id: 19, name: 'Library Head', email: 'library_head@org.com', team: 'Library Team', role: 'Head', status: 'Active' },
  { id: 20, name: 'Transport Head', email: 'transport_head@org.com', team: 'Transport Team', role: 'Head', status: 'Active' },
  // UserManagement.jsx
  { id: 21, name: 'Dr. Sarah Ahmed', email: 'sarah.ahmed@university.edu', team: 'Science', role: 'Dean', status: 'Active' },
  { id: 22, name: 'Prof. Mohammed Ali', email: 'mohammed.ali@university.edu', team: 'Engineering', role: 'HoD', status: 'Active' },
  { id: 23, name: 'Dr. Fatima Khan', email: 'fatima.khan@university.edu', team: 'Business', role: 'Professor', status: 'Inactive' },
  { id: 24, name: 'Ahmed Hassan', email: 'ahmed.hassan@university.edu', team: 'Admissions', role: 'Admin Staff', status: 'Active' },
  { id: 25, name: 'John Doe', email: 'john.doe@univ.edu', team: 'Science', role: 'Dean', status: 'Active' },
  { id: 26, name: 'Jane Smith', email: 'jane.smith@univ.edu', team: 'EEE', role: 'HoD', status: 'Active' },
  { id: 27, name: 'Mike Johnson', email: 'mike.johnson@univ.edu', team: 'Math', role: 'Faculty', status: 'Inactive' },
];

const allRoles = [
  'Super Admin', 'Head', 'Manager', 'CityHead', 'FieldExecutive', 'SPOC', 'CFO/Head', 'HRs', 'Executive', 'Director', 'Dean', 'HoD', 'Senior Professor', 'Professor', 'External', 'Students', 'Parents', 'Driver', 'Helper', 'Faculty', 'Admin Staff', 'IT Staff', 'Staff', 'Campaign Manager', 'Content Strategist', 'Digital Marketer'
];

const allTeams = [
  'Marketing Team', 'Admission Team', 'HR & Payroll Team', 'Admin Team', 'IT & Support Team', 'Director and Deans', 'HoD (Head of Department)', 'Teacher / Professor', 'Students', 'Parents', 'Exam Team', 'Library Team', 'Transport Team'
];

const allPermissions = ['Users', 'Teams', 'Settings', 'Reports', 'Export', 'Delete', 'Academic Oversight', 'Department Management', 'Budget Approval', 'Course Management', 'Student Evaluation', 'Research Oversight', 'Administrative Tasks', 'Document Management', 'Student Support', 'System Maintenance', 'Technical Support', 'Security Management', 'User Management', 'System Configuration', 'Report Generation', 'Budget Management', 'Expense Approval', 'Financial Reports', 'Payment Processing', 'Access Control', 'Audit Logs', 'Security Settings', 'Compliance Management'];

export default function AdminUserRoleManagement() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState(allUsers);
  const [roles, setRoles] = useState(allRoles.map(r => ({ name: r, permissions: allPermissions.slice(0, 3) })));
  const [teams] = useState(allTeams);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editRole, setEditRole] = useState(null);

  // User Modal Handlers
  const openUserModal = (user = null) => { setEditUser(user); setShowUserModal(true); };
  const closeUserModal = () => { setEditUser(null); setShowUserModal(false); };
  const saveUser = (user) => {
    if (user.id) {
      setUsers(users.map(u => u.id === user.id ? user : u));
    } else {
      setUsers([...users, { ...user, id: users.length + 1 }]);
    }
    closeUserModal();
  };

  // Role Modal Handlers
  const openRoleModal = (role = null) => { setEditRole(role); setShowRoleModal(true); };
  const closeRoleModal = () => { setEditRole(null); setShowRoleModal(false); };
  const saveRole = (role) => {
    if (editRole) {
      setRoles(roles.map(r => r.name === editRole.name ? role : r));
    } else {
      setRoles([...roles, role]);
    }
    closeRoleModal();
  };

  // Permissions Toggle
  const togglePermission = (roleName, perm) => {
    setRoles(roles.map(r =>
      r.name === roleName
        ? { ...r, permissions: r.permissions.includes(perm)
            ? r.permissions.filter(p => p !== perm)
            : [...r.permissions, perm] }
        : r
    ));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">User & Role Management</h1>
      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b">
        <button className={`pb-2 px-4 font-semibold ${tab==='users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`} onClick={()=>setTab('users')}>Users</button>
        <button className={`pb-2 px-4 font-semibold ${tab==='roles' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`} onClick={()=>setTab('roles')}>Roles & Permissions</button>
        <button className={`pb-2 px-4 font-semibold ${tab==='teams' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`} onClick={()=>setTab('teams')}>Teams</button>
      </div>
      {/* Users Tab */}
      {tab==='users' && (
        <div>
          <div className="flex justify-between mb-4">
            <input className="border rounded px-3 py-2 w-64" placeholder="Search users..." />
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={()=>openUserModal()}>Add User</button>
          </div>
          <table className="w-full bg-white rounded shadow text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">Name</th><th>Email</th><th>Team</th><th>Role</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t">
                  <td className="p-3 font-medium">{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.team}</td>
                  <td>{u.role}</td>
                  <td><span className={`px-2 py-1 rounded text-xs ${u.status==='Active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>{u.status}</span></td>
                  <td>
                    <button className="text-blue-600 mr-2" onClick={()=>openUserModal(u)}>Edit</button>
                    <button className="text-red-500" onClick={()=>setUsers(users.filter(x=>x.id!==u.id))}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* User Modal */}
          {showUserModal && (
            <UserModal user={editUser} onClose={closeUserModal} onSave={saveUser} />
          )}
        </div>
      )}
      {/* Roles Tab */}
      {tab==='roles' && (
        <div>
          <div className="flex justify-between mb-4">
            <div />
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={()=>openRoleModal()}>Add Role</button>
          </div>
          <table className="w-full bg-white rounded shadow text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">Role</th><th>Permissions</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.name} className="border-t">
                  <td className="p-3 font-medium">{r.name}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      {allPermissions.map(perm => (
                        <label key={perm} className="flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" checked={r.permissions.includes(perm)} onChange={()=>togglePermission(r.name, perm)} />
                          <span className="text-xs">{perm}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                  <td>
                    <button className="text-blue-600 mr-2" onClick={()=>openRoleModal(r)}>Edit</button>
                    <button className="text-red-500" onClick={()=>setRoles(roles.filter(x=>x.name!==r.name))}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Role Modal */}
          {showRoleModal && (
            <RoleModal role={editRole} onClose={closeRoleModal} onSave={saveRole} />
          )}
        </div>
      )}
      {/* Teams Tab */}
      {tab==='teams' && (
        <div>
          <table className="w-full bg-white rounded shadow text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">Team</th>
              </tr>
            </thead>
            <tbody>
              {teams.map(t => (
                <tr key={t} className="border-t">
                  <td className="p-3 font-medium">{t}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// User Modal Component
function UserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState(user || { name: '', email: '', team: '', role: '', status: 'Active' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4">{user ? 'Edit User' : 'Add User'}</h2>
        <div className="space-y-3">
          <input className="w-full border rounded px-3 py-2" placeholder="Name" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} />
          <input className="w-full border rounded px-3 py-2" placeholder="Email" value={form.email} onChange={e=>setForm(f=>({...f, email: e.target.value}))} />
          <select className="w-full border rounded px-3 py-2" value={form.team} onChange={e=>setForm(f=>({...f, team: e.target.value}))}>
            <option value="">Select Team</option>
            {allTeams.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="w-full border rounded px-3 py-2" value={form.role} onChange={e=>setForm(f=>({...f, role: e.target.value}))}>
            <option value="">Select Role</option>
            {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="w-full border rounded px-3 py-2" value={form.status} onChange={e=>setForm(f=>({...f, status: e.target.value}))}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button className="px-4 py-2 bg-gray-200 rounded" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={()=>onSave(form)}>{user ? 'Save' : 'Add'}</button>
        </div>
      </div>
    </div>
  );
}

// Role Modal Component
function RoleModal({ role, onClose, onSave }) {
  const [form, setForm] = useState(role || { name: '', permissions: [] });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4">{role ? 'Edit Role' : 'Add Role'}</h2>
        <div className="space-y-3">
          <input className="w-full border rounded px-3 py-2" placeholder="Role Name" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} />
          <div className="flex flex-wrap gap-2">
            {allPermissions.map(perm => (
              <label key={perm} className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={form.permissions.includes(perm)} onChange={()=>setForm(f=>({...f, permissions: f.permissions.includes(perm) ? f.permissions.filter(p=>p!==perm) : [...f.permissions, perm]}))} />
                <span className="text-xs">{perm}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button className="px-4 py-2 bg-gray-200 rounded" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={()=>onSave(form)}>{role ? 'Save' : 'Add'}</button>
        </div>
      </div>
    </div>
  );
} 