import React, { useState } from "react";
import Sidebar from "../../director/components/Sidebar";
import { proposalManagerFeatures } from "./proposalManagerFeatures";
import { Outlet, useLocation } from "react-router-dom";
import { useLocalization } from "../../../hooks/useLocalization";
import TourOverlay from "../../../components/tours/TourOverlay";
import { TourProvider } from "../../../components/tours/TourContext";
import { useTour } from "../../../components/tours/TourContext";
import { ProposalIssuerProvider } from "./ProposalIssuerContext";
import { parseLocalStorageJson } from "../../../utils/safeStorage.js";
import { getTrialSession } from "../../../services/trialAuthSession.js";
import { useTranslation } from "react-i18next";

function TrialBanner() {
  const { t } = useTranslation("common");
  const session = getTrialSession();
  const user = parseLocalStorageJson("rbac_current_user");
  if (!session?.tenantId && !user?.isTrialUser) return null;

  const company = session?.tenantName || user?.tenantName || t("proposalManagerTrial.tenant");
  const ends = session?.trialEndsAt || user?.trialEndsAt;
  let daysLeft = null;
  if (ends) {
    const ms = Date.parse(ends) - Date.now();
    daysLeft = Number.isFinite(ms) ? Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000))) : null;
  }

  return (
    <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm text-indigo-950 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-100">
      <span className="font-semibold">{t("proposalManagerTrial.badge")}</span>
      {" · "}
      {company}
      {daysLeft != null && (
        <>
          {" · "}
          {t("proposalManagerTrial.daysLeft", { count: daysLeft })}
        </>
      )}
      <span className="opacity-70"> · {t("proposalManagerTrial.isolatedHint")}</span>
    </div>
  );
}

function AutoStartTour({ role }) {
  const location = useLocation();
  const { startTour, getTourStatus, isActive } = useTour();
  const user = parseLocalStorageJson("rbac_current_user");

  const getCurrentPage = (pathname) => {
    const segments = pathname.split('/');
    if (segments.includes('proposal-manager')) {
      if (segments.includes('source-docs')) return 'source-docs';
      if (segments.includes('company-intelligence')) return 'company-intelligence';
      if (segments.includes('competitive-intelligence')) return 'competitive-intelligence';
      if (segments.includes('team')) return 'team';
      if (segments.includes('bid-vault')) return 'bid-vault';
      if (segments.includes('scoring')) return 'scoring';
      if (segments.includes('win-slide')) return 'win-slide';
      if (segments.includes('capture-strategy')) return 'capture-strategy';
      if (segments.includes('content-hub')) return 'content-hub';
      if (segments.includes('pricing')) return 'pricing';
      if (segments.includes('communication')) return 'communication';
      if (segments.includes('compliance')) return 'compliance';
      if (segments.includes('meetings-calendar')) return 'meetings-calendar';
      if (segments.includes('user-management')) return 'user-management';
      if (segments.includes('rfp-collaboration')) return 'rfp-collaboration';
      if (segments.includes('technical-solutioning')) return 'technical-solutioning';
      if (segments.includes('topology')) return 'topology';
      if (segments.includes('workspace')) return 'workspace';
      if (segments.includes('help-support')) return 'help-support';
      if (segments.includes('settings')) return 'settings';
      return 'dashboard';
    }
    return 'dashboard';
  };

  React.useEffect(() => {
    const page = getCurrentPage(location.pathname);
    const userKey = (user?.id || user?.email || user?.username || user?.displayName || 'guest') + '';
    const seenKey = `tour_seen_${userKey}_${role}_${page}`;
    const status = getTourStatus(role, page);
    if (!isActive && status.available && !localStorage.getItem(seenKey)) {
      const timer = setTimeout(() => {
        const started = startTour(role, page);
        if (started) {
          try { localStorage.setItem(seenKey, 'true'); } catch {}
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, role, isActive]);

  return null;
}

export default function ProposalManagerLayout() {
  const [expanded, setExpanded] = useState(false);
  const { isRTLMode } = useLocalization();

  return (
    <TourProvider>
      <ProposalIssuerProvider>
      <div className="bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen" dir={isRTLMode ? 'rtl' : 'ltr'}>
        {/* Fixed Sidebar */}
        <div className={`${expanded ? "w-56" : "w-12"} flex-shrink-0 transition-all duration-300 fixed top-0 h-screen z-30 ${
          isRTLMode ? 'right-0' : 'left-0'
        }`}>
          <Sidebar
            features={proposalManagerFeatures}
            userLabel="Proposal Manager"
            expanded={expanded}
            setExpanded={setExpanded}
            role="proposal-manager"
          />
        </div>
        {/* Main content with dynamic margin */}
        <main className={`flex-1 p-6 space-y-8 overflow-y-auto transition-all duration-300 ${
          expanded 
            ? (isRTLMode ? 'mr-56' : 'ml-56') 
            : (isRTLMode ? 'mr-12' : 'ml-12')
        }`}>
          <AutoStartTour role="proposal-manager" />
          <TrialBanner />
          <Outlet />
        </main>

        {/* Tour Overlay */}
        <TourOverlay />

        {/* Tour-specific styles */}
        <style>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
          
          @keyframes tourPulse {
            0%, 100% {
              outline-color: #3b82f6;
              box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
            }
            50% {
              outline-color: #60a5fa;
              box-shadow: 0 0 30px rgba(59, 130, 246, 0.7);
            }
          }
        `}</style>
      </div>
      </ProposalIssuerProvider>
    </TourProvider>
  );
}
