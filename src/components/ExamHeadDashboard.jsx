import React from "react";
import Sidebar from "./Sidebar";

const features = [
  { label: "Dashboard", icon: "📝", route: "/rbac/exam-head" },
  { label: "Exams", icon: "📅", route: "/rbac/exam-head/exams" },
  { label: "Results", icon: "📊", route: "/rbac/exam-head/results" },
  { label: "Settings", icon: "⚙️", route: "/rbac/exam-head/settings" },
];

export default function ExamHeadDashboard() {
  const user = JSON.parse(localStorage.getItem('rbac_current_user'));
  return (
    <div className="flex min-h-screen bg-[#F6F7FA]">
      <Sidebar features={features} userLabel={user?.displayName || user?.role || "Exam Head"} />
      <main className="flex-1 p-10 flex flex-col gap-8">
        <h1 className="text-3xl font-bold text-primary mb-4">Welcome, {user?.displayName || user?.role || "Exam Head"}!</h1>
        <div className="bg-white rounded-2xl shadow p-8 flex flex-col items-center justify-center">
          <span className="text-5xl mb-4">📝</span>
          <h2 className="text-2xl font-semibold mb-2">Exam Head Demo Dashboard</h2>
          <p className="text-gray-600 mb-4">This is a placeholder for the Exam Head dashboard. You can add widgets, exam schedules, and management tools here in the future.</p>
          <div className="text-sm text-gray-400">(Demo screen for future use)</div>
        </div>
      </main>
    </div>
  );
} 