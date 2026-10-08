import React, { useState, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { marketingHeadFeatures } from '../../../components/marketingHeadFeatures';
import { TourProvider, TourOverlay } from '../../../components/tours';

const RFP_SIDEBAR_ENTRY = { label: 'marketingHead.rfp', icon: '📄', route: '/rbac/marketing-head/rfp', description: 'Request for Proposal – questionnaire and document generation' };

function getSidebarFeatures(username) {
  const isRfpRole = username === 'procurement_manager' || username === 'sales_enablement_manager';
  if (!isRfpRole) return marketingHeadFeatures;
  const insertIndex = marketingHeadFeatures.findIndex((f) => f.route === '/rbac/marketing-head/workspace');
  const idx = insertIndex >= 0 ? insertIndex + 1 : marketingHeadFeatures.length;
  return [...marketingHeadFeatures.slice(0, idx), RFP_SIDEBAR_ENTRY, ...marketingHeadFeatures.slice(idx)];
}

const getDefaultUserLabel = (user) => {
    if (!user?.username) return user?.role || 'Marketing Head';
    if (user.username === 'procurement_manager') return 'Procurement Manager';
    if (user.username === 'sales_enablement_manager') return 'Sales Enablement Manager';
    return 'Marketing Head';
  };

export default function MarketingHeadLayout() {
  const [expanded, setExpanded] = useState(false);
  const user = (() => { try { return JSON.parse(localStorage.getItem('rbac_current_user')); } catch { return null; } })();
  const userLabel = user?.displayName || getDefaultUserLabel(user);
  
  return (
    <TourProvider>
      <div className="flex h-screen bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
        <Sidebar 
          features={useMemo(() => getSidebarFeatures(user?.username), [user?.username])} 
          userLabel={userLabel} 
          expanded={expanded}
          setExpanded={setExpanded}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 lg:p-10 flex flex-col gap-6">
            <Outlet />
          </div>
        </main>
        <TourOverlay />
      </div>
    </TourProvider>
  );
}
