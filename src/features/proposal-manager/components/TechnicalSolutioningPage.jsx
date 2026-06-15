import React, { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUpload,
  FiTrash2,
  FiZap,
  FiLayers,
  FiCheckCircle,
  FiAlertTriangle,
  FiBookOpen,
  FiTarget,
  FiGitBranch,
  FiSave,
  FiCopy,
  FiRefreshCw,
  FiFileText,
  FiShield,
} from "react-icons/fi";
import { useProposalIssuer } from "./ProposalIssuerContext";
import { useLocalization } from "../../../hooks/useLocalization";
import { extractFromFile } from "../services/extractFromDocument";
import { getDocuments, addContentHubQA } from "../services/proposalManagerStorage";
import {
  REFERENCE_CATEGORIES,
  getReferenceAssets,
  saveReferenceAssets,
  deleteReferenceAsset,
  getIndexedPatterns,
  saveIndexedPatterns,
  saveDesign,
  getSettings,
  saveSettings,
  designToContentHubEntries,
} from "../services/technicalSolutioningStorage";
import {
  extractTechnicalReferencePatterns,
  generateTechnicalSolutionDesign,
} from "../../../services/api.js";
import SolutionArchitectureDiagram from "./solutioning/SolutionArchitectureDiagram";

const STEPS = ["library", "requirements", "blueprint"];

function confidenceTone(c) {
  if (c >= 0.8) return "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (c >= 0.55) return "text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300";
  return "text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-300";
}

