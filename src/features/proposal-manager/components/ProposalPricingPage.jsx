import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import { FiDollarSign, FiTrendingUp, FiPackage, FiUsers, FiFileText, FiZap, FiX } from "react-icons/fi";
import { useProposalIssuer } from "./ProposalIssuerContext";
import IssuerFinancialPanel from "./IssuerFinancialPanel";

const laborRates = [
  { role: "Project Manager", rate: 185, loaded: 220, billable: 185 },
  { role: "Technical Lead", rate: 165, loaded: 198, billable: 165 },
  { role: "Proposal Writer", rate: 125, loaded: 152, billable: 125 },
  { role: "Compliance", rate: 115, loaded: 138, billable: 115 },
  { role: "Graphics", rate: 95, loaded: 118, billable: 95 },
];

const costVolumes = [
  { proposal: "Water Wastewater RFP", labor: 420, subcontractors: 85, odc: 22, total: 527 },
  { proposal: "Landscape Maintenance", labor: 280, subcontractors: 45, odc: 12, total: 337 },
  { proposal: "Airport Restaurant", labor: 95, subcontractors: 0, odc: 8, total: 103 },
  { proposal: "Balsitis Playground", labor: 310, subcontractors: 60, odc: 15, total: 385 },
  { proposal: "Surplus Tanks", labor: 180, subcontractors: 120, odc: 25, total: 325 },
];

const pricingTrend = [
  { month: "Jan", winPrice: 2.2, targetCost: 1.8 },
  { month: "Feb", winPrice: 2.5, targetCost: 2.0 },
  { month: "Mar", winPrice: 2.1, targetCost: 1.7 },
  { month: "Apr", winPrice: 2.8, targetCost: 2.2 },
  { month: "May", winPrice: 2.4, targetCost: 1.9 },
  { month: "Jun", winPrice: 2.6, targetCost: 2.1 },
];

