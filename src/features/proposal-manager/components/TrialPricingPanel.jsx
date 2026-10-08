import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import {
  FiTrendingUp,
  FiPackage,
  FiUsers,
  FiFileText,
  FiPlus,
  FiTrash2,
  FiZap,
  FiStar,
  FiEdit2,
} from "react-icons/fi";
import {
  getPricingData,
  subscribePricing,
  hydratePricingFromServer,
  addLaborRate,
  updateLaborRate,
  removeLaborRate,
  replaceLaborRates,
  addVolume,
  updateVolume,
  removeVolume,
  openOrCreateVolumeForShortlist,
  applyHourEstimatesToVolume,
  getPricingSummary,
  laborRatesChartData,
  volumesChartData,
  volumesTrendData,
  formatMoney,
} from "../services/pricingStore.js";
import { listShortlist, hydrateShortlistFromServer, subscribeShortlist } from "../services/shortlistStore.js";
import {
  suggestPricingRates,
  estimatePricingHours,
  pricingRiskNote,
} from "../../../services/api.js";

const emptyRate = () => ({ role: "", rate: 100, loaded: 120, billable: 100, notes: "" });
const emptyVolume = () => ({
  title: "",
  subcontractors: 0,
  odc: 0,
  bidPrice: "",
  targetCost: "",
  laborLines: [{ role: "", hours: 40, rate: 100 }],
});

function riskLevelClass(level) {
  if (level === "high") return "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-100";
  if (level === "low") return "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100";
  return "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100";
}

