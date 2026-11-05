import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { localStorageService } from "../services/localStorageService";
import { preloadDemoUsers } from "../data/preloadDemoUsers";
import API, {
  confirmTrialEmail,
  signupTrial,
} from "../services/api.js";
import {
  clearTrialSession,
  setTrialSession,
  trialUserToRbacUser,
} from "../services/trialAuthSession.js";
import { proposalManagerLandingPath } from "../features/proposal-manager/services/navModeStore.js";
import { useRTL } from "../hooks/useRTL";
import LanguageSwitcher from "./localization/LanguageSwitcher";
import RTLWrapper from "./localization/RTLWrapper";
import "../utils/i18n"; // Initialize i18n

// Map team/role to dashboard route
const dashboardRoute = (user) => {
  if (user.role === "Super Admin") return "/rbac";
  if (user.team === "Marketing Team" && user.role === "Head") return "/rbac/marketing-head";
  if (user.team === "Marketing Team" && user.role === "Manager") return "/rbac/marketing-manager";
  if ((user.team === "Admission Team" || user.team === "Recruitment Team") && user.role === "Head") return "/rbac/admission-head";
  if ((user.team === "Admission Team" || user.team === "Recruitment Team") && user.role === "SPOC") return "/rbac/admission-spoc";
  if (user.team === "HR & PayRoll Team" && user.role === "CFO/Head") return "/rbac/hr-head";
  if (user.team === "HR & PayRoll Team" && user.role === "Manager") return "/rbac/hr-manager";
  if (user.team === "Director and Deans" && user.role === "Director") return "/rbac/director";
  if (user.team === "Director and Deans" && user.role === "CFO") return "/rbac/dean";
  if (user.team === "Admin Team" && user.role === "Head") return "/rbac/admin-head";
  if (user.team === "IT & Support Team" && user.role === "Head") return "/rbac/it-head";
  if (user.team === "HoD" && user.role === "HoD") return "/rbac/hod";
  if (user.team === "Teacher/Professor" && user.role === "Senior Professor") return "/rbac/senior-professor";
  if (user.team === "Students" && user.role === "Students") return "/rbac/student";
  if (user.team === "Parents" && user.role === "Parents") return "/rbac/parent";
  if (user.team === "Exam Team" && user.role === "Head") return "/rbac/exam-head";
  if (user.team === "Library Team" && user.role === "Head") return "/rbac/library-head";
  if (user.team === "Transport Team" && user.role === "Head") return "/rbac/transport-head";
  if (user.team === "Procurement Team" && user.role === "Manager") return "/rbac/marketing-head";
  if (user.team === "Sales Enablement Team" && user.role === "Manager") return "/rbac/marketing-head";
  if (user.team === "Proposal Team" && user.role === "Proposal Manager") {
    return proposalManagerLandingPath();
  }
  if (
    user.team === "RFP Collaboration" &&
    (user.role === "Team Member" || user.role === "RFP Auditor")
  ) {
    return "/rbac/rfp-auditor";
  }
  // Add more as you build more dashboards
  // Default fallback
  return "/unauthorized";
};

/** Dedupe confirm calls (Strict Mode remount / double-click). */
const confirmInFlight = new Map();
const confirmHandled = new Set();

async function confirmTrialEmailOnce(token) {
  if (confirmInFlight.has(token)) return confirmInFlight.get(token);
  const promise = confirmTrialEmail(token).finally(() => {
    confirmInFlight.delete(token);
  });
  confirmInFlight.set(token, promise);
  return promise;
}

