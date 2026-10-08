import React from "react";
import { useTranslation } from "react-i18next";

/** Maps Grants desk source ids → proposalManagerGrants label keys */
export const SOURCE_LABEL_KEYS = {
  grants: "modeGrants",
  private: "modePrivate",
  local: "modeLocal",
  contracts: "modeContracts",
  sam: "modeContracts",
  ca: "modeCa",
  sbir: "modeSbir",
  usaspending: "modeUsaSpending",
  assistance: "modeAssistance",
  nih: "modeNih",
  nsf: "modeNsf",
  fac: "modeFac",
  alt: "modePrivate",
};

export function resolveSourceLabelKey(sourceId) {
  return SOURCE_LABEL_KEYS[sourceId] || null;
}

/**
 * Compact badge showing which funding source a listing came from.
 */
export default function GrantSourceBadge({ sourceId, label, className = "" }) {
  const { t } = useTranslation("common");
  const key = resolveSourceLabelKey(sourceId);
  const text =
    label ||
    (key ? t(`proposalManagerGrants.${key}`) : null) ||
    String(sourceId || "").trim();
  if (!text) return null;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-800 ring-1 ring-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-200 dark:ring-indigo-800 ${className}`}
    >
      {text}
    </span>
  );
}