export default function ProposalPricingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { issuer, clearLink } = useProposalIssuer();
  const [activeTab, setActiveTab] = useState("labor");

  const monthLabel = (value) =>
    t(`proposalManagerPricing.months.${value}`, { defaultValue: value });

  const roleLabel = (value) =>
    t(`proposalManagerPricing.roles.${value}`, { defaultValue: value });

  const proposalLabel = (value) =>
    t(`proposalManagerPricing.proposals.${value}`, { defaultValue: value });

  useEffect(() => {
    if (issuer?.linkedAt) setActiveTab("customer");
  }, [issuer?.linkedAt]);

  useEffect(() => {
    if (!issuer && activeTab === "customer") setActiveTab("labor");
  }, [issuer, activeTab]);

  const tabs = [
    { id: "labor", label: t("proposalManagerPricing.tabs.laborRates") },
    { id: "volumes", label: t("proposalManagerPricing.tabs.costVolumes") },
    { id: "trends", label: t("proposalManagerPricing.tabs.trends") },
    { id: "customer", label: t("proposalManagerPricing.tabs.customerIntel") },
  ];

  return (
    <div className="flex min-h-screen bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-8 overflow-x-auto">
        {issuer && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-indigo-50 via-white to-blue-50 dark:from-indigo-950/50 dark:via-gray-800 dark:to-blue-950/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FiZap className="w-5 h-5 text-indigo-600 shrink-0" />
              <p className="text-sm text-gray-800 dark:text-gray-200">
                <span className="font-semibold">{t("proposalManagerPricing.liveLinkPrefix")}</span>{" "}
                <span className="text-indigo-700 dark:text-indigo-300">{issuer.name}</span>
                {issuer.ticker ? ` (${issuer.ticker})` : ""} {t("proposalManagerPricing.liveLinkSuffix")}
              </p>
            </div>
            <button
              type="button"
              onClick={clearLink}
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            >
              <FiX className="w-3.5 h-3.5" /> {t("proposalManagerPricing.clearLink")}
            </button>
          </motion.div>
        )}

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("proposalManagerPricing.title")}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t("proposalManagerPricing.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={tab.id === "customer" && !issuer}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900"
                } ${tab.id === "customer" && !issuer ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "labor" && (
          <>
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center gap-2 mb-4">
                <FiUsers className="w-6 h-6 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("proposalManagerPricing.sections.laborRatesByRole")}</h2>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={laborRates} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="role" tick={{ fontSize: 11 }} tickFormatter={roleLabel} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rate" fill="#6366f1" radius={[4, 4, 0, 0]} name={t("proposalManagerPricing.series.blendedPerHour")} />
                  <Bar dataKey="loaded" fill="#22c55e" radius={[4, 4, 0, 0]} name={t("proposalManagerPricing.series.loadedPerHour")} />
                  <Bar dataKey="billable" fill="#f59e0b" radius={[4, 4, 0, 0]} name={t("proposalManagerPricing.series.billablePerHour")} />
                </BarChart>
              </ResponsiveContainer>
            </motion.section>
          </>
        )}

        {activeTab === "volumes" && (
          <>
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center gap-2 mb-4">
                <FiPackage className="w-6 h-6 text-green-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("proposalManagerPricing.sections.costVolumesByProposal")}</h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costVolumes} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="proposal" tick={{ fontSize: 10 }} tickFormatter={proposalLabel} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="labor" fill="#6366f1" radius={[4, 4, 0, 0]} name={t("proposalManagerPricing.series.labor")} />
                  <Bar dataKey="subcontractors" fill="#22c55e" radius={[4, 4, 0, 0]} name={t("proposalManagerPricing.series.subcontractors")} />
                  <Bar dataKey="odc" fill="#f59e0b" radius={[4, 4, 0, 0]} name="ODC" />
                  <Bar dataKey="total" fill="#8b5cf6" radius={[4, 4, 0, 0]} name={t("proposalManagerPricing.series.total")} />
                </BarChart>
              </ResponsiveContainer>
            </motion.section>
          </>
        )}

        {activeTab === "customer" && issuer && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-indigo-100 dark:border-indigo-900/40"
          >
            <div className="flex items-center gap-2 mb-6">
              <FiZap className="w-6 h-6 text-indigo-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("proposalManagerPricing.sections.customerFinancialProfile")}</h2>
            </div>
            <IssuerFinancialPanel snapshot={issuer} />
          </motion.section>
        )}

        {activeTab === "customer" && !issuer && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 text-center"
          >
            <FiZap className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t("proposalManagerPricing.emptyCustomer.title")}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
              {t("proposalManagerPricing.emptyCustomer.description")}
            </p>
            <button
              type="button"
              onClick={() => navigate("/rbac/proposal-manager/company-intelligence")}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500"
            >
              {t("proposalManagerPricing.emptyCustomer.cta")}
            </button>
          </motion.section>
        )}

        {activeTab === "trends" && (
          <>
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center gap-2 mb-4">
                <FiTrendingUp className="w-6 h-6 text-purple-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("proposalManagerPricing.sections.winPriceVsTargetCost")}</h2>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={pricingTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={monthLabel} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="winPrice" stroke="#6366f1" strokeWidth={2} name={t("proposalManagerPricing.series.winPrice")} />
                  <Line type="monotone" dataKey="targetCost" stroke="#22c55e" strokeWidth={2} name={t("proposalManagerPricing.series.targetCost")} />
                </LineChart>
              </ResponsiveContainer>
            </motion.section>
          </>
        )}

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center gap-2 mb-4">
            <FiFileText className="w-6 h-6 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("proposalManagerPricing.sections.pricingSummary")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">{t("proposalManagerPricing.summary.activeProposals")}</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">4</div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">{t("proposalManagerPricing.summary.avgWinPriceYtd")}</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">$2.4M</div>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">{t("proposalManagerPricing.summary.targetCostRatio")}</div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">82%</div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">{t("proposalManagerPricing.summary.subcontractorShare")}</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">18%</div>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
