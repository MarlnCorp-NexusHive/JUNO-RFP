import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../../director/components/Sidebar";
import {
  HUB_HOME_FEATURE,
  hubForRoute,
  featuresForHub,
  proposalManagerFeatures,
} from "./proposalManagerFeatures";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { useLocalization } from "../../../hooks/useLocalization";
import TourOverlay from "../../../components/tours/TourOverlay";
import { TourProvider } from "../../../components/tours/TourContext";
import { ProposalIssuerProvider } from "./ProposalIssuerContext";
import { parseLocalStorageJson } from "../../../utils/safeStorage.js";
import { getTrialSession } from "../../../services/trialAuthSession.js";
import GlobalFloatingCalendar from "./GlobalFloatingCalendar.jsx";
import {
  getNavMode,
  proposalManagerLandingPath,
  subscribeNavMode,
} from "../services/navModeStore.js";

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

function allSidebarFeatures() {
  if (!isTrialUser()) return proposalManagerFeatures;
  return proposalManagerFeatures.filter((f) => {
    const route = String(f.route || "");
    return !route.includes("/topology") && !route.includes("/capture-strategy");
  });
}

function sidebarBrandLogo() {
  if (!isTrialUser()) return null;
  const session = getTrialSession();
  const user = parseLocalStorageJson("rbac_current_user");
  const brand = String(
    session?.brandLogo ||
      session?.tenant?.brandLogo ||
      user?.brandLogo ||
      "",
  )
    .trim()
    .toLowerCase();
  const tenantBlob = `${session?.tenantId || user?.tenantId || ""} ${session?.tenantName || user?.tenantName || ""}`.toLowerCase();
  const useWbec =
    brand === "wbec" ||
    brand === "wbec-pacific" ||
    /wbec|wbenc/.test(tenantBlob);

  // Default trial branding is MARLN; WBEC only for WBEC-flagged tenants.
  if (useWbec) {
    return { src: "/wbec-pacific-logo.png", alt: "WBEC Pacific" };
  }
  return null; // Sidebar falls back to /marlncorplogo.png
}

export default function ProposalManagerLayout() {
  const [expanded, setExpanded] = useState(false);
  const [navMode, setNavModeState] = useState(getNavMode);
  const { isRTLMode } = useLocalization();
  const location = useLocation();
  const userLabel = sidebarUserLabel();
  const brandLogo = sidebarBrandLogo();
  const baseFeatures = useMemo(() => allSidebarFeatures(), []);

  useEffect(() => subscribeNavMode(setNavModeState), []);

  const features = useMemo(() => {
    if (navMode !== "guided") return baseFeatures;
    const currentHub = hubForRoute(location.pathname, baseFeatures);
    const hubTools = currentHub
      ? featuresForHub(currentHub, baseFeatures)
      : [];
    return [HUB_HOME_FEATURE, ...hubTools];
  }, [navMode, baseFeatures, location.pathname]);

  // Trial: hide Topology + Capture Strategy — bounce direct URL hits back to landing
  const trialBlocked =
    isTrialUser() &&
    (String(location.pathname || "").includes("/topology") ||
      String(location.pathname || "").includes("/capture-strategy"));
  if (trialBlocked) {
    return <Navigate to={proposalManagerLandingPath()} replace />;
  }

  return (
    <TourProvider>
      <ProposalIssuerProvider>
      <div className="bg-[#F4F6F9] dark:bg-[#0B1017] min-h-screen" dir={isRTLMode ? 'rtl' : 'ltr'}>
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
            brandLogoSrc={brandLogo?.src}
            brandLogoAlt={brandLogo?.alt}
            showNavModeToggle
            navMode={navMode}
          />
        </div>
        {/* Main content with dynamic margin */}
        <main className={`flex-1 p-6 space-y-8 overflow-y-auto transition-all duration-300 ${
          expanded 
            ? (isRTLMode ? 'mr-56' : 'ml-56') 
            : (isRTLMode ? 'mr-12' : 'ml-12')
        }`}>
          <Outlet />
        </main>

        <GlobalFloatingCalendar />

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
