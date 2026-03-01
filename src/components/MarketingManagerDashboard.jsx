import React from "react";
import Sidebar from "./Sidebar";
import { useTranslation } from "react-i18next";

const features = [
  { label: "Dashboard", icon: "🏠", route: "/rbac/marketing-manager" },
  { label: "Leads", icon: "📋", route: "/rbac/marketing-manager/leads" },
  { label: "Campaigns", icon: "📢", route: "/rbac/marketing-manager/campaigns" },
  { label: "Reports", icon: "📊", route: "/rbac/marketing-manager/reports" },
  { label: "Settings", icon: "⚙️", route: "/rbac/marketing-manager/settings" },
];

export default function MarketingManagerDashboard() {
  const { t } = useTranslation('welcome');
  const user = (() => { try { return JSON.parse(localStorage.getItem('rbac_current_user')); } catch { return null; } })();
  const welcomeMessage = t(user?.username || 'marketing_manager');
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#ede7f6] to-[#e3f0ff]">
      <Sidebar features={features} />
      <main className="flex-1 p-10 flex flex-col gap-8">
        <h1 className="text-3xl font-bold text-[#4f3cc9] mb-2">Welcome, {user?.displayName || 'Marketing Manager'}!</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{welcomeMessage}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-start">
            <span className="text-2xl mb-2">📋</span>
            <div className="font-semibold text-lg mb-1">Leads</div>
            <div className="text-gray-500 mb-4">View and manage assigned leads.</div>
            <button className="text-[#4f3cc9] font-semibold hover:underline">Go to Leads</button>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-start">
            <span className="text-2xl mb-2">📢</span>
            <div className="font-semibold text-lg mb-1">Campaigns</div>
            <div className="text-gray-500 mb-4">Manage campaigns and activities.</div>
            <button className="text-[#4f3cc9] font-semibold hover:underline">Go to Campaigns</button>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-start">
            <span className="text-2xl mb-2">📊</span>
            <div className="font-semibold text-lg mb-1">Reports</div>
            <div className="text-gray-500 mb-4">Analyze performance and results.</div>
            <button className="text-[#4f3cc9] font-semibold hover:underline">Go to Reports</button>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-start">
            <span className="text-2xl mb-2">⚙️</span>
            <div className="font-semibold text-lg mb-1">Settings</div>
            <div className="text-gray-500 mb-4">Configure your preferences.</div>
            <button className="text-[#4f3cc9] font-semibold hover:underline">Settings</button>
          </div>
        </div>
      </main>
    </div>
  );
} 