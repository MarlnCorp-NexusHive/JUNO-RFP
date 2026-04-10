import React from "react";
import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function RfpAuditorShell() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <Link to="/collaboration" className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("rfpCollaboration.auditorPortalTitle")}
        </Link>
        <p className="text-xs text-gray-500 dark:text-gray-400">{t("rfpCollaboration.auditorPortalSubtitle")}</p>
      </header>
      <main className="max-w-5xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
