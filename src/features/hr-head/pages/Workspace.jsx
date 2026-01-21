import React from 'react';
import { AcademicCapIcon, ShieldCheckIcon, UserCircleIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const Workspace = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workspace</h1>
        <p className="text-gray-500 dark:text-gray-400">Unified dashboard for HR staff to manage training, compliance, and daily HR operations.</p>
      </div>
      {/* Training & Development */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-4">
        <h2 className="font-semibold text-lg mb-2 flex items-center gap-2"><AcademicCapIcon className="h-5 w-5" /> Training & Development</h2>
        <ul className="list-disc ml-6 text-gray-700 dark:text-gray-200">
          <li>Leadership Development Series <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs">In Progress</span></li>
          <li>Onboarding Training <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs">Completed</span></li>
          <li>Digital HR Tools <span className="ml-2 px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-xs">Pending</span></li>
        </ul>
      </div>
      {/* Compliance & Quality */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-4">
        <h2 className="font-semibold text-lg mb-2 flex items-center gap-2"><ShieldCheckIcon className="h-5 w-5" /> Compliance & Quality</h2>
        <ul className="list-disc ml-6 text-gray-700 dark:text-gray-200">
          <li>Quality Self-Assessment <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs">Start</span></li>
          <li>Policy Compliance Uploads <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs">Upload</span></li>
        </ul>
      </div>
      {/* Account Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-4">
        <h2 className="font-semibold text-lg mb-2 flex items-center gap-2"><UserCircleIcon className="h-5 w-5" /> Account Management</h2>
        <ul className="list-disc ml-6 text-gray-700 dark:text-gray-200">
          <li>My Profile</li>
          <li>HR Board</li>
          <li>My Reports</li>
        </ul>
      </div>
      {/* Document Center */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-4">
        <h2 className="font-semibold text-lg mb-2 flex items-center gap-2"><ClipboardDocumentListIcon className="h-5 w-5" /> Document Center</h2>
        <ul className="list-disc ml-6 text-gray-700 dark:text-gray-200">
          <li>HR Policies</li>
          <li>Employee Handbook</li>
          <li>Compliance Documents</li>
        </ul>
      </div>
    </div>
  );
};

export default Workspace; 