import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  getContentHubQAs,
  addContentHubQA,
  updateContentHubQA,
  deleteContentHubQA,
} from "../services/proposalManagerStorage";
import { FiTag, FiPlus, FiTrash2, FiCopy, FiFileText, FiZap, FiRefreshCw, FiLayers, FiUpload, FiX } from "react-icons/fi";
import { useProposalIssuer } from "./ProposalIssuerContext";
import { useTranslation } from "react-i18next";
import { generateAnswer, askWithFile, generateCompanyProfile } from "../../../services/api.js";

const SUGGESTED_TAGS = [
  "Section L",
  "Section M",
  "Technical",
  "Pricing",
  "Past Performance",
  "Q&A",
  "Clarification",
  "RFP",
  "Amendment",
  "Evaluation",
  "Format",
];

export default function ProposalManagerContentHub() {
  const { t } = useTranslation();
  const { issuer } = useProposalIssuer();
  const [qas, setQas] = useState(getContentHubQAs());
  const location = useLocation();
  const [filterTag, setFilterTag] = useState("");
  const [editingQAId, setEditingQAId] = useState(null);
  const [editingTags, setEditingTags] = useState("");
  const [showAddQA, setShowAddQA] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newTags, setNewTags] = useState("");
  const [question, setQuestion] = useState("");
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const aiFileInputRef = useRef(null);
  const [profileCompanyName, setProfileCompanyName] = useState("");
  const [profileWebsite, setProfileWebsite] = useState("");
  const [profileText, setProfileText] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileResult, setProfileResult] = useState(null);

  const TAG_LABEL_KEY_BY_VALUE = {
    "Section L": "sectionL",
    "Section M": "sectionM",
    Technical: "technical",
    Pricing: "pricing",
    "Past Performance": "pastPerformance",
    "Q&A": "qa",
    Clarification: "clarification",
    RFP: "rfp",
    Amendment: "amendment",
    Evaluation: "evaluation",
    Format: "format",
    "Company Intelligence": "companyIntelligence",
    Issuer: "issuer",
    General: "general",
  };

  const getTagLabel = (tagValue) => {
    const labelKey = TAG_LABEL_KEY_BY_VALUE[tagValue];
    return labelKey
      ? t(`proposalManagerContentHub.tagLabels.${labelKey}`, { defaultValue: tagValue })
      : tagValue;
  };

  useEffect(() => {
    if (location.pathname.includes("content-hub")) {
      setQas(getContentHubQAs());
    }
  }, [location.pathname]);

  const filteredQAs = filterTag
    ? qas.filter((qa) => qa.tags && qa.tags.some((t) => t.toLowerCase().includes(filterTag.toLowerCase())))
    : qas;

  const handleSaveQATags = (id) => {
    const tags = editingTags
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter(Boolean);
    updateContentHubQA(id, { tags });
    setEditingQAId(null);
    setEditingTags("");
    setQas(getContentHubQAs());
  };

  const handleAddQA = () => {
    const tags = newTags
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter(Boolean);
    addContentHubQA({ question: newQuestion.trim(), answer: newAnswer.trim(), tags });
    setNewQuestion("");
    setNewAnswer("");
    setNewTags("");
    setShowAddQA(false);
    setQas(getContentHubQAs());
  };

  const handleCopyAnswer = (qa) => {
    navigator.clipboard?.writeText(qa.answer);
  };

  const clearAiFile = () => {
    setFile(null);
    if (aiFileInputRef.current) aiFileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setResponse("");
    try {
      const answer = file ? await askWithFile(file, q) : await generateAnswer(q);
      setResponse(answer);
      clearAiFile();
    } catch (err) {
      const msg =
        err?.response?.data?.error ??
        err?.message ??
        t("proposalManagerContentHub.aiAssistant.unknownError");
      setResponse(`[Error] ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const profileHasInput =
    profileCompanyName.trim().length > 0
    || profileWebsite.trim().length > 0
    || profileText.trim().length > 0;

  const handleGenerateCompanyProfile = async (e) => {
    e.preventDefault();
    if (!profileHasInput || profileLoading) return;
    setProfileLoading(true);
    setProfileError("");
    setProfileResult(null);
    try {
      const data = await generateCompanyProfile({
        companyName: profileCompanyName.trim(),
        companyWebsite: profileWebsite.trim(),
        companyText: profileText.trim(),
      });
      setProfileResult(data);
    } catch (err) {
      const msg = err?.response?.data?.error ?? err?.message ?? t("proposalManagerContentHub.companyProfileGenerator.errorPrefix");
      setProfileError(msg);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePushIssuerToHub = () => {
    if (!issuer?.narrative) return;
    addContentHubQA({
      question: `${t("proposalManagerContentHub.companyIntelligenceQuestionPrefix")} — ${
        issuer.name
      }${issuer.ticker ? ` (${issuer.ticker})` : ""}`,
      answer: issuer.narrative,
      tags: ["Company Intelligence", "Issuer", "General"],
    });
    setQas(getContentHubQAs());
  };

  return (
    <div className="min-h-screen bg-[#F6F7FA] dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("proposalManagerContentHub.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t("proposalManagerContentHub.description")}</p>
        </div>

        <section className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
            <FiZap className="text-indigo-500 shrink-0" />
            {t("proposalManagerContentHub.aiAssistant.heading")}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {t("proposalManagerContentHub.aiAssistant.hint")}
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t("proposalManagerContentHub.aiAssistant.questionPlaceholder")}
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
            />
            <input
              ref={aiFileInputRef}
              type="file"
              accept=".txt,.pdf,.doc,.docx,text/plain,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={loading}
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => aiFileInputRef.current?.click()}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                <FiUpload className="w-4 h-4 shrink-0" aria-hidden />
                {t("proposalManagerContentHub.aiAssistant.chooseFile")}
              </button>
              {file ? (
                <div className="flex items-center gap-2 min-w-0 max-w-full">
                  <span
                    className="text-sm text-gray-700 dark:text-gray-200 truncate max-w-[260px]"
                    title={file.name}
                  >
                    {t("proposalManagerContentHub.aiAssistant.selectedFile", { name: file.name })}
                  </span>
                  <button
                    type="button"
                    onClick={clearAiFile}
                    disabled={loading}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    <FiX className="w-3.5 h-3.5" aria-hidden />
                    {t("proposalManagerContentHub.aiAssistant.clearFile")}
                  </button>
                </div>
              ) : null}
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none text-white text-sm font-medium"
              >
                {loading ? t("proposalManagerContentHub.aiAssistant.loading") : t("proposalManagerContentHub.aiAssistant.submit")}
              </button>
            </div>
          </form>
          {response ? (
            <div
              className={`mt-4 rounded-lg border px-3 py-2 text-sm whitespace-pre-wrap ${
                response.startsWith("[Error]")
                  ? "border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/20 text-red-800 dark:text-red-200"
                  : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100"
              }`}
            >
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                {t("proposalManagerContentHub.aiAssistant.responseLabel")}
              </p>
              {response.startsWith("[Error]") ? response.replace(/^\[Error\]\s*/, "") : response}
            </div>
          ) : null}
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
            <FiLayers className="text-indigo-500 shrink-0" />
            {t("proposalManagerContentHub.companyProfileGenerator.heading")}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {t("proposalManagerContentHub.companyProfileGenerator.hint")}
          </p>
          <form onSubmit={handleGenerateCompanyProfile} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {t("proposalManagerContentHub.companyProfileGenerator.companyNameLabel")}
              </label>
              <input
                type="text"
                value={profileCompanyName}
                onChange={(e) => setProfileCompanyName(e.target.value)}
                placeholder={t("proposalManagerContentHub.companyProfileGenerator.companyNamePlaceholder")}
                disabled={profileLoading}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {t("proposalManagerContentHub.companyProfileGenerator.websiteLabel")}
              </label>
              <input
                type="url"
                value={profileWebsite}
                onChange={(e) => setProfileWebsite(e.target.value)}
                placeholder={t("proposalManagerContentHub.companyProfileGenerator.websitePlaceholder")}
                disabled={profileLoading}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {t("proposalManagerContentHub.companyProfileGenerator.pastedContentLabel")}
              </label>
              <textarea
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                placeholder={t("proposalManagerContentHub.companyProfileGenerator.pastedContentPlaceholder")}
                disabled={profileLoading}
                rows={4}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm resize-y min-h-[96px]"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("proposalManagerContentHub.companyProfileGenerator.validationHint")}
            </p>
            <button
              type="submit"
              disabled={profileLoading || !profileHasInput}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none text-white text-sm font-medium"
            >
              {profileLoading ? (
                <>
                  <FiRefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  {t("proposalManagerContentHub.companyProfileGenerator.loading")}
                </>
              ) : (
                t("proposalManagerContentHub.companyProfileGenerator.submit")
              )}
            </button>
          </form>
          {profileError ? (
            <div className="mt-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/20 px-3 py-2 text-sm text-red-800 dark:text-red-200">
              {profileError}
            </div>
          ) : null}
          {profileResult ? (
            <div className="mt-4 space-y-4 border-t border-gray-200 dark:border-gray-600 pt-4">
              {[
                {
                  key: "companyOverview",
                  labelKey: "proposalManagerContentHub.companyProfileGenerator.sections.overview",
                },
                {
                  key: "keyServices",
                  labelKey: "proposalManagerContentHub.companyProfileGenerator.sections.keyServices",
                },
                {
                  key: "strengths",
                  labelKey: "proposalManagerContentHub.companyProfileGenerator.sections.strengths",
                },
                {
                  key: "relevantExperience",
                  labelKey: "proposalManagerContentHub.companyProfileGenerator.sections.experience",
                },
                {
                  key: "suggestedRfpResponseParagraph",
                  labelKey: "proposalManagerContentHub.companyProfileGenerator.sections.rfpParagraph",
                },
              ].map(({ key, labelKey }) => (
                <div
                  key={key}
                  className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/40 px-3 py-3"
                >
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    {t(labelKey)}
                  </h3>
                  <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {profileResult[key] || "—"}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {issuer && (
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/90 dark:bg-indigo-950/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <FiZap className="w-4 h-4 text-indigo-600 shrink-0" />
              {t("proposalManagerContentHub.linkedIssuerPrefix")}{" "}
              <span className="font-semibold">{issuer.name}</span> {t("proposalManagerContentHub.linkedIssuerSuffix")}
            </p>
            <button
              type="button"
              onClick={handlePushIssuerToHub}
              className="shrink-0 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium"
            >
              {t("proposalManagerContentHub.addIssuerOverviewToLibrary")}
            </button>
          </div>
        )}

        <section className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiFileText className="text-indigo-500" /> {t("proposalManagerContentHub.qaLibraryHeading")}
            </h2>
            <div className="flex gap-2">
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
              >
                <option value="">{t("proposalManagerContentHub.allTags")}</option>
                {SUGGESTED_TAGS.map((tag) => (
                  <option key={tag} value={tag}>
                    {getTagLabel(tag)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowAddQA(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
              >
                <FiPlus size={16} /> {t("proposalManagerContentHub.addQAButton")}
              </button>
            </div>
          </div>

          {showAddQA && (
            <div className="mb-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder={t("proposalManagerContentHub.placeholders.question")}
                className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm mb-2"
              />
              <textarea
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder={t("proposalManagerContentHub.placeholders.answer")}
                rows={3}
                className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm mb-2"
              />
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder={t("proposalManagerContentHub.placeholders.tagsCommaSeparated")}
                className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm mb-2"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddQA}
                  className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm"
                >
                  {t("common.actions.save", { defaultValue: "Save" })}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddQA(false)}
                  className="px-3 py-1.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white text-sm"
                >
                  {t("common.actions.cancel", { defaultValue: "Cancel" })}
                </button>
              </div>
            </div>
          )}

          <ul className="space-y-3 max-h-[70vh] overflow-y-auto">
            {filteredQAs.length === 0 ? (
              <li className="text-gray-500 dark:text-gray-400 text-sm py-4">
                {t("proposalManagerContentHub.noQAsYet")}
              </li>
            ) : (
              filteredQAs.map((qa) => (
                <li
                  key={qa.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">{qa.question}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{qa.answer}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(qa.tags || []).map((tagValue) => (
                          <span
                            key={tagValue}
                            className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 text-xs"
                          >
                            {getTagLabel(tagValue)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopyAnswer(qa)}
                        className="p-1.5 rounded text-gray-400 hover:text-indigo-600"
                        title={t("proposalManagerContentHub.tooltips.copyAnswer")}
                      >
                        <FiCopy size={14} />
                      </button>
                      {editingQAId === qa.id ? (
                        <>
                          <input
                            type="text"
                            value={editingTags}
                            onChange={(e) => setEditingTags(e.target.value)}
                            placeholder={t("proposalManagerContentHub.placeholders.tags")}
                            className="w-24 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveQATags(qa.id)}
                            className="text-green-600 text-xs"
                          >
                            {t("common.actions.save", { defaultValue: "Save" })}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingQAId(null)}
                            className="text-gray-500 text-xs"
                          >
                            {t("common.actions.cancel", { defaultValue: "Cancel" })}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingQAId(qa.id);
                            setEditingTags((qa.tags || []).join(", "));
                          }}
                          className="p-1.5 rounded text-gray-400 hover:text-indigo-600"
                          title={t("proposalManagerContentHub.tooltips.editTags")}
                        >
                          <FiTag size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          deleteContentHubQA(qa.id);
                          setQas(getContentHubQAs());
                        }}
                        className="p-1.5 rounded text-gray-400 hover:text-red-600"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
