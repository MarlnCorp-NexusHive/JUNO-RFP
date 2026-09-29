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
  FiTrendingUp, 
  FiTrendingDown, 
  FiMinus,
  FiDownload,
  FiUpload,
  FiSettings,
  FiUser,
  FiUserX,
  FiAward, // Changed from FiCrown to FiAward
  FiBookOpen,
  FiTarget,
  FiZap
} from "react-icons/fi";
import { isTrialUserSession } from "../../rfp-collaboration/useTrialCollabT.js";
import { loadTrialFeatureData, persistTrialFeatureData, canUseTrialFeatures } from "../../../services/trialFeatureApi.js";
import { fetchTrialMembers } from "../../../services/api.js";
import { getTrialSession } from "../../../services/trialAuthSession.js";
import { syncTeamMembersFromCompanyRoster } from "../../proposal-manager/services/companyUserRoster.js";
import {
  mapSignupMemberToCard,
  mergeSignupMembers,
} from "../../proposal-manager/services/companyUserRoster.js";


export default function DirectorUserManagement() {
  const location = useLocation();
  const isPM = location.pathname.includes("/app/user-management");
  const isTrialPm = isPM && isTrialUserSession();
  const user = JSON.parse(localStorage.getItem('rbac_current_user'));
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const { t, ready, i18n } = useTranslation('director');
  const { isRTLMode } = useLocalization();
  const isArabic = String(i18n?.resolvedLanguage || i18n?.language || "").toLowerCase().startsWith("ar");
  const pmText = (value) => {
    if (!isPM || !isArabic) return value;
    const map = {
      "Loading...": "جارٍ التحميل...",
      "Proposal Team Access": "صلاحيات فريق العروض",
      "Roles, permissions, and access for proposal and capture team.": "الأدوار والصلاحيات والوصول لفريق العروض والالتقاط.",
      "Total Users": "إجمالي المستخدمين",
      Active: "نشط",
      "All Status": "كل الحالات",
      Inactive: "غير نشط",
      Pending: "قيد الانتظار",
      Export: "تصدير",
      Users: "المستخدمون",
      "Deselect All": "إلغاء تحديد الكل",
      "Select All": "تحديد الكل",
      Remove: "إزالة",
      "Last login:": "آخر تسجيل دخول:",
      Department: "القسم",
      Permissions: "الصلاحيات",
      Joined: "تاريخ الانضمام",
      Close: "إغلاق",
      Name: "الاسم",
      "Full name": "الاسم الكامل",
      Email: "البريد الإلكتروني",
      Role: "الدور",
      Status: "الحالة",
      Cancel: "إلغاء",
      "Add User": "إضافة مستخدم",
      "Edit User": "تعديل المستخدم",
      Edit: "تعديل",
      Save: "حفظ",
      "Proposal Manager": "مدير العروض",
      "Capture Manager": "مدير الالتقاط",
      "Proposal Writer": "كاتب العروض",
      "Technical Lead": "القائد التقني",
      "Pricing Lead": "قائد التسعير",
      "Compliance Specialist": "أخصائي الامتثال",
      Proposals: "العروض",
      Capture: "الالتقاط",
      Pricing: "التسعير",
      Technical: "تقني",
      Compliance: "الامتثال",
      Operations: "العمليات",
      "Other (custom)": "أخرى (مخصص)",
      "Enter department name": "أدخل اسم القسم",
      You: "أنت",
      "Signed up": "مسجّل",
    };
    return map[value] || value;
  };

  // Show loading state if i18n is not ready
  if (!ready) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{pmText("Loading...")}</h1>
          </div>
        </main>
      </div>
    );
  }

  const pmInitialUsers = [
    { id: 1, name: "Michael Anderson", role: "Proposal Manager", department: "Proposals", statusKey: "userStatuses.active", email: "michael.anderson@company.com", lastLogin: "2026-09-10", avatar: "MA", permissions: 12, joinDate: "2026-09-15" },
    { id: 2, name: "David Reynolds", role: "Capture Manager", department: "Capture", statusKey: "userStatuses.active", email: "david.reynolds@company.com", lastLogin: "2026-09-09", avatar: "DR", permissions: 10, joinDate: "2026-10-20" },
    { id: 3, name: "Sarah Chen", role: "Proposal Writer", department: "Proposals", statusKey: "userStatuses.active", email: "sarah.chen@company.com", lastLogin: "2026-09-11", avatar: "SC", permissions: 6, joinDate: "2026-09-01" },
    { id: 4, name: "James Wilson", role: "Technical Lead", department: "Proposals", statusKey: "userStatuses.active", email: "james.wilson@company.com", lastLogin: "2026-09-08", avatar: "JW", permissions: 8, joinDate: "2026-10-15" },
    { id: 5, name: "Emily Martinez", role: "Pricing Lead", department: "Proposals", statusKey: "userStatuses.inactive", email: "emily.martinez@company.com", lastLogin: "2026-09-28", avatar: "EM", permissions: 7, joinDate: "2026-09-10" },
  ];
  const directorInitialUsers = [
    { id: 1, nameKey: "demoUsers.johnDoe", roleKey: "roles.dean", departmentKey: "departments.science", statusKey: "userStatuses.active", email: "john.doe@company.com", lastLogin: "2026-09-10", avatar: "JD", permissions: 12, joinDate: "2026-09-15" },
    { id: 2, nameKey: "demoUsers.janeSmith", roleKey: "roles.hod", departmentKey: "departments.eee", statusKey: "userStatuses.active", email: "jane.smith@company.com", lastLogin: "2026-09-09", avatar: "JS", permissions: 8, joinDate: "2026-09-20" },
    { id: 3, nameKey: "demoUsers.mikeJohnson", roleKey: "roles.faculty", departmentKey: "departments.math", statusKey: "userStatuses.inactive", email: "mike.johnson@company.com", lastLogin: "2026-09-28", avatar: "MJ", permissions: 5, joinDate: "2026-10-10" },
    { id: 4, nameKey: "demoUsers.sarahWilson", roleKey: "roles.faculty", departmentKey: "departments.computer", statusKey: "userStatuses.active", email: "sarah.wilson@company.com", lastLogin: "2026-09-11", avatar: "SW", permissions: 6, joinDate: "2026-09-15" },
    { id: 5, nameKey: "demoUsers.davidBrown", roleKey: "roles.student", departmentKey: "departments.engineering", statusKey: "userStatuses.active", email: "david.brown@company.com", lastLogin: "2026-09-12", avatar: "DB", permissions: 3, joinDate: "2026-09-01" },
  ];
  const initialUsers = isTrialPm ? [] : isPM ? pmInitialUsers : directorInitialUsers;
  /** Manual roster (Add User) — trial persists under tenant feature store. */
  const [users, setUsers] = useState(initialUsers);
  /** Real trial signup accounts for this company tenant. */
  const [signupMembers, setSignupMembers] = useState([]);
  const [signupTotals, setSignupTotals] = useState({ totalUsers: 0, newUsers: 0 });
  const [usersReady, setUsersReady] = useState(!isTrialPm);

  const persistUsers = React.useCallback(
    (nextUsers) => {
      if (!isTrialPm || !canUseTrialFeatures()) return;
      const manualOnly = (Array.isArray(nextUsers) ? nextUsers : []).filter((u) => u?.source !== "signup");
      void persistTrialFeatureData("userManagement", { users: manualOnly });
    },
    [isTrialPm],
  );

  const hydrateUsers = React.useCallback(async () => {
    if (!isTrialPm) return;
    let membersRes = null;
    try {
      membersRes = canUseTrialFeatures() ? await fetchTrialMembers() : null;
    } catch (err) {
      console.warn("[user-management] members fetch failed:", err?.message || err);
      membersRes = null;
    }
    const data = await loadTrialFeatureData("userManagement", { users: [] });
    const manual = (Array.isArray(data?.users) ? data.users : []).map((u) => ({
      ...u,
      source: u.source === "signup" ? "manual" : u.source || "manual",
    }));
    setUsers(manual);

    const mergedMembers = mergeSignupMembers(membersRes?.ok ? membersRes.members : []);
    setSignupMembers(mergedMembers);

    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const newCount = mergedMembers.filter((m) => {
      const t = Date.parse(m.createdAt || m.emailVerifiedAt || "");
      return Number.isFinite(t) && now - t <= weekMs;
    }).length;

    setSignupTotals({
      totalUsers: mergedMembers.length,
      newUsers: newCount,
    });
    setUsersReady(true);
    // Keep Manage Team "Team Members" aligned with Total Users
    void syncTeamMembersFromCompanyRoster().catch(() => {});
  }, [isTrialPm]);

  React.useEffect(() => {
    if (!isTrialPm) {
      setUsers(initialUsers);
      setSignupMembers([]);
      setSignupTotals({ totalUsers: 0, newUsers: 0 });
      setUsersReady(true);
      return undefined;
    }
    let cancelled = false;
    setUsersReady(false);
    (async () => {
      await hydrateUsers();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPM, isTrialPm]);

  // Persist only after hydrate so an empty initial state does not wipe tenant data.
  React.useEffect(() => {
    if (!isTrialPm || !usersReady || !canUseTrialFeatures()) return;
    persistUsers(users);
  }, [users, isTrialPm, usersReady, persistUsers]);

  // Pull latest company roster when returning to the tab (shared across same tenant).
  React.useEffect(() => {
    if (!isTrialPm) return undefined;
    const onFocus = () => {
      void hydrateUsers();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") onFocus();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    const poll = window.setInterval(() => {
      void hydrateUsers();
    }, 20_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(poll);
    };
  }, [isTrialPm, hydrateUsers]);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [newUser, setNewUser] = useState({
    displayName: "",
    email: "",
    roleKey: "roles.employee",
    departmentKey: "departments.engineering",
    department: "Proposals",
    customDepartment: "",
    statusKey: "userStatuses.active",
  });

  const resetUserForm = () => {
    setEditingUserId(null);
    setNewUser({
      displayName: "",
      email: "",
      roleKey: "roles.employee",
      departmentKey: "departments.engineering",
      department: "Proposals",
      customDepartment: "",
      statusKey: "userStatuses.active",
    });
  };

  const openAddUser = () => {
    resetUserForm();
    setShowAddUserModal(true);
  };

  const openEditUser = (u) => {
    if (u?.source === "signup") return;
    let display = "";
    if (isPM && u.name) display = u.name;
    else if (u.displayName) display = u.displayName;
    else if (u.name) display = u.name;
    else if (u.nameKey) {
      try {
        display = t(`userManagement.${u.nameKey}`);
      } catch {
        display = "";
      }
    }
    if (!display) display = String(u.email || "").split("@")[0];
    const dept = u.department || "Proposals";
    const isPreset = ["Proposals", "Capture", "Pricing", "Technical", "Compliance", "Operations"].includes(dept);
    setEditingUserId(u.id);
    setNewUser({
      displayName: display,
      email: u.email || "",
      roleKey: u.roleKey || "roles.employee",
      departmentKey: u.departmentKey || "departments.engineering",
      department: isPreset ? dept : "__custom__",
      customDepartment: isPreset ? "" : dept,
      statusKey: u.statusKey || "userStatuses.active",
    });
    setShowAddUserModal(true);
  };

  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    const name = newUser.displayName.trim();
    const email = newUser.email.trim();
    if (!name || !email) return;
    const initials = name.split(/\s+/).map((s) => s[0]).join("").toUpperCase().slice(0, 2);
    const customDept = String(newUser.customDepartment || "").trim();
    if (isPM && newUser.department === "__custom__" && !customDept) return;
    const department = isPM
      ? newUser.department === "__custom__"
        ? customDept
        : newUser.department || "Proposals"
      : undefined;

    const emailNorm = email.toLowerCase();
    const signupEmails = new Set(
      signupMembers.map((m) => String(m.email || "").toLowerCase()).filter(Boolean),
    );
    if (isTrialPm && signupEmails.has(emailNorm)) return;
    if (users.some((u) => String(u.email || "").toLowerCase() === emailNorm && u.id !== editingUserId)) {
      return;
    }

    if (editingUserId != null) {
      setUsers((prev) => {
        const next = prev.map((u) =>
          u.id === editingUserId
            ? {
                ...u,
                source: "manual",
                displayName: name,
                name,
                email,
                avatar: initials,
                department: isPM ? department : u.department,
                departmentKey: isPM ? u.departmentKey : newUser.departmentKey,
                updatedAt: new Date().toISOString(),
              }
            : u
        );
        persistUsers(next);
        void syncTeamMembersFromCompanyRoster().catch(() => {});
        return next;
      });
    } else {
      const nextId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const joinDate = new Date().toISOString().slice(0, 10);
      setUsers((prev) => {
        const next = [
          ...prev,
          {
            id: nextId,
            source: "manual",
            nameKey: "demoUsers.newUser",
            displayName: name,
            name,
            role: isPM ? "Proposal Manager" : undefined,
            roleKey: isPM ? "roles.employee" : "roles.employee",
            department,
            departmentKey: isPM ? undefined : newUser.departmentKey,
            statusKey: "userStatuses.active",
            email,
            lastLogin: "—",
            avatar: initials,
            permissions: 3,
            joinDate,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        persistUsers(next);
        void syncTeamMembersFromCompanyRoster().catch(() => {});
        return next;
      });
    }
    setShowAddUserModal(false);
    resetUserForm();
  };

  const handleRemoveSelected = () => {
    if (selectedUsers.length === 0) return;
    // Signup accounts stay; only remove manually added roster rows.
    setUsers((prev) => {
      const next = prev.filter((u) => !selectedUsers.includes(u.id));
      persistUsers(next);
      void syncTeamMembersFromCompanyRoster().catch(() => {});
      return next;
    });
    setSelectedUsers([]);
  };

  const roles = isPM ? ["Proposal Manager", "Capture Manager", "Proposal Writer", "Technical Lead", "Pricing Lead", "Compliance Specialist"] : ["director", "dean", "hod", "team", "employee", "admin"];
  const pmDepartments = ["Proposals", "Capture", "Pricing", "Technical", "Compliance", "Operations"];
  const learnedDepartments = Array.from(
    new Set(
      users
        .map((u) => String(u.department || "").trim())
        .filter((d) => d && !pmDepartments.includes(d))
    )
  ).sort((a, b) => a.localeCompare(b));
  const pmDepartmentOptions = [...pmDepartments, ...learnedDepartments];
  const directorDepartments = [
    { key: "departments.engineering", labelKey: "userManagement.departments.engineering" },
    { key: "departments.science", labelKey: "userManagement.departments.science" },
    { key: "departments.math", labelKey: "userManagement.departments.math" },
    { key: "departments.computer", labelKey: "userManagement.departments.computer" },
    { key: "departments.eee", labelKey: "userManagement.departments.eee" },
    { key: "departments.business", labelKey: "userManagement.departments.business" },
  ];

  const rosterUsers = React.useMemo(() => {
    if (!isTrialPm) return users;
    const session = getTrialSession();
    const selfEmail = String(session?.user?.email || "").toLowerCase();
    const signupCards = signupMembers.map((m) => {
      const card = mapSignupMemberToCard(m);
      const isSelf =
        (selfEmail && String(card.email || "").toLowerCase() === selfEmail) ||
        String(card.id) === String(session?.user?.id || "");
      return { ...card, isSelf };
    });
    // Current viewer first, then other signups, then Add User rows.
    signupCards.sort((a, b) => Number(b.isSelf) - Number(a.isSelf));
    const signupEmails = new Set(
      signupCards.map((u) => String(u.email || "").toLowerCase()).filter(Boolean),
    );
    const manualCards = users
      .filter((u) => u?.source !== "signup")
      .filter((u) => !signupEmails.has(String(u.email || "").toLowerCase()))
      .map((u) => ({ ...u, source: "manual", isSelf: false }));
    return [...signupCards, ...manualCards];
  }, [isTrialPm, signupMembers, users]);

  // Total Users mirrors the Users list (signups on this tenant + Add User rows).
  const trialTotalUsers = isTrialPm ? rosterUsers.length : users.length;
  const trialNewUsers = isTrialPm ? signupTotals.newUsers : 0;

  // Demo data for user metrics using translation keys (trial derives from live user list)
  const userMetrics = isTrialPm
    ? [
        {
          id: 1,
          titleKey: "metrics.totalUsers",
          value: String(trialTotalUsers),
          change: "—",
          trend: "flat",
          icon: FiUsers,
          color: "blue",
        },
        {
          id: 2,
          titleKey: "metrics.newUsers",
          value: String(trialNewUsers),
          change: "—",
          trend: "flat",
          icon: FiUserPlus,
          color: "purple",
        },
      ]
    : [
        {
          id: 1,
          titleKey: "metrics.totalUsers",
          value: "245",
          change: "+12",
          trend: "up",
          icon: FiUsers,
          color: "blue",
        },
        {
          id: 2,
          titleKey: "metrics.newUsers",
          value: "15",
          change: "+5",
          trend: "up",
          icon: FiUserPlus,
          color: "purple",
        },
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
  const filteredUsers = rosterUsers.filter(u => {
    const roleMatch = !roleFilter || (isPM ? u.role === roleFilter : u.roleKey === `roles.${roleFilter}`);
    const statusMatch = statusFilter === "all" || u.statusKey === `userStatuses.${statusFilter}`;
    const searchMatch = getUserDisplayName(u).toLowerCase().includes(search.toLowerCase()) ||
                      (u.email || "").toLowerCase().includes(search.toLowerCase());
    return roleMatch && statusMatch && searchMatch;
  });
  const removableSelectedCount = selectedUsers.filter((id) =>
    filteredUsers.some((u) => u.id === id && u.source !== "signup"),
  ).length;

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
                {isPM ? pmText("Proposal Team Access") : t('userManagement.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {isPM ? pmText("Roles, permissions, and access for proposal and capture team.") : t('userManagement.subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">{t('userManagement.metrics.totalUsers')}</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {isTrialPm ? trialTotalUsers : 245}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* User Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          data-tour="2"
          data-tour-title-en="User Metrics"
          data-tour-title-ar="مقاييس المستخدمين"
          data-tour-content-en="Key user stats: total and new users."
          data-tour-content-ar="إحصاءات المستخدمين الرئيسية: الإجمالي والجديد."
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
            {!isTrialPm && (
              <select 
                value={roleFilter} 
                onChange={e => setRoleFilter(e.target.value)} 
                className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">{t('userManagement.allRoles')}</option>
                {roles.map(r => (
                  <option key={r} value={r}>
                    {isPM ? pmText(r) : t(`userManagement.roles.${r}`)}
                  </option>
                ))}
              </select>
            )}
            {!isTrialPm && (
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)} 
                className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="all">{pmText("All Status")}</option>
                <option value="active">{t('userManagement.userStatuses.active')}</option>
                <option value="inactive">{t('userManagement.userStatuses.inactive')}</option>
                <option value="pending">{t('userManagement.userStatuses.pending')}</option>
              </select>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openAddUser}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <FiUserPlus className="w-4 h-4" />
                {t('userManagement.addUser')}
              </button>
              {!isTrialPm && (
                <button className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2">
                  <FiDownload className="w-4 h-4" />
                  {pmText("Export")}
                </button>
              )}
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
                {pmText("Users")} ({filteredUsers.length})
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSelectAll}
                className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {selectedUsers.length === filteredUsers.length ? pmText('Deselect All') : pmText('Select All')}
              </button>
              {removableSelectedCount > 0 && (
                <button
                  type="button"
                  onClick={handleRemoveSelected}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <FiUserX className="w-4 h-4" />
                  {pmText("Remove")} ({removableSelectedCount})
                </button>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            {filteredUsers.length === 0 && isTrialPm && (
              <p className="col-span-full text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
                {pmText("No users yet. Add your first team member to manage roles and access.")}
              </p>
            )}
            {filteredUsers.map((u) => (
              <div key={u.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
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
                        {u.isSelf ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            {pmText("You")}
                          </span>
                        ) : null}
                        {u.source === "signup" && !u.isSelf ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {pmText("Signed up")}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mb-2">
                        <div className="flex items-center gap-1">
                          {getRoleIcon(isPM ? u.role?.replace(/\s+/g, '') : u.roleKey?.split('.').pop())}
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${getRoleColor(isPM ? (u.role?.replace(/\s+/g, '').toLowerCase()) : u.roleKey?.split('.').pop())}`}>
                            {isPM ? pmText(u.role) : t(`userManagement.${u.roleKey}`)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FiMail className="w-4 h-4" />
                          {u.email}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{pmText("Department")}: {isPM ? pmText(u.department) : (u.displayDepartment ?? t(`userManagement.${u.departmentKey}`))}</span>
                        <span>{pmText("Joined")}: {u.joinDate}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {u.source !== "signup" && (
                      <button
                        type="button"
                        onClick={() => openEditUser(u)}
                        className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                        aria-label={pmText("Edit")}
                        title={pmText("Edit")}
                      >
                        <FiEdit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {showAddUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => { setShowAddUserModal(false); resetUserForm(); }} />
            <div className="relative z-10 bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingUserId != null ? pmText("Edit User") : t('userManagement.addUser')}
                </h2>
                <button type="button" onClick={() => { setShowAddUserModal(false); resetUserForm(); }} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl font-bold" aria-label={pmText("Close")}>&times;</button>
              </div>
              <form onSubmit={handleAddUserSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{pmText("Name")} *</label>
                  <input type="text" required value={newUser.displayName} onChange={(e) => setNewUser((p) => ({ ...p, displayName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder={pmText("Full name")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{pmText("Email")} *</label>
                  <input type="email" required value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="email@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{pmText("Department")}</label>
                  {isPM ? (
                    <div className="space-y-2">
                      <select
                        value={
                          newUser.department === "__custom__" || pmDepartmentOptions.includes(newUser.department)
                            ? newUser.department
                            : "__custom__"
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewUser((p) => ({
                            ...p,
                            department: value,
                            customDepartment: value === "__custom__" ? p.customDepartment : "",
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        {pmDepartmentOptions.map((dept) => (
                          <option key={dept} value={dept}>
                            {pmText(dept)}
                          </option>
                        ))}
                        <option value="__custom__">{pmText("Other (custom)")}</option>
                      </select>
                      {newUser.department === "__custom__" && (
                        <input
                          type="text"
                          required
                          value={newUser.customDepartment}
                          onChange={(e) => setNewUser((p) => ({ ...p, customDepartment: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder={pmText("Enter department name")}
                        />
                      )}
                    </div>
                  ) : (
                    <select
                      value={newUser.departmentKey}
                      onChange={(e) => setNewUser((p) => ({ ...p, departmentKey: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      {directorDepartments.map((dept) => (
                        <option key={dept.key} value={dept.key}>
                          {t(dept.labelKey)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowAddUserModal(false); resetUserForm(); }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">{pmText("Cancel")}</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    {editingUserId != null ? pmText("Save") : pmText("Add User")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}