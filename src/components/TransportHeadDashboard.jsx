import React from "react";
import Sidebar from "./Sidebar";

const features = [
  { label: "Dashboard", icon: "🚌", route: "/rbac/transport-head" },
  { label: "Vehicles", icon: "🚐", route: "/rbac/transport-head/vehicles" },
  { label: "Drivers", icon: "🧑‍✈️", route: "/rbac/transport-head/drivers" },
  { label: "Settings", icon: "⚙️", route: "/rbac/transport-head/settings" },
];

export default function TransportHeadDashboard() {
  const user = JSON.parse(localStorage.getItem('rbac_current_user'));
  return (
    <div className="flex min-h-screen bg-[#F6F7FA]">
      <Sidebar features={features} userLabel={user?.displayName || user?.role || "Transport Head"} />
      <main className="flex-1 p-10 flex flex-col gap-8">
        <h1 className="text-3xl font-bold text-primary mb-4">Welcome, {user?.displayName || user?.role || "Transport Head"}!</h1>
        <div className="bg-white rounded-2xl shadow p-8 flex flex-col items-center justify-center">
          <span className="text-5xl mb-4">🚌</span>
          <h2 className="text-2xl font-semibold mb-2">Transport Head Demo Dashboard</h2>
          <p className="text-gray-600 mb-4">This is a placeholder for the Transport Head dashboard. You can add widgets, vehicle management, and tools here in the future.</p>
          <div className="text-sm text-gray-400">(Demo screen for future use)</div>
        </div>
      </main>
    </div>
  );
} 