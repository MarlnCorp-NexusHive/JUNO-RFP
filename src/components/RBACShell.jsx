import React from "react";
import { Button } from "./ui/button";

const sidebarItems = [
  { label: "Dashboard", icon: "dashboard" },
  { label: "Teams & Roles", icon: "users" },
  { label: "Role Templates", icon: "template" },
  { label: "Users", icon: "user" },
  { label: "Audit Log", icon: "history" },
];

export default function RBACShell({ children }) {
  return (
    <div className="flex h-screen bg-[#f8f9fb]">
      {/* Sidebar */}
      <aside className="w-20 bg-[#4f3cc9] flex flex-col items-center py-6 shadow-lg">
        <div className="mb-8">
          <span className="text-white text-3xl font-bold">U</span>
        </div>
        <nav className="flex flex-col gap-6 w-full items-center">
          {sidebarItems.map((item, idx) => (
            <button
              key={item.label}
              className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-[#6c5dd3] transition-colors text-white text-xl"
              title={item.label}
            >
              {/* Replace with icon component */}
              <span>{item.icon.slice(0, 2).toUpperCase()}</span>
            </button>
          ))}
        </nav>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 bg-white flex items-center justify-between px-8 shadow-sm">
          <div className="text-xl font-semibold text-[#4f3cc9] tracking-wide">University RBAC Demo</div>
          <div className="flex items-center gap-4">
            <Button variant="outline">Login</Button>
            <div className="w-10 h-10 rounded-full bg-[#e0e7ff] flex items-center justify-center text-[#4f3cc9] font-bold">A</div>
          </div>
        </header>
        {/* Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children || <div className="text-gray-400 text-center mt-32 text-2xl">Select a section to get started.</div>}
        </main>
      </div>
    </div>
  );
} 