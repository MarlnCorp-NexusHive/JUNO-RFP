import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  FiShield,
  FiFileText,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiSearch,
  FiUser,
  FiActivity,
  FiPlus,
  FiTrash2,
  FiEdit2,
} from "react-icons/fi";
import {
  getComplianceData,
  subscribeCompliance,
  hydrateComplianceFromServer,
  addComplianceArea,
  updateComplianceArea,
  removeComplianceArea,
  addComplianceLog,
  updateComplianceLog,
  removeComplianceLog,
  addComplianceRisk,
  updateComplianceRisk,
  removeComplianceRisk,
  getComplianceScore,
  getActiveRiskCount,
} from "../../proposal-manager/services/complianceStore.js";

const emptyAreaForm = () => ({
  name: "",
  status: "pending",
  score: 80,
  lastAudit: new Date().toISOString().slice(0, 10),
});

const emptyLogForm = () => {
  const now = new Date();
  return {
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
    action: "",
    user: "",
    status: "success",
    priority: "medium",
    details: "",
  };
};

const emptyRiskForm = () => ({
  name: "",
  level: "medium",
  score: 50,
  mitigation: "",
});

function statusColorClass(status) {
  switch (status) {
    case "success":
    case "compliant":
      return "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
    case "failed":
    case "nonCompliant":
      return "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
    case "pending":
      return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400";
    default:
      return "text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400";
  }
}

function riskColorClass(level) {
  switch (level) {
    case "high":
      return "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
    case "medium":
      return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400";
    case "low":
      return "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
    default:
      return "text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400";
  }
}

function areaIcon(status) {
  if (status === "compliant") return FiCheckCircle;
  if (status === "nonCompliant") return FiXCircle;
  return FiClock;
}

function areaBarColor(status) {
  if (status === "compliant") return "bg-green-500";
  if (status === "nonCompliant") return "bg-red-500";
  return "bg-yellow-500";
}

function riskBarColor(level) {
  if (level === "high") return "bg-red-500";
  if (level === "medium") return "bg-yellow-500";
  return "bg-green-500";
}

function riskIconColor(level) {
  if (level === "high") return "text-red-600 dark:text-red-400";
  if (level === "medium") return "text-yellow-600 dark:text-yellow-400";
  return "text-green-600 dark:text-green-400";
}

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent";

