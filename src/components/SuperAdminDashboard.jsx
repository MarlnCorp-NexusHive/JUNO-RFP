import React from "react";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";

const features = [
  { label: "Dashboard", icon: "🏠", route: "/rbac" },
  { label: "Users", icon: "👤", route: "/rbac/users" },
  { label: "Teams & Roles", icon: "👥", route: "/rbac/teams" },
  { label: "Role Templates", icon: "📄", route: "/rbac/templates" },
  { label: "Audit Logs", icon: "📝", route: "/rbac/logs" },
  { label: "System Settings", icon: "⚙️", route: "/rbac/settings" },
];

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen bg-[#F6F7FA]">
      <Sidebar features={features} />
      {/* Main Content */}
      <main className="flex-1 p-10 flex flex-col gap-8">
        <h1 className="text-3xl font-bold text-primary mb-4">Welcome, Super Admin!</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-card rounded-2xl shadow p-6 flex flex-col items-start">
            <span className="text-2xl mb-2">👤</span>
            <div className="font-semibold text-lg mb-1 text-foreground">User Management</div>
            <div className="text-muted-foreground mb-4">Add, edit, or remove users and assign roles.</div>
            <button className="text-primary font-semibold hover:underline" onClick={() => navigate('/rbac/users')}>Go to Users</button>
          </div>
          <div className="bg-card rounded-2xl shadow p-6 flex flex-col items-start">
            <span className="text-2xl mb-2">👥</span>
            <div className="font-semibold text-lg mb-1 text-foreground">Team & Role Management</div>
            <div className="text-muted-foreground mb-4">Manage teams, roles, and hierarchies.</div>
            <button className="text-primary font-semibold hover:underline" onClick={() => navigate('/rbac/teams')}>Go to Teams</button>
          </div>
          <div className="bg-card rounded-2xl shadow p-6 flex flex-col items-start">
            <span className="text-2xl mb-2">📄</span>
            <div className="font-semibold text-lg mb-1 text-foreground">Role Template Management</div>
            <div className="text-muted-foreground mb-4">Create, clone, and version role templates.</div>
            <button className="text-primary font-semibold hover:underline" onClick={() => navigate('/rbac/templates')}>Go to Templates</button>
          </div>
          <div className="bg-card rounded-2xl shadow p-6 flex flex-col items-start">
            <span className="text-2xl mb-2">📝</span>
            <div className="font-semibold text-lg mb-1 text-foreground">Audit Logs</div>
            <div className="text-muted-foreground mb-4">View system activity and changes.</div>
            <button className="text-primary font-semibold hover:underline" onClick={() => navigate('/rbac/logs')}>View Logs</button>
          </div>
          <div className="bg-card rounded-2xl shadow p-6 flex flex-col items-start">
            <span className="text-2xl mb-2">⚙️</span>
            <div className="font-semibold text-lg mb-1 text-foreground">System Settings</div>
            <div className="text-muted-foreground mb-4">Configure system-wide settings.</div>
            <button className="text-primary font-semibold hover:underline" onClick={() => navigate('/rbac/settings')}>Settings</button>
          </div>
        </div>
      </main>
    </div>
  );
} 