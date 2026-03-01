import React from "react";
import { useTranslation } from "react-i18next";

export default function AdminHeadDashboard() {
  const { t } = useTranslation('welcome');
  const user = (() => { try { return JSON.parse(localStorage.getItem('rbac_current_user')); } catch { return null; } })();
  const welcomeMessage = t(user?.username || 'admin_head');
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
      <h1 className="text-3xl font-bold mb-2">Welcome, {user?.displayName || 'Admin Head'}!</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-xl">{welcomeMessage}</p>
      <div className="bg-white rounded-2xl shadow p-8 flex flex-col items-center justify-center">
        <span className="text-5xl mb-4">🛠️</span>
        <h2 className="text-2xl font-semibold mb-2">Admin Head Demo Dashboard</h2>
        <p className="text-gray-600 mb-4">This is a placeholder for the Admin Head dashboard. You can add widgets, stats, and management tools here in the future.</p>
        <div className="text-sm text-gray-400">(Demo screen for future use)</div>
      </div>
    </div>
  );
} 