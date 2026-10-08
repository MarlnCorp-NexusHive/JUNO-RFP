import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  FiPlus, FiTrash2, FiEdit2, FiZap, FiStar, FiFileText, FiAward, FiPackage,
} from "react-icons/fi";
import {
  getBidVaultData,
  subscribeBidVault,
  hydrateBidVaultFromServer,
  addSubmission,
  updateSubmission,
  removeSubmission,
  openOrCreateFromShortlist,
  openOrCreateFromSourceDoc,
  deriveBidVaultCharts,
  formatBidValue,
  listSubmissions,
} from "../services/bidVaultStore.js";
import { listShortlist, hydrateShortlistFromServer, subscribeShortlist } from "../services/shortlistStore.js";
import {
  listTrialSourceDocs,
  hydrateSourceDocsCatalog,
  buildSourceDocsAiContext,
} from "../services/sourceDocsCatalog.js";
import { suggestBidVaultFromSources } from "../../../services/api.js";

const STAGES = [
  { id: "pipeline", en: "Pipeline", ar: "خط الأنابيب" },
  { id: "capture", en: "Capture", ar: "التقاط" },
  { id: "proposal", en: "Proposal", ar: "العرض" },
  { id: "submitted", en: "Submitted", ar: "مقدّم" },
  { id: "won", en: "Won", ar: "فوز" },
  { id: "lost", en: "Lost", ar: "خسارة" },
  { id: "no-bid", en: "No-Bid", ar: "عدم تقديم" },
];

const emptyForm = () => ({
  title: "",
  number: "",
  agency: "",
  segment: "State/Local",
  stage: "pipeline",
  value: "",
  deadline: "",
  submittedAt: "",
  owner: "",
  sourceDocIds: [],
  notes: "",
});

