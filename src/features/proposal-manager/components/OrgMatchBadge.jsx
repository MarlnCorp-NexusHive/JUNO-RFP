import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { assessOrgMatch } from "../services/grantMatch.js";
import {
  getOrgMatchProfile,
  isOrgMatchProfileReady,
  subscribeOrgMatchProfile,
} from "../services/orgMatchProfileStore.js";

function tone(level) {
  if (level === "strong") {
    return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800";
  }
  if (level === "possible") {
    return "bg-sky-50 text-sky-900 ring-1 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-100 dark:ring-sky-800";
  }
  if (level === "unlikely") {
    return "bg-rose-50 text-rose-900 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-100 dark:ring-rose-800";
  }
  return "bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600";
}

/**
 * Applicant Profile badge driven by Company Intelligence → Applicant Profile.
 */
export default function OrgMatchBadge({ listing, match, className = "" }) {
  const { t } = useTranslation("common");
  const [profile, setProfile] = useState(getOrgMatchProfile);

  useEffect(() => subscribeOrgMatchProfile(setProfile), []);

  const assessed = match || listing?._orgMatch || assessOrgMatch(listing, profile);
  const ready = isOrgMatchProfileReady(profile) || assessed?.profileReady;
  const level = ready ? assessed?.level || "unknown" : "unknown";

  const title = ready
    ? t("proposalManagerGrants.orgMatch.hint")
    : t("proposalManagerGrants.orgMatch.setProfileHint");

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone(level)} ${className}`}
      title={title}
    >
      {t(`proposalManagerGrants.orgMatch.levels.${level}`)}
    </span>
  );
}
