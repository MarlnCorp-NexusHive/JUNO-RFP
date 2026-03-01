import React from "react";
import Sidebar from "./Sidebar";
import { useTranslation } from "react-i18next";

const features = [
  { label: "Dashboard", icon: "🎓", route: "/rbac/student" },
  { label: "Courses", icon: "📖", route: "/rbac/student/courses" },
  { label: "Profile", icon: "👤", route: "/rbac/student/profile" },
  { label: "Settings", icon: "⚙️", route: "/rbac/student/settings" },
];

export default function StudentDashboard() {
  const { t } = useTranslation('welcome');
  const user = (() => { try { return JSON.parse(localStorage.getItem('rbac_current_user')); } catch { return null; } })();
  const welcomeMessage = t(user?.username || 'student');
  return (
    <div className="flex min-h-screen bg-[#F6F7FA]">
      <Sidebar features={features} userLabel={user?.displayName || user?.role || "Student"} />
      <main className="flex-1 p-10 flex flex-col gap-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Welcome, {user?.displayName || user?.role || "Student"}!</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{welcomeMessage}</p>
        <div className="bg-white rounded-2xl shadow p-8 flex flex-col items-center justify-center">
          <span className="text-5xl mb-4">🎓</span>
          <h2 className="text-2xl font-semibold mb-2">Student Demo Dashboard</h2>
          <p className="text-gray-600 mb-4">This is a placeholder for the Student dashboard. You can add widgets, stats, and management tools here in the future.</p>
          <div className="text-sm text-gray-400">(Demo screen for future use)</div>
        </div>
      </main>
    </div>
  );
} 