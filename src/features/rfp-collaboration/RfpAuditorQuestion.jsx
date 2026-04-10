import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiRefreshCw, FiSend, FiZap } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { rfpCollab } from "../../services/rfpCollabApi.js";
import { loadCollabSession } from "./rfpCollabSession.js";
import { getRfpAuditorBasePath } from "./rfpAuditorPaths.js";

const STATUS_KEYS = {
  unassigned: "rfpCollaboration.status.unassigned",
  assigned: "rfpCollaboration.status.assigned",
  in_progress: "rfpCollaboration.status.inProgress",
  submitted: "rfpCollaboration.status.submitted",
  approved: "rfpCollaboration.status.approved",
  rejected: "rfpCollaboration.status.rejected",
  changes_requested: "rfpCollaboration.status.changesRequested",
};

const QR_LABELS = {
  product_roadmap: "rfpCollaboration.qr.productRoadmap",
  company_info: "rfpCollaboration.qr.companyInfo",
  technical_capabilities: "rfpCollaboration.qr.technicalCapabilities",
};

export default function RfpAuditorQuestion() {
  const { workspaceId, questionId } = useParams();
  const { t } = useTranslation();
  const base = getRfpAuditorBasePath();
  const session = loadCollabSession();
  const token = session?.token;

  const [detail, setDetail] = useState(null);
  const [question, setQuestion] = useState(null);
  const [draft, setDraft] = useState("");
  const [clarify, setClarify] = useState("");
  const [messages, setMessages] = useState([]);
  const [quarterly, setQuarterly] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token || !workspaceId || !questionId) return;
    setError("");
    try {
      const [wsRes, clRes, qrRes] = await Promise.all([
        rfpCollab.getWorkspace(token, workspaceId),
        rfpCollab.clarifications(token, workspaceId, questionId),
        rfpCollab.quarterlyReview(token, workspaceId),
      ]);
      setDetail(wsRes.data.workspace);
      const q = (wsRes.data.questions || []).find((x) => x.id === questionId);
      setQuestion(q || null);
      setDraft(q?.answerDraft || "");
      setMessages(clRes.data.messages || []);
      setQuarterly(qrRes.data.items || []);
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    }
  }, [token, workspaceId, questionId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveDraft = async () => {
    if (!token) return;
    setBusy(true);
    try {
      await rfpCollab.saveDraft(token, { workspaceId, questionId, answerDraft: draft });
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const runAi = async () => {
    if (!token) return;
    setBusy(true);
    try {
      const { data } = await rfpCollab.draftAnswerAi(token, { workspaceId, questionId });
      setDraft(data.answerDraft || "");
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!token) return;
    setBusy(true);
    try {
      await rfpCollab.submitAnswer(token, {
        workspaceId,
        questionId,
        answerText: draft,
      });
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const sendClarification = async (e) => {
    e.preventDefault();
    if (!token || !clarify.trim()) return;
    setBusy(true);
    try {
      await rfpCollab.askClarification(token, {
        workspaceId,
        questionId,
        message: clarify.trim(),
      });
      setClarify("");
      const { data } = await rfpCollab.clarifications(token, workspaceId, questionId);
      setMessages(data.messages || []);
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const setQrStatus = async (reviewItemId, status) => {
    if (!token) return;
    setBusy(true);
    try {
      await rfpCollab.quarterlyReviewUpdate(token, { workspaceId, reviewItemId, status });
      const { data } = await rfpCollab.quarterlyReview(token, workspaceId);
      setQuarterly(data.items || []);
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!session || session.user?.role !== "auditor") {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-300">
        <Link className="text-indigo-600 underline" to={base}>
          {t("rfpCollaboration.signInAsAuditor")}
        </Link>
      </p>
    );
  }

  if (!question) {
    return (
      <div className="space-y-4">
        {error ? (
          <div className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : (
          <p className="text-sm text-gray-500">{t("rfpCollaboration.loading")}</p>
        )}
        <Link to={base} className="text-sm text-indigo-600 inline-flex items-center gap-1">
          <FiArrowLeft className="w-4 h-4" />
          {t("rfpCollaboration.backToDashboard")}
        </Link>
      </div>
    );
  }

  const canEdit = ["assigned", "in_progress", "changes_requested", "rejected"].includes(question.status);
  const submittedLocked = question.status === "submitted" || question.status === "approved";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to={base} className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400">
          <FiArrowLeft className="w-4 h-4" />
          {t("rfpCollaboration.backToDashboard")}
        </Link>
        <button type="button" onClick={() => load()} className="inline-flex items-center gap-1 text-sm text-gray-600">
          <FiRefreshCw className="w-4 h-4" />
          {t("rfpCollaboration.refresh")}
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/80 dark:bg-red-950/20 px-3 py-2 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{detail?.title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("rfpCollaboration.questionRef")} {question.number} · {t(STATUS_KEYS[question.status] || question.status)}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{t("rfpCollaboration.requirement")}</h2>
        <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{question.text}</p>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t("rfpCollaboration.yourAnswer")}</h2>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={!canEdit || submittedLocked}
          rows={12}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm disabled:opacity-60"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || !canEdit || submittedLocked}
            onClick={runAi}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-600 text-white text-sm disabled:opacity-50"
          >
            <FiZap className="w-4 h-4" />
            {t("rfpCollaboration.aiDraft")}
          </button>
          <button
            type="button"
            disabled={busy || !canEdit || submittedLocked}
            onClick={saveDraft}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-50"
          >
            {t("rfpCollaboration.saveDraft")}
          </button>
          <button
            type="button"
            disabled={busy || !canEdit || submittedLocked || !draft.trim()}
            onClick={submit}
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-50"
          >
            {t("rfpCollaboration.submitForReview")}
          </button>
        </div>
        {question.pmReviewComment ? (
          <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
            {t("rfpCollaboration.pmFeedback")}: {question.pmReviewComment}
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
        <h2 className="text-sm font-semibold">{t("rfpCollaboration.clarifications")}</h2>
        <div className="space-y-2 max-h-40 overflow-y-auto text-sm">
          {messages.map((m) => (
            <div key={m.id} className="rounded-lg border border-gray-100 dark:border-gray-600 px-3 py-2">
              <div className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleString()}</div>
              <div className="whitespace-pre-wrap">{m.body}</div>
            </div>
          ))}
        </div>
        <form onSubmit={sendClarification} className="flex gap-2">
          <input
            value={clarify}
            onChange={(e) => setClarify(e.target.value)}
            placeholder={t("rfpCollaboration.askPmPlaceholder")}
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={busy || !clarify.trim()}
            className="px-3 py-2 rounded-lg bg-gray-800 dark:bg-gray-200 dark:text-gray-900 text-white text-sm disabled:opacity-50"
          >
            <FiSend className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
        <h2 className="text-sm font-semibold">{t("rfpCollaboration.quarterlyAudit")}</h2>
        <p className="text-xs text-gray-500">{t("rfpCollaboration.quarterlyAuditorHint")}</p>
        <ul className="space-y-3">
          {quarterly.map((item) => (
            <li key={item.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 text-sm">
              <div className="font-medium mb-2">{t(QR_LABELS[item.category] || item.category)}</div>
              <div className="flex flex-wrap gap-2">
                {["up_to_date", "needs_update", "outdated"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={busy}
                    onClick={() => setQrStatus(item.id, s)}
                    className={`px-2 py-1 rounded text-xs border ${
                      item.status === s
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {t(`rfpCollaboration.qrStatus.${s}`)}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
