import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiStar, FiMessageCircle, FiDollarSign, FiPackage } from "react-icons/fi";
import { isTrialUserSession } from "../../rfp-collaboration/useTrialCollabT.js";
import { isShortlisted, subscribeShortlist, toggleShortlist, hydrateShortlistFromServer } from "../services/shortlistStore.js";
import OpenGrantBriefButton from "./OpenGrantBriefButton.jsx";

/**
 * Shortlist toggle (demo + trial). Persists deadline for dashboard Alerts;
 * trial tenants also sync to company-wide storage + shared calendar.
 * When shortlisted, offers deep-links into Communication / Pricing / Bid Vault.
 * Always offers Open brief (shared Pursuit Brief cache).
 */
export default function OpportunityShortlistButton({
  id,
  source,
  title,
  number,
  agency,
  deadline,
  opportunity,
  className = "",
}) {
  const { t } = useTranslation();
  const trial = isTrialUserSession();
  const [on, setOn] = useState(() => isShortlisted(id));
  const [hint, setHint] = useState("");

  useEffect(() => {
    let cancelled = false;
    setOn(isShortlisted(id));
    if (trial) {
      hydrateShortlistFromServer()
        .then(() => {
          if (!cancelled) setOn(isShortlisted(id));
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [trial, id]);

  useEffect(() => {
    setOn(isShortlisted(id));
    return subscribeShortlist(() => setOn(isShortlisted(id)));
  }, [id]);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setHint("");
    const result = toggleShortlist({
      id,
      source,
      title,
      number,
      agency,
      deadline,
    });
    if (!result.ok && result.error === "missing_deadline") {
      setHint(t("proposalManagerGrants.shortlistNeedsDeadline"));
      return;
    }
    if (result.ok) setOn(!!result.shortlisted);
  };

  return (
    <div className={`inline-flex flex-col items-end gap-0.5 ${className}`}>
      <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
        <OpenGrantBriefButton
          id={id}
          source={source}
          title={title}
          number={number}
          agency={agency}
          deadline={deadline}
          opportunity={opportunity}
        />
        <button
          type="button"
          onClick={handleClick}
          aria-pressed={on}
          title={on ? t("proposalManagerGrants.shortlisted") : t("proposalManagerGrants.shortlist")}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
            on
              ? "border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-100"
              : "border-slate-300 bg-white text-slate-700 hover:border-amber-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          }`}
        >
          <FiStar className={`h-3.5 w-3.5 ${on ? "fill-current" : ""}`} aria-hidden />
          {on ? t("proposalManagerGrants.shortlisted") : t("proposalManagerGrants.shortlist")}
        </button>
        {on ? (
          <>
            <Link
              to={`/app/communication?shortlistId=${encodeURIComponent(id)}`}
              onClick={(e) => e.stopPropagation()}
              title={t("proposalManagerGrants.openKickoffTitle")}
              className="inline-flex items-center gap-1 rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-900 hover:border-blue-400 dark:border-blue-600 dark:bg-blue-950/40 dark:text-blue-100"
            >
              <FiMessageCircle className="h-3.5 w-3.5" aria-hidden />
              {t("proposalManagerGrants.openKickoff")}
            </Link>
            <Link
              to={`/app/pricing?shortlistId=${encodeURIComponent(id)}`}
              onClick={(e) => e.stopPropagation()}
              title={t("proposalManagerGrants.openPricingTitle")}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-900 hover:border-emerald-400 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-100"
            >
              <FiDollarSign className="h-3.5 w-3.5" aria-hidden />
              {t("proposalManagerGrants.openPricing")}
            </Link>
            <Link
              to={`/app/bid-vault?shortlistId=${encodeURIComponent(id)}`}
              onClick={(e) => e.stopPropagation()}
              title={t("proposalManagerGrants.openBidVaultTitle")}
              className="inline-flex items-center gap-1 rounded-lg border border-violet-300 bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-900 hover:border-violet-400 dark:border-violet-600 dark:bg-violet-950/40 dark:text-violet-100"
            >
              <FiPackage className="h-3.5 w-3.5" aria-hidden />
              {t("proposalManagerGrants.openBidVault")}
            </Link>
          </>
        ) : null}
      </div>
      {hint ? <span className="max-w-[12rem] text-[10px] font-medium text-rose-600 dark:text-rose-400">{hint}</span> : null}
    </div>
  );
}
