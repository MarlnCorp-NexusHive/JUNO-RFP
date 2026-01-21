import React from "react";
import Sidebar from "./Sidebar";

const features = [
  { label: "Dashboard", icon: "📚", route: "/rbac/library-head" },
  { label: "Books", icon: "📖", route: "/rbac/library-head/books" },
  { label: "Members", icon: "👥", route: "/rbac/library-head/members" },
  { label: "Settings", icon: "⚙️", route: "/rbac/library-head/settings" },
];

export default function LibraryHeadDashboard() {
  const user = JSON.parse(localStorage.getItem('rbac_current_user'));
  return (
    <div className="flex min-h-screen bg-[#F6F7FA]">
      <Sidebar features={features} userLabel={user?.displayName || user?.role || "Library Head"} />
      <main className="flex-1 p-10 flex flex-col gap-8">
        <h1 className="text-3xl font-bold text-primary mb-4">Welcome, {user?.displayName || user?.role || "Library Head"}!</h1>
        <div className="bg-white rounded-2xl shadow p-8 flex flex-col items-center justify-center">
          <span className="text-5xl mb-4">📚</span>
          <h2 className="text-2xl font-semibold mb-2">Library Head Demo Dashboard</h2>
          <p className="text-gray-600 mb-4">This is a placeholder for the Library Head dashboard. You can add widgets, book management, and tools here in the future.</p>
          <div className="text-sm text-gray-400">(Demo screen for future use)</div>
        </div>
      </main>
    </div>
  );
} 