function EyeIcon({ off = false }) {
  if (off) {
    return (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M3 3l18 18M10.6 10.6A2 2 0 0012 14a2 2 0 001.4-.6M9.9 5.1A9.8 9.8 0 0112 5c5 0 9.3 3.1 11 7a11.4 11.4 0 01-4.2 4.8M6.1 6.1A11.5 11.5 0 001 12c1.7 3.9 6 7 11 7a10.4 10.4 0 005.1-1.3"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function LoginPageContent() {
  const [mode, setMode] = useState("login"); // login | signup
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupCompany, setSignupCompany] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [devConfirmUrl, setDevConfirmUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [darkTheme, setDarkTheme] = useState(false);
  const [demoReloaded, setDemoReloaded] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation(['auth', 'common']);
  const { isRTL, flexDirection, textAlign } = useRTL();

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const getInitialTheme = () => {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    };
    
    const initialTheme = getInitialTheme();
    setDarkTheme(initialTheme);
    
    if (initialTheme) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, []);

  // Handle email confirmation link: /login?trialConfirm=TOKEN
  useEffect(() => {
    const token = searchParams.get("trialConfirm");
    if (!token) return;
    if (confirmHandled.has(token)) {
      setInfo(t("auth.confirm.alreadyConfirmed"));
      setMode("login");
      setSearchParams({}, { replace: true });
      return;
    }

    let alive = true;
    (async () => {
      setConfirming(true);
      setError("");
      setInfo(t("auth.confirm.loading"));
      try {
        const data = await confirmTrialEmailOnce(token);
        if (!alive) return;
        confirmHandled.add(token);
        setInfo(
          data?.alreadyConfirmed
            ? t("auth.confirm.alreadyConfirmed")
            : t("auth.confirm.success"),
        );
        setMode("login");
        setSearchParams({}, { replace: true });
      } catch (err) {
        if (!alive) return;
        const code = err?.response?.data?.code;
        setInfo("");
        if (code === "invalid_token") {
          // Link already consumed (scanner / prior click) — account is usually already active
          confirmHandled.add(token);
          setError("");
          setInfo(t("auth.confirm.alreadyUsed"));
          setMode("login");
          setSearchParams({}, { replace: true });
        } else {
          setError(
            code === "token_expired"
              ? t("auth.confirm.expired")
              : err?.response?.data?.error || t("auth.confirm.failed"),
          );
          setSearchParams({}, { replace: true });
        }
      } finally {
        if (alive) setConfirming(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [searchParams, setSearchParams, t]);

  const handleThemeToggle = () => {
    const newTheme = !darkTheme;
    setDarkTheme(newTheme);
    
    if (newTheme) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setInfo("");
    setDevConfirmUrl("");
    
    try {
      const ident = username.trim().toLowerCase();
      const passIn = password.trim();

      // 1) Demo accounts first (local, instant).
      clearTrialSession();
      preloadDemoUsers();

      const users = localStorageService.getUsers();
      const demoUser = users.find((u) => {
        const uName = String(u.username || "").toLowerCase();
        const uMail = String(u.collabEmail || "").toLowerCase();
        const passOk = String(u.password || "") === passIn;
        if (!passOk) return false;
        return uName === ident || (uMail && uMail === ident);
      });
      if (demoUser) {
        localStorage.setItem("rbac_current_user", JSON.stringify(demoUser));
        navigate(dashboardRoute(demoUser), { replace: true });
        return;
      }

      // 2) Trial tenants (backend) — long timeout: Render free tier can cold-start slowly.
      try {
        const { data } = await API.post(
          "/trial/auth/login",
          { email: ident, password: passIn },
          { timeout: 90_000 },
        );
        setTrialSession(data);
        localStorage.setItem("rbac_current_user", JSON.stringify(trialUserToRbacUser(data)));
        navigate(proposalManagerLandingPath(), { replace: true });
        return;
      } catch (trialErr) {
        const code = trialErr?.response?.data?.code;
        const msg = trialErr?.response?.data?.error;
        if (code === "trial_expired" || code === "tenant_disabled") {
          clearTrialSession();
          setError(msg || t("auth.login.trialExpiredDetail"));
          return;
        }
        if (code === "email_not_verified") {
          clearTrialSession();
          setError(msg || t("auth.login.emailNotVerified"));
          return;
        }
        const timedOut =
          trialErr?.code === "ECONNABORTED" ||
          /timeout/i.test(String(trialErr?.message || ""));
        const networkFail = !trialErr?.response && !timedOut;
        if (timedOut || networkFail) {
          clearTrialSession();
          setError(t("auth.login.serverWaking"));
          return;
        }
        setError(msg || t('auth.login.invalidCredentials'));
      }
    } catch (err) {
      setError(t('auth.login.invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setDevConfirmUrl("");

    if (signupPassword.length < 8) {
      setError(t("auth.signup.tooShort"));
      return;
    }
    if (signupPassword !== signupConfirm) {
      setError(t("auth.signup.mismatch"));
      return;
    }

    setIsLoading(true);
    try {
      const data = await signupTrial({
        name: signupName.trim(),
        companyName: signupCompany.trim(),
        email: signupEmail.trim().toLowerCase(),
        password: signupPassword,
      });
      setInfo(data.emailSent ? t("auth.signup.success") : t("auth.signup.successDev"));
      if (data.confirmUrl) setDevConfirmUrl(data.confirmUrl);
      setUsername(signupEmail.trim().toLowerCase());
      setPassword("");
      setMode("login");
    } catch (err) {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.error;
      if (code === "email_taken") setError(t("auth.signup.emailTaken"));
      else if (code === "password_too_short") setError(t("auth.signup.tooShort"));
      else setError(msg || t("auth.signup.failed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReloadDemoUsers = () => {
    preloadDemoUsers();
    setDemoReloaded(true);
    setError("");
    setTimeout(() => setDemoReloaded(false), 3000);
  };

  const pageBg = darkTheme ? "bg-[#0B1017]" : "bg-[#FFFFFF]";
  const ink = darkTheme ? "text-[#F3F4F6]" : "text-[#111827]";
  const muted = darkTheme ? "text-[#9CA3AF]" : "text-[#6B7280]";
  const fieldBorder = darkTheme
    ? "border-[#374151] bg-[#111827] text-[#F3F4F6] placeholder:text-[#6B7280] focus:border-[#9CA3AF]"
    : "border-[#D1D5DB] bg-[#FFFFFF] text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#111827]";
  const inputClass = `w-full rounded-md border px-3.5 py-3 text-[15px] outline-none transition focus:ring-0 ${fieldBorder} text-${textAlign("left")}`;
  const labelClass = `mb-1.5 block text-sm font-medium ${ink} text-${textAlign("left")}`;
  const linkClass = darkTheme
    ? "text-[#D1D5DB] underline decoration-[#6B7280] underline-offset-2 hover:text-white"
    : "text-[#111827] underline decoration-[#9CA3AF] underline-offset-2 hover:decoration-[#111827]";
  const ctaClass = darkTheme
    ? "w-full rounded-md bg-[#E5E7EB] py-3.5 text-center text-[15px] font-semibold text-[#111827] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
    : "w-full rounded-md bg-[#111827] py-3.5 text-center text-[15px] font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-70";

  return (
    <RTLWrapper className={`relative min-h-screen ${pageBg}`}>
      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <img
          src="/juno-rfp-wordmark.jpg"
          alt="JUNO RFP by MARLN Corporation"
          className="h-24 w-auto object-contain sm:h-32"
        />

        <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
          {mode === "login" ? (
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError("");
                setInfo("");
              }}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                darkTheme
                  ? "border-[#374151] text-[#E5E7EB] hover:bg-[#1F2937]"
                  : "border-[#D1D5DB] text-[#111827] hover:bg-[#F9FAFB]"
              }`}
            >
              {t("auth.login.signUp")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setInfo("");
              }}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                darkTheme
                  ? "border-[#374151] text-[#E5E7EB] hover:bg-[#1F2937]"
                  : "border-[#D1D5DB] text-[#111827] hover:bg-[#F9FAFB]"
              }`}
            >
              {t("auth.login.backToSignIn")}
            </button>
          )}
          <button
            type="button"
            onClick={handleThemeToggle}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
              darkTheme
                ? "border-[#374151] text-[#D1D5DB] hover:bg-[#1F2937]"
                : "border-[#E5E7EB] text-[#4B5563] hover:bg-[#F9FAFB]"
            }`}
            title={darkTheme ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={darkTheme ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkTheme ? (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="relative z-[1] mx-auto flex w-full max-w-[420px] flex-col px-5 pb-16 pt-6 sm:pt-10">
        {mode === "login" ? (
          <>
            <p className={`text-sm ${muted}`}>
              {t("auth.login.welcomeBack", { defaultValue: "Welcome back" })}
            </p>
            <h1
              className={`mt-2 text-[2rem] font-semibold tracking-tight sm:text-[2.35rem] ${ink}`}
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {t("auth.login.logInTo", { defaultValue: "Log in to JUNO RFP" })}
            </h1>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label className={labelClass}>
                  {t("auth.login.username")} <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder={t("auth.login.usernamePlaceholder")}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                  disabled={isLoading || confirming}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t("auth.login.password")} <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`${inputClass} ${isRTL ? "pl-11" : "pr-11"}`}
                    placeholder={t("auth.login.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || confirming}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className={`absolute top-1/2 -translate-y-1/2 rounded p-1.5 ${muted} ${
                      isRTL ? "left-2" : "right-2"
                    } hover:opacity-80`}
                    aria-label={
                      showPassword ? t("auth.login.hidePassword") : t("auth.login.showPassword")
                    }
                  >
                    <EyeIcon off={showPassword} />
                  </button>
                </div>
              </div>

              <div
                className={`flex flex-wrap items-center justify-between gap-3 text-sm ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
                <label className={`flex cursor-pointer items-center gap-2 ${muted}`}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#111827] focus:ring-[#111827]"
                  />
                  <span>
                    {t("auth.login.rememberMe", {
                      defaultValue: "Remember me on this computer",
                    })}
                  </span>
                </label>
                <button
                  type="button"
                  className={linkClass}
                  onClick={() =>
                    setInfo(
                      t("auth.login.forgotComingSoon", {
                        defaultValue:
                          "Password reset is coming soon. Contact support if you need help.",
                      }),
                    )
                  }
                >
                  {t("auth.login.forgotPassword", {
                    defaultValue: "Forgot your password?",
                  })}
                </button>
              </div>

              {(error || info || confirming) && (
                <div
                  className={`rounded-md px-3 py-2.5 text-center text-sm ${
                    error
                      ? darkTheme
                        ? "bg-red-900/20 text-red-300"
                        : "bg-red-50 text-red-600"
                      : darkTheme
                        ? "bg-emerald-900/20 text-emerald-300"
                        : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {error || info}
                </div>
              )}
              {devConfirmUrl && (
                <a
                  href={devConfirmUrl}
                  className={`block text-center text-sm font-semibold ${linkClass}`}
                >
                  {t("auth.signup.openConfirmLink")}
                </a>
              )}
              {demoReloaded && (
                <div
                  className={`rounded-md px-3 py-2.5 text-center text-sm ${
                    darkTheme
                      ? "bg-emerald-900/20 text-emerald-300"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  Demo credentials reloaded. Try logging in again.
                </div>
              )}

              <button type="submit" disabled={isLoading || confirming} className={ctaClass}>
                {isLoading ? t("auth.login.loading") : t("auth.login.signInButton")}
              </button>
            </form>

            <p className={`mt-8 text-center text-sm ${muted}`}>
              {t("auth.login.noAccount")}{" "}
              <button
                type="button"
                className={linkClass}
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setInfo("");
                }}
              >
                {t("auth.login.signUp")}
              </button>
            </p>
            <button
              type="button"
              onClick={handleReloadDemoUsers}
              className={`mx-auto mt-4 block text-xs hover:underline ${muted}`}
            >
              Reload demo credentials
            </button>
          </>
        ) : (
          <>
            <p className={`text-sm ${muted}`}>{t("auth.signup.subtitle")}</p>
            <h1
              className={`mt-2 text-[2rem] font-semibold tracking-tight sm:text-[2.35rem] ${ink}`}
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {t("auth.signup.title")}
            </h1>
            <form onSubmit={handleSignup} className="mt-8 space-y-4">
              <div>
                <label className={labelClass}>
                  {t("auth.signup.name")} <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  className={inputClass}
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder={t("auth.signup.namePlaceholder")}
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t("auth.signup.company")} <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  className={inputClass}
                  value={signupCompany}
                  onChange={(e) => setSignupCompany(e.target.value)}
                  placeholder={t("auth.signup.companyPlaceholder")}
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t("auth.signup.email")} <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="email"
                  className={inputClass}
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder={t("auth.signup.emailPlaceholder")}
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t("auth.signup.password")} <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    className={`${inputClass} ${isRTL ? "pl-11" : "pr-11"}`}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder={t("auth.signup.passwordPlaceholder")}
                    minLength={8}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword((v) => !v)}
                    className={`absolute top-1/2 -translate-y-1/2 rounded p-1.5 ${muted} ${
                      isRTL ? "left-2" : "right-2"
                    }`}
                  >
                    <EyeIcon off={showSignupPassword} />
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>
                  {t("auth.signup.confirmPassword")} <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSignupConfirm ? "text" : "password"}
                    className={`${inputClass} ${isRTL ? "pl-11" : "pr-11"}`}
                    value={signupConfirm}
                    onChange={(e) => setSignupConfirm(e.target.value)}
                    minLength={8}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupConfirm((v) => !v)}
                    className={`absolute top-1/2 -translate-y-1/2 rounded p-1.5 ${muted} ${
                      isRTL ? "left-2" : "right-2"
                    }`}
                  >
                    <EyeIcon off={showSignupConfirm} />
                  </button>
                </div>
              </div>
              {(error || info) && (
                <div
                  className={`rounded-md px-3 py-2.5 text-center text-sm ${
                    error
                      ? darkTheme
                        ? "bg-red-900/20 text-red-300"
                        : "bg-red-50 text-red-600"
                      : darkTheme
                        ? "bg-emerald-900/20 text-emerald-300"
                        : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {error || info}
                </div>
              )}
              {devConfirmUrl && (
                <a
                  href={devConfirmUrl}
                  className={`block text-center text-sm font-semibold ${linkClass}`}
                >
                  {t("auth.signup.openConfirmLink")}
                </a>
              )}
              <button type="submit" disabled={isLoading} className={ctaClass}>
                {isLoading ? t("auth.signup.loading") : t("auth.signup.submit")}
              </button>
            </form>
            <p className={`mt-8 text-center text-sm ${muted}`}>
              {t("auth.login.haveAccount")}{" "}
              <button
                type="button"
                className={linkClass}
                onClick={() => {
                  setMode("login");
                  setError("");
                  setInfo("");
                }}
              >
                {t("auth.login.backToSignIn")}
              </button>
            </p>
          </>
        )}
      </main>
    </RTLWrapper>
  );
}

export default function LoginPage() {
  return <LoginPageContent />;
}
