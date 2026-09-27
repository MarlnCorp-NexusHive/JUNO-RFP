import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEye, FiEyeOff, FiLock, FiX } from "react-icons/fi";
import { changeTrialPassword } from "../../../services/api.js";

/**
 * Modal for trial tenants to change their own password.
 */
export default function TrialChangePasswordModal({ open, onClose }) {
  const { t } = useTranslation("common");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const reset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrent(false);
    setShowNew(false);
    setError("");
    setSuccess(false);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword.length < 8) {
      setError(t("proposalManagerTrial.passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("proposalManagerTrial.passwordMismatch"));
      return;
    }
    if (newPassword === currentPassword) {
      setError(t("proposalManagerTrial.passwordUnchanged"));
      return;
    }

    setSubmitting(true);
    try {
      await changeTrialPassword({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.error;
      if (code === "invalid_current_password") {
        setError(t("proposalManagerTrial.passwordCurrentWrong"));
      } else if (code === "password_too_short") {
        setError(t("proposalManagerTrial.passwordTooShort"));
      } else if (code === "password_unchanged") {
        setError(t("proposalManagerTrial.passwordUnchanged"));
      } else {
        setError(msg || t("proposalManagerTrial.passwordChangeFailed"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50"
        aria-label={t("proposalManagerTrial.passwordCancel")}
        onClick={handleClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <FiLock className="mt-0.5 h-5 w-5 text-indigo-600 dark:text-indigo-300" />
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {t("proposalManagerTrial.changePassword")}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {t("proposalManagerTrial.changePasswordHint")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="space-y-4">
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
              {t("proposalManagerTrial.passwordChanged")}
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              {t("proposalManagerTrial.passwordDone")}
            </button>
          </div>
        ) : (
          <form className="space-y-3" onSubmit={onSubmit}>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("proposalManagerTrial.currentPassword")}
              </span>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-2 text-slate-400"
                  onClick={() => setShowCurrent((v) => !v)}
                  aria-label={showCurrent ? "Hide" : "Show"}
                >
                  {showCurrent ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("proposalManagerTrial.newPassword")}
              </span>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-2 text-slate-400"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={showNew ? "Hide" : "Show"}
                >
                  {showNew ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("proposalManagerTrial.confirmPassword")}
              </span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                minLength={8}
                required
              />
            </label>

            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
                {error}
              </p>
            ) : null}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t("proposalManagerTrial.passwordCancel")}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                {submitting
                  ? t("proposalManagerTrial.passwordSaving")
                  : t("proposalManagerTrial.passwordSave")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
