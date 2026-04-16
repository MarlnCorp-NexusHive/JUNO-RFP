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

function AutoStartTour({ role }) {
  const location = useLocation();
  const { startTour, getTourStatus, isActive } = useTour();
  const user = parseLocalStorageJson("rbac_current_user");

  const getCurrentPage = (pathname) => {
    const segments = pathname.split('/');
    if (segments.includes('proposal-manager')) {
      if (segments.includes('source-docs')) return 'source-docs';
      if (segments.includes('company-intelligence')) return 'company-intelligence';
      if (segments.includes('team')) return 'team';
      if (segments.includes('bid-vault')) return 'bid-vault';
      if (segments.includes('capture-strategy')) return 'capture-strategy';
      if (segments.includes('content-hub')) return 'content-hub';
      if (segments.includes('pricing')) return 'pricing';
      if (segments.includes('communication')) return 'communication';
      if (segments.includes('compliance')) return 'compliance';
      if (segments.includes('meetings-calendar')) return 'meetings-calendar';
      if (segments.includes('user-management')) return 'user-management';
      if (segments.includes('rfp-collaboration')) return 'rfp-collaboration';
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
            userLabel="Proposal manger"
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
