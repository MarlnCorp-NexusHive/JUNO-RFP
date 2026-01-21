import React from "react";
import Sidebar from "./Sidebar";

const features = [
  { label: "Dashboard", icon: "🏠", route: "/rbac/hr-manager" },
  { label: "Employees", icon: "👥", route: "/rbac/hr-manager/employees" },
  { label: "Payroll", icon: "💸", route: "/rbac/hr-manager/payroll" },
  { label: "Settings", icon: "⚙️", route: "/rbac/hr-manager/settings" },
];

export default function HRManagerDashboard() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar features={features} />
      <main className="flex-1 p-10 flex flex-col gap-8">
        <h1 className="text-3xl font-bold text-primary mb-4">Welcome, HR Manager!</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-card rounded-2xl shadow p-6 flex flex-col items-start">
            <span className="text-2xl mb-2">👥</span>
            <div className="font-semibold text-lg mb-1 text-foreground">Employees</div>
            <div className="text-muted-foreground mb-4">View and manage assigned employees.</div>
            <button className="text-primary font-semibold hover:underline">Go to Employees</button>
          </div>
          <div className="bg-card rounded-2xl shadow p-6 flex flex-col items-start">
            <span className="text-2xl mb-2">💸</span>
            <div className="font-semibold text-lg mb-1 text-foreground">Payroll</div>
            <div className="text-muted-foreground mb-4">Manage payroll and compensation.</div>
            <button className="text-primary font-semibold hover:underline">Go to Payroll</button>
          </div>
          <div className="bg-card rounded-2xl shadow p-6 flex flex-col items-start">
            <span className="text-2xl mb-2">⚙️</span>
            <div className="font-semibold text-lg mb-1 text-foreground">Settings</div>
            <div className="text-muted-foreground mb-4">Configure your preferences.</div>
            <button className="text-primary font-semibold hover:underline">Settings</button>
          </div>
        </div>
      </main>
    </div>
  );
} 