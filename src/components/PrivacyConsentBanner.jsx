import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const CONSENT_STORAGE_KEY = "juno_privacy_banner_ack_v1";

export default function PrivacyConsentBanner() {
  const barRef = useRef(null);
  const [visible, setVisible] = useState(() => {
    try {
      return !window.localStorage.getItem(CONSENT_STORAGE_KEY);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!visible) return undefined;
    const previousPadding = document.body.style.paddingTop;
    const applyOffset = () => {
      const height = barRef.current?.offsetHeight || 0;
      document.body.style.paddingTop = height ? `${height}px` : previousPadding;
    };
    applyOffset();
    window.addEventListener("resize", applyOffset);
    return () => {
      window.removeEventListener("resize", applyOffset);
      document.body.style.paddingTop = previousPadding;
    };
  }, [visible]);

  if (!visible) return null;

  const handleAcknowledge = () => {
    try {
      window.localStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify({ acknowledgedAt: new Date().toISOString(), version: "2026-11" }),
      );
    } catch {
      /* ignore storage errors */
    }
    setVisible(false);
  };

  return (
    <div
      ref={barRef}
      role="region"
      aria-label="Privacy and cookie notice"
      className="fixed top-0 inset-x-0 z-[9990] border-b border-slate-200/90 bg-white/95 px-5 py-3 text-xs text-slate-700 shadow-md backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/95 dark:text-slate-200"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <p className="min-w-[240px] flex-1 leading-relaxed">
          JUNO RFP uses essential cookies and browser storage strictly for secure authentication,
          single-tab session protection, and workspace preferences. Read our{" "}
          <Link to="/privacy-policy" className="font-semibold text-[#2F6BA8] underline dark:text-sky-400">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link to="/cookie-policy" className="font-semibold text-[#2F6BA8] underline dark:text-sky-400">
            Cookie Policy
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={handleAcknowledge}
          className="shrink-0 rounded-lg bg-[#243F5B] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#2E4F70] dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
