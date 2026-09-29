import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  FiInfo, 
  FiExternalLink, 
  FiUserCheck, 
  FiUsers, 
  FiSettings, 
  FiClipboard, 
  FiBarChart2, 
  FiBookOpen, 
  FiMessageCircle, 
  FiAlertCircle, 
  FiCalendar, 
  FiTarget,
  FiPlus,
  FiDownload,
  FiEdit,
  FiEye,
  FiTrendingUp,
  FiAward,
  FiShield,
  FiClock,
  FiCheckCircle,
  FiStar,
  FiFileText,
  FiTrash2
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useLocalization } from "../../../hooks/useLocalization";
import { canUseTrialFeatures } from "../../../services/trialFeatureApi.js";
import {
  getTeamData,
  subscribeTeam,
  updateTeamMember,
  addTeamTraining,
  removeTeamTraining,
  addTeamAssignment,
  updateTeamAssignment,
  removeTeamAssignment,
  hydrateTeamFromServer,
} from "../../proposal-manager/services/teamStore.js";
import {
  loadCompanyUserRoster,
  syncTeamMembersFromCompanyRoster,
  addCompanyTeamPerson,
  removeCompanyTeamPerson,
  subscribeUserRoster,
  upsertManualUserManagementUser,
} from "../../proposal-manager/services/companyUserRoster.js";
// Proposal Manager team roles (Team Structure & Hierarchy)
const PROPOSAL_MANAGER_ROLES = [
  "Capture Manager",
  "Proposal Manager",
  "Proposal Writer",
  "Technical Lead / Solution Architect",
  "Pricing Lead",
  "Compliance Specialist",
  "Graphics",
  "Sub contractors",
];

// Initial demo data for proposal manager team (all 12 names)
const proposalManagerInitialMembers = [
  { id: 1, name: "Michael Anderson", role: "Capture Manager", email: "michael.anderson@example.com", phone: "+1 234 567 801", performance: 94, status: "Active", avatar: "👨‍💼", skills: ["Capture Planning", "Win Strategy"], projects: ["DoD IT Services", "GSA BPA"] },
  { id: 2, name: "David Reynolds", role: "Proposal Manager", email: "david.reynolds@example.com", phone: "+1 234 567 802", performance: 91, status: "Active", avatar: "👨‍💼", skills: ["Proposal Leadership", "Compliance"], projects: ["DoD IT Services", "NASA Follow-on"] },
  { id: 3, name: "Jennifer Thompson", role: "Proposal Writer", email: "jennifer.thompson@example.com", phone: "+1 234 567 803", performance: 88, status: "Active", avatar: "👩‍💼", skills: ["Technical Writing", "Past Performance"], projects: ["DoD IT Services"] },
  { id: 4, name: "Patricia Sullivan", role: "Technical Lead / Solution Architect", email: "patricia.sullivan@example.com", phone: "+1 234 567 804", performance: 90, status: "Active", avatar: "👩‍💼", skills: ["Solution Design", "Architecture"], projects: ["DoD IT Services", "DHS Recompete"] },
  { id: 5, name: "Robert Mitchell", role: "Pricing Lead", email: "robert.mitchell@example.com", phone: "+1 234 567 805", performance: 89, status: "Active", avatar: "👨‍💼", skills: ["Cost Volume", "Pricing Strategy"], projects: ["GSA BPA", "NASA Follow-on"] },
  { id: 6, name: "Karen Brooks", role: "Compliance Specialist", email: "karen.brooks@example.com", phone: "+1 234 567 806", performance: 92, status: "Active", avatar: "👩‍💼", skills: ["FAR/DFARS", "Compliance Review"], projects: ["DoD IT Services", "DHS Recompete"] },
  { id: 7, name: "Emily Parker", role: "Graphics", email: "emily.parker@example.com", phone: "+1 234 567 807", performance: 87, status: "Active", avatar: "👩‍💼", skills: ["Design", "Formatting"], projects: ["DoD IT Services", "GSA BPA"] },
  { id: 8, name: "Ashley Morgan", role: "Sub contractors", email: "ashley.morgan@example.com", phone: "+1 234 567 808", performance: 85, status: "Active", avatar: "👩‍💼", skills: ["Specialty Support"], projects: ["DHS Recompete"] },
  { id: 9, name: "Nicole Harrison", role: "Proposal Writer", email: "nicole.harrison@example.com", phone: "+1 234 567 809", performance: 86, status: "Active", avatar: "👩‍💼", skills: ["Past Performance", "Executive Summary"], projects: ["NASA Follow-on"] },
  { id: 10, name: "Stephanie Grant", role: "Compliance Specialist", email: "stephanie.grant@example.com", phone: "+1 234 567 810", performance: 90, status: "Active", avatar: "👩‍💼", skills: ["Proposal Compliance", "Checklists"], projects: ["GSA BPA"] },
  { id: 11, name: "Brian Foster", role: "Technical Lead / Solution Architect", email: "brian.foster@example.com", phone: "+1 234 567 811", performance: 88, status: "Active", avatar: "👨‍💼", skills: ["Technical Approach", "Integration"], projects: ["DHS Recompete"] },
  { id: 12, name: "Jonathan Blake", role: "Sub contractors", email: "jonathan.blake@example.com", phone: "+1 234 567 812", performance: 84, status: "Active", avatar: "👨‍💼", skills: ["Specialty Support"], projects: ["DoD IT Services"] },
];

// Initial demo data for team members (marketing head)
const initialTeamMembers = [
  {
    id: 1,
    name: "Abdullah Al-Rashid",
    role: "Campaign Manager",
    email: "abdullah.alrashid@mbsc.edu.sa",
    phone: "+1 234 567 890",
    performance: 92,
    status: "Active",
    avatar: "👨‍💼",
    skills: ["Digital Marketing", "Content Strategy", "Social Media"],
    projects: ["Q2 Campaign", "Brand Refresh"],
  },
  {
    id: 2,
    name: "Noura Al-Zahra",
    role: "Content Strategist",
    email: "noura.alzahra@mbsc.edu.sa",
    phone: "+1 234 567 891",
    performance: 88,
    status: "Active",
    avatar: "👩‍💼",
    skills: ["Content Creation", "SEO", "Copywriting"],
    projects: ["Blog Series", "Email Campaign"],
  },
  {
    id: 3,
    name: "Khalid Al-Sayed",
    role: "Digital Marketer",
    email: "khalid.alsayed@mbsc.edu.sa",
    phone: "+1 234 567 892",
    performance: 85,
    status: "On Leave",
    avatar: "👨‍💼",
    skills: ["Social Media", "Community Management", "Analytics"],
    projects: ["Social Campaign", "Influencer Outreach"],
  },
];

// Demo data for performance metrics (marketing)
const performanceMetrics = [
  { metric: "Lead Generation", target: 1000, achieved: 850, icon: FiTrendingUp, color: "blue" },
  { metric: "Conversion Rate", target: 35, achieved: 32, icon: FiTarget, color: "green" },
  { metric: "Campaign ROI", target: 300, achieved: 285, icon: FiBarChart2, color: "purple" },
  { metric: "Social Engagement", target: 5000, achieved: 4800, icon: FiUsers, color: "yellow" },
];

// Proposal manager team metrics
const proposalManagerMetrics = [
  { metric: "Active Proposals", target: 12, achieved: 10, icon: FiFileText, color: "blue" },
  { metric: "Win Rate %", target: 40, achieved: 38, icon: FiTarget, color: "green" },
  { metric: "Compliance Score", target: 100, achieved: 94, icon: FiShield, color: "purple" },
  { metric: "On-Time Submissions", target: 10, achieved: 9, icon: FiCheckCircle, color: "yellow" },
];