export default function TrialPricingPanel({ issuer, clearLink }) {
  const { t, i18n } = useTranslation();
  const isArabic = String(i18n?.resolvedLanguage || i18n?.language || "").toLowerCase().startsWith("ar");
  const label = (en, ar) => (isArabic ? ar : en);
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(() => getPricingData());
  const [shortlist, setShortlist] = useState(() => listShortlist());
  const [activeTab, setActiveTab] = useState("labor");
  const [showRateForm, setShowRateForm] = useState(false);
  const [rateForm, setRateForm] = useState(emptyRate);
  const [editingRateId, setEditingRateId] = useState(null);
  const [showVolumeForm, setShowVolumeForm] = useState(false);
  const [volumeForm, setVolumeForm] = useState(emptyVolume);
  const [editingVolumeId, setEditingVolumeId] = useState(null);
  const [selectedVolumeId, setSelectedVolumeId] = useState(null);
  const [aiBusy, setAiBusy] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiRationale, setAiRationale] = useState("");
  const [risk, setRisk] = useState(null);
  const deepLinkHandled = useRef("");

  useEffect(() => {
    setData(getPricingData());
    const unsub = subscribePricing(setData);
    void hydratePricingFromServer().then(setData);
    return unsub;
  }, []);

  useEffect(() => {
    setShortlist(listShortlist());
    const unsub = subscribeShortlist(setShortlist);
    void hydrateShortlistFromServer().then(setShortlist);
    return unsub;
  }, []);

  // Deep link ?shortlistId= or ?volume=
  useEffect(() => {
    const shortlistParam = searchParams.get("shortlistId");
    const volumeParam = searchParams.get("volume");
    const key = `${shortlistParam || ""}|${volumeParam || ""}`;
    if (!key || key === "|" || deepLinkHandled.current === key) return;

    if (volumeParam && data.volumes.some((v) => v.id === volumeParam)) {
      deepLinkHandled.current = key;
      setSelectedVolumeId(volumeParam);
      setActiveTab("volumes");
      return;
    }
    if (shortlistParam) {
      const item = shortlist.find((s) => s.id === shortlistParam);
      if (!item && shortlist.length === 0) return;
      deepLinkHandled.current = key;
      if (item) {
        const result = openOrCreateVolumeForShortlist(item);
        if (result?.volume) {
          setData(getPricingData());
          setSelectedVolumeId(result.volume.id);
          setActiveTab("volumes");
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.delete("shortlistId");
              next.set("volume", result.volume.id);
              return next;
            },
            { replace: true },
          );
        }
      }
    }
  }, [searchParams, data.volumes, shortlist, setSearchParams]);

  const summary = useMemo(() => getPricingSummary(data), [data]);
  const laborChart = useMemo(() => laborRatesChartData(data), [data]);
  const volumeChart = useMemo(() => volumesChartData(data), [data]);
  const trendChart = useMemo(() => volumesTrendData(data), [data]);
  const currency = data.settings?.currency || "USD";
  const selectedVolume = data.volumes.find((v) => v.id === selectedVolumeId) || null;

  const tabs = [
    { id: "labor", label: t("proposalManagerPricing.tabs.laborRates") },
    { id: "volumes", label: t("proposalManagerPricing.tabs.costVolumes") },
    { id: "trends", label: t("proposalManagerPricing.tabs.trends") },
  ];

  const submitRate = (e) => {
    e.preventDefault();
    if (!rateForm.role.trim()) return;
    if (editingRateId) {
      setData(updateLaborRate(editingRateId, rateForm));
    } else {
      setData(addLaborRate(rateForm));
    }
    setRateForm(emptyRate());
    setEditingRateId(null);
    setShowRateForm(false);
  };

  const submitVolume = (e) => {
    e.preventDefault();
    const payload = {
      title: volumeForm.title.trim() || label("Cost volume", "حجم التكلفة"),
      subcontractors: Number(volumeForm.subcontractors) || 0,
      odc: Number(volumeForm.odc) || 0,
      bidPrice: volumeForm.bidPrice === "" ? null : Number(volumeForm.bidPrice),
      targetCost: volumeForm.targetCost === "" ? null : Number(volumeForm.targetCost),
      laborLines: (volumeForm.laborLines || [])
        .filter((l) => String(l.role || "").trim())
        .map((l) => ({
          role: String(l.role).trim(),
          hours: Number(l.hours) || 0,
          rate: Number(l.rate) || 0,
        })),
    };
    if (editingVolumeId) {
      const vol = updateVolume(editingVolumeId, payload);
      setData(getPricingData());
      if (vol) setSelectedVolumeId(vol.id);
    } else {
      const vol = addVolume(payload);
      setData(getPricingData());
      setSelectedVolumeId(vol.id);
    }
    setVolumeForm(emptyVolume());
    setEditingVolumeId(null);
    setShowVolumeForm(false);
  };

  const startKickoffVolume = (item) => {
    const result = openOrCreateVolumeForShortlist(item);
    if (!result?.volume) return;
    setData(getPricingData());
    setSelectedVolumeId(result.volume.id);
    setActiveTab("volumes");
  };

  const runSuggestRates = async () => {
    setAiBusy("rates");
    setAiError("");
    setAiRationale("");
    try {
      const result = await suggestPricingRates({
        industry: "government contracting / grants",
        existingRoles: data.laborRates.map((r) => r.role),
        context: issuer?.name ? `Linked customer: ${issuer.name}` : "",
      });
      if (result?.rates?.length) {
        // Prefer replace only when empty; otherwise append unique roles
        if (!data.laborRates.length) {
          setData(replaceLaborRates(result.rates));
        } else {
          const existing = new Set(data.laborRates.map((r) => r.role.toLowerCase()));
          result.rates.forEach((r) => {
            if (!existing.has(String(r.role).toLowerCase())) {
              addLaborRate(r);
              existing.add(String(r.role).toLowerCase());
            }
          });
          setData(getPricingData());
        }
        setAiRationale(result.rationale || "");
      }
    } catch (err) {
      setAiError(err?.response?.data?.error || err?.message || label("AI rates failed", "فشل اقتراح الأسعار"));
    } finally {
      setAiBusy("");
    }
  };

  const runEstimateHours = async () => {
    if (!selectedVolume) return;
    setAiBusy("hours");
    setAiError("");
    try {
      const result = await estimatePricingHours({
        opportunity: {
          title: selectedVolume.title,
          number: selectedVolume.opportunityNumber,
          agency: selectedVolume.opportunityAgency,
          deadline: selectedVolume.opportunityDeadline,
        },
        roles: data.laborRates.map((r) => r.role),
      });
      if (result?.lines?.length) {
        applyHourEstimatesToVolume(selectedVolume.id, result.lines);
        setData(getPricingData());
        setAiRationale(result.assumptions || "");
      }
    } catch (err) {
      setAiError(err?.response?.data?.error || err?.message || label("Hour estimate failed", "فشل تقدير الساعات"));
    } finally {
      setAiBusy("");
    }
  };

  const runRiskNote = async () => {
    if (!selectedVolume) return;
    setAiBusy("risk");
    setAiError("");
    setRisk(null);
    try {
      const vol = getPricingData().volumes.find((v) => v.id === selectedVolume.id) || selectedVolume;
      const result = await pricingRiskNote({
        volume: {
          title: vol.title,
          laborTotal: vol.labor,
          subcontractors: vol.subcontractors,
          odc: vol.odc,
          total: vol.total,
          bidPrice: vol.bidPrice,
          targetCost: vol.targetCost,
          laborLines: vol.laborLines,
        },
      });
      setRisk(result);
    } catch (err) {
      setAiError(err?.response?.data?.error || err?.message || label("Risk note failed", "فشل تقييم المخاطر"));
    } finally {
      setAiBusy("");
    }
  };

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white";

  return (
    <div className="flex flex-col gap-6">
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
          {clearLink && (
            <button
              type="button"
              onClick={clearLink}
              className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-red-600"
            >
              {t("proposalManagerPricing.clearLink")}
            </button>
          )}
        </motion.div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("proposalManagerPricing.title")}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {label(
              "Company rate card and cost volumes — shared across your company.",
              "بطاقة أسعار الشركة وأحجام التكلفة — مشتركة عبر شركتك.",
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {aiError && (
        <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 rounded-lg px-3 py-2">
          {aiError}
        </div>
      )}
      {aiRationale && (
        <div className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
          {aiRationale}
        </div>
      )}

      {/* Summary */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <FiFileText className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("proposalManagerPricing.sections.pricingSummary")}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">{t("proposalManagerPricing.summary.activeProposals")}</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.activeProposals}</div>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">{label("Avg. bid price", "متوسط سعر العرض")}</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {summary.avgBidPrice ? formatMoney(summary.avgBidPrice, currency) : "—"}
            </div>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">{t("proposalManagerPricing.summary.targetCostRatio")}</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {summary.targetCostRatio != null ? `${summary.targetCostRatio}%` : "—"}
            </div>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">{t("proposalManagerPricing.summary.subcontractorShare")}</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{summary.subcontractorShare}%</div>
          </div>
        </div>
      </section>

      {activeTab === "labor" && (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingRateId(null);
                setRateForm(emptyRate());
                setShowRateForm((v) => !v);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2"
            >
              <FiPlus /> {label("Add rate", "إضافة سعر")}
            </button>
            <button
              type="button"
              disabled={!!aiBusy}
              onClick={runSuggestRates}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-sm font-medium px-3 py-2 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-100 disabled:opacity-50"
            >
              <FiZap /> {aiBusy === "rates" ? label("Suggesting…", "جاري الاقتراح…") : label("AI suggest rate card", "اقتراح بطاقة أسعار")}
            </button>
          </div>

          {showRateForm && (
            <form onSubmit={submitRate} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-100 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300 lg:col-span-2">
                {label("Role", "الدور")}
                <input className={`${inputClass} mt-1`} value={rateForm.role} onChange={(e) => setRateForm((f) => ({ ...f, role: e.target.value }))} required />
              </label>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {label("Base $/hr", "أساسي $/ساعة")}
                <input type="number" min="0" step="1" className={`${inputClass} mt-1`} value={rateForm.rate} onChange={(e) => setRateForm((f) => ({ ...f, rate: e.target.value }))} />
              </label>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {label("Loaded $/hr", "محمّل $/ساعة")}
                <input type="number" min="0" step="1" className={`${inputClass} mt-1`} value={rateForm.loaded} onChange={(e) => setRateForm((f) => ({ ...f, loaded: e.target.value }))} />
              </label>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {label("Billable $/hr", "قابل للفوترة $/ساعة")}
                <input type="number" min="0" step="1" className={`${inputClass} mt-1`} value={rateForm.billable} onChange={(e) => setRateForm((f) => ({ ...f, billable: e.target.value }))} />
              </label>
              <div className="sm:col-span-2 lg:col-span-5 flex gap-2">
                <button type="submit" className="rounded-lg bg-blue-600 text-white text-sm px-4 py-2">
                  {editingRateId ? label("Save", "حفظ") : label("Add", "إضافة")}
                </button>
                <button type="button" onClick={() => { setShowRateForm(false); setEditingRateId(null); }} className="rounded-lg border text-sm px-4 py-2 dark:border-gray-600">
                  {label("Cancel", "إلغاء")}
                </button>
              </div>
            </form>
          )}

          {laborChart.length > 0 ? (
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <FiUsers className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold">{t("proposalManagerPricing.sections.laborRatesByRole")}</h2>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={laborChart} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="role" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rate" fill="#6366f1" radius={[4, 4, 0, 0]} name={t("proposalManagerPricing.series.blendedPerHour")} />
                  <Bar dataKey="loaded" fill="#22c55e" radius={[4, 4, 0, 0]} name={t("proposalManagerPricing.series.loadedPerHour")} />
                  <Bar dataKey="billable" fill="#f59e0b" radius={[4, 4, 0, 0]} name={t("proposalManagerPricing.series.billablePerHour")} />
                </BarChart>
              </ResponsiveContainer>
            </motion.section>
          ) : (
            <p className="text-sm text-gray-500 text-center py-6">{label("No rates yet. Add a role or use AI suggest.", "لا أسعار بعد. أضف دوراً أو استخدم الاقتراح.")}</p>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/40 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-2">{label("Role", "الدور")}</th>
                  <th className="px-4 py-2">{label("Base", "أساسي")}</th>
                  <th className="px-4 py-2">{label("Loaded", "محمّل")}</th>
                  <th className="px-4 py-2">{label("Billable", "قابل للفوترة")}</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.laborRates.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{r.role}</td>
                    <td className="px-4 py-2">{formatMoney(r.rate, currency)}</td>
                    <td className="px-4 py-2">{formatMoney(r.loaded, currency)}</td>
                    <td className="px-4 py-2">{formatMoney(r.billable, currency)}</td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button type="button" className="text-blue-600" onClick={() => { setEditingRateId(r.id); setRateForm({ role: r.role, rate: r.rate, loaded: r.loaded, billable: r.billable, notes: r.notes || "" }); setShowRateForm(true); }}>
                        <FiEdit2 />
                      </button>
                      <button type="button" className="text-rose-600" onClick={() => setData(removeLaborRate(r.id))}>
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "volumes" && (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingVolumeId(null);
                setVolumeForm(emptyVolume());
                setShowVolumeForm((v) => !v);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2"
            >
              <FiPlus /> {label("New volume", "حجم جديد")}
            </button>
            {selectedVolume && (
              <>
                <button type="button" disabled={!!aiBusy} onClick={runEstimateHours} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-sm font-medium px-3 py-2 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-100 disabled:opacity-50">
                  <FiZap /> {aiBusy === "hours" ? label("Estimating…", "جاري التقدير…") : label("AI estimate hours", "تقدير الساعات")}
                </button>
                <button type="button" disabled={!!aiBusy} onClick={runRiskNote} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-300 bg-violet-50 text-violet-900 text-sm font-medium px-3 py-2 dark:border-violet-600 dark:bg-violet-950/40 dark:text-violet-100 disabled:opacity-50">
                  {aiBusy === "risk" ? label("Reviewing…", "جاري المراجعة…") : label("AI price risk", "مخاطر السعر")}
                </button>
              </>
            )}
          </div>

          {shortlist.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-100 dark:border-gray-700">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1">
                <FiStar className="text-amber-500" />
                {label("Build volume from shortlist", "ابنِ حجماً من القائمة المختصرة")}
              </div>
              <div className="flex flex-wrap gap-2">
                {shortlist.slice(0, 8).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => startKickoffVolume(item)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-400 truncate max-w-[14rem]"
                  >
                    {item.title || item.number || item.id}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showVolumeForm && (
            <form onSubmit={submitVolume} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-100 dark:border-gray-700 space-y-3">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">
                {label("Title", "العنوان")}
                <input className={`${inputClass} mt-1`} value={volumeForm.title} onChange={(e) => setVolumeForm((f) => ({ ...f, title: e.target.value }))} required />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {label("Subcontractors $", "مقاولون فرعيون $")}
                  <input type="number" min="0" className={`${inputClass} mt-1`} value={volumeForm.subcontractors} onChange={(e) => setVolumeForm((f) => ({ ...f, subcontractors: e.target.value }))} />
                </label>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  ODC $
                  <input type="number" min="0" className={`${inputClass} mt-1`} value={volumeForm.odc} onChange={(e) => setVolumeForm((f) => ({ ...f, odc: e.target.value }))} />
                </label>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {label("Bid price $", "سعر العرض $")}
                  <input type="number" min="0" className={`${inputClass} mt-1`} value={volumeForm.bidPrice} onChange={(e) => setVolumeForm((f) => ({ ...f, bidPrice: e.target.value }))} />
                </label>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {label("Target cost $", "التكلفة المستهدفة $")}
                  <input type="number" min="0" className={`${inputClass} mt-1`} value={volumeForm.targetCost} onChange={(e) => setVolumeForm((f) => ({ ...f, targetCost: e.target.value }))} />
                </label>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">{label("Labor lines", "بنود العمالة")}</div>
                {(volumeForm.laborLines || []).map((line, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2">
                    <input
                      placeholder={label("Role", "الدور")}
                      className={inputClass}
                      value={line.role}
                      list="pricing-roles"
                      onChange={(e) => {
                        const laborLines = [...volumeForm.laborLines];
                        laborLines[idx] = { ...laborLines[idx], role: e.target.value };
                        const match = data.laborRates.find((r) => r.role.toLowerCase() === e.target.value.toLowerCase());
                        if (match) laborLines[idx].rate = match.billable;
                        setVolumeForm((f) => ({ ...f, laborLines }));
                      }}
                    />
                    <input type="number" min="0" placeholder={label("Hours", "ساعات")} className={inputClass} value={line.hours} onChange={(e) => {
                      const laborLines = [...volumeForm.laborLines];
                      laborLines[idx] = { ...laborLines[idx], hours: e.target.value };
                      setVolumeForm((f) => ({ ...f, laborLines }));
                    }} />
                    <input type="number" min="0" placeholder={label("Rate", "سعر")} className={inputClass} value={line.rate} onChange={(e) => {
                      const laborLines = [...volumeForm.laborLines];
                      laborLines[idx] = { ...laborLines[idx], rate: e.target.value };
                      setVolumeForm((f) => ({ ...f, laborLines }));
                    }} />
                  </div>
                ))}
                <datalist id="pricing-roles">
                  {data.laborRates.map((r) => (
                    <option key={r.id} value={r.role} />
                  ))}
                </datalist>
                <button
                  type="button"
                  className="text-xs text-blue-600"
                  onClick={() => setVolumeForm((f) => ({ ...f, laborLines: [...(f.laborLines || []), { role: "", hours: 40, rate: 100 }] }))}
                >
                  + {label("Add labor line", "إضافة بند عمالة")}
                </button>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="rounded-lg bg-blue-600 text-white text-sm px-4 py-2">
                  {editingVolumeId ? label("Save volume", "حفظ الحجم") : label("Create volume", "إنشاء الحجم")}
                </button>
                <button type="button" onClick={() => { setShowVolumeForm(false); setEditingVolumeId(null); }} className="rounded-lg border text-sm px-4 py-2 dark:border-gray-600">
                  {label("Cancel", "إلغاء")}
                </button>
              </div>
            </form>
          )}

          {risk && (
            <div className={`rounded-xl border p-4 text-sm space-y-1 ${riskLevelClass(risk.level)}`}>
              <div className="font-semibold">{risk.headline} ({risk.level})</div>
              {risk.notes?.map((n) => <div key={n}>• {n}</div>)}
              {risk.actions?.length > 0 && (
                <div className="pt-1">
                  <span className="font-medium">{label("Actions", "إجراءات")}:</span> {risk.actions.join(" · ")}
                </div>
              )}
            </div>
          )}

          {volumeChart.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <FiPackage className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold">{t("proposalManagerPricing.sections.costVolumesByProposal")}</h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={volumeChart} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="proposal" tick={{ fontSize: 10 }} />
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
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {data.volumes.length === 0 ? (
              <p className="text-sm text-gray-500 col-span-full text-center py-6">
                {label("No cost volumes yet. Create one or build from shortlist.", "لا أحجام تكلفة بعد. أنشئ واحداً أو ابنِ من القائمة المختصرة.")}
              </p>
            ) : (
              data.volumes.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVolumeId(v.id)}
                  className={`text-left rounded-xl border p-4 bg-white dark:bg-gray-800 shadow-sm transition ${
                    selectedVolumeId === v.id ? "border-blue-500 ring-1 ring-blue-400" : "border-gray-100 dark:border-gray-700"
                  }`}
                >
                  <div className="flex justify-between gap-2">
                    <div className="font-semibold text-gray-900 dark:text-white truncate">{v.title}</div>
                    <div className="text-sm font-bold text-blue-600 shrink-0">{formatMoney(v.total, currency)}</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {label("Labor", "عمالة")} {formatMoney(v.labor, currency)} · Subs {formatMoney(v.subcontractors, currency)} · ODC {formatMoney(v.odc, currency)}
                  </div>
                  {(v.bidPrice != null || v.targetCost != null) && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {v.bidPrice != null ? `${label("Bid", "عرض")} ${formatMoney(v.bidPrice, currency)}` : ""}
                      {v.bidPrice != null && v.targetCost != null ? " · " : ""}
                      {v.targetCost != null ? `${label("Target", "هدف")} ${formatMoney(v.targetCost, currency)}` : ""}
                    </div>
                  )}
                  <div className="mt-2 flex gap-2">
                    <span
                      role="button"
                      tabIndex={0}
                      className="text-xs text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingVolumeId(v.id);
                        setVolumeForm({
                          title: v.title,
                          subcontractors: v.subcontractors,
                          odc: v.odc,
                          bidPrice: v.bidPrice ?? "",
                          targetCost: v.targetCost ?? "",
                          laborLines: (v.laborLines || []).length
                            ? v.laborLines.map((l) => ({ role: l.role, hours: l.hours, rate: l.rate }))
                            : [{ role: "", hours: 40, rate: 100 }],
                        });
                        setShowVolumeForm(true);
                      }}
                    >
                      {label("Edit", "تعديل")}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="text-xs text-rose-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setData(removeVolume(v.id));
                        if (selectedVolumeId === v.id) setSelectedVolumeId(null);
                      }}
                    >
                      {label("Delete", "حذف")}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === "trends" && (
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <FiTrendingUp className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold">{label("Bid vs target by volume ($K)", "العرض مقابل الهدف حسب الحجم ($ألف)")}</h2>
          </div>
          {trendChart.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              {label("Trends appear when volumes have bid price or target cost.", "تظهر الاتجاهات عند وجود سعر عرض أو تكلفة مستهدفة.")}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendChart} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="bidPrice" stroke="#6366f1" strokeWidth={2} name={label("Bid ($K)", "عرض ($ألف)")} connectNulls />
                <Line type="monotone" dataKey="targetCost" stroke="#22c55e" strokeWidth={2} name={label("Target / cost ($K)", "هدف / تكلفة ($ألف)")} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.section>
      )}
    </div>
  );
}
