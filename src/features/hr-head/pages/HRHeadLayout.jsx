import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';

const HRHeadLayout = () => {
  const features = [
    { label: 'Dashboard', icon: '📊', route: '/rbac/hr-head' },
    { label: 'Payroll Overview', icon: '💰', route: '/rbac/hr-head/payroll' },
    { label: 'Budget Management', icon: '📈', route: '/rbac/hr-head/budget' },
    { label: 'Reports & Analytics', icon: '📊', route: '/rbac/hr-head/reports' },
    { label: 'Approval Center', icon: '✅', route: '/rbac/hr-head/approvals' },
    { label: 'Audit Logs', icon: '📝', route: '/rbac/hr-head/audit' },
    { label: 'Settings', icon: '⚙️', route: '/rbac/hr-head/settings' },
    { label: 'Communication Hub', icon: '💬', route: '/rbac/hr-head/communication' },
    { label: 'Training & Development', icon: '🎓', route: '/rbac/hr-head/training' },
    { label: 'Compliance & Quality', icon: '🛡️', route: '/rbac/hr-head/compliance' },
    { label: 'Workspace', icon: '💼', route: '/rbac/hr-head/workspace' },
    { label: 'Support Tickets', icon: '🎫', route: '/rbac/hr-head/support' },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar features={features} userLabel="HR Head" />
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default HRHeadLayout; 