import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../director/components/Sidebar";
import { useLocalization } from "../../hooks/useLocalization";
import { rfpAuditorFeatures } from "./rfpAuditorFeatures.js";
import { ensureRbacAuditorCollabSession } from "./rfpCollabSession.js";
import { FiRefreshCw } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { TourProvider } from "../../components/tours/TourContext";
import TourOverlay from "../../components/tours/TourOverlay";

function readRbacUser() {
  try {
    return JSON.parse(localStorage.getItem("rbac_current_user") || "null");
  } catch {
    return null;
  }
}

export default function RfpAuditorRbacLayout() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isRTLMode } = useLocalization();
  const [expanded, setExpanded] = useState(false);
  const [collabReady, setCollabReady] = useState(false);
  const [collabError, setCollabError] = useState("");

  const user = readRbacUser();
  const allowed = user?.team === "RFP Collaboration" && user?.role === "RFP Auditor";

  useEffect(() => {
    if (!allowed) {
      navigate("/login", { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await ensureRbacAuditorCollabSession();
        if (!cancelled) setCollabReady(true);
      } catch (e) {
        if (!cancelled) {
          setCollabError(e?.response?.data?.error || e.message);
          setCollabReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [allowed, navigate]);

  if (!allowed) {
    return null;
  }

  if (!collabReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#F6F7FA] dark:bg-gray-900 text-gray-600 dark:text-gray-300">
        <FiRefreshCw className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-sm">{t("rfpCollaboration.connectingTeamCollab")}</p>
      </div>
    );
  }

  if (collabError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F6F7FA] dark:bg-gray-900">
        <div className="max-w-md rounded-xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-gray-800 p-6 text-sm text-red-800 dark:text-red-200">
          {collabError}
        </div>
      </div>
    );
  }

  return (
    <TourProvider>
      <div
        className="bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 min-h-screen"
        dir={isRTLMode ? "rtl" : "ltr"}
      >
        <div
          className={`${expanded ? "w-56" : "w-12"} flex-shrink-0 transition-all duration-300 fixed top-0 h-screen z-30 ${
            isRTLMode ? "right-0" : "left-0"
          }`}
        >
          <Sidebar
            features={rfpAuditorFeatures}
            userLabel={user?.displayName || t("rfpCollaboration.rfpAuditorNavTitle")}
            expanded={expanded}
            setExpanded={setExpanded}
            role="rfp-auditor"
          />
        </div>
        <main
          className={`flex-1 p-6 space-y-8 overflow-y-auto transition-all duration-300 ${
            expanded ? (isRTLMode ? "mr-56" : "ml-56") : isRTLMode ? "mr-12" : "ml-12"
          }`}
        >
          <Outlet />
        </main>
        <TourOverlay />
      </div>
    </TourProvider>
  );
}
