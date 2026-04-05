import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocalization } from "../../../hooks/useLocalization";
import { directorFeatures } from '../../../components/directorFeatures';
import { 
  FiShield, 
  FiFileText, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiXCircle, 
  FiSearch, 
  FiDownload, 
  FiEye, 
  FiClock, 
  FiUser, 
  FiActivity, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiMinus,
  FiFilter,
  FiCalendar,
  FiBarChart2,
  FiTarget,
  FiZap
} from "react-icons/fi";

export default function DirectorAuditCompliance() {
  const location = useLocation();
  const isPM = location.pathname.includes("/rbac/proposal-manager/compliance");
  const user = JSON.parse(localStorage.getItem('rbac_current_user'));
  const [logFilter, setLogFilter] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedRisk, setSelectedRisk] = useState("all");
  const { t, ready, i18n } = useTranslation('director');
  const { isRTLMode } = useLocalization();
  const isArabic = String(i18n?.resolvedLanguage || i18n?.language || "").toLowerCase().startsWith("ar");
  const pmText = (en, ar) => (isPM ? (isArabic ? ar : en) : en);
  const pmLabel = (value) => {
    if (!isPM || !isArabic) return value;
    const map = {
      low: "منخفض",
      medium: "متوسط",
      high: "مرتفع",
      "Proposal section updated": "تم تحديث قسم العرض",
      "Compliance checklist signed": "تم توقيع قائمة التحقق للامتثال",
      "Pricing export attempted": "تمت محاولة تصدير التسعير",
      "Source document accessed": "تم الوصول إلى المستند المصدر",
      "Proposal Writer": "كاتب العروض",
      "Compliance Specialist": "أخصائي الامتثال",
      "Pricing Lead": "قائد التسعير",
      "Proposal Manager": "مدير العروض",
      "Technical Approach – Water Wastewater RFP": "النهج الفني - طلب عروض المياه والصرف الصحي",
      "FAR 52.219-9 – Landscape RFP": "FAR 52.219-9 - طلب عروض تنسيق الحدائق",
      "Insufficient permissions": "صلاحيات غير كافية",
      "Airport Restaurant RFP – Source Docs": "طلب عروض مطعم المطار - المستندات المصدرية",
      "FAR Conformance": "التوافق مع FAR",
      "RFP Requirements Matrix": "مصفوفة متطلبات طلب العروض",
      "Proposal Audit Trail": "سجل تدقيق العرض",
      "Past Performance Refs": "مراجع الأداء السابق",
      "All Status": "كل الحالات",
      Success: "ناجح",
      Failed: "فشل",
      Export: "تصدير",
      Time: "الوقت",
      Priority: "الأولوية",
      Actions: "الإجراءات",
      "Compliance Score": "درجة الامتثال",
      "Active Risks": "المخاطر النشطة",
      "All Risks": "كل المخاطر",
      "High Risk": "مخاطر مرتفعة",
      "Medium Risk": "مخاطر متوسطة",
      "Low Risk": "مخاطر منخفضة",
      "Risk Score": "درجة المخاطر",
      "Proposal & RFP Compliance": "امتثال العروض وطلبات تقديم العروض",
      "FAR conformance, RFP requirements, proposal audit trail, and past performance.": "التوافق مع FAR، متطلبات طلبات العروض، سجل تدقيق العرض، والأداء السابق.",
      "Loading...": "جارٍ التحميل...",
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
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{pmLabel("Loading...")}</h1>
          </div>
        </main>
      </div>
    );
  }

  const pmAuditLogs = [
    { id: 1, date: "2026-03-10", time: "14:30", action: "Proposal section updated", user: "Proposal Writer", statusKey: "auditStatuses.success", details: "Technical Approach – Water Wastewater RFP", priority: "low" },
    { id: 2, date: "2026-03-09", time: "09:15", action: "Compliance checklist signed", user: "Compliance Specialist", statusKey: "auditStatuses.success", details: "FAR 52.219-9 – Landscape RFP", priority: "medium" },
    { id: 3, date: "2026-03-08", time: "16:45", action: "Pricing export attempted", user: "Pricing Lead", statusKey: "auditStatuses.failed", details: "Insufficient permissions", priority: "high" },
    { id: 4, date: "2026-03-07", time: "11:20", action: "Source document accessed", user: "Proposal Manager", statusKey: "auditStatuses.success", details: "Airport Restaurant RFP – Source Docs", priority: "medium" },
  ];
  const directorAuditLogs = [
    { 
      id: 1, 
      date: "2026-03-10", 
      time: "14:30",
      actionKey: "auditActions.userLogin", 
      userKey: "auditUsers.deanScience", 
      statusKey: "auditStatuses.success", 
      detailsKey: "auditDetails.ipAddress",
      ipAddress: "192.168.1.100",
      priority: "low"
    },
    { 
      id: 2, 
      date: "2026-03-09", 
      time: "09:15",
      actionKey: "auditActions.dataExport", 
      userKey: "auditUsers.hodEEE", 
      statusKey: "auditStatuses.success", 
      detailsKey: "auditDetails.exportedStudentList",
      ipAddress: "192.168.1.105",
      priority: "medium"
    },
    { 
      id: 3, 
      date: "2026-03-08", 
      time: "16:45",
      actionKey: "auditActions.policyUpdate", 
      userKey: "auditUsers.director", 
      statusKey: "auditStatuses.failed", 
      detailsKey: "auditDetails.insufficientPermissions",
      ipAddress: "192.168.1.110",
      priority: "high"
    },
    { 
      id: 4, 
      date: "2026-03-07", 
      time: "11:20",
      actionKey: "auditActions.dataAccess", 
      userKey: "auditUsers.adminIT", 
      statusKey: "auditStatuses.success", 
      detailsKey: "auditDetails.accessedStudentRecords",
      ipAddress: "192.168.1.120",
      priority: "medium"
    },
  ];
  const auditLogs = isPM ? pmAuditLogs : directorAuditLogs;

  const pmComplianceStatus = [
    { areaKey: "FAR Conformance", statusKey: "complianceStatuses.compliant", lastAudit: "2026-02-01", score: 95, icon: FiCheckCircle, color: "green" },
    { areaKey: "RFP Requirements Matrix", statusKey: "complianceStatuses.pending", lastAudit: "2026-02-15", score: 78, icon: FiClock, color: "yellow" },
    { areaKey: "Proposal Audit Trail", statusKey: "complianceStatuses.compliant", lastAudit: "2026-01-20", score: 92, icon: FiCheckCircle, color: "green" },
    { areaKey: "Past Performance Refs", statusKey: "complianceStatuses.compliant", lastAudit: "2026-02-10", score: 88, icon: FiCheckCircle, color: "green" },
  ];
  const directorComplianceStatus = [
    { 
      areaKey: "complianceAreas.ncaaa", 
      statusKey: "complianceStatuses.compliant", 
      lastAudit: "2026-12-01",
      score: 95,
      icon: FiCheckCircle,
      color: "green"
    },
    { 
      areaKey: "complianceAreas.etec", 
      statusKey: "complianceStatuses.pending", 
      lastAudit: "2026-11-15",
      score: 78,
      icon: FiClock,
      color: "yellow"
    },
    { 
      areaKey: "complianceAreas.moe", 
      statusKey: "complianceStatuses.compliant", 
      lastAudit: "2026-01-20",
      score: 92,
      icon: FiCheckCircle,
      color: "green"
    },
    { 
      areaKey: "complianceAreas.scfhs", 
      statusKey: "complianceStatuses.compliant", 
      lastAudit: "2026-09-10",
      score: 88,
      icon: FiCheckCircle,
      color: "green"
    },
  ];
  const complianceStatus = isPM ? pmComplianceStatus : directorComplianceStatus;

  const riskAnalytics = [
    { 
      riskKey: "riskTypes.dataBreach", 
      levelKey: "riskLevels.low", 
      mitigationKey: "mitigationStrategies.twoFactorAuth",
      score: 25,
      trend: "down",
      icon: FiShield,
      color: "green"
    },
    { 
      riskKey: "riskTypes.nonCompliance", 
      levelKey: "riskLevels.medium", 
      mitigationKey: "mitigationStrategies.quarterlyAudits",
      score: 65,
      trend: "up",
      icon: FiAlertTriangle,
      color: "yellow"
    },
    { 
      riskKey: "riskTypes.policyViolation", 
      levelKey: "riskLevels.high", 
      mitigationKey: "mitigationStrategies.trainingMonitoring",
      score: 85,
      trend: "up",
      icon: FiXCircle,
      color: "red"
    },
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'success': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      case 'failed': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      case 'pending': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getRiskColor = (level) => {
    switch(level) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'up': return <FiTrendingUp className="w-4 h-4 text-red-500" />;
      case 'down': return <FiTrendingDown className="w-4 h-4 text-green-500" />;
      default: return <FiMinus className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const searchable = isPM
      ? [(log.user || ""), (log.action || ""), (log.details || "")].join(" ").toLowerCase()
      : [t(`auditCompliance.${log.userKey || ""}`), t(`auditCompliance.${log.actionKey || ""}`)].join(" ").toLowerCase();
    const matchesFilter = logFilter === "" || searchable.includes(logFilter.toLowerCase());
    const matchesStatus = selectedStatus === "all" || 
      (selectedStatus === "success" && log.statusKey === "auditStatuses.success") ||
      (selectedStatus === "failed" && log.statusKey === "auditStatuses.failed");
    return matchesFilter && matchesStatus;
  });

  const filteredRisks = riskAnalytics.filter(risk => {
    return selectedRisk === "all" || 
      (selectedRisk === "high" && risk.levelKey === "riskLevels.high") ||
      (selectedRisk === "medium" && risk.levelKey === "riskLevels.medium") ||
      (selectedRisk === "low" && risk.levelKey === "riskLevels.low");
  });

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
          data-tour-title-en="Audit & Compliance Overview"
          data-tour-title-ar="نظرة عامة على التدقيق والامتثال"
          data-tour-content-en="Track compliance status, review audit logs, and monitor risks."
          data-tour-content-ar="تتبع حالة الامتثال، وراجع سجلات التدقيق، وراقب المخاطر."
          data-tour-position="bottom"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <FiShield className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                {isPM ? pmLabel("Proposal & RFP Compliance") : t('auditCompliance.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {isPM ? pmLabel("FAR conformance, RFP requirements, proposal audit trail, and past performance.") : t('auditCompliance.subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">{pmLabel("Compliance Score")}</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">88%</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">{pmLabel("Active Risks")}</div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">3</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Compliance Status */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          data-tour="2"
          data-tour-title-en="Compliance Status"
          data-tour-title-ar="حالة الامتثال"
          data-tour-content-en="Snapshot of certification and regulatory compliance across areas."
          data-tour-content-ar="لمحة عن الشهادة والامتثال التنظيمي عبر المجالات."
          data-tour-position="bottom"
        >
          <div className="flex items-center gap-3 mb-6">
            <FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('auditCompliance.complianceStatus')}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {complianceStatus.map((c, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <c.icon className={`w-6 h-6 ${c.color === 'green' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(c.statusKey.split('.').pop())}`}>
                    {t(`auditCompliance.${c.statusKey}`)}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    {isPM ? pmLabel(c.areaKey) : t(`auditCompliance.${c.areaKey}`)}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{c.score}%</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {t('auditCompliance.lastAudit')}: {c.lastAudit}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${c.color === 'green' ? 'bg-green-500' : 'bg-yellow-500'}`}
                      style={{ width: `${c.score}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Audit Logs */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          data-tour="3"
          data-tour-title-en="Audit Logs"
          data-tour-title-ar="سجلات التدقيق"
          data-tour-content-en="Filter and inspect user actions, statuses, and details."
          data-tour-content-ar="قم بتصفية وفحص إجراءات المستخدم والحالات والتفاصيل."
          data-tour-position="bottom"
        >
          <div className="flex items-center gap-3 mb-6">
            <FiFileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('auditCompliance.auditLogs')}
            </h2>
          </div>
          
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-64">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  value={logFilter} 
                  onChange={e => setLogFilter(e.target.value)} 
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  placeholder={t('auditCompliance.filterPlaceholder')} 
                />
              </div>
              <select 
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="all">{pmLabel("All Status")}</option>
                <option value="success">{pmLabel("Success")}</option>
                <option value="failed">{pmLabel("Failed")}</option>
              </select>
              <button className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2">
                <FiDownload className="w-4 h-4" />
                {pmLabel("Export")}
              </button>
            </div>
            
            {/* Audit Logs Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">{t('auditCompliance.auditLogHeaders.date')}</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">{pmLabel("Time")}</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">{t('auditCompliance.auditLogHeaders.action')}</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">{t('auditCompliance.auditLogHeaders.user')}</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">{t('auditCompliance.auditLogHeaders.status')}</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">{pmLabel("Priority")}</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">{t('auditCompliance.auditLogHeaders.details')}</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">{pmLabel("Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, idx) => (
                    <tr key={idx} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{log.date}</td>
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{log.time}</td>
                      <td className="py-3 px-2 text-gray-900 dark:text-white">{isPM ? pmLabel(log.action) : t(`auditCompliance.${log.actionKey}`)}</td>
                      <td className="py-3 px-2 text-gray-900 dark:text-white flex items-center gap-2">
                        <FiUser className="w-4 h-4 text-gray-400" />
                        {isPM ? pmLabel(log.user) : t(`auditCompliance.${log.userKey}`)}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.statusKey?.split('.').pop() || '')}`}>
                          {t(`auditCompliance.${log.statusKey}`)}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(log.priority)}`}>
                          {pmLabel(log.priority)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <FiActivity className="w-3 h-3" />
                          {isPM ? pmLabel(log.details) : t(`auditCompliance.${log.detailsKey}`)}
                        </div>
                        {!isPM && log.ipAddress && (
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          IP: {log.ipAddress}
                        </div>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <button className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          <FiEye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>

        {/* Risk Analytics */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          data-tour="4"
          data-tour-title-en="Risk Analytics"
          data-tour-title-ar="تحليلات المخاطر"
          data-tour-content-en="Review risk levels and recommended mitigation strategies."
          data-tour-content-ar="راجع مستويات المخاطر واستراتيجيات التخفيف الموصى بها."
          data-tour-position="bottom"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FiAlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('auditCompliance.riskAnalytics')}
              </h2>
            </div>
            <select 
              value={selectedRisk}
              onChange={e => setSelectedRisk(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            >
              <option value="all">{pmLabel("All Risks")}</option>
              <option value="high">{pmLabel("High Risk")}</option>
              <option value="medium">{pmLabel("Medium Risk")}</option>
              <option value="low">{pmLabel("Low Risk")}</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredRisks.map((r, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <r.icon className={`w-6 h-6 ${r.color === 'red' ? 'text-red-600 dark:text-red-400' : r.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`} />
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(r.levelKey.split('.').pop())}`}>
                      {t(`auditCompliance.${r.levelKey}`)}
                    </span>
                    {getTrendIcon(r.trend)}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    {t(`auditCompliance.${r.riskKey}`)}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{r.score}%</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{pmLabel("Risk Score")}</div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${r.color === 'red' ? 'bg-red-500' : r.color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${r.score}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    <div className="font-medium mb-1">{t('auditCompliance.mitigation')}:</div>
                    {t(`auditCompliance.${r.mitigationKey}`)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </main>
    </div>
  );
}