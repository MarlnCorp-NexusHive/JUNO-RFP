import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiLogOut, FiPlus, FiRefreshCw, FiUsers } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { rfpCollab } from "../../services/rfpCollabApi.js";
import { structureRfpRequirementsWithAi } from "../../services/api.js";
import {
  clearCollabSession,
  ensureProposalManagerCollabSession,
  isMainAppProposalManager,
  loadCollabSession,
  saveCollabSession,
} from "./rfpCollabSession.js";

export default function RfpCollaborationPmHub() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [session, setSession] = useState(() => loadCollabSession());
  const [bootstrapping, setBootstrapping] = useState(() => {
    const s = loadCollabSession();
    if (s?.user?.role === "proposal_manager") return false;
    return isMainAppProposalManager();
  });
  const [email, setEmail] = useState("jordan@juno");
  const [password, setPassword] = useState("pm123");
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [listError, setListError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [document, setDocument] = useState("");
  const [parseBusy, setParseBusy] = useState(false);
  const [rows, setRows] = useState([{ number: 1, text: "" }]);

  const refresh = useCallback(async () => {
    const s = loadCollabSession();
    if (!s?.token || s.user?.role !== "proposal_manager") return;
    setListError("");
    try {
      const { data } = await rfpCollab.listWorkspaces(s.token);
      setWorkspaces(data.workspaces || []);
    } catch (e) {
      setListError(e?.response?.data?.error || e.message);
    }
  }, []);

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
        await refresh();
        setBootstrapping(false);
        return;
      }
      try {
        const s = await ensureProposalManagerCollabSession();
        if (!cancelled && s) {
          setSession(s);
          await refresh();
        }
      } catch (e) {
        if (!cancelled) {
          setLoginError(e?.response?.data?.error || e.message);
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setBusy(true);
    try {
      const { data } = await rfpCollab.login(email.trim(), password);
      if (data.user?.role !== "proposal_manager") {
        setLoginError(t("rfpCollaboration.pmOnlyPortal"));
        return;
      }
      saveCollabSession(data.token, data.user);
      setSession(loadCollabSession());
      await refresh();
    } catch (err) {
      setLoginError(err?.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    clearCollabSession();
    setSession(null);
    setWorkspaces([]);
  };

  const addRow = () => {
    setRows((r) => [...r, { number: r.length + 1, text: "" }]);
  };

  const updateRow = (i, field, value) => {
    setRows((r) => r.map((row, j) => (j === i ? { ...row, [field]: value } : row)));
  };

  const parseWithAi = async () => {
    if (!document.trim()) return;
    setParseBusy(true);
    try {
      const data = await structureRfpRequirementsWithAi(document);
      const items = Array.isArray(data.items) ? data.items : [];
      if (!items.length) return;
      setRows(
        items.map((it, idx) => ({
          number: Number(it.n) || idx + 1,
          text: String(it.q || "").trim(),
        })),
      );
    } catch (e) {
      setListError(e?.response?.data?.error || e.message);
    } finally {
      setParseBusy(false);
    }
  };

  const createWorkspace = async (e) => {
    e.preventDefault();
    const s = loadCollabSession();
    if (!s?.token) return;
    const questions = rows
      .map((row, idx) => ({
        number: Number(row.number) || idx + 1,
        text: String(row.text || "").trim(),
      }))
      .filter((q) => q.text.length > 0);
    if (!title.trim() || questions.length === 0) return;
    setBusy(true);
    try {
      const { data } = await rfpCollab.createWorkspace(s.token, {
        title: title.trim(),
        document,
        questions,
      });
      setShowCreate(false);
      setTitle("");
      setDocument("");
      setRows([{ number: 1, text: "" }]);
      await refresh();
      if (data?.workspace?.id) {
        navigate(`/rbac/proposal-manager/rfp-collaboration/w/${data.workspace.id}`);
      }
    } catch (err) {
      setListError(err?.response?.data?.error || err.message);
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

  if (!session?.token || session.user?.role !== "proposal_manager") {
    return (
      <div className="max-w-md mx-auto mt-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
          {t("rfpCollaboration.pmLoginTitle")}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t("rfpCollaboration.pmLoginHintFallback")}</p>
        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
              autoComplete="current-password"
            />
          </div>
          {loginError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{loginError}</p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium disabled:opacity-50"
          >
            {busy ? t("rfpCollaboration.signingIn") : t("rfpCollaboration.signIn")}
          </button>
        </form>
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          {t("rfpCollaboration.auditorLinkPrefix")}{" "}
          <Link to="/collaboration" className="text-indigo-600 dark:text-indigo-400 underline">
            /collaboration
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("rfpCollaboration.pmHubTitle")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {session.user.name} · {t("rfpCollaboration.pmHubSubtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refresh()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm"
          >
            <FiRefreshCw className="w-4 h-4" />
            {t("rfpCollaboration.refresh")}
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium"
          >
            <FiPlus className="w-4 h-4" />
            {t("rfpCollaboration.newWorkspace")}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm"
          >
            <FiLogOut className="w-4 h-4" />
            {t("rfpCollaboration.logOut")}
          </button>
        </div>
      </div>

      {listError ? (
        <div className="rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/80 dark:bg-red-950/20 px-3 py-2 text-sm text-red-800 dark:text-red-200">
          {listError}
        </div>
      ) : null}

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <FiUsers className="w-5 h-5 text-indigo-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">{t("rfpCollaboration.workspaces")}</h2>
        </div>
        {workspaces.length === 0 ? (
          <p className="p-6 text-sm text-gray-500 dark:text-gray-400">{t("rfpCollaboration.noWorkspaces")}</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {workspaces.map((w) => (
              <li key={w.id}>
                <Link
                  to={`/rbac/proposal-manager/rfp-collaboration/w/${w.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <span className="font-medium text-gray-900 dark:text-white">{w.title}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {w.questionCount} {t("rfpCollaboration.questions")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("rfpCollaboration.createWorkspace")}</h2>
            <form onSubmit={createWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">{t("rfpCollaboration.workspaceTitle")}</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t("rfpCollaboration.rfpDocument")}</label>
                <textarea
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-mono"
                  placeholder={t("rfpCollaboration.rfpDocumentPlaceholder")}
                />
                <button
                  type="button"
                  onClick={parseWithAi}
                  disabled={parseBusy || !document.trim()}
                  className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 disabled:opacity-50"
                >
                  {parseBusy ? t("rfpCollaboration.parsing") : t("rfpCollaboration.splitWithAi")}
                </button>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium">{t("rfpCollaboration.requirements")}</label>
                  <button type="button" onClick={addRow} className="text-xs text-indigo-600 dark:text-indigo-400">
                    {t("rfpCollaboration.addRow")}
                  </button>
                </div>
                <div className="space-y-2">
                  {rows.map((row, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="number"
                        value={row.number}
                        onChange={(e) => updateRow(i, "number", e.target.value)}
                        className="w-16 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm"
                      />
                      <input
                        value={row.text}
                        onChange={(e) => updateRow(i, "text", e.target.value)}
                        className="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1 text-sm"
                        placeholder={t("rfpCollaboration.requirementText")}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm"
                >
                  {t("rfpCollaboration.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50"
                >
                  {t("rfpCollaboration.create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
