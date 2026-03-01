import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocalization } from "../../../hooks/useLocalization";
import { directorFeatures } from '../../../components/directorFeatures';

import { 
  FiUsers, 
  FiUserPlus, 
  FiSearch, 
  FiFilter, 
  FiEdit3, 
  FiEye, 
  FiMoreHorizontal, 
  FiMail, 
  FiShield, 
  FiCheckCircle, 
  FiXCircle, 
  FiClock, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiMinus,
  FiDownload,
  FiUpload,
  FiSettings,
  FiUser,
  FiUserCheck,
  FiUserX,
  FiAward, // Changed from FiCrown to FiAward
  FiBookOpen,
  FiTarget,
  FiZap
} from "react-icons/fi";


export default function DirectorUserManagement() {
  const location = useLocation();
  const isPM = location.pathname.includes("/rbac/proposal-manager/user-management");
  const user = JSON.parse(localStorage.getItem('rbac_current_user'));
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const { t, ready } = useTranslation('director');
  const { isRTLMode } = useLocalization();

  // Show loading state if i18n is not ready
  if (!ready) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Loading...</h1>
          </div>
        </main>
      </div>
    );
  }

  const pmInitialUsers = [
    { id: 1, name: "Michael Anderson", role: "Proposal Manager", department: "Proposals", statusKey: "userStatuses.active", email: "michael.anderson@company.com", lastLogin: "2026-03-10", avatar: "MA", permissions: 12, joinDate: "2026-01-15" },
    { id: 2, name: "David Reynolds", role: "Capture Manager", department: "Capture", statusKey: "userStatuses.active", email: "david.reynolds@company.com", lastLogin: "2026-03-09", avatar: "DR", permissions: 10, joinDate: "2025-11-20" },
    { id: 3, name: "Sarah Chen", role: "Proposal Writer", department: "Proposals", statusKey: "userStatuses.active", email: "sarah.chen@company.com", lastLogin: "2026-03-11", avatar: "SC", permissions: 6, joinDate: "2026-02-01" },
    { id: 4, name: "James Wilson", role: "Technical Lead", department: "Proposals", statusKey: "userStatuses.active", email: "james.wilson@company.com", lastLogin: "2026-03-08", avatar: "JW", permissions: 8, joinDate: "2025-09-15" },
    { id: 5, name: "Emily Martinez", role: "Pricing Lead", department: "Proposals", statusKey: "userStatuses.inactive", email: "emily.martinez@company.com", lastLogin: "2026-02-28", avatar: "EM", permissions: 7, joinDate: "2025-06-10" },
  ];
  const directorInitialUsers = [
    { id: 1, nameKey: "demoUsers.johnDoe", roleKey: "roles.dean", departmentKey: "departments.science", statusKey: "userStatuses.active", email: "john.doe@company.com", lastLogin: "2026-03-10", avatar: "JD", permissions: 12, joinDate: "2026-01-15" },
    { id: 2, nameKey: "demoUsers.janeSmith", roleKey: "roles.hod", departmentKey: "departments.eee", statusKey: "userStatuses.active", email: "jane.smith@company.com", lastLogin: "2026-03-09", avatar: "JS", permissions: 8, joinDate: "2026-03-20" },
    { id: 3, nameKey: "demoUsers.mikeJohnson", roleKey: "roles.faculty", departmentKey: "departments.math", statusKey: "userStatuses.inactive", email: "mike.johnson@company.com", lastLogin: "2026-02-28", avatar: "MJ", permissions: 5, joinDate: "2026-06-10" },
    { id: 4, nameKey: "demoUsers.sarahWilson", roleKey: "roles.faculty", departmentKey: "departments.computer", statusKey: "userStatuses.active", email: "sarah.wilson@company.com", lastLogin: "2026-03-11", avatar: "SW", permissions: 6, joinDate: "2026-08-15" },
    { id: 5, nameKey: "demoUsers.davidBrown", roleKey: "roles.student", departmentKey: "departments.engineering", statusKey: "userStatuses.active", email: "david.brown@company.com", lastLogin: "2026-03-12", avatar: "DB", permissions: 3, joinDate: "2026-09-01" },
  ];
  const initialUsers = isPM ? pmInitialUsers : directorInitialUsers;
  const [users, setUsers] = useState(initialUsers);
  React.useEffect(() => { setUsers(initialUsers); }, [isPM]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    displayName: "",
    email: "",
    roleKey: "roles.employee",
    departmentKey: "departments.engineering",
    statusKey: "userStatuses.active",
  });

  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    const name = newUser.displayName.trim();
    const email = newUser.email.trim();
    if (!name || !email) return;
    const nextId = Math.max(0, ...users.map((u) => u.id)) + 1;
    const initials = name.split(/\s+/).map((s) => s[0]).join("").toUpperCase().slice(0, 2);
    const joinDate = new Date().toISOString().slice(0, 10);
    setUsers((prev) => [
      ...prev,
      {
        id: nextId,
        nameKey: "demoUsers.newUser",
        displayName: name,
        roleKey: newUser.roleKey,
        departmentKey: newUser.departmentKey,
        statusKey: newUser.statusKey,
        email,
        lastLogin: "—",
        avatar: initials,
        permissions: 3,
        joinDate,
      },
    ]);
    setShowAddUserModal(false);
    setNewUser({ displayName: "", email: "", roleKey: "roles.employee", departmentKey: "departments.engineering", statusKey: "userStatuses.active" });
  };

  const roles = isPM ? ["Proposal Manager", "Capture Manager", "Proposal Writer", "Technical Lead", "Pricing Lead", "Compliance Specialist"] : ["director", "dean", "hod", "team", "employee", "admin"];

  // Demo data for user metrics using translation keys
  const userMetrics = [
    {
      id: 1,
      titleKey: 'metrics.totalUsers',
      value: '245',
      change: '+12',
      trend: 'up',
      icon: FiUsers,
      color: 'blue'
    },
    {
      id: 2,
      titleKey: 'metrics.activeUsers',
      value: '230',
      change: '+8',
      trend: 'up',
      icon: FiUserCheck,
      color: 'green'
    },
    {
      id: 3,
      titleKey: 'metrics.newUsers',
      value: '15',
      change: '+5',
      trend: 'up',
      icon: FiUserPlus,
      color: 'purple'
    },
    {
      id: 4,
      titleKey: 'metrics.avgActivity',
      value: '85%',
      change: '+2%',
      trend: 'up',
      icon: FiTrendingUp,
      color: 'orange'
    }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      case 'pending': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'suspended': return 'text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'director': return <FiAward className="w-4 h-4" />; // Changed from FiCrown to FiAward
      case 'dean': return <FiAward className="w-4 h-4" />;
      case 'hod': return <FiShield className="w-4 h-4" />;
      case 'team': return <FiBookOpen className="w-4 h-4" />;
      case 'faculty': return <FiBookOpen className="w-4 h-4" />;
      case 'employee': return <FiUser className="w-4 h-4" />;
      case 'student': return <FiUser className="w-4 h-4" />;
      case 'admin': return <FiSettings className="w-4 h-4" />;
      default: return <FiUser className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'director': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400';
      case 'dean': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
      case 'hod': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      case 'team': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400';
      case 'faculty': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400';
      case 'employee': return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400';
      case 'student': return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400';
      case 'admin': return 'text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'up': return <FiTrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <FiTrendingDown className="w-4 h-4 text-red-500" />;
      default: return <FiMinus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getUserDisplayName = (u) => (isPM && u.name) ? u.name : (u.displayName ?? t(`userManagement.${u.nameKey}`));
  const filteredUsers = users.filter(u => {
    const roleMatch = !roleFilter || (isPM ? u.role === roleFilter : u.roleKey === `roles.${roleFilter}`);
    const statusMatch = statusFilter === "all" || u.statusKey === `userStatuses.${statusFilter}`;
    const searchMatch = getUserDisplayName(u).toLowerCase().includes(search.toLowerCase()) ||
                      (u.email || "").toLowerCase().includes(search.toLowerCase());
    return roleMatch && statusMatch && searchMatch;
  });

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  return (
    <div className="w-full">
      <main className="w-full space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          data-tour="1"
          data-tour-title-en="User Management Overview"
          data-tour-title-ar="نظرة عامة على إدارة المستخدمين"
          data-tour-content-en="Track user metrics, filter by role, search, and manage users."
          data-tour-content-ar="تتبع مقاييس المستخدمين، وصَفِّ حسب الدور، وابحث، وأدر المستخدمين."
          data-tour-position="bottom"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <FiUsers className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                {isPM ? "Proposal Team Access" : t('userManagement.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {isPM ? "Roles, permissions, and access for proposal and capture team." : t('userManagement.subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Users</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">245</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">Active</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">230</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* User Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          data-tour="2"
          data-tour-title-en="User Metrics"
          data-tour-title-ar="مقاييس المستخدمين"
          data-tour-content-en="Key user stats: total, active, new, and activity levels."
          data-tour-content-ar="إحصاءات المستخدمين الرئيسية: الإجمالي، النشط، الجديد، ومستويات النشاط."
          data-tour-position="bottom"
        >
          {userMetrics.map((metric) => (
            <div key={metric.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{metric.value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {t(`userManagement.${metric.titleKey}`)}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {getTrendIcon(metric.trend)}
                    <span className={`text-sm font-medium ${
                      metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl bg-${metric.color}-50 dark:bg-${metric.color}-900/20`}>
                  <metric.icon className={`w-6 h-6 text-${metric.color}-600 dark:text-${metric.color}-400`} />
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* User Filters */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          data-tour="3"
          data-tour-title-en="Filters & Actions"
          data-tour-title-ar="المرشحات والإجراءات"
          data-tour-content-en="Filter by role, search by name/email, and add new users."
          data-tour-content-ar="صَفِّ حسب الدور، وابحث بالاسم/البريد، وأضف مستخدمين جدد."
          data-tour-position="bottom"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                placeholder={t('userManagement.searchPlaceholder')} 
              />
            </div>
            <select 
              value={roleFilter} 
              onChange={e => setRoleFilter(e.target.value)} 
              className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">{t('userManagement.allRoles')}</option>
              {roles.map(r => (
                <option key={r} value={r}>
                  {t(`userManagement.roles.${r}`)}
                </option>
              ))}
            </select>
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)} 
              className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddUserModal(true)}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <FiUserPlus className="w-4 h-4" />
                {t('userManagement.addUser')}
              </button>
              <button className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2">
                <FiDownload className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </motion.section>

        {/* User List */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          data-tour="4"
          data-tour-title-en="User List"
          data-tour-title-ar="قائمة المستخدمين"
          data-tour-content-en="Browse users, check roles and status, and edit user details."
          data-tour-content-ar="تصفح المستخدمين، راجع الأدوار والحالة، وعدّل تفاصيل المستخدم."
          data-tour-position="bottom"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FiUsers className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Users ({filteredUsers.length})
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSelectAll}
                className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedUsers.length > 0 && (
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2">
                  <FiUserX className="w-4 h-4" />
                  Remove ({selectedUsers.length})
                </button>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            {filteredUsers.map((u, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <input 
                      type="checkbox" 
                      checked={selectedUsers.includes(u.id)}
                      onChange={() => handleSelectUser(u.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                      {u.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {getUserDisplayName(u)}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(u.statusKey.split('.').pop())}`}>
                          {t(`userManagement.${u.statusKey}`)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mb-2">
                        <div className="flex items-center gap-1">
                          {getRoleIcon(isPM ? u.role?.replace(/\s+/g, '') : u.roleKey?.split('.').pop())}
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${getRoleColor(isPM ? (u.role?.replace(/\s+/g, '').toLowerCase()) : u.roleKey?.split('.').pop())}`}>
                            {isPM ? u.role : t(`userManagement.${u.roleKey}`)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FiMail className="w-4 h-4" />
                          {u.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <FiClock className="w-4 h-4" />
                          Last login: {u.lastLogin}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>Department: {isPM ? u.department : (u.displayDepartment ?? t(`userManagement.${u.departmentKey}`))}</span>
                        <span>Permissions: {u.permissions}</span>
                        <span>Joined: {u.joinDate}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <FiEye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                      <FiEdit3 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                      <FiMoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {showAddUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setShowAddUserModal(false)} />
            <div className="relative z-10 bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('userManagement.addUser')}</h2>
                <button type="button" onClick={() => setShowAddUserModal(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl font-bold" aria-label="Close">&times;</button>
              </div>
              <form onSubmit={handleAddUserSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                  <input type="text" required value={newUser.displayName} onChange={(e) => setNewUser((p) => ({ ...p, displayName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                  <input type="email" required value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="email@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                  <select value={newUser.roleKey} onChange={(e) => setNewUser((p) => ({ ...p, roleKey: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    {roles.map((r) => <option key={r} value={`roles.${r}`}>{t(`userManagement.roles.${r}`)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                  <select value={newUser.departmentKey} onChange={(e) => setNewUser((p) => ({ ...p, departmentKey: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    <option value="departments.engineering">{t('userManagement.departments.engineering')}</option>
                    <option value="departments.science">{t('userManagement.departments.science')}</option>
                    <option value="departments.math">{t('userManagement.departments.math')}</option>
                    <option value="departments.computer">{t('userManagement.departments.computer')}</option>
                    <option value="departments.eee">{t('userManagement.departments.eee')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select value={newUser.statusKey} onChange={(e) => setNewUser((p) => ({ ...p, statusKey: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    <option value="userStatuses.active">{t('userManagement.userStatuses.active')}</option>
                    <option value="userStatuses.inactive">{t('userManagement.userStatuses.inactive')}</option>
                    <option value="userStatuses.pending">{t('userManagement.userStatuses.pending')}</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddUserModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add User</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}