import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheck,
  FiMessageCircle,
  FiRefreshCw,
  FiSend,
  FiUserPlus,
  FiX,
  FiZap,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { rfpCollab } from "../../services/rfpCollabApi.js";
import {
  ensureProposalManagerCollabSession,
  isMainAppProposalManager,
  loadCollabSession,
} from "./rfpCollabSession.js";

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

export default function RfpCollaborationPmWorkspace() {
  const { workspaceId } = useParams();
  const { t } = useTranslation();
  const [session, setSession] = useState(() => loadCollabSession());
  const [bootstrapping, setBootstrapping] = useState(() => {
    if (loadCollabSession()?.user?.role === "proposal_manager") return false;
    return isMainAppProposalManager();
  });
  const token = session?.token;

  const [workspace, setWorkspace] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [auditors, setAuditors] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignAuditorId, setAssignAuditorId] = useState("");

  const [reviewComment, setReviewComment] = useState("");
  const [pmReply, setPmReply] = useState("");

  const [logs, setLogs] = useState([]);
  const [clarifications, setClarifications] = useState([]);

  const [quarterly, setQuarterly] = useState([]);

  const selected = useMemo(
    () => questions.find((q) => q.id === selectedId) || null,
    [questions, selectedId],
  );

  const nameById = useMemo(() => {
    const m = new Map();
    if (session?.user?.id) m.set(session.user.id, session.user.name);
    auditors.forEach((a) => m.set(a.id, a.name));
    return m;
  }, [session, auditors]);

  const loadAll = useCallback(async () => {
    if (!token || !workspaceId) return;
    setError("");
    try {
      const [wsRes, audRes, logRes, qrRes] = await Promise.all([
        rfpCollab.getWorkspace(token, workspaceId),
        rfpCollab.listAuditors(token),
        rfpCollab.logs(token, workspaceId),
        rfpCollab.quarterlyReview(token, workspaceId),
      ]);
      setWorkspace(wsRes.data.workspace);
      setQuestions(wsRes.data.questions || []);
      setAuditors(audRes.data.auditors || []);
      setLogs(logRes.data.logs || []);
      setQuarterly(qrRes.data.items || []);
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    }
  }, [token, workspaceId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isMainAppProposalManager()) {
        setBootstrapping(false);
        return;
      }
      const existing = loadCollabSession();
      if (existing?.user?.role === "proposal_manager") {
        setSession(existing);
        setBootstrapping(false);
        return;
      }
      try {
        const s = await ensureProposalManagerCollabSession();
        if (!cancelled && s) setSession(s);
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!token || !workspaceId) return;
    const close = rfpCollab.subscribeLogsStream(workspaceId, token, {
      onEvent: (payload) => {
        if (payload?.type === "connected") return;
        setLogs((prev) => {
          const row = { ...payload, timestamp: payload.timestamp || new Date().toISOString() };
          if (prev.some((p) => p.timestamp === row.timestamp && p.action === row.action && p.user === row.user))
            return prev;
          return [...prev, row];
        });
      },
    });
    return close;
  }, [token, workspaceId]);

  const loadClarifications = useCallback(async () => {
    if (!token || !workspaceId) return;
    try {
      const { data } = await rfpCollab.clarifications(token, workspaceId);
      setClarifications(data.messages || []);
    } catch {
      setClarifications([]);
    }
  }, [token, workspaceId]);

  useEffect(() => {
    loadClarifications();
  }, [loadClarifications, selectedId]);

  const openAssign = () => {
    if (!selected || selected.status !== "unassigned") return;
    setAssignAuditorId(auditors[0]?.id || "");
    setAssignOpen(true);
  };

  const submitAssign = async () => {
    if (!token || !selected || !assignAuditorId) return;
    setBusy(true);
    try {
      await rfpCollab.assignQuestion(token, {
        workspaceId,
        questionId: selected.id,
        auditorUserId: assignAuditorId,
      });
      setAssignOpen(false);
      await loadAll();
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const submitReview = async (decision) => {
    if (!token || !selected) return;
    setBusy(true);
    try {
      await rfpCollab.reviewAnswer(token, {
        workspaceId,
        questionId: selected.id,
        decision,
        comment: reviewComment || undefined,
      });
      setReviewComment("");
      await loadAll();
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const sendPmReply = async (e) => {
    e.preventDefault();
    if (!token || !selected || !pmReply.trim()) return;
    setBusy(true);
    try {
      await rfpCollab.replyClarification(token, {
        workspaceId,
        questionId: selected.id,
        message: pmReply.trim(),
      });
      setPmReply("");
      await loadClarifications();
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  if (bootstrapping) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-gray-600 dark:text-gray-300">
        <FiRefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm">{t("rfpCollaboration.connectingTeamCollab")}</p>
      </div>
    );
  }

  if (!session || session.user?.role !== "proposal_manager") {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-300">
        {t("rfpCollaboration.usePmPortal")}{" "}
        <Link className="text-indigo-600 underline" to="/rbac/proposal-manager/rfp-collaboration">
          {t("rfpCollaboration.openPmHub")}
        </Link>
      </p>
    );
  }

  const threadForSelected = clarifications.filter((m) => !selected || m.questionId === selected.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/rbac/proposal-manager/rfp-collaboration"
          className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400"
        >
          <FiArrowLeft className="w-4 h-4" />
          {t("rfpCollaboration.backToWorkspaces")}
        </Link>
        <button
          type="button"
          onClick={() => loadAll()}
          className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300"
        >
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{workspace?.title || "…"}</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">{workspaceId}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
              {t("rfpCollaboration.questions")}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-left">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">{t("rfpCollaboration.summary")}</th>
                    <th className="px-3 py-2">{t("rfpCollaboration.statusLabel")}</th>
                    <th className="px-3 py-2">{t("rfpCollaboration.assignee")}</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => (
                    <tr
                      key={q.id}
                      onClick={() => setSelectedId(q.id)}
                      className={`border-t border-gray-100 dark:border-gray-700 cursor-pointer ${
                        selectedId === q.id ? "bg-indigo-50/80 dark:bg-indigo-950/30" : "hover:bg-gray-50 dark:hover:bg-gray-700/40"
                      }`}
                    >
                      <td className="px-3 py-2 align-top">{q.number}</td>
                      <td className="px-3 py-2 align-top max-w-md">
                        <div className="line-clamp-2 text-gray-800 dark:text-gray-200">{q.text}</div>
                      </td>
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        {t(STATUS_KEYS[q.status] || q.status)}
                      </td>
                      <td className="px-3 py-2 align-top text-xs">{q.assignedToName || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selected ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {t("rfpCollaboration.questionDetail", { n: selected.number })}
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{selected.text}</p>

              <div className="flex flex-wrap gap-2">
                {selected.status === "unassigned" ? (
                  <button
                    type="button"
                    onClick={openAssign}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm"
                  >
                    <FiUserPlus className="w-4 h-4" />
                    {t("rfpCollaboration.askToAudit")}
                  </button>
                ) : null}
              </div>

              {(selected.answerDraft || selected.submittedAnswer) && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">{t("rfpCollaboration.answer")}</h3>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-3 text-sm whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/40">
                    {selected.submittedAnswer || selected.answerDraft}
                  </div>
                  {selected.pmReviewComment ? (
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                      {t("rfpCollaboration.pmComment")}: {selected.pmReviewComment}
                    </p>
                  ) : null}
                </div>
              )}

              {selected.status === "submitted" ? (
                <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-semibold">{t("rfpCollaboration.review")}</h3>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={2}
                    placeholder={t("rfpCollaboration.reviewCommentPlaceholder")}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => submitReview("approve")}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-50"
                    >
                      <FiCheck className="w-4 h-4" />
                      {t("rfpCollaboration.approve")}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => submitReview("request_changes")}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-amber-600 text-white text-sm disabled:opacity-50"
                    >
                      <FiMessageCircle className="w-4 h-4" />
                      {t("rfpCollaboration.requestChanges")}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => submitReview("reject")}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-red-600 text-white text-sm disabled:opacity-50"
                    >
                      <FiX className="w-4 h-4" />
                      {t("rfpCollaboration.reject")}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <FiMessageCircle className="w-4 h-4" />
                  {t("rfpCollaboration.clarifications")}
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                  {threadForSelected.length === 0 ? (
                    <p className="text-xs text-gray-500">{t("rfpCollaboration.noClarifications")}</p>
                  ) : (
                    threadForSelected.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm"
                      >
                        <div className="text-xs text-gray-500 mb-1">
                          {nameById.get(m.fromUserId) || m.fromUserId} · {new Date(m.createdAt).toLocaleString()}
                        </div>
                        <div className="whitespace-pre-wrap">{m.body}</div>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={sendPmReply} className="flex gap-2">
                  <input
                    value={pmReply}
                    onChange={(e) => setPmReply(e.target.value)}
                    placeholder={t("rfpCollaboration.replyPlaceholder")}
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={busy || !pmReply.trim()}
                    className="px-3 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50"
                  >
                    <FiSend className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">{t("rfpCollaboration.quarterlyAudit")}</h2>
            <ul className="space-y-2">
              {quarterly.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap justify-between gap-2 text-sm border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2"
                >
                  <span>{t(QR_LABELS[item.category] || item.category)}</span>
                  <span className="text-xs text-gray-500">
                    {item.status ? t(`rfpCollaboration.qrStatus.${item.status}`) : t("rfpCollaboration.qrStatus.pending")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 max-h-[70vh] overflow-y-auto">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <FiZap className="w-4 h-4 text-amber-500" />
              {t("rfpCollaboration.activityLog")}
            </h2>
            <p className="text-xs text-gray-500 mb-3">{t("rfpCollaboration.activityLogLive")}</p>
            <ul className="space-y-2 text-xs">
              {[...logs]
                .slice(-80)
                .reverse()
                .map((log, i) => (
                  <li key={`${log.timestamp}-${i}`} className="border-b border-gray-100 dark:border-gray-700 pb-2">
                    <div className="font-medium text-gray-800 dark:text-gray-200">{log.user}</div>
                    <div className="text-gray-600 dark:text-gray-300">{log.action}</div>
                    {log.question_id != null ? (
                      <div className="text-gray-500">
                        {t("rfpCollaboration.questionRef")} {log.question_id}
                      </div>
                    ) : null}
                    <div className="text-gray-400">{log.timestamp}</div>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>

      {assignOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h2 className="text-lg font-semibold">{t("rfpCollaboration.assignAuditor")}</h2>
            <select
              value={assignAuditorId}
              onChange={(e) => setAssignAuditorId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
            >
              {auditors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.email})
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssignOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm"
              >
                {t("rfpCollaboration.cancel")}
              </button>
              <button
                type="button"
                disabled={busy || !assignAuditorId}
                onClick={submitAssign}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-50"
              >
                {t("rfpCollaboration.assign")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