export default function TrialBidVaultPanel({ isArabic = false }) {
  const label = (en, ar) => (isArabic ? ar : en);
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(() => getBidVaultData());
  const [shortlist, setShortlist] = useState(() => listShortlist());
  const [sourceDocs, setSourceDocs] = useState(() => listTrialSourceDocs());
  const [activeTab, setActiveTab] = useState("submissions");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiNote, setAiNote] = useState("");
  const deepLinkHandled = useRef("");

  useEffect(() => {
    setData(getBidVaultData());
    const unsub = subscribeBidVault(setData);
    void hydrateBidVaultFromServer().then(setData);
    return unsub;
  }, []);

  useEffect(() => {
    setShortlist(listShortlist());
    const unsub = subscribeShortlist(setShortlist);
    void hydrateShortlistFromServer().then(setShortlist);
    return unsub;
  }, []);

  useEffect(() => {
    setSourceDocs(listTrialSourceDocs());
    void hydrateSourceDocsCatalog().then(setSourceDocs);
  }, []);

  useEffect(() => {
    const shortlistParam = searchParams.get("shortlistId");
    const sourceDocParam = searchParams.get("sourceDocId");
    const key = `${shortlistParam || ""}|${sourceDocParam || ""}`;
    if (!key || key === "|" || deepLinkHandled.current === key) return;

    if (shortlistParam) {
      const item = shortlist.find((s) => s.id === shortlistParam);
      if (!item && shortlist.length === 0) return;
      deepLinkHandled.current = key;
      if (item) {
        openOrCreateFromShortlist(item);
        setData(getBidVaultData());
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("shortlistId");
          return next;
        }, { replace: true });
      }
      return;
    }
    if (sourceDocParam) {
      const doc = sourceDocs.find((d) => d.id === sourceDocParam);
      if (!doc && sourceDocs.length === 0) return;
      deepLinkHandled.current = key;
      if (doc) {
        openOrCreateFromSourceDoc(doc);
        setData(getBidVaultData());
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("sourceDocId");
          return next;
        }, { replace: true });
      }
    }
  }, [searchParams, shortlist, sourceDocs, setSearchParams]);

  const submissions = useMemo(() => listSubmissions(), [data]);
  const charts = useMemo(() => deriveBidVaultCharts(data), [data]);

  const submitForm = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const payload = {
      ...form,
      value: form.value === "" ? null : Number(form.value),
      deadline: form.deadline || null,
      submittedAt: form.submittedAt || null,
      sourceDocIds: form.sourceDocIds || [],
    };
    if (editingId) {
      updateSubmission(editingId, payload);
    } else {
      addSubmission(payload);
    }
    setData(getBidVaultData());
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  };

  const runAiSuggest = async () => {
    setAiBusy(true);
    setAiError("");
    setAiNote("");
    try {
      const ctx = buildSourceDocsAiContext();
      const result = await suggestBidVaultFromSources({
        sourceDocs: ctx,
        shortlist: shortlist.map((s) => ({
          id: s.id,
          title: s.title,
          number: s.number,
          agency: s.agency,
          deadline: s.deadline,
        })),
        existingTitles: submissions.map((s) => s.title),
      });
      let added = 0;
      (result.submissions || []).forEach((s) => {
        const exists = submissions.some(
          (x) => x.title.toLowerCase() === String(s.title || "").toLowerCase(),
        );
        if (exists) return;
        addSubmission(s);
        added += 1;
      });
      setData(getBidVaultData());
      setAiNote(
        result.rationale
          ? `${result.rationale} (${label("added", "أُضيف")} ${added})`
          : label(`Added ${added} pursuits from Source Docs.`, `أُضيف ${added} فرصاً من مستندات المصدر.`),
      );
    } catch (err) {
      setAiError(err?.response?.data?.error || err?.message || label("AI suggest failed", "فشل الاقتراح"));
    } finally {
      setAiBusy(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm";

  const tabs = [
    { id: "submissions", label: label("Submissions", "التقديمات") },
    { id: "winLoss", label: label("Win/Loss", "فوز/خسارة") },
    { id: "pipeline", label: label("Pipeline", "خط الأنابيب") },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {label("Bid Vault", "مستودع العطاءات")}
            <FiPackage className="text-blue-500" />
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {label(
              "Company pursuits grounded in Source Docs and shortlist — shared across your company.",
              "فرص الشركة المبنية على مستندات المصدر والقائمة المختصرة — مشتركة عبر شركتك.",
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === tab.id ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {aiError && <div className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 rounded-lg px-3 py-2">{aiError}</div>}
      {aiNote && <div className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">{aiNote}</div>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setForm(emptyForm());
            setShowForm((v) => !v);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium px-3 py-2"
        >
          <FiPlus /> {label("Add pursuit", "إضافة فرصة")}
        </button>
        <button
          type="button"
          disabled={aiBusy || (sourceDocs.length === 0 && shortlist.length === 0)}
          onClick={runAiSuggest}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-sm font-medium px-3 py-2 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-100 disabled:opacity-50"
        >
          <FiZap /> {aiBusy ? label("Suggesting…", "جاري الاقتراح…") : label("AI from Source Docs", "AI من مستندات المصدر")}
        </button>
      </div>

      {(sourceDocs.length > 0 || shortlist.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sourceDocs.length > 0 && (
            <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1">
                <FiFileText className="text-indigo-500" />
                {label("From Source Docs", "من مستندات المصدر")} ({sourceDocs.length})
              </div>
              <ul className="space-y-1 max-h-28 overflow-y-auto">
                {sourceDocs.slice(0, 8).map((doc) => (
                  <li key={doc.id}>
                    <button
                      type="button"
                      className="w-full text-left text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-400 truncate"
                      onClick={() => {
                        openOrCreateFromSourceDoc(doc);
                        setData(getBidVaultData());
                      }}
                    >
                      {doc.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {shortlist.length > 0 && (
            <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1">
                <FiStar className="text-amber-500" />
                {label("From shortlist", "من القائمة المختصرة")}
              </div>
              <ul className="space-y-1 max-h-28 overflow-y-auto">
                {shortlist.slice(0, 8).map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="w-full text-left text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-400 truncate"
                      onClick={() => {
                        openOrCreateFromShortlist(item);
                        setData(getBidVaultData());
                      }}
                    >
                      {item.title || item.number || item.id}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <form onSubmit={submitForm} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-100 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <label className="text-xs font-medium lg:col-span-2">
            {label("Title", "العنوان")}
            <input className={`${inputClass} mt-1`} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          </label>
          <label className="text-xs font-medium">
            {label("Stage", "المرحلة")}
            <select className={`${inputClass} mt-1`} value={form.stage} onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}>
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>{label(s.en, s.ar)}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium">
            {label("Solicitation #", "رقم المناقصة")}
            <input className={`${inputClass} mt-1`} value={form.number} onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))} />
          </label>
          <label className="text-xs font-medium">
            {label("Agency", "الجهة")}
            <input className={`${inputClass} mt-1`} value={form.agency} onChange={(e) => setForm((f) => ({ ...f, agency: e.target.value }))} />
          </label>
          <label className="text-xs font-medium">
            {label("Segment", "القطاع")}
            <select className={`${inputClass} mt-1`} value={form.segment} onChange={(e) => setForm((f) => ({ ...f, segment: e.target.value }))}>
              <option>Federal</option>
              <option>State/Local</option>
              <option>Commercial</option>
              <option>International</option>
            </select>
          </label>
          <label className="text-xs font-medium">
            {label("Value $", "القيمة $")}
            <input type="number" min="0" className={`${inputClass} mt-1`} value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
          </label>
          <label className="text-xs font-medium">
            {label("Deadline", "الموعد النهائي")}
            <input type="date" className={`${inputClass} mt-1`} value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
          </label>
          <label className="text-xs font-medium sm:col-span-2 lg:col-span-3">
            {label("Link Source Docs", "ربط مستندات المصدر")}
            <select
              multiple
              className={`${inputClass} mt-1 min-h-[4.5rem]`}
              value={form.sourceDocIds}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  sourceDocIds: Array.from(e.target.selectedOptions).map((o) => o.value),
                }))
              }
            >
              {sourceDocs.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
            <button type="submit" className="rounded-lg bg-blue-600 text-white text-sm px-4 py-2">
              {editingId ? label("Save", "حفظ") : label("Create", "إنشاء")}
            </button>
            <button type="button" className="rounded-lg border text-sm px-4 py-2 dark:border-gray-600" onClick={() => { setShowForm(false); setEditingId(null); }}>
              {label("Cancel", "إلغاء")}
            </button>
          </div>
        </form>
      )}

      {activeTab === "submissions" && (
        <div className="space-y-3">
          {charts.submissionFunnel.some((x) => x.count > 0) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-semibold mb-2">{label("Pursuit funnel", "قمع الفرص")}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.submissionFunnel}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name={label("Count", "العدد")} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {submissions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              {label(
                "No pursuits yet. Add one, pull from shortlist/Source Docs, or run AI suggest.",
                "لا فرص بعد. أضف واحدة، أو اسحب من القائمة المختصرة/مستندات المصدر، أو شغّل اقتراح AI.",
              )}
            </p>
          ) : (
            <ul className="space-y-2">
              {submissions.map((s) => (
                <li key={s.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex flex-wrap justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white">{s.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {s.agency || "—"} · {s.stage} · {formatBidValue(s.value)}
                      {s.deadline ? ` · ${label("Due", "الاستحقاق")} ${s.deadline}` : ""}
                    </div>
                    {s.sourceDocIds?.length > 0 && (
                      <div className="text-[10px] text-indigo-600 mt-1">
                        {label("Docs", "مستندات")}: {s.sourceDocIds.length}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/app/scoring?vaultId=${encodeURIComponent(s.id)}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 dark:text-violet-300"
                    >
                      <FiAward /> {label("Score", "تقييم")}
                    </Link>
                    <button
                      type="button"
                      className="text-blue-600"
                      onClick={() => {
                        setEditingId(s.id);
                        setForm({
                          title: s.title,
                          number: s.number || "",
                          agency: s.agency || "",
                          segment: s.segment || "State/Local",
                          stage: s.stage,
                          value: s.value ?? "",
                          deadline: s.deadline || "",
                          submittedAt: s.submittedAt || "",
                          owner: s.owner || "",
                          sourceDocIds: s.sourceDocIds || [],
                          notes: s.notes || "",
                        });
                        setShowForm(true);
                      }}
                    >
                      <FiEdit2 />
                    </button>
                    <button type="button" className="text-rose-600" onClick={() => setData(removeSubmission(s.id))}>
                      <FiTrash2 />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === "winLoss" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-100 dark:border-gray-700">
          {charts.winLossBySegment.every((x) => x.won === 0 && x.lost === 0) ? (
            <p className="text-sm text-gray-500 text-center py-8">
              {label("Mark pursuits as Won or Lost to see segment charts.", "علّم الفرص كفوز أو خسارة لرؤية مخططات القطاعات.")}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={charts.winLossBySegment}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="segment" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="won" fill="#22c55e" name={label("Won", "فوز")} />
                <Bar dataKey="lost" fill="#ef4444" name={label("Lost", "خسارة")} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {activeTab === "pipeline" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-gray-100 dark:border-gray-700">
          {charts.pipelineByStage.every((x) => x.count === 0) ? (
            <p className="text-sm text-gray-500 text-center py-8">
              {label("Pipeline fills as you add pursuits.", "يمتلئ خط الأنابيب عند إضافة الفرص.")}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={charts.pipelineByStage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8b5cf6" name={label("Count", "العدد")} />
                <Bar dataKey="value" fill="#f59e0b" name={label("Value ($M)", "القيمة (مليون $)")} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}
