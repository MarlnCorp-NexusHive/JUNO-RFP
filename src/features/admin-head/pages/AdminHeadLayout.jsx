import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeadSidebar from '../components/AdminHeadSidebar';

export default function AdminHeadLayout() {
  return (
    <div className="flex h-screen bg-[#F4F6F9] dark:bg-[#0B1017]">
      <AdminHeadSidebar />
      <main className="flex-1 overflow-y-auto p-4">
        <Outlet />
      </main>
    </div>
  );
} 