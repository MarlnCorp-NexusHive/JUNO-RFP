import React from "react";
import { useTranslation } from "react-i18next";

export default function AdmissionSpocDashboard() {
  const { t } = useTranslation('welcome');
  const user = (() => { try { return JSON.parse(localStorage.getItem('rbac_current_user')); } catch { return null; } })();
  const welcomeMessage = t(user?.username || 'admission_spoc');
  return (
    <>
      <h1 className="text-3xl font-bold text-primary mb-2">Welcome, {user?.displayName || 'Admission SPOC'}!</h1>
      <p className="text-muted-foreground mb-4">{welcomeMessage}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-card rounded-2xl shadow p-6 flex flex-col items-start">
          <span className="text-2xl mb-2">📝</span>
          <div className="font-semibold text-lg mb-1 text-foreground">Applications</div>
          <div className="text-muted-foreground mb-4">View and manage student applications.</div>
          <button className="text-primary font-semibold hover:underline">Go to Applications</button>
        </div>
        <div className="bg-card rounded-2xl shadow p-6 flex flex-col items-start">
          <span className="text-2xl mb-2">🎤</span>
          <div className="font-semibold text-lg mb-1 text-foreground">Interviews</div>
          <div className="text-muted-foreground mb-4">Schedule and manage interviews.</div>
          <button className="text-primary font-semibold hover:underline">Go to Interviews</button>
        </div>
        <div className="bg-card rounded-2xl shadow p-6 flex flex-col items-start">
          <span className="text-2xl mb-2">📊</span>
          <div className="font-semibold text-lg mb-1 text-foreground">Reports</div>
          <div className="text-muted-foreground mb-4">Analyze admission statistics and results.</div>
          <button className="text-primary font-semibold hover:underline">Go to Reports</button>
        </div>
        <div className="bg-card rounded-2xl shadow p-6 flex flex-col items-start">
          <span className="text-2xl mb-2">⚙️</span>
          <div className="font-semibold text-lg mb-1 text-foreground">Settings</div>
          <div className="text-muted-foreground mb-4">Configure admission preferences.</div>
          <button className="text-primary font-semibold hover:underline">Settings</button>
        </div>
      </div>
    </>
  );
} 