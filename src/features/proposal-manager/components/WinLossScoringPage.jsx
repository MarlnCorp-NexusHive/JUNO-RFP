import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiAward, FiDownload, FiPlus, FiTrash2, FiUpload } from "react-icons/fi";
import { useLocalization } from "../../../hooks/useLocalization";
import { parseScoringText, PRODUCT_AREAS, rollupRoadmap } from "../data/winLossSamples";
import { getWinLossRecords, upsertWinLossRecord } from "../services/winLossStorage";

function emptyRecord() {
  return {
    rfpName: "",
    solicitationNumber: "",
    agency: "",
    segment: "State/Local",
    outcome: "lost",
    contractValue: null,
    debrief: { sourceType: "manual", summary: "", whyWon: [], whyLost: [], evaluatorComments: "" },
    factors: [],
    capabilityGaps: [],
  };
}

function scoreDelta(factor) {
  if (factor.ourScore == null || factor.winnerScore == null) return null;
  return Number((factor.ourScore - factor.winnerScore).toFixed(2));
}

export default function WinLossScoringPage() {
  const { t } = useTranslation("common");
  const { isRTLMode } = useLocalization();
  const [records, setRecords] = useState(getWinLossRecords);
  const [selectedId, setSelectedId] = useState(records[0]?.id || null);
  const [filter, setFilter] = useState("all");
  const [ingestText, setIngestText] = useState("");
  const [ingestError, setIngestError] = useState("");
  const [gapDraft, setGapDraft] = useState({ title: "", productArea: "content", severity: "high", description: "" });
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");

  const selected = records.find((r) => r.id === selectedId) || null;
  const filtered = records.filter((r) => (filter === "all" ? true : r.outcome === filter));
  const roadmap = useMemo(() => rollupRoadmap(records), [records]);

  const refresh = (nextSelectedId) => {
    const next = getWinLossRecords();
    setRecords(next);
    if (nextSelectedId) setSelectedId(nextSelectedId);
  };

  const patchSelected = (updates) => {
    if (!selected) return;
    const next = { ...selected, ...updates };
    if (updates.debrief) next.debrief = { ...selected.debrief, ...updates.debrief };
    upsertWinLossRecord(next);
    refresh(selected.id);
  };

  const ingestScores = () => {
    setIngestError("");
    const factors = parseScoringText(ingestText);
    if (!factors.length) {
      setIngestError(t("proposalManagerScoring.ingestError"));
      return;
    }
    patchSelected({ factors: [...(selected.factors || []), ...factors], ingestMeta: { ingestedAt: new Date().toISOString() } });
    setIngestText("");
  };

  const addGap = () => {
    if (!selected || !gapDraft.title.trim()) return;
    const gap = {
      id: `gap_${Date.now()}`,
      title: gapDraft.title.trim(),
      description: gapDraft.description.trim(),
      relatedFactorIds: [],
      productArea: gapDraft.productArea,
      severity: gapDraft.severity,
      evidence: selected.debrief?.summary || "",
      roadmapTheme: gapDraft.productArea,
      status: "open",
    };
    patchSelected({ capabilityGaps: [...(selected.capabilityGaps || []), gap] });
    setGapDraft({ title: "", productArea: "content", severity: "high", description: "" });
  };

  const exportRoadmap = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      source: "JUNO RFP Scoring",
      audience: "Product Engineering",
      gaps: roadmap,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "juno-product-roadmap-gaps.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const createRecord = () => {
    if (!createName.trim()) return;
    const rec = upsertWinLossRecord({ ...emptyRecord(), rfpName: createName.trim() });
    setShowCreate(false);
    setCreateName("");
    refresh(rec.id);
  };

  const dir = isRTLMode ? "rtl" : "ltr";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 lg:p-8" dir={dir}>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <FiAward className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wide">{t("proposalManagerScoring.eyebrow")}</span>
            </div>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white md:text-3xl">
              {t("proposalManagerScoring.title")}
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-400">{t("proposalManagerScoring.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={exportRoadmap}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            <FiDownload className="h-4 w-4" />
            {t("proposalManagerScoring.exportRoadmap")}
          </button>
        </header>

        <div className="grid gap-6 lg:grid-cols-12">
          <section className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{t("proposalManagerScoring.pursuits")}</h2>
              <button type="button" onClick={() => setShowCreate(true)} className="text-indigo-600 dark:text-indigo-400">
                <FiPlus className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-3 flex gap-1">
              {["all", "won", "lost", "pending"].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    filter === key ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {t(`proposalManagerScoring.filters.${key}`)}
                </button>
              ))}
            </div>
            {showCreate ? (
              <div className="mb-3 flex gap-2">
                <input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder={t("proposalManagerScoring.newRfpPlaceholder")}
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <button type="button" onClick={createRecord} className="rounded-lg bg-indigo-600 px-2 text-xs text-white">
                  {t("proposalManagerScoring.add")}
                </button>
              </div>
            ) : null}
            <ul className="max-h-[32rem] space-y-1 overflow-y-auto">
              {filtered.map((rec) => (
                <li key={rec.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(rec.id)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-start ${
                      rec.id === selectedId
                        ? "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/40"
                        : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <span className="block text-sm font-medium text-slate-900 dark:text-white">{rec.rfpName}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                      <span
                        className={`rounded px-1.5 py-0.5 font-semibold uppercase ${
                          rec.outcome === "won"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : rec.outcome === "lost"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                        }`}
                      >
                        {t(`proposalManagerScoring.outcome.${rec.outcome}`)}
                      </span>
                      {rec.agency}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <div className="lg:col-span-8 space-y-4">
            {!selected ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
                {t("proposalManagerScoring.empty")}
              </div>
            ) : (
              <>
                <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white">{selected.rfpName}</h2>
                      <p className="text-xs text-slate-500">
                        {selected.solicitationNumber} · {selected.agency}
                      </p>
                    </div>
                    <select
                      value={selected.outcome}
                      onChange={(e) => patchSelected({ outcome: e.target.value })}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                      <option value="won">{t("proposalManagerScoring.outcome.won")}</option>
                      <option value="lost">{t("proposalManagerScoring.outcome.lost")}</option>
                      <option value="pending">{t("proposalManagerScoring.outcome.pending")}</option>
                    </select>
                  </div>
                  <textarea
                    value={selected.debrief?.summary || ""}
                    onChange={(e) => patchSelected({ debrief: { summary: e.target.value } })}
                    rows={3}
                    className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder={t("proposalManagerScoring.summaryPlaceholder")}
                  />
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                        {t("proposalManagerScoring.whyWon")}
                      </h3>
                      <ul className="mt-1 list-disc space-y-1 ps-4 text-sm text-slate-700 dark:text-slate-300">
                        {(selected.debrief?.whyWon || []).length
                          ? selected.debrief.whyWon.map((item) => <li key={item}>{item}</li>)
                          : <li className="list-none text-slate-400">{t("proposalManagerScoring.none")}</li>}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-400">
                        {t("proposalManagerScoring.whyLost")}
                      </h3>
                      <ul className="mt-1 list-disc space-y-1 ps-4 text-sm text-slate-700 dark:text-slate-300">
                        {(selected.debrief?.whyLost || []).length
                          ? selected.debrief.whyLost.map((item) => <li key={item}>{item}</li>)
                          : <li className="list-none text-slate-400">{t("proposalManagerScoring.none")}</li>}
                      </ul>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t("proposalManagerScoring.ingestTitle")}</h3>
                  <p className="mt-1 text-xs text-slate-500">{t("proposalManagerScoring.ingestHint")}</p>
                  <textarea
                    value={ingestText}
                    onChange={(e) => setIngestText(e.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 p-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder={"Technical Approach | M.1 | 40 | 3.2 | 3.8 | 5"}
                  />
                  {ingestError ? <p className="mt-1 text-xs text-rose-600">{ingestError}</p> : null}
                  <button
                    type="button"
                    onClick={ingestScores}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-slate-900"
                  >
                    <FiUpload className="h-3.5 w-3.5" />
                    {t("proposalManagerScoring.ingestButton")}
                  </button>
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-start text-[11px] uppercase tracking-wide text-slate-500">
                          <th className="px-2 py-2">{t("proposalManagerScoring.factor")}</th>
                          <th className="px-2 py-2">M</th>
                          <th className="px-2 py-2">{t("proposalManagerScoring.weight")}</th>
                          <th className="px-2 py-2">{t("proposalManagerScoring.ours")}</th>
                          <th className="px-2 py-2">{t("proposalManagerScoring.winner")}</th>
                          <th className="px-2 py-2">Δ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selected.factors || []).map((f) => {
                          const delta = scoreDelta(f);
                          return (
                            <tr key={f.id} className="border-t border-slate-100 dark:border-slate-800">
                              <td className="px-2 py-2 font-medium text-slate-800 dark:text-slate-100">{f.name}</td>
                              <td className="px-2 py-2 text-xs text-slate-500">{f.sectionMRef}</td>
                              <td className="px-2 py-2">{f.weight}%</td>
                              <td className="px-2 py-2">{f.ourScore}</td>
                              <td className="px-2 py-2">{f.winnerScore}</td>
                              <td className={`px-2 py-2 font-semibold ${delta < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                {delta == null ? "—" : delta > 0 ? `+${delta}` : delta}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t("proposalManagerScoring.gapsTitle")}</h3>
                  <p className="mt-1 text-xs text-slate-500">{t("proposalManagerScoring.gapsHint")}</p>
                  <div className="mt-3 grid gap-2 md:grid-cols-4">
                    <input
                      value={gapDraft.title}
                      onChange={(e) => setGapDraft({ ...gapDraft, title: e.target.value })}
                      placeholder={t("proposalManagerScoring.gapTitle")}
                      className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                    <select
                      value={gapDraft.productArea}
                      onChange={(e) => setGapDraft({ ...gapDraft, productArea: e.target.value })}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                      {PRODUCT_AREAS.map((area) => (
                        <option key={area} value={area}>
                          {t(`proposalManagerScoring.areas.${area}`)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={gapDraft.severity}
                      onChange={(e) => setGapDraft({ ...gapDraft, severity: e.target.value })}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                      <option value="high">{t("proposalManagerScoring.severity.high")}</option>
                      <option value="medium">{t("proposalManagerScoring.severity.medium")}</option>
                      <option value="low">{t("proposalManagerScoring.severity.low")}</option>
                    </select>
                    <input
                      value={gapDraft.description}
                      onChange={(e) => setGapDraft({ ...gapDraft, description: e.target.value })}
                      placeholder={t("proposalManagerScoring.gapDescription")}
                      className="md:col-span-3 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                    <button type="button" onClick={addGap} className="rounded-lg bg-indigo-600 text-xs font-semibold text-white">
                      {t("proposalManagerScoring.addGap")}
                    </button>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {(selected.capabilityGaps || []).map((gap) => (
                      <li key={gap.id} className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{gap.title}</p>
                            <p className="text-[11px] text-slate-500">
                              {t(`proposalManagerScoring.areas.${gap.productArea}`)} · {t(`proposalManagerScoring.severity.${gap.severity}`)}
                            </p>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{gap.description}</p>
                            {gap.evidence ? <p className="mt-1 text-xs italic text-slate-400">{gap.evidence}</p> : null}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              patchSelected({ capabilityGaps: selected.capabilityGaps.filter((g) => g.id !== gap.id) })
                            }
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}
          </div>
        </div>

        <section className="rounded-xl border border-indigo-100 bg-white p-4 dark:border-indigo-900/40 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{t("proposalManagerScoring.roadmapTitle")}</h2>
          <p className="mt-1 text-xs text-slate-500">{t("proposalManagerScoring.roadmapHint")}</p>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-start text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-2 py-2">{t("proposalManagerScoring.gapTitle")}</th>
                  <th className="px-2 py-2">{t("proposalManagerScoring.area")}</th>
                  <th className="px-2 py-2">{t("proposalManagerScoring.severityLabel")}</th>
                  <th className="px-2 py-2">{t("proposalManagerScoring.losses")}</th>
                  <th className="px-2 py-2">{t("proposalManagerScoring.theme")}</th>
                </tr>
              </thead>
              <tbody>
                {roadmap.map((row) => (
                  <tr key={`${row.productArea}-${row.title}`} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-2 py-2 font-medium text-slate-800 dark:text-slate-100">{row.title}</td>
                    <td className="px-2 py-2">{t(`proposalManagerScoring.areas.${row.productArea}`)}</td>
                    <td className="px-2 py-2">{t(`proposalManagerScoring.severity.${row.severity}`)}</td>
                    <td className="px-2 py-2">{row.lossCount}</td>
                    <td className="px-2 py-2 text-xs text-slate-500">{row.roadmapTheme}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