export default function MarketingHeadTeamManagement() {
  const { t, ready, i18n } = useTranslation('marketing');
  const location = useLocation();
  const [languageVersion, setLanguageVersion] = useState(0);
  const { isRTLMode } = useLocalization();
  const isProposalManagerTeam = location.pathname.includes('/app/team');
  // Backend company-wide store requires a real trial session token
  const isTrialPm = isProposalManagerTeam && canUseTrialFeatures();
  const isArabic = String(i18n?.resolvedLanguage || i18n?.language || "en").toLowerCase().startsWith("ar");
  const pmText = (en, ar) => (isProposalManagerTeam ? (isArabic ? ar : en) : en);
  const pmTranslate = (text) => {
    if (!isProposalManagerTeam || !isArabic) return text;
    const map = {
      "Capture Manager": "مدير الالتقاط",
      "Proposal Manager": "مدير العروض",
      "Proposal Writer": "كاتب العروض",
      "Technical Lead / Solution Architect": "القائد الفني / مهندس الحلول",
      "Pricing Lead": "قائد التسعير",
      "Compliance Specialist": "أخصائي الامتثال",
      "Graphics": "التصميم",
      "Sub contractors": "المتعاقدون الفرعيون",
      "Active Proposals": "العروض النشطة",
      "Win Rate %": "معدل الفوز %",
      "Compliance Score": "درجة الامتثال",
      "On-Time Submissions": "التسليم في الموعد",
      "FAR/DFARS Overview": "نظرة عامة على FAR/DFARS",
      "Proposal Writing Workshop": "ورشة كتابة العروض",
      "Compliance Certification": "شهادة الامتثال",
      "Solution Architecture Training": "تدريب هندسة الحلول",
      "Technical volume draft – DoD IT Services": "مسودة المجلد الفني – خدمات تقنية DoD",
      "Past Performance section": "قسم الأداء السابق",
      "Compliance matrix & checklist": "مصفوفة الامتثال وقائمة التحقق",
      "Pricing volume – GSA BPA": "مجلد التسعير – GSA BPA",
      "Sections completed": "الأقسام المكتملة",
      "Compliance reviews": "مراجعات الامتثال",
      "Proposals supported": "العروض المدعومة",
      "DoD IT Services draft due July 15 – all sections": "موعد تسليم مسودة خدمات DoD التقنية في 15 يوليو – جميع الأقسام",
      "Compliance matrix sign-off by Friday": "اعتماد مصفوفة الامتثال قبل يوم الجمعة",
      "Proposal SOP v2 and style guide uploaded": "تم رفع إجراء العمل القياسي للعروض v2 ودليل الأسلوب",
    };
    return map[text] || text;
  };
  
  useEffect(() => {
    setLanguageVersion(prev => prev + 1);
  }, [i18n.language]);

  const user = JSON.parse(localStorage.getItem('rbac_current_user') || "null");
  const [members, setMembers] = useState(() => {
    if (location.pathname.includes("/app/team") && canUseTrialFeatures()) {
      return getTeamData().members;
    }
    if (location.pathname.includes("/app/team")) return proposalManagerInitialMembers;
    return initialTeamMembers;
  });
  const [selectedMember, setSelectedMember] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [trainingPerfStatus, setTrainingPerfStatus] = useState("certified");
  const [newTrainingTitle, setNewTrainingTitle] = useState("");
  const [customTrainings, setCustomTrainings] = useState(() =>
    canUseTrialFeatures() && location.pathname.includes("/app/team") ? getTeamData().trainings : [],
  );
  const [assignments, setAssignments] = useState(() =>
    canUseTrialFeatures() && location.pathname.includes("/app/team") ? getTeamData().assignments : [],
  );
  /** Same count source as User Management "Total Users". */
  const [rosterCount, setRosterCount] = useState(0);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState({
    task: "",
    assigned: "",
    assignedEmail: "",
    status: "pending",
    progress: "0",
    deadline: new Date().toISOString().slice(0, 10),
  });
  const [newMember, setNewMember] = useState({
    name: "",
    role: "Digital Marketer",
    email: "",
    phone: "",
    skills: "",
    projects: "",
    status: "Active",
    permissions: [],
  });
  const TRAINING_PERF_OPTIONS = [
    { id: "certified", label: "Certified" },
    { id: "in_performance", label: "In performance" },
    { id: "opt_out", label: "Opt out" },
    { id: "expired", label: "Expired" },
  ];
  const TRIAL_PERMISSION_OPTIONS = [
    { id: "view_rfps", label: "View RFPs" },
    { id: "edit_sections", label: "Edit sections" },
    { id: "compliance", label: "Compliance" },
    { id: "past_performance", label: "Past performance" },
    { id: "pricing", label: "Pricing" },
    { id: "assign_questions", label: "Assign questions" },
    { id: "full_access", label: "Full access" },
  ];

  useEffect(() => {
    if (!isTrialPm) {
      if (location.pathname.includes("/app/team")) {
        setMembers(proposalManagerInitialMembers);
        setRosterCount(proposalManagerInitialMembers.length);
      }
      return undefined;
    }
    let cancelled = false;
    const applyTeam = (data) => {
      setMembers(data.members);
      setCustomTrainings(data.trainings);
      setAssignments(data.assignments);
    };
    (async () => {
      try {
        await hydrateTeamFromServer({ notify: false });
        const synced = await syncTeamMembersFromCompanyRoster({ notify: false });
        if (cancelled) return;
        applyTeam(synced);
        const roster = await loadCompanyUserRoster();
        if (!cancelled) setRosterCount(roster.count);
      } catch {
        if (!cancelled) {
          const data = getTeamData();
          applyTeam(data);
        }
      }
    })();
    const data = getTeamData();
    applyTeam(data);
    return () => {
      cancelled = true;
    };
  }, [isTrialPm, location.pathname]);

  useEffect(() => {
    if (!isTrialPm) return undefined;
    return subscribeTeam((next) => {
      setMembers(next.members);
      setCustomTrainings(next.trainings);
      setAssignments(next.assignments);
    });
  }, [isTrialPm]);

  useEffect(() => {
    if (!isTrialPm) return undefined;
    const refreshRoster = () => {
      void (async () => {
        const synced = await syncTeamMembersFromCompanyRoster({ notify: false });
        setMembers(synced.members);
        setCustomTrainings(synced.trainings);
        setAssignments(synced.assignments);
        const roster = await loadCompanyUserRoster();
        setRosterCount(roster.count);
      })();
    };
    const unsub = subscribeUserRoster(refreshRoster);
    const onFocus = () => refreshRoster();
    window.addEventListener("focus", onFocus);
    return () => {
      unsub();
      window.removeEventListener("focus", onFocus);
    };
  }, [isTrialPm]);

  if (!ready) {
    return (
      <div className="flex min-h-screen bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
        <main className="flex-1 p-4 md:p-6 flex flex-col gap-8 overflow-x-auto">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{isArabic ? "جارٍ التحميل..." : "Loading..."}</h1>
          </div>
        </main>
      </div>
    );
  }

  const trialMetrics = [
    {
      metric: "Team Members",
      target: Math.max(rosterCount || members.length, 1),
      achieved: rosterCount || members.length,
      icon: FiUsers,
      color: "blue",
    },
    { metric: "Open Assignments", target: Math.max(assignments.filter((a) => a.status !== "completed").length, 1), achieved: assignments.filter((a) => a.status !== "completed").length, icon: FiClipboard, color: "green" },
    { metric: "Completed", target: Math.max(assignments.length, 1), achieved: assignments.filter((a) => a.status === "completed").length, icon: FiCheckCircle, color: "purple" },
    { metric: "Trainings Logged", target: Math.max(customTrainings.length, 1), achieved: customTrainings.length, icon: FiAward, color: "yellow" },
  ];

  /** Live feed for trial Team Updates card — from assignments, members, trainings only. */
  const trialTeamUpdates = (() => {
    if (!isTrialPm) return [];
    const items = [];
    const open = assignments
      .filter((a) => a.status !== "completed")
      .slice()
      .sort((a, b) => (Date.parse(a.deadline) || 0) - (Date.parse(b.deadline) || 0));
    for (const a of open.slice(0, 4)) {
      const who = a.assigned || a.assignee || "Unassigned";
      const when = a.deadline ? ` · due ${a.deadline}` : "";
      items.push({
        type: "reminder",
        message: `${a.task || "Assignment"} → ${who}${when}`,
        icon: FiClock,
      });
    }
    for (const a of assignments.filter((x) => x.status === "completed").slice(0, 2)) {
      items.push({
        type: "announcement",
        message: `Completed: ${a.task || "Assignment"}${a.assigned ? ` (${a.assigned})` : ""}`,
        icon: FiCheckCircle,
      });
    }
    for (const m of members.slice(0, 2)) {
      items.push({
        type: "brief",
        message: `Team member: ${m.name}${m.role ? ` · ${m.role}` : ""}`,
        icon: FiUsers,
      });
    }
    for (const tr of customTrainings.slice(0, 2)) {
      items.push({
        type: "brief",
        message: `Training logged: ${tr.training || tr.name || "Training"}`,
        icon: FiAward,
      });
    }
    return items.slice(0, 6);
  })();

  const toggleMemberPermission = (memberId, permId) => {
    setMembers((prev) => {
      const next = prev.map((m) => {
        if (m.id !== memberId) return m;
        const current = new Set(m.permissions || []);
        if (current.has(permId)) current.delete(permId);
        else current.add(permId);
        return { ...m, permissions: [...current] };
      });
      if (isTrialPm) {
        const updated = next.find((m) => m.id === memberId);
        if (updated) updateTeamMember(memberId, { permissions: updated.permissions });
      }
      return next;
    });
  };

  const addCustomTraining = () => {
    const title = newTrainingTitle.trim();
    if (!title || !trainingPerfStatus) return;
    if (isTrialPm) {
      const data = addTeamTraining({ training: title, status: trainingPerfStatus });
      setCustomTrainings(data.trainings);
    } else {
      setCustomTrainings((prev) => [
        ...prev,
        { id: `tr_${Date.now()}`, training: title, status: trainingPerfStatus },
      ]);
    }
    setNewTrainingTitle("");
  };

  const handleMemberClick = (member) => {
    setSelectedMember(member);
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingMemberId(null);
    setNewMember({
      name: "",
      role: isProposalManagerTeam ? "Proposal Writer" : "Digital Marketer",
      email: "",
      phone: "",
      skills: "",
      projects: "",
      status: "Active",
      permissions: [],
    });
    setShowAddModal(true);
  };

  const openEditMember = (member) => {
    if (!member) return;
    setEditingMemberId(member.id);
    setNewMember({
      name: member.name || "",
      role: member.role || (isProposalManagerTeam ? "Proposal Writer" : "Digital Marketer"),
      email: member.email || "",
      phone: member.phone || "",
      skills: Array.isArray(member.skills) ? member.skills.join(", ") : String(member.skills || ""),
      projects: Array.isArray(member.projects) ? member.projects.join(", ") : String(member.projects || ""),
      status: member.status || "Active",
      permissions: Array.isArray(member.permissions) ? [...member.permissions] : [],
    });
    setShowModal(false);
    setShowAddModal(true);
  };

  const handleDeleteMember = (member) => {
    if (!member?.id) return;
    const label = member.name || member.email || "this member";
    if (!window.confirm(pmText(`Remove ${label} from the team?`, `إزالة ${label} من الفريق؟`))) return;
    if (isTrialPm) {
      void (async () => {
        const data = await removeCompanyTeamPerson(member);
        setMembers(data.members);
        const roster = await loadCompanyUserRoster();
        setRosterCount(roster.count);
      })();
    } else {
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      setRosterCount((n) => Math.max(0, n - 1));
    }
    if (selectedMember?.id === member.id) {
      setSelectedMember(null);
      setShowModal(false);
    }
    if (editingMemberId === member.id) {
      setEditingMemberId(null);
      setShowAddModal(false);
    }
  };

  const exportRoster = () => {
    const rows = [
      ["Name", "Role", "Email", "Phone", "Status", "Skills", "Projects", "Permissions"],
      ...members.map((m) => [
        m.name || "",
        m.role || "",
        m.email || "",
        m.phone || "",
        m.status || "",
        (m.skills || []).join("; "),
        (m.projects || []).join("; "),
        (m.permissions || []).join("; "),
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const s = String(cell ?? "");
            if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
            return s;
          })
          .join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `team-roster-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleAddMemberSubmit = (e) => {
    e.preventDefault();
    const name = newMember.name.trim();
    const email = newMember.email.trim();
    if (!name || !email) return;
    if (isTrialPm) {
      if (editingMemberId) {
        const data = updateTeamMember(editingMemberId, {
          name,
          role: newMember.role.trim() || "Proposal Writer",
          email,
          phone: newMember.phone.trim() || "",
          status: newMember.status,
          skills: newMember.skills,
          projects: newMember.projects,
          permissions: [...(newMember.permissions || [])],
        });
        setMembers(data.members);
        void (async () => {
          await upsertManualUserManagementUser({
            name,
            email,
            role: newMember.role.trim() || "Proposal Manager",
            department: "Proposals",
          });
          await syncTeamMembersFromCompanyRoster();
          const roster = await loadCompanyUserRoster();
          setRosterCount(roster.count);
          setMembers(getTeamData().members);
        })();
      } else {
        void (async () => {
          const result = await addCompanyTeamPerson({
            name,
            role: newMember.role.trim() || "Proposal Writer",
            email,
            phone: newMember.phone.trim() || "",
            status: newMember.status,
            skills: newMember.skills,
            projects: newMember.projects,
            permissions: [...(newMember.permissions || [])],
            avatar: "👤",
            performance: 80,
          });
          if (result?.data) setMembers(result.data.members);
          const roster = await loadCompanyUserRoster();
          setRosterCount(roster.count);
        })();
      }
      setEditingMemberId(null);
      setShowAddModal(false);
      return;
    }
    if (editingMemberId) {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === editingMemberId
            ? {
                ...m,
                name,
                role: newMember.role.trim() || (isProposalManagerTeam ? "Proposal Writer" : "Team Member"),
                email,
                phone: newMember.phone.trim() || "",
                status: newMember.status,
                skills: newMember.skills
                  ? newMember.skills.split(",").map((s) => s.trim()).filter(Boolean)
                  : [],
                projects: newMember.projects
                  ? newMember.projects.split(",").map((p) => p.trim()).filter(Boolean)
                  : [],
              }
            : m,
        ),
      );
      setEditingMemberId(null);
      setShowAddModal(false);
      return;
    }
    const nextId = members.reduce((max, m) => Math.max(max, Number(m.id) || 0), 0) + 1;
    const added = {
      id: nextId,
      name,
      role: newMember.role.trim() || (isProposalManagerTeam ? "Proposal Writer" : "Team Member"),
      email,
      phone: newMember.phone.trim() || "",
      performance: 80,
      status: newMember.status,
      avatar: "👤",
      skills: newMember.skills
        ? newMember.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      projects: newMember.projects
        ? newMember.projects.split(",").map((p) => p.trim()).filter(Boolean)
        : [],
      permissions: undefined,
    };
    setMembers((prev) => [...prev, added]);
    setShowAddModal(false);
  };

  const openAssignmentForm = (existing = null) => {
    if (existing) {
      setEditingAssignmentId(existing.id);
      setAssignmentForm({
        task: existing.task || "",
        assigned: existing.assigned || "",
        assignedEmail: existing.assignedEmail || "",
        status: existing.status || "pending",
        progress: String(existing.progress || "0").replace("%", ""),
        deadline: existing.deadline || new Date().toISOString().slice(0, 10),
      });
    } else {
      setEditingAssignmentId(null);
      const first = members[0];
      setAssignmentForm({
        task: "",
        assigned: first?.name || "",
        assignedEmail: first?.email || "",
        status: "pending",
        progress: "0",
        deadline: new Date().toISOString().slice(0, 10),
      });
    }
    setShowAssignmentForm(true);
  };

  const submitAssignment = (e) => {
    e.preventDefault();
    if (!isTrialPm) return;
    if (!assignmentForm.task.trim() || !assignmentForm.deadline) return;
    if (editingAssignmentId) {
      const data = updateTeamAssignment(editingAssignmentId, assignmentForm);
      setAssignments(data.assignments);
    } else {
      const result = addTeamAssignment(assignmentForm);
      if (result.ok) setAssignments(result.data.assignments);
    }
    setShowAssignmentForm(false);
    setEditingAssignmentId(null);
  };

  const StatusBadge = ({ status, children }) => {
    const statusStyles = {
      active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      onLeave: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      inProgress: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      resolved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      certified: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      in_performance: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      opt_out: "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200",
      expired: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || statusStyles.pending}`}>
        {children}
      </span>
    );
  };

  const MetricCard = ({ title, value, target, achieved, icon: Icon, color = "blue", showTarget = true }) => {
    const colorClasses = {
      blue: "text-blue-600 dark:text-blue-400",
      green: "text-green-600 dark:text-green-400",
      purple: "text-purple-600 dark:text-purple-400",
      yellow: "text-yellow-600 dark:text-yellow-400",
      red: "text-red-600 dark:text-red-400"
    };

    const percentage = target > 0 ? Math.round((achieved / target) * 100) : 0;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg bg-${color}-50 dark:bg-${color}-900/20`}>
            <Icon className={`h-5 w-5 ${colorClasses[color]}`} />
          </div>
          {showTarget && (
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{percentage}%</span>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {showTarget && (
            <p className="text-sm text-gray-500 dark:text-gray-400">Target: {target}</p>
          )}
        </div>
      </div>
    );
  };

  const Modal = ({ member, onClose }) => {
    if (!member) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={onClose} />
        <div className="relative z-10 bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-3xl font-bold"
            aria-label="Close"
          >
            &times;
          </button>
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{member.avatar || "👤"}</span>
              <div>
                <h2 className="text-xl font-bold">{member.name}</h2>
                <p className="text-gray-600 dark:text-gray-300">{pmTranslate(member.role)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{member.status || "Active"}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">{t('team.modal.contactInformation')}</h3>
              <p className="text-sm">{member.email}</p>
              <p className="text-sm">{member.phone || "—"}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">{isProposalManagerTeam ? pmText('Skills / Expertise', 'المهارات / الخبرات') : t('team.modal.skills')}</h3>
              <div className="flex flex-wrap gap-2">
                {(member.skills || []).length > 0
                  ? member.skills.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
                        {skill}
                      </span>
                    ))
                  : <span className="text-sm text-gray-500">—</span>}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">{isProposalManagerTeam ? pmText('Active Pursuits / Proposals', 'الفرص / العروض النشطة') : t('team.modal.currentProjects')}</h3>
              <div className="space-y-2">
                {(member.projects || []).length > 0
                  ? member.projects.map((project, index) => (
                      <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        {project}
                      </div>
                    ))
                  : <span className="text-sm text-gray-500">—</span>}
              </div>
            </div>
            {isTrialPm && (member.permissions || []).length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">{pmText("Permissions", "الصلاحيات")}</h3>
                <div className="flex flex-wrap gap-2">
                  {(member.permissions || []).map((p) => (
                    <span key={p} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 rounded-full text-xs">
                      {TRIAL_PERMISSION_OPTIONS.find((o) => o.id === p)?.label || p}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => openEditMember(member)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                <FiEdit className="w-4 h-4" />
                {pmText("Edit", "تعديل")}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMember(member)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
              >
                <FiTrash2 className="w-4 h-4" />
                {pmText("Remove", "إزالة")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      key={`${i18n.language}-${languageVersion}`}
      className={`flex min-h-screen bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 ${isRTLMode ? 'rtl' : 'ltr'}`}
    >
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-8 overflow-x-auto">
        {/* Header Section */}
        <header
          className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${isRTLMode ? 'flex-row-reverse' : ''}`}
          data-tour="1"
          data-tour-title-en={isProposalManagerTeam ? "Proposal Team Overview" : "Team Management Overview"}
          data-tour-title-ar={isProposalManagerTeam ? "نظرة عامة على فريق العرض" : "نظرة عامة على إدارة الفريق"}
          data-tour-content-en={isProposalManagerTeam ? "Add team members, export roster, and manage proposal roles and assignments." : "Add members, export reports, and manage team operations."}
          data-tour-content-ar={isProposalManagerTeam ? "أضف أعضاء الفريق، صدّر القائمة، وأدر أدوار ومهام العرض." : "أضف الأعضاء، صدّر التقارير، وأدر عمليات الفريق."}
          data-tour-position="bottom"
        >
          <div className={`flex-1 min-w-0 ${isRTLMode ? 'text-right' : 'text-left'}`}>
            <h1 className="text-2xl font-bold !text-gray-900 dark:!text-white flex items-center gap-2">
              {isProposalManagerTeam ? pmText('Manage Team', 'إدارة الفريق') : t('team.title')} <FiUsers className="text-blue-500" />
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {isTrialPm
                ? pmText(
                    "Structure, roles, assignments, and training — saved company-wide for your trial team.",
                    "الهيكل والأدوار والتكليفات والتدريب — تُحفظ على مستوى الشركة لفريق التجربة.",
                  )
                : isProposalManagerTeam
                  ? pmText(
                      "Structure, roles, assignments, and performance for your proposal team.",
                      "هيكل الفريق والأدوار والتكليفات ومؤشرات الأداء لفريق إعداد العروض.",
                    )
                  : t("team.subtitle")}
            </p>
          </div>
          
          {/* Quick Actions */}
          <div className={`flex-shrink-0 w-full lg:w-auto ${isRTLMode ? 'text-right' : 'text-left'}`}>
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 lg:flex lg:gap-3 ${isRTLMode ? 'lg:flex-row-reverse' : ''}`}>
              <button 
                onClick={openAddModal}
                className={`px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors whitespace-nowrap ${isRTLMode ? 'flex-row-reverse' : ''}`}
              >
                <FiPlus className="w-4 h-4 flex-shrink-0" /> 
                <span className="hidden sm:inline">{isProposalManagerTeam ? pmText('Add Team Member', 'إضافة عضو فريق') : t('team.addTeamMember')}</span>
                <span className="sm:hidden">{isProposalManagerTeam ? pmText('Add', 'إضافة') : 'Add'}</span>
              </button>
              
              <button 
                type="button"
                onClick={exportRoster}
                disabled={!members.length}
                className={`px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${isRTLMode ? 'flex-row-reverse' : ''}`}
              >
                <FiDownload className="w-4 h-4 flex-shrink-0" /> 
                <span className="hidden sm:inline">{isProposalManagerTeam ? pmText('Export Roster', 'تصدير قائمة الفريق') : t('team.exportReport')}</span>
                <span className="sm:hidden">{isProposalManagerTeam ? pmText('Export', 'تصدير') : 'Export'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Performance Metrics Overview */}
        <div className="mb-8">
  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
    {isProposalManagerTeam ? pmText('Proposal Team Metrics', 'مؤشرات فريق إعداد العروض') : t('team.sections.teamStructure.performanceOverview')}
  </h2>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {(isTrialPm
      ? trialMetrics
      : isProposalManagerTeam
        ? proposalManagerMetrics
        : performanceMetrics
    ).map((metric, index) => (
      <MetricCard
        key={index}
        title={pmTranslate(metric.metric)}
        value={metric.achieved}
        target={metric.target}
        achieved={metric.achieved}
        icon={metric.icon}
        color={metric.color}
        showTarget={!isTrialPm}
      />
    ))}
  </div>
</div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Team Structure & Hierarchy */}
            <section
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              data-tour="2"
              data-tour-title-en={isProposalManagerTeam ? "Proposal Team Structure & Hierarchy" : "Team Structure & Hierarchy"}
              data-tour-title-ar={isProposalManagerTeam ? "هيكل فريق العرض والتسلسل الهرمي" : "هيكل الفريق والتسلسل الهرمي"}
              data-tour-content-en={isProposalManagerTeam ? "View proposal roles and reporting lines. AI suggests workload balance." : "View roles and reporting lines with AI workload suggestions."}
              data-tour-content-ar={isProposalManagerTeam ? "اعرض أدوار العرض وخطوط التقارير. الذكاء الاصطناعي يقترح توازن الأحمال." : "اعرض الأدوار وخطوط التقارير مع اقتراحات عبء العمل بالذكاء الاصطناعي."}
              data-tour-position="bottom"
            >
              <div className={`flex items-center gap-3 mb-6 ${isRTLMode ? 'flex-row-reverse' : ''}`}>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FiUsers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {isProposalManagerTeam ? pmText('Proposal Team Structure', 'هيكل فريق إعداد العروض') : t('team.sections.teamStructure.title')}
                </h2>
                {!isTrialPm && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded animate-pulse">
                  {isProposalManagerTeam ? pmText('AI', 'ذكاء اصطناعي') : t('team.sections.teamStructure.aiSuggestion')}
                </span>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    {isProposalManagerTeam ? pmText('By Role', 'حسب الدور') : t('team.sections.teamStructure.byRole')}
                  </h3>
                  <div className="space-y-2">
                    {members.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('team.trialEmpty.noMembers', 'No team members yet. Add your first member to build the roster.')}</p>
                    ) : (
                    (() => {
                      const byRole = members.reduce((acc, m) => {
                        acc[m.role] = acc[m.role] || [];
                        acc[m.role].push(m.name);
                        return acc;
                      }, {});
                      return Object.entries(byRole).map(([role, names]) => (
                        <div key={role} className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{pmTranslate(role)}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {names.length === 1 ? names[0] : names.join(", ")}
                            </span>
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                              {names.length}
                            </span>
                          </div>
                        </div>
                      ));
                    })()
                    )}
                  </div>
                </div>
                
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    {isProposalManagerTeam ? pmText('Reporting Hierarchy', 'الهيكل الإداري للتقارير') : t('team.sections.teamStructure.reportingHierarchy')}
                  </h3>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {members.length > 0
                        ? isProposalManagerTeam
                          ? `${members.find(m => m.role === 'Proposal Manager')?.name ?? members[0].name} ${pmText('(Proposal Manager)', '(مدير العروض)')} → ${members.filter(m => m.role !== 'Proposal Manager').map((m) => m.name).join(", ") || "—"}`
                          : `${members[0].name} (Supervisor) → ${members.slice(1).map((m) => m.name).join(", ") || "—"}`
                        : "—"}
                    </div>
                    {!isTrialPm && (
                    <div className="text-xs text-blue-600 animate-bounce">
                      {isProposalManagerTeam ? pmText('AI suggests balancing section ownership across writers.', 'يقترح الذكاء الاصطناعي موازنة ملكية الأقسام بين الكتّاب.') : t('team.sections.teamStructure.aiWorkloadSuggestion')}
                    </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Role-based Access & Permissions */}
            <section
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              data-tour="3"
              data-tour-title-en={isProposalManagerTeam ? "Proposal Role Access & Permissions" : "Role-based Access & Permissions"}
              data-tour-title-ar={isProposalManagerTeam ? "وصول أدوار العرض والأذونات" : "الوصول المستند إلى الدور والأذونات"}
              data-tour-content-en={isProposalManagerTeam ? "Review proposal roles, section access, and compliance permissions." : "Review roles, permissions, and edit access."}
              data-tour-content-ar={isProposalManagerTeam ? "راجع أدوار العرض، وصول الأقسام، وأذونات الامتثال." : "راجع الأدوار والأذونات وعدّل الوصول."}
              data-tour-position="bottom"
            >
              <div className={`flex items-center gap-3 mb-6 ${isRTLMode ? 'flex-row-reverse' : ''}`}>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <FiSettings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {isProposalManagerTeam ? pmText('Role Access & Permissions', 'صلاحيات الوصول حسب الدور') : t('team.sections.roleAccess.title')}
                </h2>
              </div>

              {isTrialPm ? (
                <div className="space-y-4">
                  {members.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No team members yet. Add a team member, then choose which permissions to grant them here.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {members.map((member) => {
                        const selected = new Set(member.permissions || []);
                        return (
                          <div
                            key={member.id}
                            className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {pmTranslate(member.role)}
                                  {member.email ? ` · ${member.email}` : ""}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleMemberClick(member)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                                  title={pmText("View", "عرض")}
                                  aria-label={pmText("View member", "عرض العضو")}
                                >
                                  <FiEye className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditMember(member)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                  title={pmText("Edit", "تعديل")}
                                  aria-label={pmText("Edit member", "تعديل العضو")}
                                >
                                  <FiEdit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMember(member)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                                  title={pmText("Remove", "إزالة")}
                                  aria-label={pmText("Remove member", "إزالة العضو")}
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              Permissions for this team member:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {TRIAL_PERMISSION_OPTIONS.map((opt) => {
                                const on = selected.has(opt.id);
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => toggleMemberPermission(member.id, opt.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                      on
                                        ? "bg-purple-600 text-white border-purple-600"
                                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-purple-400"
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add team member
                  </button>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b dark:border-gray-700">
                      <th className="pb-2 font-medium text-gray-900 dark:text-white">{t('team.sections.roleAccess.member')}</th>
                      <th className="pb-2 font-medium text-gray-900 dark:text-white">{t('team.sections.roleAccess.role')}</th>
                      <th className="pb-2 font-medium text-gray-900 dark:text-white">{t('team.sections.roleAccess.permissions')}</th>
                      <th className="pb-2 font-medium text-gray-900 dark:text-white">{t('team.sections.roleAccess.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {members.map((member, index) => (
                      <tr
                        key={member.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                        onClick={() => handleMemberClick(member)}
                      >
                        <td className="py-3 text-gray-700 dark:text-gray-300">{member.name}</td>
                        <td className="py-3 text-gray-700 dark:text-gray-300">{pmTranslate(member.role)}</td>
                        <td className="py-3 text-gray-700 dark:text-gray-300">
                          {isProposalManagerTeam
                            ? (member.role === "Proposal Manager"
                                ? pmText("Full access", "وصول كامل")
                                : member.role === "Compliance Specialist"
                                  ? pmText("Compliance, Sections", "الامتثال، الأقسام")
                                  : member.role === "Proposal Writer"
                                    ? pmText("Sections, Past Performance", "الأقسام، الأداء السابق")
                                    : pmText("Sections", "الأقسام"))
                            : (index === 0 ? "All" : index === 1 ? "Content, Campaigns" : "Campaigns")}
                        </td>
                        <td className="py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleMemberClick(member)}
                              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"
                            >
                              <FiEye className="w-3 h-3" />
                              {pmText("View", "عرض")}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditMember(member)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                            >
                              <FiEdit className="w-3 h-3" />
                              {t('team.sections.roleAccess.edit')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMember(member)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                            >
                              <FiTrash2 className="w-3 h-3" />
                              {pmText("Remove", "إزالة")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2 text-xs text-purple-600">
                  {isProposalManagerTeam ? pmText('AI suggests assigning Compliance review to specialists only.', 'يقترح الذكاء الاصطناعي إسناد مراجعة الامتثال للمتخصصين فقط.') : t('team.sections.roleAccess.aiPermissionSuggestion')}
                </div>
              </div>
              )}
            </section>

            {/* Training & Development Tracker */}
            <section
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              data-tour="6"
              data-tour-title-en={isProposalManagerTeam ? "Proposal Training & Certifications" : "Training & Development Tracker"}
              data-tour-title-ar={isProposalManagerTeam ? "تدريب العرض والشهادات" : "متابعة التدريب والتطوير"}
              data-tour-content-en={isProposalManagerTeam ? "FAR/DFARS, proposal writing, and compliance certifications." : "Training attendance, certifications, and AI recommendations."}
              data-tour-content-ar={isProposalManagerTeam ? "FAR/DFARS، كتابة العرض، وشهادات الامتثال." : "حضور التدريب والشهادات وتوصيات الذكاء الاصطناعي."}
              data-tour-position="bottom"
            >
              <div className={`flex items-center gap-3 mb-6 ${isRTLMode ? 'flex-row-reverse' : ''}`}>
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <FiBookOpen className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {isProposalManagerTeam ? pmText('Training & Certifications', 'التدريب والشهادات') : t('team.sections.trainingDevelopment.title')}
                </h2>
                {!isTrialPm && (
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded animate-pulse">
                  {isProposalManagerTeam ? pmText('AI', 'ذكاء اصطناعي') : t('team.sections.trainingDevelopment.aiRecommendations')}
                </span>
                )}
              </div>
              
              <div className="space-y-3">
                {!isTrialPm &&
                  (isProposalManagerTeam
                    ? [
                        { name: "Michael Anderson", training: "FAR/DFARS Overview", status: "certified" },
                        { name: "Jennifer Thompson", training: "Proposal Writing Workshop", status: "inProgress" },
                        { name: "Karen Brooks", training: "Compliance Certification", status: "certified" },
                        { name: "Patricia Sullivan", training: "Solution Architecture Training", status: "pending" },
                      ]
                    : [
                        { name: "Abdullah Al-Rashid", training: "Digital Marketing Bootcamp", status: "certified" },
                        { name: "Noura Al-Zahra", training: "Content Strategy Seminar", status: "inProgress" },
                        { name: "Khalid Al-Sayed", training: "Not attended recent training", status: "pending" },
                      ]
                  ).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {item.name}: {pmTranslate(item.training)}
                        </span>
                      </div>
                      <StatusBadge status={item.status}>
                        {t(`team.sections.trainingDevelopment.${item.status}`)}
                      </StatusBadge>
                    </div>
                  ))}
                {isTrialPm && customTrainings.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No trainings or certifications yet. Add your first below.
                  </p>
                )}
                {isTrialPm &&
                  customTrainings.map((item) => {
                    const label =
                      TRAINING_PERF_OPTIONS.find((o) => o.id === item.status)?.label || item.status;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-300">{item.training}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge status={item.status}>{label}</StatusBadge>
                          <button
                            type="button"
                            onClick={() => {
                              const data = removeTeamTraining(item.id);
                              setCustomTrainings(data.trainings);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600"
                            aria-label="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                {isTrialPm ? (
                  <div className="mt-3 space-y-3 rounded-lg border border-yellow-200/60 dark:border-yellow-800/40 bg-yellow-50/40 dark:bg-yellow-950/20 p-3">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      Add Training / Certification
                    </p>
                    <input
                      type="text"
                      value={newTrainingTitle}
                      onChange={(e) => setNewTrainingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomTraining();
                        }
                      }}
                      placeholder="e.g. FAR/DFARS Refresh, Capture Planning Cert"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                    />
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Update your training and performance :
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {TRAINING_PERF_OPTIONS.map((opt) => {
                          const selected = trainingPerfStatus === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setTrainingPerfStatus(opt.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                selected
                                  ? "bg-yellow-500 text-white border-yellow-500"
                                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-yellow-400"
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addCustomTraining}
                      disabled={!newTrainingTitle.trim()}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiPlus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                ) : (
                <div className="text-xs text-yellow-600 animate-bounce">
                  {isProposalManagerTeam ? pmText('AI recommends FAR/DFARS refresh for new team members.', 'يوصي الذكاء الاصطناعي بتحديث تدريب FAR/DFARS لأعضاء الفريق الجدد.') : t('team.sections.trainingDevelopment.aiTrainingRecommendation')}
                </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Task Assignment & Tracking */}
            <section
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              data-tour="4"
              data-tour-title-en={isProposalManagerTeam ? "Proposal Section Assignments" : "Task Assignment & Tracking"}
              data-tour-title-ar={isProposalManagerTeam ? "تعيينات أقسام العرض" : "تعيين المهام وتتبعها"}
              data-tour-content-en={isProposalManagerTeam ? "Assign proposal sections, track drafts, and review deadlines." : "Assign tasks, track progress, and view AI suggestions."}
              data-tour-content-ar={isProposalManagerTeam ? "عيّن أقسام العرض، تتبع المسودات، ومواعيد المراجعة." : "قم بتعيين المهام وتتبع التقدم واعرض اقتراحات الذكاء الاصطناعي."}
              data-tour-position="bottom"
            >
              <div className={`flex items-center justify-between gap-3 mb-6 flex-wrap ${isRTLMode ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isRTLMode ? 'flex-row-reverse' : ''}`}>
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <FiClipboard className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {isProposalManagerTeam ? pmText('Assignments & Deadlines', 'التعيينات والمواعيد النهائية') : t('team.sections.taskAssignment.title')}
                  </h2>
                  {!isTrialPm && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded animate-pulse">
                    {isProposalManagerTeam ? pmText('AI', 'ذكاء اصطناعي') : t('team.sections.taskAssignment.aiSmartAssignment')}
                  </span>
                  )}
                </div>
                {isTrialPm && (
                  <button
                    type="button"
                    onClick={() => openAssignmentForm()}
                    className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
                  >
                    <FiPlus className="w-4 h-4" />
                    {t('team.trialEmpty.addAssignment', 'Add assignment')}
                  </button>
                )}
              </div>

              {isTrialPm && showAssignmentForm && (
                <form
                  onSubmit={submitAssignment}
                  className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
                >
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                    placeholder={t('team.sections.taskAssignment.task')}
                    value={assignmentForm.task}
                    onChange={(e) => setAssignmentForm((f) => ({ ...f, task: e.target.value }))}
                    required
                  />
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                    value={assignmentForm.assigned}
                    onChange={(e) => {
                      const name = e.target.value;
                      const match = members.find((m) => m.name === name);
                      setAssignmentForm((f) => ({
                        ...f,
                        assigned: name,
                        assignedEmail: match?.email || "",
                      }));
                    }}
                  >
                    <option value="">{t('team.sections.taskAssignment.assignedTo')}</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}{m.email ? ` (${m.email})` : ""}
                      </option>
                    ))}
                  </select>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                    value={assignmentForm.status}
                    onChange={(e) => setAssignmentForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="pending">{t('team.status.pending')}</option>
                    <option value="inProgress">{t('team.status.inProgress')}</option>
                    <option value="completed">{t('team.status.completed')}</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                    placeholder={t('team.sections.taskAssignment.progress')}
                    value={assignmentForm.progress}
                    onChange={(e) => setAssignmentForm((f) => ({ ...f, progress: e.target.value }))}
                  />
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                    value={assignmentForm.deadline}
                    onChange={(e) => setAssignmentForm((f) => ({ ...f, deadline: e.target.value }))}
                    required
                  />
                  <div className="flex gap-2 lg:col-span-3">
                    <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">
                      {editingAssignmentId ? t('team.trialEmpty.save', 'Save') : t('team.trialEmpty.add', 'Add')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAssignmentForm(false);
                        setEditingAssignmentId(null);
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-500 rounded-lg text-sm"
                    >
                      {t('team.trialEmpty.cancel', 'Cancel')}
                    </button>
                  </div>
                </form>
              )}
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b dark:border-gray-700">
                      <th className="pb-2 font-medium text-gray-900 dark:text-white">{t('team.sections.taskAssignment.task')}</th>
                      <th className="pb-2 font-medium text-gray-900 dark:text-white">{t('team.sections.taskAssignment.assignedTo')}</th>
                      <th className="pb-2 font-medium text-gray-900 dark:text-white">{t('team.sections.taskAssignment.status')}</th>
                      <th className="pb-2 font-medium text-gray-900 dark:text-white">{t('team.sections.taskAssignment.progress')}</th>
                      <th className="pb-2 font-medium text-gray-900 dark:text-white">{t('team.sections.taskAssignment.deadline')}</th>
                      {isTrialPm && (
                        <th className="pb-2 font-medium text-gray-900 dark:text-white">{t('team.trialEmpty.actions', 'Actions')}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {(isTrialPm
                      ? assignments
                      : isProposalManagerTeam
                      ? [
                          { task: "Technical volume draft – DoD IT Services", assigned: "Patricia Sullivan", status: "inProgress", progress: "65%", deadline: "2026-09-15" },
                          { task: "Past Performance section", assigned: "Jennifer Thompson", status: "inProgress", progress: "80%", deadline: "2026-09-12" },
                          { task: "Compliance matrix & checklist", assigned: "Karen Brooks", status: "completed", progress: "100%", deadline: "2026-09-08" },
                          { task: "Pricing volume – GSA BPA", assigned: "Robert Mitchell", status: "pending", progress: "0%", deadline: "2026-09-20" }
                        ]
                      : [
                          { task: "Launch Q2 Campaign", assigned: "Abdullah Al-Rashid", status: "inProgress", progress: "70%", deadline: "2026-09-10" },
                          { task: "Write Blog Series", assigned: "Noura Al-Zahra", status: "pending", progress: "0%", deadline: "2026-09-12" },
                          { task: "Social Media Audit", assigned: "Khalid Al-Sayed", status: "completed", progress: "100%", deadline: "2026-10-30" }
                        ]
                    ).map((task, index) => (
                      <tr key={task.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 text-gray-700 dark:text-gray-300">{pmTranslate(task.task)}</td>
                        <td className="py-3 text-gray-700 dark:text-gray-300">{task.assigned}</td>
                        <td className="py-3">
                          <StatusBadge status={task.status}>
                            {t(`team.status.${task.status}`)}
                          </StatusBadge>
                        </td>
                        <td className="py-3 text-gray-700 dark:text-gray-300">{task.progress}</td>
                        <td className="py-3 text-gray-700 dark:text-gray-300">{task.deadline}</td>
                        {isTrialPm && (
                          <td className="py-3">
                            <div className="flex gap-1">
                              <button type="button" onClick={() => openAssignmentForm(task)} className="p-1 text-gray-400 hover:text-blue-600">
                                <FiEdit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const data = removeTeamAssignment(task.id);
                                  setAssignments(data.assignments);
                                }}
                                className="p-1 text-gray-400 hover:text-red-600"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {isTrialPm && assignments.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
                    {t('team.trialEmpty.noAssignments', 'No assignments yet. Add a task with a deadline to see it on Alerts and Calendar.')}
                  </p>
                )}
                {!isTrialPm && (
                <div className="mt-2 text-xs text-green-600 animate-bounce">
                  {isProposalManagerTeam ? pmText('AI suggests assigning Technical Lead for solution narrative.', 'يقترح الذكاء الاصطناعي إسناد السرد الفني إلى القائد الفني.') : t('team.sections.taskAssignment.aiAssignmentSuggestion')}
                </div>
                )}
              </div>
            </section>

            {/* Performance Dashboard — hidden for trial PM */}
            {!isTrialPm && (
            <section
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              data-tour="5"
              data-tour-title-en={isProposalManagerTeam ? "Proposal Team Performance" : "Performance Dashboard"}
              data-tour-title-ar={isProposalManagerTeam ? "أداء فريق العرض" : "لوحة الأداء"}
              data-tour-content-en={isProposalManagerTeam ? "Section contributions, review counts, and proposal score." : "KPIs, leaderboard, and burnout predictions."}
              data-tour-content-ar={isProposalManagerTeam ? "مساهمات الأقسام، عدد المراجعات، ودرجة العرض." : "مؤشرات الأداء، لوحة الصدارة، وتنبؤات الإرهاق."}
              data-tour-position="bottom"
            >
              <div className={`flex items-center gap-3 mb-6 ${isRTLMode ? 'flex-row-reverse' : ''}`}>
                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                  <FiBarChart2 className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {isProposalManagerTeam ? pmText('Team Performance', 'أداء الفريق') : t('team.sections.performanceDashboard.title')}
                </h2>
                <span className="ml-2 text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded animate-pulse">
                  {isProposalManagerTeam ? pmText('AI', 'ذكاء اصطناعي') : t('team.sections.performanceDashboard.aiLeaderboard')}
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    {isProposalManagerTeam ? pmText('Contributions', 'المساهمات') : t('team.sections.performanceDashboard.kpis')}
                  </h3>
                  <div className="space-y-2">
                    {(isProposalManagerTeam
                      ? [
                          { metric: "Sections completed", data: "Jennifer Thompson (8), Nicole Harrison (6), Patricia Sullivan (5)" },
                          { metric: "Compliance reviews", data: "Karen Brooks (12), Stephanie Grant (9)" },
                          { metric: "Proposals supported", data: "David Reynolds (4), Michael Anderson (3), Robert Mitchell (3)" }
                        ]
                      : [
                          { metric: "Leads Handled", data: "Abdullah Al-Rashid (120), Noura Al-Zahra (90), Khalid Al-Sayed (80)" },
                          { metric: "Conversions", data: "Abdullah Al-Rashid (30), Noura Al-Zahra (25), Khalid Al-Sayed (20)" },
                          { metric: "Campaign ROI", data: "Abdullah Al-Rashid (3.2x), Noura Al-Zahra (2.8x), Khalid Al-Sayed (2.5x)" }
                        ]
                    ).map((item, index) => (
                      <div key={index} className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">{pmTranslate(item.metric)}:</span> {pmTranslate(item.data)}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    {t('team.sections.performanceDashboard.leaderboard')}
                  </h3>
                  <div className="space-y-2">
                    {[...members]
                      .sort((a, b) => (b.performance ?? 0) - (a.performance ?? 0))
                      .map((member, index) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded px-2 -mx-2"
                          onClick={() => handleMemberClick(member)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === "Enter" && handleMemberClick(member)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">#{index + 1}</span>
                            <span className="text-sm text-gray-700 dark:text-gray-300">{member.name}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {isProposalManagerTeam ? pmText('Score', 'النتيجة') : t('team.sections.performanceDashboard.score')}: {member.performance ?? 80}
                          </span>
                        </div>
                      ))}
                  </div>
                  <div className="mt-2 text-xs text-pink-600 animate-bounce">
                    {isProposalManagerTeam ? pmText('AI suggests workload balance before color team.', 'يقترح الذكاء الاصطناعي موازنة عبء العمل قبل مراجعة فريق الألوان.') : t('team.sections.performanceDashboard.aiBurnoutPrediction')}
                  </div>
                </div>
              </div>
            </section>
            )}

            {/* Communication Center */}
            <section
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              data-tour="7"
              data-tour-title-en={isProposalManagerTeam ? "Proposal Team Updates" : "Communication Center"}
              data-tour-title-ar={isProposalManagerTeam ? "تحديثات فريق العرض" : "مركز الاتصال"}
              data-tour-content-en={isProposalManagerTeam ? "Deadlines, compliance reminders, and proposal SOPs." : "Announcements, reminders, and SOP briefs."}
              data-tour-content-ar={isProposalManagerTeam ? "المواعيد النهائية، تذكيرات الامتثال، وإجراءات العرض." : "الإعلانات والتذكيرات والموجزات."}
              data-tour-position="bottom"
            >
              <div className={`flex items-center gap-3 mb-6 ${isRTLMode ? 'flex-row-reverse' : ''}`}>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FiMessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {isProposalManagerTeam ? pmText('Team Updates & Reminders', 'تحديثات الفريق والتذكيرات') : t('team.sections.communicationCenter.title')}
                </h2>
                {!isTrialPm && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded animate-pulse">
                  {isProposalManagerTeam ? pmText('AI', 'ذكاء اصطناعي') : t('team.sections.communicationCenter.aiSummary')}
                </span>
                )}
              </div>
              
              <div className="space-y-3">
                {isTrialPm ? (
                  trialTeamUpdates.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                      {pmText(
                        "No updates yet. Add team members, assignments, or trainings and they’ll show up here.",
                        "لا توجد تحديثات بعد. أضف أعضاء فريق أو مهام أو تدريبات وستظهر هنا.",
                      )}
                    </p>
                  ) : (
                    trialTeamUpdates.map((item, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <item.icon className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase">
                            {t(`team.sections.communicationCenter.${item.type}`, { defaultValue: item.type })}
                          </span>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{item.message}</p>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  <>
                {(isProposalManagerTeam
                  ? [
                      { type: "announcement", message: "DoD IT Services draft due July 15 – all sections", icon: FiInfo },
                      { type: "reminder", message: "Compliance matrix sign-off by Friday", icon: FiClock },
                      { type: "brief", message: "Proposal SOP v2 and style guide uploaded", icon: FiFileText }
                    ]
                  : [
                      { type: "announcement", message: "Q2 Campaign Launch on July 10", icon: FiInfo },
                      { type: "reminder", message: "Submit weekly report by Friday", icon: FiClock },
                      { type: "brief", message: "SOP for Event Coordination uploaded", icon: FiFileText }
                    ]
                ).map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <item.icon className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase">
                        {t(`team.sections.communicationCenter.${item.type}`)}
                      </span>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{pmTranslate(item.message)}</p>
                    </div>
                  </div>
                ))}
                {!isProposalManagerTeam && (
                <div className="text-xs text-blue-600 animate-bounce">
                  {t('team.sections.communicationCenter.aiTopUpdates')}
                </div>
                )}
                  </>
                )}
              </div>
            </section>
          </div>
        </div>

        {showModal && <Modal member={selectedMember} onClose={() => setShowModal(false)} />}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div
              className="absolute inset-0"
              onClick={() => {
                setShowAddModal(false);
                setEditingMemberId(null);
              }}
            />
            <div className="relative z-10 bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingMemberId
                    ? pmText("Edit Team Member", "تعديل عضو الفريق")
                    : isProposalManagerTeam
                      ? pmText("Add Team Member", "إضافة عضو فريق")
                      : t("team.addTeamMember")}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingMemberId(null);
                  }}
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl font-bold"
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handleAddMemberSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{isProposalManagerTeam ? pmText('Name *', 'الاسم *') : 'Name *'}</label>
                  <input
                    type="text"
                    required
                    value={newMember.name}
                    onChange={(e) => setNewMember((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder={isProposalManagerTeam ? pmText("e.g. John Smith", "مثال: أحمد علي") : "e.g. Ahmed Al-Saud"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{isProposalManagerTeam ? pmText('Role', 'الدور') : 'Role'}</label>
                  <select
                    value={isProposalManagerTeam && !PROPOSAL_MANAGER_ROLES.includes(newMember.role) ? PROPOSAL_MANAGER_ROLES[0] : newMember.role}
                    onChange={(e) => setNewMember((p) => ({ ...p, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    {isProposalManagerTeam
                      ? PROPOSAL_MANAGER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)
                      : (
                        <>
                          <option>Campaign Manager</option>
                          <option>Content Strategist</option>
                          <option>Digital Marketer</option>
                          <option>Team Member</option>
                        </>
                      )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{isProposalManagerTeam ? pmText('Email *', 'البريد الإلكتروني *') : 'Email *'}</label>
                  <input
                    type="email"
                    required
                    value={newMember.email}
                    onChange={(e) => setNewMember((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder={isProposalManagerTeam ? pmText("email@example.com", "name@example.com") : "email@example.com"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{isProposalManagerTeam ? pmText('Phone', 'الهاتف') : 'Phone'}</label>
                  <input
                    type="tel"
                    value={newMember.phone}
                    onChange={(e) => setNewMember((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="+1 234 567 890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{isProposalManagerTeam ? pmText('Skills / Expertise (comma-separated)', 'المهارات / الخبرات (مفصولة بفواصل)') : 'Skills (comma-separated)'}</label>
                  <input
                    type="text"
                    value={newMember.skills}
                    onChange={(e) => setNewMember((p) => ({ ...p, skills: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder={isProposalManagerTeam ? pmText("e.g. Technical Writing, FAR/DFARS, Past Performance", "مثال: كتابة فنية، FAR/DFARS، الأداء السابق") : "e.g. SEO, Social Media, Analytics"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{isProposalManagerTeam ? pmText('Active Pursuits / Proposals (comma-separated)', 'الفرص / العروض النشطة (مفصولة بفواصل)') : 'Projects (comma-separated)'}</label>
                  <input
                    type="text"
                    value={newMember.projects}
                    onChange={(e) => setNewMember((p) => ({ ...p, projects: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder={isProposalManagerTeam ? pmText("e.g. DoD IT Services, GSA BPA, NASA Follow-on", "مثال: خدمات تقنية DoD، GSA BPA، متابعة NASA") : "e.g. Q3 Campaign, Brand Refresh"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{isProposalManagerTeam ? pmText('Status', 'الحالة') : 'Status'}</label>
                  <select
                    value={newMember.status}
                    onChange={(e) => setNewMember((p) => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="Active">{isProposalManagerTeam ? pmText('Active', 'نشط') : 'Active'}</option>
                    <option value="On Leave">{isProposalManagerTeam ? pmText('On Leave', 'في إجازة') : 'On Leave'}</option>
                    <option value="Pending">{isProposalManagerTeam ? pmText('Pending', 'قيد الانتظار') : 'Pending'}</option>
                  </select>
                </div>
                {isTrialPm && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Permissions for this team member
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {TRIAL_PERMISSION_OPTIONS.map((opt) => {
                        const on = (newMember.permissions || []).includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              setNewMember((p) => {
                                const set = new Set(p.permissions || []);
                                if (set.has(opt.id)) set.delete(opt.id);
                                else set.add(opt.id);
                                return { ...p, permissions: [...set] };
                              })
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              on
                                ? "bg-purple-600 text-white border-purple-600"
                                : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className={`flex gap-3 pt-2 ${isRTLMode ? 'flex-row-reverse' : ''}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingMemberId(null);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {isProposalManagerTeam ? pmText('Cancel', 'إلغاء') : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingMemberId
                      ? pmText("Save Changes", "حفظ التغييرات")
                      : isProposalManagerTeam
                        ? pmText("Add Team Member", "إضافة عضو فريق")
                        : "Add Member"}
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