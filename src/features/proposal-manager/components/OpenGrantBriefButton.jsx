import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiFileText } from "react-icons/fi";
import GrantPursuitBriefModal from "./GrantPursuitBriefModal.jsx";

function resolveOpportunityId(id, source) {
  const raw = String(id || "").trim();
  if (!raw) return "";
  const prefix = `${String(source || "").trim()}:`;
  if (prefix.length > 1 && raw.toLowerCase().startsWith(prefix.toLowerCase())) {
    return raw.slice(prefix.length);
  }
  return raw;
}

/**
 * Opens the shared Grant Pursuit Brief for any opportunity (all Grants sources).
 */
export default function OpenGrantBriefButton({
  id,
  source,
  title,
  number,
  agency,
  deadline,
  opportunity,
  className = "",
  compact = false,
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const opportunityId = resolveOpportunityId(id, source);

  if (!opportunityId || !source) return null;

  const snapshot = {
    title: title || opportunity?.title,
    number: number || opportunity?.number,
    agency: agency || opportunity?.agency,
    deadline: deadline || opportunity?.deadline,
    status: opportunity?.status,
    amount: opportunity?.amount,
    amountLabel: opportunity?.amountLabel,
    summary: opportunity?.summary || opportunity?.description,
    description: opportunity?.description,
    eligibility: opportunity?.eligibility,
    applicantTypes: opportunity?.applicantTypes,
    url: opportunity?.url,
    pi: opportunity?.pi,
    organization: opportunity?.organization,
    company: opportunity?.company,
    source: opportunity?.source,
    ...opportunity,
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        title={t("proposalManagerGrants.openBriefTitle")}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-900 transition hover:border-indigo-400 dark:border-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-100 ${className}`}
      >
        <FiFileText className="h-3.5 w-3.5" aria-hidden />
        {compact ? t("proposalManagerGrants.openBriefShort") : t("proposalManagerGrants.openBrief")}
      </button>
      {open ? (
        <GrantPursuitBriefModal
          open={open}
          onClose={() => setOpen(false)}
          source={source}
          opportunityId={opportunityId}
          opportunity={snapshot}
        />
      ) : null}
    </>
  );
}
