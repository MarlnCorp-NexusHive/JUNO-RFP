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
import { LocalizationProvider } from "../hooks/useLocalization.jsx";
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
  if (user.team === "Proposal Team" && user.role === "Proposal Manager") return "/app/dashboard";
  if (user.team === "RFP Collaboration" && user.role === "RFP Auditor") return "/rbac/rfp-auditor";
  // Add more as you build more dashboards
  // Default fallback
  return "/unauthorized";
};

const PRODUCT_HIGHLIGHT_KEYS = ["aiQa", "companyIntel", "exports", "collaboration"];

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

function ProductHighlight({ label, darkTheme }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${darkTheme ? "text-white/70" : "text-white/85"}`}>
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/25">
        <svg width="8" height="8" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2 6l2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>{label}</span>
    </div>
  );
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation(['auth', 'common']);
  const { isRTL, flexDirection, textAlign, margin, padding } = useRTL();

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

      // 2) Trial tenants (backend)
      try {
        const { data } = await API.post(
          "/trial/auth/login",
          { email: ident, password: passIn },
          { timeout: 8_000 },
        );
        setTrialSession(data);
        localStorage.setItem("rbac_current_user", JSON.stringify(trialUserToRbacUser(data)));
        navigate("/app/dashboard", { replace: true });
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
        setError(t('auth.login.invalidCredentials'));
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

  const inputClass = `w-full px-4 py-3 rounded-xl ${darkTheme ? 'bg-slate-700/80 text-white placeholder:text-slate-300/60' : 'bg-white/60 text-[#23232B] placeholder:text-[#23232B]/60'} focus:outline-none focus:ring-2 focus:ring-[#4f3cc9] font-medium shadow text-${textAlign('left')}`;
  const labelClass = `block text-sm font-medium ${darkTheme ? 'text-white' : 'text-white/80'} mb-1 text-${textAlign('left')}`;

  return (
    <RTLWrapper className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4f3cc9] via-[#6c5dd3] to-[#90caf9] relative">
      {/* Language Switcher and Theme Toggle - Positioned absolutely in top-right */}
      <div className={`absolute top-6 ${isRTL ? 'left-6' : 'right-6'} z-10 flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''} top-controls`}>
        {/* Theme Toggle Button */}
        <button
          onClick={handleThemeToggle}
          className={`
            relative inline-flex items-center justify-center w-12 h-12 
            bg-white/20 backdrop-blur-sm rounded-full 
            border border-white/30 shadow-lg
            hover:bg-white/30 hover:scale-105 
            transition-all duration-300 ease-in-out
            group
            ${isRTL ? 'ml-2' : 'mr-2'}
          `}
          title={darkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={darkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {/* Sun Icon */}
          <svg
            className={`w-5 h-5 text-yellow-400 transition-all duration-300 ${
              darkTheme ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
          
          {/* Moon Icon */}
          <svg
            className={`w-5 h-5 text-blue-300 transition-all duration-300 absolute ${
              darkTheme ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>

          {/* Hover effect ring */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-white/40 transition-all duration-300"></div>
        </button>
        
        <LanguageSwitcher />
      </div>
      
      <div className={`flex w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl bg-white/10 backdrop-blur-lg border border-white/20 ${flexDirection('row')}`}>
        {/* Left Side - Logo & Tagline */}
        <div className={`hidden md:flex flex-col items-center justify-center w-1/2 bg-white/10 p-10 ${isRTL ? 'rounded-r-3xl' : 'rounded-l-3xl'}`}>
          <img
            src="/juno-rfp-logo.png"
            alt="JUNO RFP"
            className="w-full max-w-56 object-contain drop-shadow-lg"
          />
        </div>
        {/* Right Side - Login Form */}
        <div className={`flex-1 flex flex-col justify-center items-center p-8 md:p-16 bg-white/20 ${isRTL ? 'rounded-l-3xl' : 'rounded-r-3xl'} form-container`}>
          <div className="w-full max-w-sm">
            <h2 className={`text-2xl font-bold text-center ${darkTheme ? 'text-white' : 'text-[#23232B]'} mb-2`}>
              {mode === "signup" ? t("auth.signup.title") : t("auth.login.title")}
            </h2>
            {mode === "signup" && (
              <p className={`text-center text-sm mb-6 ${darkTheme ? "text-white/70" : "text-white/85"}`}>
                {t("auth.signup.subtitle")}
              </p>
            )}
            {mode === "login" && !info && (
              <p className={`text-center text-sm mb-6 ${darkTheme ? "text-white/70" : "text-white/85"}`}>
                {t("auth.login.subtitle")}
              </p>
            )}
            {mode === "login" && info && <div className="mb-2" />}

            {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className={labelClass}>
                  {t('auth.login.username')}
                </label>
                <div className="relative input-with-icon">
                  <input
                    type="text"
                    className={`${inputClass} ${isRTL ? 'pr-12' : 'pl-12'}`}
                    placeholder={t('auth.login.usernamePlaceholder')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus
                    disabled={isLoading || confirming}
                  />
                  <span className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-[#4f3cc9] input-icon`}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#4f3cc9"/></svg>
                  </span>
                </div>
              </div>
              <div>
                <label className={labelClass}>
                  {t('auth.login.password')}
                </label>
                <div className="relative input-with-icon">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`${inputClass} ${isRTL ? "pl-12 pr-12" : "pl-12 pr-12"}`}
                    placeholder={t('auth.login.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || confirming}
                    autoComplete="current-password"
                  />
                  <span className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-[#4f3cc9] input-icon`}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-7V8a6 6 0 10-12 0v2a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2zm-8-2a4 4 0 118 0v2H6V8zm10 10H4v-6h16v6z" fill="#4f3cc9"/></svg>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className={`absolute ${isRTL ? "left-3" : "right-3"} top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#4f3cc9] hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-[#4f3cc9]/40 dark:hover:bg-white/10`}
                    aria-label={showPassword ? t("auth.login.hidePassword") : t("auth.login.showPassword")}
                    tabIndex={0}
                  >
                    <EyeIcon off={showPassword} />
                  </button>
                </div>
              </div>
              {(error || info || confirming) && (
                <div className={`text-sm text-center p-3 rounded-lg ${
                  error
                    ? (darkTheme ? 'text-red-400 bg-red-900/20' : 'text-red-500 bg-red-50')
                    : (darkTheme ? 'text-emerald-300 bg-emerald-900/20' : 'text-emerald-700 bg-emerald-50')
                }`}>
                  {error || info}
                </div>
              )}
              {devConfirmUrl && (
                <a
                  href={devConfirmUrl}
                  className="block text-center text-sm font-semibold text-[#4f3cc9] underline"
                >
                  {t("auth.signup.openConfirmLink")}
                </a>
              )}
              {demoReloaded && (
                <div className={`text-sm text-center p-3 rounded-lg ${darkTheme ? 'text-green-400 bg-green-900/20' : 'text-green-600 bg-green-50'}`}>
                  Demo credentials reloaded. Try logging in again.
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading || confirming}
                className={`w-full py-3 rounded-xl bg-[#23232B] text-white font-semibold text-lg shadow hover:bg-[#4f3cc9] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${flexDirection('row')} login-button`}
              >
                {isLoading ? t('auth.login.loading') : t('auth.login.signInButton')}
                {!isLoading && (
                  <svg 
                    width="18" 
                    height="18" 
                    fill="none" 
                    viewBox="0 0 24 24"
                    className={isRTL ? 'rotate-180' : ''}
                    data-arrow="true"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setInfo("");
                }}
                className="w-full mt-1 py-2 text-sm font-semibold text-white hover:underline"
              >
                {t("auth.login.noAccount")} {t("auth.login.signUp")}
              </button>
              <p className={`text-center text-xs mt-1 ${darkTheme ? "text-white/55" : "text-white/75"}`}>
                {t("auth.login.trialSignupHint")}
              </p>
              <button
                type="button"
                onClick={handleReloadDemoUsers}
                className="w-full py-2 text-sm text-[#4f3cc9] hover:underline"
              >
                Reload demo credentials
              </button>
            </form>
            ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className={labelClass}>{t("auth.signup.name")}</label>
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
                <label className={labelClass}>{t("auth.signup.company")}</label>
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
                <label className={labelClass}>{t("auth.signup.email")}</label>
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
                <label className={labelClass}>{t("auth.signup.password")}</label>
                <div className="relative">
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    className={`${inputClass} ${isRTL ? "pl-12" : "pr-12"}`}
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
                    className={`absolute ${isRTL ? "left-3" : "right-3"} top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#4f3cc9] hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-[#4f3cc9]/40 dark:hover:bg-white/10`}
                    aria-label={showSignupPassword ? t("auth.login.hidePassword") : t("auth.login.showPassword")}
                  >
                    <EyeIcon off={showSignupPassword} />
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>{t("auth.signup.confirmPassword")}</label>
                <div className="relative">
                  <input
                    type={showSignupConfirm ? "text" : "password"}
                    className={`${inputClass} ${isRTL ? "pl-12" : "pr-12"}`}
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
                    className={`absolute ${isRTL ? "left-3" : "right-3"} top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#4f3cc9] hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-[#4f3cc9]/40 dark:hover:bg-white/10`}
                    aria-label={showSignupConfirm ? t("auth.login.hidePassword") : t("auth.login.showPassword")}
                  >
                    <EyeIcon off={showSignupConfirm} />
                  </button>
                </div>
              </div>
              {(error || info) && (
                <div
                  className={`text-sm text-center p-3 rounded-lg ${
                    error
                      ? darkTheme
                        ? "text-red-400 bg-red-900/20"
                        : "text-red-500 bg-red-50"
                      : darkTheme
                        ? "text-emerald-300 bg-emerald-900/20"
                        : "text-emerald-700 bg-emerald-50"
                  }`}
                >
                  {error || info}
                </div>
              )}
              {devConfirmUrl && (
                <a
                  href={devConfirmUrl}
                  className="block text-center text-sm font-semibold text-[#4f3cc9] underline"
                >
                  {t("auth.signup.openConfirmLink")}
                </a>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#23232B] text-white font-semibold text-lg shadow hover:bg-[#4f3cc9] transition-colors disabled:opacity-70"
              >
                {isLoading ? t("auth.signup.loading") : t("auth.signup.submit")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setInfo("");
                }}
                className="w-full py-2 text-sm font-semibold text-white hover:underline"
              >
                {t("auth.login.haveAccount")} {t("auth.login.backToSignIn")}
              </button>
            </form>
            )}

            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-2.5">
              {PRODUCT_HIGHLIGHT_KEYS.map((key) => (
                <ProductHighlight key={key} label={t(`auth.highlights.${key}`)} darkTheme={darkTheme} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </RTLWrapper>
  );
}

// Main export with LocalizationProvider wrapper
export default function LoginPage() {
  return (
    <LocalizationProvider>
      <LoginPageContent />
    </LocalizationProvider>
  );
} 