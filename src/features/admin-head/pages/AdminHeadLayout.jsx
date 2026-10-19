import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeadSidebar from '../components/AdminHeadSidebar';

export default function AdminHeadLayout() {
  return (
    <div className="flex h-screen bg-[#F8F9F8] dark:bg-[#0B1410]">
      <AdminHeadSidebar />
      <main className="flex-1 overflow-y-auto p-4">
        <Outlet />
      </main>
    </div>
  );
} 