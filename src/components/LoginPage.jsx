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

  const ink = darkTheme ? "text-[#F7F4EF]" : "text-[#1A2433]";
  const muted = darkTheme ? "text-[#C9D0DB]" : "text-[#5B6B7C]";
  const accent = darkTheme ? "text-[#9DC4EE]" : "text-[#2F6BA8]";
  const fieldBorder = darkTheme
    ? "border-white/12 bg-[#121A26]/88 text-[#F7F4EF] placeholder:text-[#8B97A8] focus:border-[#8EC1EC] focus:ring-[#8EC1EC]/25"
    : "border-[#D5DEE8] bg-white/92 text-[#1A2433] placeholder:text-[#8FA0B2] focus:border-[#4F85B5] focus:ring-[#4F85B5]/20";
  const inputClass = `w-full rounded-xl border px-4 py-3.5 text-[15px] font-loginUi font-medium tracking-[-0.01em] outline-none transition duration-200 focus:ring-4 ${fieldBorder} text-${textAlign("left")}`;
  const labelClass = `mb-2 block text-[12px] font-loginUi font-semibold uppercase tracking-[0.14em] ${muted} text-${textAlign("left")}`;
  const linkClass = darkTheme
    ? "font-loginUi font-medium text-[#D7E7F7] underline decoration-[#6B849C]/70 underline-offset-4 hover:text-white hover:decoration-white"
    : "font-loginUi font-medium text-[#2F6BA8] underline decoration-[#9DC4EE] underline-offset-4 hover:text-[#1A2433] hover:decoration-[#2F6BA8]";
  const ctaClass = darkTheme
    ? "w-full rounded-xl bg-gradient-to-b from-[#E8EEF6] to-[#D5DFEC] py-3.5 text-center text-[15px] font-loginUi font-semibold tracking-[0.02em] text-[#121A26] shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition hover:from-white hover:to-[#E8EEF6] disabled:cursor-not-allowed disabled:opacity-70"
    : "w-full rounded-xl bg-gradient-to-b from-[#243F5B] to-[#1A3148] py-3.5 text-center text-[15px] font-loginUi font-semibold tracking-[0.02em] text-white shadow-[0_12px_28px_rgba(36,63,91,0.32)] transition hover:from-[#2E4F70] hover:to-[#243F5B] disabled:cursor-not-allowed disabled:opacity-70";
  const chipBtn = darkTheme
    ? "rounded-full border border-white/20 bg-black/35 font-loginUi text-[13px] font-medium tracking-wide text-[#E5E7EB] backdrop-blur-md hover:bg-black/50"
    : "rounded-full border border-black/10 bg-white/80 font-loginUi text-[13px] font-medium tracking-wide text-[#1A2433] backdrop-blur-md hover:bg-white";
  const iconBtn = darkTheme
    ? "border-white/20 bg-black/35 text-[#D1D5DB] backdrop-blur-md hover:bg-black/50"
    : "border-black/10 bg-white/80 text-[#4B5563] backdrop-blur-md hover:bg-white";
  const panelClass = darkTheme
    ? "rounded-[1.75rem] border border-white/12 bg-[linear-gradient(160deg,rgba(18,26,38,0.88),rgba(11,16,23,0.78))] p-7 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:p-9"
    : "rounded-[1.75rem] border border-white/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.92),rgba(247,250,253,0.82))] p-7 shadow-[0_30px_80px_rgba(36,63,91,0.22)] backdrop-blur-2xl sm:p-9";
  const requiredMark = darkTheme ? "text-[#9DC4EE]" : "text-[#4F85B5]";
  const loginVideoSrc = darkTheme
    ? "/login-bg/golden-gate-night.mp4"
    : "/login-bg/golden-gate-day.mp4";

  return (
    <RTLWrapper className="relative min-h-screen overflow-hidden bg-[#0B1017]">
      {/* Theme-aware Golden Gate Bridge backgrounds (Pexels, free license) */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <video
          key={loginVideoSrc}
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src={loginVideoSrc} type="video/mp4" />
        </video>
        <div
          className={`absolute inset-0 ${
            darkTheme
              ? "bg-gradient-to-b from-black/55 via-black/40 to-black/65"
              : "bg-gradient-to-b from-white/45 via-white/25 to-white/50"
          }`}
        />
      </div>

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <img
          src={darkTheme ? "/juno-rfp-wordmark-dark.png" : "/juno-rfp-wordmark.png"}
          alt="JUNO RFP by MARLN Corporation"
          className="h-24 w-auto object-contain sm:h-32 bg-transparent drop-shadow-sm"
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
              className={`px-4 py-1.5 text-sm font-medium transition ${chipBtn}`}
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
              className={`px-4 py-1.5 text-sm font-medium transition ${chipBtn}`}
            >
              {t("auth.login.backToSignIn")}
            </button>
          )}
          <button
            type="button"
            onClick={handleThemeToggle}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${iconBtn}`}
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

      <main className="relative z-[1] mx-auto flex w-full max-w-[460px] flex-col px-5 pb-16 pt-6 font-loginUi sm:pt-10">
        <div className={panelClass}>
        {mode === "login" ? (
          <>
            <p className={`text-[13px] font-medium tracking-[0.18em] uppercase ${accent}`}>
              {t("auth.login.welcomeBack", { defaultValue: "Welcome back" })}
            </p>
            <h1
              className={`mt-3 font-loginDisplay text-[2.15rem] font-semibold leading-[1.18] tracking-[-0.015em] sm:text-[2.55rem] ${ink}`}
            >
              {t("auth.login.logInTo", { defaultValue: "Log in to JUNO RFP" })}
            </h1>
            <p className={`mt-3 max-w-[22rem] text-[15px] leading-relaxed ${muted}`}>
              {t("auth.login.tagline", {
                defaultValue: "Pick up where you left off — proposals, deadlines, and your team, waiting.",
              })}
            </p>

            <form onSubmit={handleLogin} className="mt-9 space-y-5">
              <div>
                <label className={labelClass}>
                  {t("auth.login.username")}{" "}
                  <span className={`${requiredMark} normal-case tracking-normal`} aria-hidden="true">
                    *
                  </span>
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
                  {t("auth.login.password")}{" "}
                  <span className={`${requiredMark} normal-case tracking-normal`} aria-hidden="true">
                    *
                  </span>
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
                className={`flex flex-wrap items-center justify-between gap-3 text-[13.5px] ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
                <label className={`flex cursor-pointer items-center gap-2.5 ${muted}`}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className={`h-4 w-4 rounded border ${
                      darkTheme
                        ? "border-white/25 bg-[#121A26] text-[#9DC4EE] focus:ring-[#8EC1EC]/40"
                        : "border-[#C5D0DC] bg-white text-[#243F5B] focus:ring-[#4F85B5]/30"
                    }`}
                  />
                  <span className="font-medium leading-snug">
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
                  className={`rounded-xl px-4 py-3 text-center text-[13.5px] font-medium leading-relaxed ${
                    error
                      ? darkTheme
                        ? "border border-red-400/20 bg-red-950/40 text-red-200"
                        : "border border-red-200/80 bg-red-50/90 text-red-700"
                      : darkTheme
                        ? "border border-emerald-400/20 bg-emerald-950/35 text-emerald-200"
                        : "border border-emerald-200/80 bg-emerald-50/90 text-emerald-800"
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
                  className={`rounded-xl px-4 py-3 text-center text-[13.5px] font-medium ${
                    darkTheme
                      ? "border border-emerald-400/20 bg-emerald-950/35 text-emerald-200"
                      : "border border-emerald-200/80 bg-emerald-50/90 text-emerald-800"
                  }`}
                >
                  Demo credentials reloaded. Try logging in again.
                </div>
              )}

              <button type="submit" disabled={isLoading || confirming} className={ctaClass}>
                {isLoading ? t("auth.login.loading") : t("auth.login.signInButton")}
              </button>
            </form>

            <p className={`mt-9 text-center text-[14px] ${muted}`}>
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
              className={`mx-auto mt-5 block text-[11px] font-medium tracking-[0.08em] uppercase opacity-70 transition hover:opacity-100 hover:underline ${muted}`}
            >
              Reload demo credentials
            </button>
          </>
        ) : (
          <>
            <p className={`text-[13px] font-medium tracking-[0.18em] uppercase ${accent}`}>
              {t("auth.signup.subtitle")}
            </p>
            <h1
              className={`mt-3 font-loginDisplay text-[2.15rem] font-semibold leading-[1.18] tracking-[-0.015em] sm:text-[2.55rem] ${ink}`}
            >
              {t("auth.signup.title")}
            </h1>
            <form onSubmit={handleSignup} className="mt-9 space-y-4">
              <div>
                <label className={labelClass}>
                  {t("auth.signup.name")}{" "}
                  <span className={`${requiredMark} normal-case tracking-normal`} aria-hidden="true">
                    *
                  </span>
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
                  {t("auth.signup.company")}{" "}
                  <span className={`${requiredMark} normal-case tracking-normal`} aria-hidden="true">
                    *
                  </span>
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
                  {t("auth.signup.email")}{" "}
                  <span className={`${requiredMark} normal-case tracking-normal`} aria-hidden="true">
                    *
                  </span>
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
                  {t("auth.signup.password")}{" "}
                  <span className={`${requiredMark} normal-case tracking-normal`} aria-hidden="true">
                    *
                  </span>
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
                  {t("auth.signup.confirmPassword")}{" "}
                  <span className={`${requiredMark} normal-case tracking-normal`} aria-hidden="true">
                    *
                  </span>
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
                  className={`rounded-xl px-4 py-3 text-center text-[13.5px] font-medium leading-relaxed ${
                    error
                      ? darkTheme
                        ? "border border-red-400/20 bg-red-950/40 text-red-200"
                        : "border border-red-200/80 bg-red-50/90 text-red-700"
                      : darkTheme
                        ? "border border-emerald-400/20 bg-emerald-950/35 text-emerald-200"
                        : "border border-emerald-200/80 bg-emerald-50/90 text-emerald-800"
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
            <p className={`mt-9 text-center text-[14px] ${muted}`}>
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
        </div>
      </main>
    </RTLWrapper>
  );
}

export default function LoginPage() {
  return <LoginPageContent />;
}
