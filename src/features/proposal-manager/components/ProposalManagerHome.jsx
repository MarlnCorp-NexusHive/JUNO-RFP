import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  PROPOSAL_MANAGER_HUBS,
  featuresForHub,
  proposalManagerFeatures,
} from "./proposalManagerFeatures.js";
import { HubIconBadge } from "./HubIcon.jsx";
import { parseLocalStorageJson } from "../../../utils/safeStorage.js";
import { getTrialSession } from "../../../services/trialAuthSession.js";

function visibleFeatures() {
  const session = getTrialSession();
  const user = parseLocalStorageJson("rbac_current_user");
  const trial = Boolean(session?.token || user?.isTrialUser);
  if (!trial) return proposalManagerFeatures;
  return proposalManagerFeatures.filter((f) => {
    const route = String(f.route || "");
    return !route.includes("/topology") && !route.includes("/capture-strategy");
  });
}

/** Corner rounding so the four cells read as one concave tray. */
const CELL_RADIUS = {
  find: "rounded-t-2xl sm:rounded-tr-none sm:rounded-tl-2xl",
  respond: "rounded-none sm:rounded-tr-2xl",
  manage: "rounded-none sm:rounded-bl-2xl",
  account: "rounded-b-2xl sm:rounded-bl-none sm:rounded-br-2xl",
};

export default function ProposalManagerHome() {
  const { t } = useTranslation("common");
  const features = useMemo(() => visibleFeatures(), []);

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl flex-col justify-center px-2 py-8 sm:px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute left-1/2 top-1/3 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#3D4F66]/[0.07] blur-3xl dark:bg-[#8FA3B8]/10" />
      </div>

      {/* Single recessed well — four cells meet at a cross */}
      <div
        className="relative overflow-hidden rounded-2xl border border-[#C5D0DE] bg-[#E4EAF1] p-[3px] dark:border-[#1A2332] dark:bg-[#0A0F16]"
        style={{
          boxShadow:
            "inset 0 2px 4px rgba(61,79,102,0.18), inset 0 8px 24px rgba(61,79,102,0.12), inset 0 -1px 0 rgba(255,255,255,0.45)",
        }}
      >
        <div
          className="grid grid-cols-1 overflow-hidden rounded-[13px] sm:grid-cols-2"
          style={{
            boxShadow: "inset 0 0 0 1px rgba(61,79,102,0.06)",
          }}
        >
          {PROPOSAL_MANAGER_HUBS.map((hub) => {
            const count = featuresForHub(hub.id, features).length;
            const isRight = hub.id === "respond" || hub.id === "account";
            const isBottom = hub.id === "manage" || hub.id === "account";
            return (
              <Link
                key={hub.id}
                to={`/app/home/${hub.id}`}
                className={`group relative flex min-h-[10.5rem] flex-col justify-between bg-[#F7F9FB] p-6 transition-[background,box-shadow] duration-300 hover:bg-[#EEF2F6] dark:bg-[#121A26] dark:hover:bg-[#0E1520] ${CELL_RADIUS[hub.id] || ""} ${
                  isRight ? "sm:border-l sm:border-[#C5D0DE]/80 dark:sm:border-[#2A3548]" : ""
                } ${
                  isBottom ? "border-t border-[#C5D0DE]/80 dark:border-[#2A3548]" : "border-t border-[#C5D0DE]/80 sm:border-t-0 dark:border-[#2A3548]"
                }`}
                style={{
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -10px 28px rgba(61,79,102,0.06)",
                }}
              >
                {/* Soft well deepen on hover */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    boxShadow:
                      "inset 0 0 0 1px rgba(61,79,102,0.12), inset 0 12px 32px rgba(61,79,102,0.1)",
                  }}
                />
                <div className="relative flex items-start justify-between gap-3">
                  <HubIconBadge id={hub.id} />
                  <span className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 shadow-[inset_0_1px_2px_rgba(61,79,102,0.12)] dark:bg-[#0B1017]/60 dark:text-slate-400">
                    {t("proposalManagerNav.toolCount", { count })}
                  </span>
                </div>
                <div className="relative">
                  <h2 className="text-2xl font-semibold text-[#2A384C] dark:text-white">
                    {t(hub.titleKey)}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {t(hub.subtitleKey)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Center cross accent — reads as the concave focal point */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D8E0EA] shadow-[inset_0_1px_3px_rgba(61,79,102,0.35)] sm:block dark:bg-[#2A3548]"
        />
      </div>
    </div>
  );
}
