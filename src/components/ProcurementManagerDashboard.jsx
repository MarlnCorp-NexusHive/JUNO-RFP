import React from "react";
import Sidebar from "./Sidebar";
import { useTranslation } from "react-i18next";

const features = [
  { label: "Dashboard", icon: "📦", route: "/rbac/procurement-manager" },
  { label: "Purchase Requests", icon: "📋", route: "/rbac/procurement-manager/requests" },
  { label: "Vendors", icon: "🏢", route: "/rbac/procurement-manager/vendors" },
  { label: "Settings", icon: "⚙️", route: "/rbac/procurement-manager/settings" },
];

export default function ProcurementManagerDashboard() {
  const { t } = useTranslation("welcome");
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("rbac_current_user"));
    } catch {
      return null;
    }
  })();
  const welcomeMessage = t(user?.username || "procurement_manager");
  return (
    <div className="flex min-h-screen bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      <Sidebar features={features} userLabel={user?.displayName || "Procurement Manager"} />
      <main className="flex-1 p-10 flex flex-col gap-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Welcome, {user?.displayName || "Procurement Manager"}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{welcomeMessage}</p>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-8 flex flex-col items-center justify-center">
          <span className="text-5xl mb-4">📦</span>
          <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">
            Procurement Manager Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-center max-w-lg">
            Manage purchase requests, vendors, and procurement operations. Full procurement tools can be added here.
          </p>
          <div className="text-sm text-gray-400">(Demo dashboard for Procurement Manager role)</div>
        </div>
      </main>
    </div>
  );
}
