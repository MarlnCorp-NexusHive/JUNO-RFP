import React, { useState } from "react";
import Sidebar from "../../director/components/Sidebar";
import { proposalManagerFeatures } from "./proposalManagerFeatures";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { useLocalization } from "../../../hooks/useLocalization";
import TourOverlay from "../../../components/tours/TourOverlay";
import { TourProvider } from "../../../components/tours/TourContext";
import { useTour } from "../../../components/tours/TourContext";
import { ProposalIssuerProvider } from "./ProposalIssuerContext";
import { parseLocalStorageJson } from "../../../utils/safeStorage.js";
import { getTrialSession } from "../../../services/trialAuthSession.js";
import { getProposalManagerTourPage } from "../../../components/tours/data/proposalManagerTourPages.js";

function AutoStartTour({ role }) {
  const location = useLocation();
  const { startTour, getTourStatus, isActive } = useTour();
  const user = parseLocalStorageJson("rbac_current_user");

  const getCurrentPage = (pathname) => getProposalManagerTourPage(pathname) || "dashboard";

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

function isTrialUser() {
  const session = getTrialSession();
  const user = parseLocalStorageJson("rbac_current_user");
  return Boolean(session?.token || user?.isTrialUser);
}

function sidebarUserLabel() {
  const session = getTrialSession();
  const user = parseLocalStorageJson("rbac_current_user");
  if (isTrialUser()) {
    const name = String(
      session?.user?.name || user?.name || user?.displayName || "",
    ).trim();
    if (name) return name;
  }
  return "Proposal Manager";
}

function sidebarFeatures() {
  if (!isTrialUser()) return proposalManagerFeatures;
  return proposalManagerFeatures.filter(
    (f) => !String(f.route || "").includes("/topology"),
  );
}

export default function ProposalManagerLayout() {
  const [expanded, setExpanded] = useState(false);
  const { isRTLMode } = useLocalization();
  const location = useLocation();
  const userLabel = sidebarUserLabel();
  const features = sidebarFeatures();

  // Trial: Topology tab is hidden — bounce direct URL hits back to dashboard
  if (isTrialUser() && String(location.pathname || "").includes("/topology")) {
    return <Navigate to="/rbac/proposal-manager" replace />;
  }

  return (
    <TourProvider>
      <ProposalIssuerProvider>
      <div className="bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen" dir={isRTLMode ? 'rtl' : 'ltr'}>
        {/* Fixed Sidebar */}
        <div className={`${expanded ? "w-56" : "w-12"} flex-shrink-0 transition-all duration-300 fixed top-0 h-screen z-30 ${
          isRTLMode ? 'right-0' : 'left-0'
        }`}>
          <Sidebar
            features={features}
            userLabel={userLabel}
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