function ConfidenceBadge({ value, label }) {
  const pct = Math.round((value ?? 0) * 100);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${confidenceTone(value ?? 0)}`}>
      {label ? `${label}: ` : ""}{pct}%
    </span>
  );
}

export default function TechnicalSolutioningPage() {
  const { t } = useTranslation();
  const { isRTLMode } = useLocalization();
  const { issuer } = useProposalIssuer();
  const fileInputRef = useRef(null);

  const [assets, setAssets] = useState(() => getReferenceAssets());
  const [patterns, setPatterns] = useState(() => getIndexedPatterns());
  const [settings, setSettingsState] = useState(() => getSettings());
  const [activeStep, setActiveStep] = useState("library");
  const [selectedAssetIds, setSelectedAssetIds] = useState(() =>
    getReferenceAssets().slice(0, 3).map((a) => a.id),
  );

  const workspaceDocs = useMemo(() => getDocuments().filter((d) => d.rawText?.length > 100), []);
  const [selectedDocId, setSelectedDocId] = useState(settings.selectedWorkspaceDocId || workspaceDocs[0]?.id || "");
  const [requirementsText, setRequirementsText] = useState("");
  const [solutionTitle, setSolutionTitle] = useState("");
  const [designGoals, setDesignGoals] = useState("");

  const [indexLoading, setIndexLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generatePhase, setGeneratePhase] = useState("");
  const [error, setError] = useState("");
  const [design, setDesign] = useState(null);
  const [activeSection, setActiveSection] = useState(0);
  const [pushNotice, setPushNotice] = useState("");

  const selectedAssets = useMemo(
    () => assets.filter((a) => selectedAssetIds.includes(a.id)),
    [assets, selectedAssetIds],
  );

  const categoryLabel = (catId) => {
    const cat = REFERENCE_CATEGORIES.find((c) => c.id === catId);
    return cat ? t(`proposalManagerTechnicalSolutioning.categories.${cat.labelKey}`, { defaultValue: catId }) : catId;
  };

  const loadRequirementsFromWorkspace = useCallback(() => {
    const doc = workspaceDocs.find((d) => d.id === selectedDocId);
    if (!doc) return;
    const fromQas = (doc.extractedQAs || [])
      .map((q, i) => `${i + 1}. ${q.question}`)
      .join("\n");
    setRequirementsText(fromQas || doc.rawText?.slice(0, 12000) || "");
    saveSettings({ ...settings, selectedWorkspaceDocId: selectedDocId });
  }, [selectedDocId, workspaceDocs, settings]);

  const handleUploadReferences = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploadLoading(true);
    setError("");
    try {
      const next = [...assets];
      for (const file of files) {
        const { text } = await extractFromFile(file);
        if (!text?.trim()) continue;
        const id = `tsa_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        next.unshift({
          id,
          name: file.name.replace(/\.[^.]+$/, ""),
          category: "system_design",
          fileType: file.type,
          fileName: file.name,
          text: text.slice(0, 50000),
          uploadedAt: new Date().toISOString(),
          isDemo: false,
        });
        setSelectedAssetIds((prev) => [id, ...prev.filter((x) => x !== id)]);
      }
      saveReferenceAssets(next);
      setAssets(next);
      if (settings.autoIndexOnUpload) {
        await runIndexPatterns(next.filter((a) => selectedAssetIds.includes(a.id) || next[0]?.id === a.id));
      }
    } catch (e) {
      setError(e.message || t("proposalManagerTechnicalSolutioning.errors.upload"));
    } finally {
      setUploadLoading(false);
    }
  };

  const runIndexPatterns = async (assetList = selectedAssets) => {
    if (!assetList.length) {
      setError(t("proposalManagerTechnicalSolutioning.errors.noAssets"));
      return;
    }
    setIndexLoading(true);
    setError("");
    try {
      const result = await extractTechnicalReferencePatterns(
        assetList.map((a) => ({ id: a.id, name: a.name, category: a.category, text: a.text })),
      );
      saveIndexedPatterns(result);
      setPatterns(result);
    } catch (e) {
      setError(e.message || t("proposalManagerTechnicalSolutioning.errors.index"));
    } finally {
      setIndexLoading(false);
    }
  };

  const runGenerate = async () => {
    const req = requirementsText.trim();
    if (!req) {
      setError(t("proposalManagerTechnicalSolutioning.errors.noRequirements"));
      setActiveStep("requirements");
      return;
    }
    if (!selectedAssets.length) {
      setError(t("proposalManagerTechnicalSolutioning.errors.noAssetsSelected"));
      setActiveStep("library");
      return;
    }

    setGenerateLoading(true);
    setError("");
    setDesign(null);
    setActiveStep("blueprint");

    try {
      setGeneratePhase(t("proposalManagerTechnicalSolutioning.phases.indexing"));
      let indexed = patterns;
      if (!indexed?.components?.length) {
        indexed = await extractTechnicalReferencePatterns(
          selectedAssets.map((a) => ({ id: a.id, name: a.name, category: a.category, text: a.text })),
        );
        saveIndexedPatterns(indexed);
        setPatterns(indexed);
      }

      setGeneratePhase(t("proposalManagerTechnicalSolutioning.phases.mapping"));
      await new Promise((r) => setTimeout(r, 400));

      setGeneratePhase(t("proposalManagerTechnicalSolutioning.phases.generating"));
      const result = await generateTechnicalSolutionDesign({
        rfpRequirementsText: req,
        referenceAssets: selectedAssets.map((a) => ({
          id: a.id,
          name: a.name,
          category: a.category,
          text: a.text,
        })),
        indexedPatterns: indexed,
        issuerName: issuer?.name || issuer?.displayName || "",
        solutionTitle: solutionTitle.trim() || t("proposalManagerTechnicalSolutioning.defaultSolutionTitle"),
        designGoals: designGoals.trim(),
      });

      setGeneratePhase(t("proposalManagerTechnicalSolutioning.phases.finalizing"));
      saveDesign(result);
      setDesign(result);
      setActiveSection(0);
    } catch (e) {
      setError(e.message || t("proposalManagerTechnicalSolutioning.errors.generate"));
    } finally {
      setGenerateLoading(false);
      setGeneratePhase("");
    }
  };

  const pushToContentHub = () => {
    const entries = designToContentHubEntries(design);
    entries.forEach((e) => addContentHubQA(e));
    setPushNotice(t("proposalManagerTechnicalSolutioning.pushedToHub", { count: entries.length }));
    setTimeout(() => setPushNotice(""), 4000);
  };

  const copyDesignMarkdown = () => {
    if (!design) return;
    const md = [
      `# ${design.solutionTitle}`,
      "",
      design.executiveSummary,
      "",
      ...(design.solutionSections || []).map((s) => `## ${s.title}\n\n${s.content}`),
    ].join("\n\n");
    navigator.clipboard?.writeText(md);
    setPushNotice(t("proposalManagerTechnicalSolutioning.copied"));
    setTimeout(() => setPushNotice(""), 2500);
  };

  const toggleAsset = (id) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <div className="space-y-8" dir={isRTLMode ? "rtl" : "ltr"}>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 px-8 py-10 text-white shadow-xl">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.45),transparent_50%)]" />
        <div className="relative z-10 max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <FiLayers className="text-indigo-300" />
            {t("proposalManagerTechnicalSolutioning.badge")}
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t("proposalManagerTechnicalSolutioning.title")}
          </h1>
          <p className="mt-3 text-indigo-100/90 text-base leading-relaxed max-w-2xl">
            {t("proposalManagerTechnicalSolutioning.subtitle")}
          </p>
          {issuer?.name ? (
            <p className="mt-4 text-sm text-indigo-200/80">
              {t("proposalManagerTechnicalSolutioning.linkedIssuer", { name: issuer.name })}
            </p>
          ) : null}
        </div>
      </div>

      {/* Step nav */}
      <div className="flex flex-wrap gap-2">
        {STEPS.map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => setActiveStep(step)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeStep === step
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-300"
            }`}
          >
            {t(`proposalManagerTechnicalSolutioning.steps.${step}`)}
          </button>
        ))}
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          <FiAlertTriangle className="mt-0.5 shrink-0" />
          {error}
        </div>
      ) : null}

      {pushNotice ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {pushNotice}
        </div>
      ) : null}

      {/* Step 1 — Reference library */}
      {activeStep === "library" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FiBookOpen className="text-indigo-500" />
                  {t("proposalManagerTechnicalSolutioning.libraryTitle")}
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => runIndexPatterns()}
                    disabled={indexLoading || !selectedAssets.length}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700 px-3 py-1.5 text-sm text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 disabled:opacity-50"
                  >
                    <FiRefreshCw className={indexLoading ? "animate-spin" : ""} />
                    {t("proposalManagerTechnicalSolutioning.indexPatterns")}
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <FiUpload />
                    {t("proposalManagerTechnicalSolutioning.upload")}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
                    className="hidden"
                    onChange={(e) => {
                      handleUploadReferences(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {t("proposalManagerTechnicalSolutioning.libraryHint")}
              </p>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {assets.map((asset) => {
                  const selected = selectedAssetIds.includes(asset.id);
                  return (
                    <div
                      key={asset.id}
                      className={`flex items-start gap-3 rounded-lg border p-4 transition cursor-pointer ${
                        selected
                          ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 dark:border-indigo-600"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      }`}
                      onClick={() => toggleAsset(asset.id)}
                      onKeyDown={(e) => e.key === "Enter" && toggleAsset(asset.id)}
                      role="button"
                      tabIndex={0}
                    >
                      <input type="checkbox" checked={selected} readOnly className="mt-1 rounded border-gray-300" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{asset.name}</span>
                          {asset.isDemo ? (
                            <span className="text-[10px] uppercase tracking-wide rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-1.5 py-0.5">
                              Demo
                            </span>
                          ) : null}
                          <span className="text-xs text-gray-500">{categoryLabel(asset.category)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{asset.text.slice(0, 180)}…</p>
                      </div>
                      {!asset.isDemo ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteReferenceAsset(asset.id);
                            setAssets(getReferenceAssets());
                            setSelectedAssetIds((prev) => prev.filter((id) => id !== asset.id));
                          }}
                          className="p-1.5 text-gray-400 hover:text-rose-500"
                          aria-label="Remove"
                        >
                          <FiTrash2 />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6 shadow-sm">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <FiGitBranch className="text-indigo-500" />
                {t("proposalManagerTechnicalSolutioning.patternIndex")}
              </h3>
              {patterns?.components?.length ? (
                <div className="space-y-3 text-sm">
                  <p className="text-gray-500">{t("proposalManagerTechnicalSolutioning.indexedAt", { count: patterns.components.length })}</p>
                  <ul className="space-y-2 max-h-64 overflow-y-auto">
                    {(patterns.components || []).slice(0, 8).map((c) => (
                      <li key={c.id} className="rounded-lg bg-gray-50 dark:bg-gray-900/50 px-3 py-2">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-xs text-gray-500 block">{c.layer}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-gray-500">{t("proposalManagerTechnicalSolutioning.noPatternsYet")}</p>
              )}
              <button
                type="button"
                onClick={() => setActiveStep("requirements")}
                className="mt-6 w-full rounded-lg bg-gray-900 dark:bg-indigo-600 text-white py-2.5 text-sm font-medium hover:opacity-90"
              >
                {t("proposalManagerTechnicalSolutioning.continueToRequirements")}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 2 — Requirements */}
      {activeStep === "requirements" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FiTarget className="text-indigo-500" />
              {t("proposalManagerTechnicalSolutioning.requirementsTitle")}
            </h2>
            {workspaceDocs.length > 0 ? (
              <div className="flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    {t("proposalManagerTechnicalSolutioning.fromWorkspace")}
                  </label>
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  >
                    {workspaceDocs.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={loadRequirementsFromWorkspace}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  {t("proposalManagerTechnicalSolutioning.loadFromWorkspace")}
                </button>
              </div>
            ) : (
              <p className="text-sm text-amber-600 dark:text-amber-400">{t("proposalManagerTechnicalSolutioning.noWorkspaceDocs")}</p>
            )}
            <textarea
              value={requirementsText}
              onChange={(e) => setRequirementsText(e.target.value)}
              rows={14}
              placeholder={t("proposalManagerTechnicalSolutioning.requirementsPlaceholder")}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-mono"
            />
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold">{t("proposalManagerTechnicalSolutioning.designOptions")}</h3>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">{t("proposalManagerTechnicalSolutioning.solutionTitle")}</label>
              <input
                value={solutionTitle}
                onChange={(e) => setSolutionTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                placeholder={t("proposalManagerTechnicalSolutioning.defaultSolutionTitle")}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">{t("proposalManagerTechnicalSolutioning.designGoals")}</label>
              <textarea
                value={designGoals}
                onChange={(e) => setDesignGoals(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                placeholder={t("proposalManagerTechnicalSolutioning.designGoalsPlaceholder")}
              />
            </div>
            <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-4 text-sm text-indigo-900 dark:text-indigo-200">
              <p className="font-medium mb-1">{t("proposalManagerTechnicalSolutioning.selectedAssets", { count: selectedAssets.length })}</p>
              <ul className="text-xs space-y-1 opacity-90">
                {selectedAssets.slice(0, 4).map((a) => (
                  <li key={a.id}>• {a.name}</li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={runGenerate}
              disabled={generateLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3.5 text-white font-semibold shadow-lg hover:from-indigo-700 hover:to-blue-700 disabled:opacity-60"
            >
              <FiZap className={generateLoading ? "animate-pulse" : ""} />
              {generateLoading ? generatePhase || t("proposalManagerTechnicalSolutioning.generating") : t("proposalManagerTechnicalSolutioning.generateBlueprint")}
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 3 — Blueprint */}
      {activeStep === "blueprint" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {generateLoading ? (
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20 p-12 text-center">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 mb-4" />
              <p className="text-lg font-medium text-indigo-900 dark:text-indigo-100">{generatePhase}</p>
              <p className="text-sm text-indigo-600/80 mt-2">{t("proposalManagerTechnicalSolutioning.generatingHint")}</p>
            </div>
          ) : null}

          <AnimatePresence>
            {design && !generateLoading ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Header actions */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{design.solutionTitle}</h2>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <ConfidenceBadge value={design.confidenceOverall} label={t("proposalManagerTechnicalSolutioning.overallConfidence")} />
                      <span className="text-xs text-gray-500 self-center">
                        {t("proposalManagerTechnicalSolutioning.generatedAt", {
                          date: new Date(design.generatedAt).toLocaleString(),
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={copyDesignMarkdown} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                      <FiCopy /> {t("proposalManagerTechnicalSolutioning.copyMarkdown")}
                    </button>
                    <button type="button" onClick={pushToContentHub} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm hover:bg-emerald-700">
                      <FiSave /> {t("proposalManagerTechnicalSolutioning.pushToHub")}
                    </button>
                    <button type="button" onClick={runGenerate} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 text-indigo-700 dark:text-indigo-300 px-3 py-2 text-sm">
                      <FiRefreshCw /> {t("proposalManagerTechnicalSolutioning.regenerate")}
                    </button>
                  </div>
                </div>

                {/* Executive summary */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6">
                  <h3 className="font-semibold mb-2">{t("proposalManagerTechnicalSolutioning.executiveSummary")}</h3>
                  <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{design.executiveSummary}</p>
                  {design.designPrinciples?.length ? (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {design.designPrinciples.map((p) => (
                        <li key={p} className="rounded-full bg-gray-100 dark:bg-gray-900 px-3 py-1 text-xs">{p}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                {/* Diagram + sections */}
                <div className="grid gap-6 xl:grid-cols-5">
                  <div className="xl:col-span-3 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FiLayers className="text-indigo-500" />
                      {t("proposalManagerTechnicalSolutioning.architectureDiagram")}
                    </h3>
                    <SolutionArchitectureDiagram diagramSpec={design.diagramSpec} />
                  </div>
                  <div className="xl:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-4">
                    <h3 className="font-semibold mb-3">{t("proposalManagerTechnicalSolutioning.solutionSections")}</h3>
                    <div className="flex flex-col gap-1 mb-3">
                      {(design.solutionSections || []).map((s, i) => (
                        <button
                          key={s.title}
                          type="button"
                          onClick={() => setActiveSection(i)}
                          className={`text-left rounded-lg px-3 py-2 text-sm transition ${
                            activeSection === i
                              ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-100 font-medium"
                              : "hover:bg-gray-50 dark:hover:bg-gray-900/50 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {s.title}
                          <ConfidenceBadge value={s.confidence} />
                        </button>
                      ))}
                    </div>
                    {design.solutionSections?.[activeSection] ? (
                      <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap border-t border-gray-100 dark:border-gray-700 pt-3">
                        {design.solutionSections[activeSection].content}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Traceability matrix */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                    <FiFileText className="text-indigo-500" />
                    <h3 className="font-semibold">{t("proposalManagerTechnicalSolutioning.traceability")}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-900/50 text-left text-xs uppercase text-gray-500">
                        <tr>
                          <th className="px-4 py-3">{t("proposalManagerTechnicalSolutioning.reqRef")}</th>
                          <th className="px-4 py-3">{t("proposalManagerTechnicalSolutioning.requirement")}</th>
                          <th className="px-4 py-3">{t("proposalManagerTechnicalSolutioning.solutionElement")}</th>
                          <th className="px-4 py-3">{t("proposalManagerTechnicalSolutioning.confidence")}</th>
                          <th className="px-4 py-3">{t("proposalManagerTechnicalSolutioning.sme")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {(design.traceability || []).map((row, i) => (
                          <tr key={i} className={row.needsSmeReview ? "bg-amber-50/50 dark:bg-amber-900/10" : ""}>
                            <td className="px-4 py-3 font-mono text-xs">{row.requirementRef || "—"}</td>
                            <td className="px-4 py-3 max-w-xs">{row.requirementText}</td>
                            <td className="px-4 py-3 max-w-sm text-indigo-900 dark:text-indigo-200">{row.solutionElement}</td>
                            <td className="px-4 py-3"><ConfidenceBadge value={row.confidence} /></td>
                            <td className="px-4 py-3">
                              {row.needsSmeReview ? (
                                <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 text-xs">
                                  <FiAlertTriangle /> {row.smeRole || "SME"}
                                </span>
                              ) : (
                                <FiCheckCircle className="text-emerald-500" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Gaps & differentiators */}
                <div className="grid gap-6 md:grid-cols-2">
                  {(design.gaps || []).length > 0 ? (
                    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/10 p-6">
                      <h3 className="font-semibold flex items-center gap-2 text-amber-900 dark:text-amber-200 mb-3">
                        <FiAlertTriangle /> {t("proposalManagerTechnicalSolutioning.gaps")}
                      </h3>
                      <ul className="space-y-3 text-sm">
                        {design.gaps.map((g) => (
                          <li key={g.topic} className="rounded-lg bg-white/60 dark:bg-gray-900/40 p-3">
                            <span className="font-medium">{g.topic}</span>
                            <span className={`ml-2 text-[10px] uppercase px-1.5 py-0.5 rounded ${
                              g.severity === "high" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                            }`}>{g.severity}</span>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">{g.recommendation}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10 p-6">
                    <h3 className="font-semibold flex items-center gap-2 text-emerald-900 dark:text-emerald-200 mb-3">
                      <FiShield /> {t("proposalManagerTechnicalSolutioning.differentiators")}
                    </h3>
                    <ul className="space-y-2 text-sm">
                      {(design.differentiators || []).map((d) => (
                        <li key={d} className="flex gap-2"><FiCheckCircle className="text-emerald-500 shrink-0 mt-0.5" />{d}</li>
                      ))}
                    </ul>
                    {(design.risks || []).length > 0 ? (
                      <>
                        <h4 className="font-medium mt-4 mb-2 text-sm">{t("proposalManagerTechnicalSolutioning.risks")}</h4>
                        <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                          {design.risks.map((r) => (
                            <li key={r.risk}><strong>{r.risk}</strong> — {r.mitigation}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {!design && !generateLoading ? (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-12 text-center text-gray-500">
              <FiZap className="mx-auto text-4xl mb-3 text-indigo-400" />
              <p>{t("proposalManagerTechnicalSolutioning.noBlueprintYet")}</p>
              <button type="button" onClick={() => setActiveStep("requirements")} className="mt-4 text-indigo-600 hover:underline text-sm">
                {t("proposalManagerTechnicalSolutioning.goToRequirements")}
              </button>
            </div>
          ) : null}
        </motion.div>
      )}
    </div>
  );
}
