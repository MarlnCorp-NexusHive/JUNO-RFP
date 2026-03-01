import React from "react";
import Sidebar from "./Sidebar";
import { useTranslation } from "react-i18next";

const features = [
  { label: "Dashboard", icon: "📈", route: "/rbac/sales-enablement" },
  { label: "Content & Training", icon: "📚", route: "/rbac/sales-enablement/content" },
  { label: "Playbooks", icon: "📋", route: "/rbac/sales-enablement/playbooks" },
  { label: "Settings", icon: "⚙️", route: "/rbac/sales-enablement/settings" },
];

export default function SalesEnablementDashboard() {
  const { t } = useTranslation("welcome");
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("rbac_current_user"));
    } catch {
      return null;
    }
  })();
  const welcomeMessage = t(user?.username || "sales_enablement_manager");
  return (
    <div className="flex min-h-screen bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      <Sidebar features={features} userLabel={user?.displayName || "Sales Enablement Manager"} />
      <main className="flex-1 p-10 flex flex-col gap-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Welcome, {user?.displayName || "Sales Enablement Manager"}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{welcomeMessage}</p>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-8 flex flex-col items-center justify-center">
          <span className="text-5xl mb-4">📈</span>
          <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">
            Sales Enablement Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-center max-w-lg">
            Enable the sales team with content, training, and playbooks. Full sales enablement tools can be added here.
          </p>
          <div className="text-sm text-gray-400">(Demo dashboard for Sales Enablement Manager role)</div>
        </div>
      </main>
    </div>
  );
}
