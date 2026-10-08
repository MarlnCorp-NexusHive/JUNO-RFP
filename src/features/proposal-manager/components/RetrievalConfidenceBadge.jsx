import React from "react";
import { useTranslation } from "react-i18next";
import { assessListingConfidence } from "../services/listingConfidence.js";

function tone(level) {
  if (level === "high") {
    return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800";
  }
  if (level === "low") {
    return "bg-amber-50 text-amber-950 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-800";
  }
  return "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600";
}

/**
 * Label for how complete / trustworthy the retrieved listing payload is.
 */
export default function RetrievalConfidenceBadge({ listing, confidence, className = "" }) {
  const { t } = useTranslation("common");
  const assessed = confidence || listing?._retrievalConfidence || assessListingConfidence(listing);
  const level = assessed?.level || "medium";
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone(level)} ${className}`}
      title={t("proposalManagerGrants.retrievalConfidenceHint")}
    >
      {t(`proposalManagerGrants.retrievalConfidence.${level}`)}
    </span>
  );
}
