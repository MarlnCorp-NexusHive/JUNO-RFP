import React, { useMemo } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getHubById,
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

export default function ProposalManagerHubPage() {
  const { hubId } = useParams();
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const hub = getHubById(hubId);
  const features = useMemo(() => visibleFeatures(), []);
  const tools = useMemo(
    () => (hub ? featuresForHub(hub.id, features) : []),
    [hub, features],
  );

  if (!hub) {
    return <Navigate to="/app/home" replace />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <button
          type="button"
          onClick={() => navigate("/app/home")}
          className="text-sm font-medium text-[#3D4F66] hover:underline dark:text-[#8FA3B8]"
        >
          ← {t("proposalManagerNav.backToHome")}
        </button>
        <div className="mt-4 flex items-start gap-4">
          <HubIconBadge id={hub.id} size="lg" />
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
              {t(hub.titleKey)}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t(hub.longTitleKey)} — {t(hub.subtitleKey)}
            </p>
          </div>
        </div>
      </div>

      <ul className="divide-y divide-[#D8E0EA] overflow-hidden rounded-2xl border border-[#D8E0EA] bg-white dark:divide-[#2A3548] dark:border-[#2A3548] dark:bg-[#151D2A]">
        {tools.map((tool) => (
          <li key={tool.route}>
            <Link
              to={tool.route}
              className="flex items-start gap-4 px-5 py-4 transition hover:bg-[#F4F6F9] dark:hover:bg-[#0B1017]"
            >
              <span className="text-2xl" aria-hidden>
                {tool.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-slate-900 dark:text-white">
                  {t(tool.label, { defaultValue: tool.label })}
                </span>
                <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">
                  {tool.description}
                </span>
              </span>
              <span className="mt-1 text-slate-400" aria-hidden>
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