export default function TrialCompliancePanel({ isArabic = false }) {
  const { t } = useTranslation("director");
  const [data, setData] = useState(() => getComplianceData());
  const [logFilter, setLogFilter] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedRisk, setSelectedRisk] = useState("all");

  const [showAreaForm, setShowAreaForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showRiskForm, setShowRiskForm] = useState(false);
  const [areaForm, setAreaForm] = useState(emptyAreaForm);
  const [logForm, setLogForm] = useState(emptyLogForm);
  const [riskForm, setRiskForm] = useState(emptyRiskForm);
  const [editingAreaId, setEditingAreaId] = useState(null);
  const [editingLogId, setEditingLogId] = useState(null);
  const [editingRiskId, setEditingRiskId] = useState(null);

  useEffect(() => {
    setData(getComplianceData());
    const unsub = subscribeCompliance(setData);
    void hydrateComplianceFromServer().then((next) => setData(next));
    return unsub;
  }, []);

  const label = (en, ar) => (isArabic ? ar : en);
  const score = getComplianceScore(data);
  const activeRisks = getActiveRiskCount(data);

  const filteredLogs = (data.logs || []).filter((log) => {
    const searchable = [log.user, log.action, log.details].join(" ").toLowerCase();
    const matchesFilter = !logFilter || searchable.includes(logFilter.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "success" && log.status === "success") ||
      (selectedStatus === "failed" && log.status === "failed");
    return matchesFilter && matchesStatus;
  });

  const filteredRisks = (data.risks || []).filter(
    (risk) => selectedRisk === "all" || risk.level === selectedRisk
  );

  const submitArea = (e) => {
    e.preventDefault();
    if (!areaForm.name.trim()) return;
    if (editingAreaId) {
      setData(updateComplianceArea(editingAreaId, areaForm));
    } else {
      setData(addComplianceArea(areaForm));
    }
    setAreaForm(emptyAreaForm());
    setEditingAreaId(null);
    setShowAreaForm(false);
  };

  const submitLog = (e) => {
    e.preventDefault();
    if (!logForm.action.trim()) return;
    if (editingLogId) {
      setData(updateComplianceLog(editingLogId, logForm));
    } else {
      setData(addComplianceLog(logForm));
    }
    setLogForm(emptyLogForm());
    setEditingLogId(null);
    setShowLogForm(false);
  };

  const submitRisk = (e) => {
    e.preventDefault();
    if (!riskForm.name.trim()) return;
    if (editingRiskId) {
      setData(updateComplianceRisk(editingRiskId, riskForm));
    } else {
      setData(addComplianceRisk(riskForm));
    }
    setRiskForm(emptyRiskForm());
    setEditingRiskId(null);
    setShowRiskForm(false);
  };

  const startEditArea = (area) => {
    setAreaForm({
      name: area.name,
      status: area.status,
      score: area.score,
      lastAudit: area.lastAudit,
    });
    setEditingAreaId(area.id);
    setShowAreaForm(true);
  };

  const startEditLog = (log) => {
    setLogForm({
      date: log.date,
      time: log.time,
      action: log.action,
      user: log.user,
      status: log.status,
      priority: log.priority,
      details: log.details || "",
    });
    setEditingLogId(log.id);
    setShowLogForm(true);
  };

  const startEditRisk = (risk) => {
    setRiskForm({
      name: risk.name,
      level: risk.level,
      score: risk.score,
      mitigation: risk.mitigation || "",
    });
    setEditingRiskId(risk.id);
    setShowRiskForm(true);
  };

  return (
    <div className="w-full">
      <main className="w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <FiShield className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                {label("Grants and RFP Compliance", "امتثال المنح وطلبات تقديم العروض")}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {label("Compliance Score", "درجة الامتثال")}
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {(data.areas || []).length ? `${score}%` : "—"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {label("Active Risks", "المخاطر النشطة")}
                </div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {activeRisks}
                </div>
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
        >
          <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("auditCompliance.complianceStatus")}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingAreaId(null);
                setAreaForm(emptyAreaForm());
                setShowAreaForm((v) => !v);
              }}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium flex items-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              {t("auditCompliance.trialAddArea")}
            </button>
          </div>

          {showAreaForm && (
            <form
              onSubmit={submitArea}
              className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
            >
              <input
                className={inputClass}
                placeholder={t("auditCompliance.trialAreaName")}
                value={areaForm.name}
                onChange={(e) => setAreaForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <select
                className={inputClass}
                value={areaForm.status}
                onChange={(e) => setAreaForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="compliant">{t("auditCompliance.complianceStatuses.compliant")}</option>
                <option value="pending">{t("auditCompliance.complianceStatuses.pending")}</option>
                <option value="nonCompliant">{t("auditCompliance.complianceStatuses.nonCompliant")}</option>
              </select>
              <input
                type="number"
                min={0}
                max={100}
                className={inputClass}
                placeholder={t("auditCompliance.trialScore")}
                value={areaForm.score}
                onChange={(e) => setAreaForm((f) => ({ ...f, score: e.target.value }))}
              />
              <input
                type="date"
                className={inputClass}
                value={areaForm.lastAudit}
                onChange={(e) => setAreaForm((f) => ({ ...f, lastAudit: e.target.value }))}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                >
                  {editingAreaId ? t("auditCompliance.trialSave") : t("auditCompliance.trialAdd")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAreaForm(false);
                    setEditingAreaId(null);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg text-sm text-gray-700 dark:text-gray-200"
                >
                  {t("auditCompliance.trialCancel")}
                </button>
              </div>
            </form>
          )}

          {(data.areas || []).length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
              {t("auditCompliance.trialEmptyAreas")}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(data.areas || []).map((c) => {
                const Icon = areaIcon(c.status);
                return (
                  <div
                    key={c.id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Icon
                        className={`w-6 h-6 ${
                          c.status === "compliant"
                            ? "text-green-600 dark:text-green-400"
                            : c.status === "nonCompliant"
                              ? "text-red-600 dark:text-red-400"
                              : "text-yellow-600 dark:text-yellow-400"
                        }`}
                      />
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusColorClass(c.status)}`}
                      >
                        {t(`auditCompliance.complianceStatuses.${c.status}`)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="font-semibold text-sm text-gray-900 dark:text-white">{c.name}</div>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{c.score}%</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {t("auditCompliance.lastAudit")}: {c.lastAudit}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${areaBarColor(c.status)}`}
                          style={{ width: `${c.score}%` }}
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => startEditArea(c)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          aria-label={t("auditCompliance.trialEdit")}
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setData(removeComplianceArea(c.id))}
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          aria-label={t("auditCompliance.trialDelete")}
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* Audit Logs */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <FiFileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("auditCompliance.auditLogs")}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingLogId(null);
                setLogForm(emptyLogForm());
                setShowLogForm((v) => !v);
              }}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium flex items-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              {t("auditCompliance.trialAddLog")}
            </button>
          </div>

          {showLogForm && (
            <form
              onSubmit={submitLog}
              className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
            >
              <input
                type="date"
                className={inputClass}
                value={logForm.date}
                onChange={(e) => setLogForm((f) => ({ ...f, date: e.target.value }))}
              />
              <input
                type="time"
                className={inputClass}
                value={logForm.time}
                onChange={(e) => setLogForm((f) => ({ ...f, time: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder={t("auditCompliance.auditLogHeaders.action")}
                value={logForm.action}
                onChange={(e) => setLogForm((f) => ({ ...f, action: e.target.value }))}
                required
              />
              <input
                className={inputClass}
                placeholder={t("auditCompliance.auditLogHeaders.user")}
                value={logForm.user}
                onChange={(e) => setLogForm((f) => ({ ...f, user: e.target.value }))}
              />
              <select
                className={inputClass}
                value={logForm.status}
                onChange={(e) => setLogForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="success">{t("auditCompliance.auditStatuses.success")}</option>
                <option value="failed">{t("auditCompliance.auditStatuses.failed")}</option>
              </select>
              <select
                className={inputClass}
                value={logForm.priority}
                onChange={(e) => setLogForm((f) => ({ ...f, priority: e.target.value }))}
              >
                <option value="low">{t("auditCompliance.riskLevels.low")}</option>
                <option value="medium">{t("auditCompliance.riskLevels.medium")}</option>
                <option value="high">{t("auditCompliance.riskLevels.high")}</option>
              </select>
              <input
                className={`${inputClass} lg:col-span-2`}
                placeholder={t("auditCompliance.auditLogHeaders.details")}
                value={logForm.details}
                onChange={(e) => setLogForm((f) => ({ ...f, details: e.target.value }))}
              />
              <div className="flex gap-2 lg:col-span-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                >
                  {editingLogId ? t("auditCompliance.trialSave") : t("auditCompliance.trialAdd")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogForm(false);
                    setEditingLogId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-500 rounded-lg text-sm text-gray-700 dark:text-gray-200"
                >
                  {t("auditCompliance.trialCancel")}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t("auditCompliance.filterPlaceholder")}
                />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">{label("All Status", "كل الحالات")}</option>
                <option value="success">{t("auditCompliance.auditStatuses.success")}</option>
                <option value="failed">{t("auditCompliance.auditStatuses.failed")}</option>
              </select>
            </div>

            {(data.logs || []).length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
                {t("auditCompliance.trialEmptyLogs")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                      <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                        {t("auditCompliance.auditLogHeaders.date")}
                      </th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                        {label("Time", "الوقت")}
                      </th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                        {t("auditCompliance.auditLogHeaders.action")}
                      </th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                        {t("auditCompliance.auditLogHeaders.user")}
                      </th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                        {t("auditCompliance.auditLogHeaders.status")}
                      </th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                        {label("Priority", "الأولوية")}
                      </th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                        {t("auditCompliance.auditLogHeaders.details")}
                      </th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">
                        {label("Actions", "الإجراءات")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{log.date}</td>
                        <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{log.time}</td>
                        <td className="py-3 px-2 text-gray-900 dark:text-white">{log.action}</td>
                        <td className="py-3 px-2 text-gray-900 dark:text-white">
                          <span className="inline-flex items-center gap-2">
                            <FiUser className="w-4 h-4 text-gray-400" />
                            {log.user}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColorClass(log.status)}`}
                          >
                            {t(`auditCompliance.auditStatuses.${log.status}`)}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${riskColorClass(log.priority)}`}
                          >
                            {t(`auditCompliance.riskLevels.${log.priority}`)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-gray-600 dark:text-gray-400">
                          <span className="inline-flex items-center gap-1">
                            <FiActivity className="w-3 h-3" />
                            {log.details}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => startEditLog(log)}
                              className="p-1 text-gray-400 hover:text-blue-600"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setData(removeComplianceLog(log.id))}
                              className="p-1 text-gray-400 hover:text-red-600"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.section>

        {/* Risk Analytics */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <FiAlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("auditCompliance.riskAnalytics")}
              </h2>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">{label("All Risks", "كل المخاطر")}</option>
                <option value="high">{label("High Risk", "مخاطر مرتفعة")}</option>
                <option value="medium">{label("Medium Risk", "مخاطر متوسطة")}</option>
                <option value="low">{label("Low Risk", "مخاطر منخفضة")}</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  setEditingRiskId(null);
                  setRiskForm(emptyRiskForm());
                  setShowRiskForm((v) => !v);
                }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium flex items-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                {t("auditCompliance.trialAddRisk")}
              </button>
            </div>
          </div>

          {showRiskForm && (
            <form
              onSubmit={submitRisk}
              className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
            >
              <input
                className={inputClass}
                placeholder={t("auditCompliance.trialRiskName")}
                value={riskForm.name}
                onChange={(e) => setRiskForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <select
                className={inputClass}
                value={riskForm.level}
                onChange={(e) => setRiskForm((f) => ({ ...f, level: e.target.value }))}
              >
                <option value="low">{t("auditCompliance.riskLevels.low")}</option>
                <option value="medium">{t("auditCompliance.riskLevels.medium")}</option>
                <option value="high">{t("auditCompliance.riskLevels.high")}</option>
              </select>
              <input
                type="number"
                min={0}
                max={100}
                className={inputClass}
                placeholder={t("auditCompliance.trialScore")}
                value={riskForm.score}
                onChange={(e) => setRiskForm((f) => ({ ...f, score: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder={t("auditCompliance.mitigation")}
                value={riskForm.mitigation}
                onChange={(e) => setRiskForm((f) => ({ ...f, mitigation: e.target.value }))}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                >
                  {editingRiskId ? t("auditCompliance.trialSave") : t("auditCompliance.trialAdd")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRiskForm(false);
                    setEditingRiskId(null);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg text-sm text-gray-700 dark:text-gray-200"
                >
                  {t("auditCompliance.trialCancel")}
                </button>
              </div>
            </form>
          )}

          {(data.risks || []).length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
              {t("auditCompliance.trialEmptyRisks")}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredRisks.map((r) => (
                <div
                  key={r.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center justify-between mb-4">
                    <FiAlertTriangle className={`w-6 h-6 ${riskIconColor(r.level)}`} />
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${riskColorClass(r.level)}`}
                    >
                      {t(`auditCompliance.riskLevels.${r.level}`)}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">{r.name}</div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{r.score}%</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {label("Risk Score", "درجة المخاطر")}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${riskBarColor(r.level)}`}
                        style={{ width: `${r.score}%` }}
                      />
                    </div>
                    {r.mitigation ? (
                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        <div className="font-medium mb-1">{t("auditCompliance.mitigation")}:</div>
                        {r.mitigation}
                      </div>
                    ) : null}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => startEditRisk(r)}
                        className="p-1.5 text-gray-400 hover:text-blue-600"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setData(removeComplianceRisk(r.id))}
                        className="p-1.5 text-gray-400 hover:text-red-600"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
}
