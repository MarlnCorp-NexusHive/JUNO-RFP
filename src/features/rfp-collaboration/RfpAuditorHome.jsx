import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiLogOut, FiRefreshCw } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { rfpCollab } from "../../services/rfpCollabApi.js";
import {
  clearCollabSession,
  isMainAppRfpAuditor,
  loadCollabSession,
  saveCollabSession,
} from "./rfpCollabSession.js";
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

export default function RfpAuditorHome() {
  const { t } = useTranslation();
  const base = getRfpAuditorBasePath();
  const [session, setSession] = useState(() => loadCollabSession());
  const [email, setEmail] = useState("aiyana@juno");
  const [password, setPassword] = useState("aud123");
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dash, setDash] = useState(null);
  const [loadError, setLoadError] = useState("");

  const refreshDash = useCallback(async () => {
    const s = loadCollabSession();
    if (!s?.token || s.user?.role !== "auditor") return;
    setLoadError("");
    try {
      const { data } = await rfpCollab.auditorDashboard(s.token, s.user.id);
      setDash(data);
    } catch (e) {
      setLoadError(e?.response?.data?.error || e.message);
    }
  }, []);

  useEffect(() => {
    const s = loadCollabSession();
    setSession(s);
    if (s?.token && s.user?.role === "auditor") refreshDash();
  }, [refreshDash]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setBusy(true);
    try {
      const { data } = await rfpCollab.login(email.trim(), password);
      if (data.user?.role !== "auditor") {
        setLoginError(t("rfpCollaboration.auditorOnlyPortal"));
        return;
      }
      saveCollabSession(data.token, data.user);
      setSession(loadCollabSession());
      await refreshDash();
    } catch (err) {
      setLoginError(err?.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    clearCollabSession();
    setSession(null);
    setDash(null);
  };

  if (!session?.token || session.user?.role !== "auditor") {
    return (
      <div className="max-w-md mx-auto mt-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{t("rfpCollaboration.auditorLoginTitle")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t("rfpCollaboration.auditorLoginHint")}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t("rfpCollaboration.auditorMainLoginHint")}</p>
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
          {loginError ? <p className="text-sm text-red-600 dark:text-red-400">{loginError}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium disabled:opacity-50"
          >
            {busy ? t("rfpCollaboration.signingIn") : t("rfpCollaboration.signIn")}
          </button>
        </form>
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          {t("rfpCollaboration.pmLinkPrefix")}{" "}
          <Link to="/rbac/proposal-manager/rfp-collaboration" className="text-indigo-600 dark:text-indigo-400 underline">
            {t("rfpCollaboration.pmHubLink")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("rfpCollaboration.myAssignments")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {dash?.auditor?.name} · {dash?.auditor?.email}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => refreshDash()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm"
          >
            <FiRefreshCw className="w-4 h-4" />
            {t("rfpCollaboration.refresh")}
          </button>
          {!isMainAppRfpAuditor() ? (
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm"
            >
              <FiLogOut className="w-4 h-4" />
              {t("rfpCollaboration.logOut")}
            </button>
          ) : null}
        </div>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/80 dark:bg-red-950/20 px-3 py-2 text-sm text-red-800 dark:text-red-200">
          {loadError}
        </div>
      ) : null}

      {!dash?.questions?.length ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("rfpCollaboration.noAssignments")}</p>
      ) : (
        <ul className="space-y-2">
          {dash.questions.map((q) => (
            <li key={q.id}>
              <Link
                to={`${base}/workspace/${q.workspaceId}/question/${q.id}`}
                className="block rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {t("rfpCollaboration.questionRef")} {q.number}
                  </span>
                  <span className="text-xs text-gray-500">{t(STATUS_KEYS[q.status] || q.status)}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{q.text}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
