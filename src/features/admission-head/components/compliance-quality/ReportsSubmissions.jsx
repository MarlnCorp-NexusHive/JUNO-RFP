import React, { useState } from 'react';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";

// Mock data for reports and submissions
const reports = [
  {
    id: 'REP001',
    title: 'Monthly Recruitment Report',
    type: 'Monthly',
    status: 'Submitted',
    dueDate: '2026-06-30',
    submittedDate: '2026-06-28',
    owner: 'Noura Al-Zahra',
    approvedBy: 'Dr. Abdullah Al-Rashid'
  },
  {
    id: 'REP002',
    title: 'Quarterly Compliance Report',
    type: 'Quarterly',
    status: 'Pending',
    dueDate: '2026-07-15',
    submittedDate: null,
    owner: 'Khalid Al-Sayed',
    approvedBy: null
  },
  {
    id: 'REP003',
    title: 'Policy Compliance Check',
    type: 'Policy',
    status: 'Submitted',
    dueDate: '2026-07-10',
    submittedDate: '2026-07-05',
    owner: 'Aisha Al-Hassan',
    doc: 'Policy_Compliance_Check.pdf'
  },
  {
    id: 'REP004',
    title: 'Risk Assessment Report',
    type: 'Risk',
    status: 'Pending',
    dueDate: '2026-07-20',
    submittedDate: null,
    owner: 'Omar Al-Mutairi',
    doc: null
  }
];

const ReportsSubmissions = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = reports.filter(r =>
    (statusFilter === 'All' || r.status === statusFilter) &&
    (r.title.toLowerCase().includes(search.toLowerCase()) || r.owner.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Submissions</h2>
        <div className="flex gap-2">
          {['All', 'Submitted', 'Pending'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${statusFilter === status ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>
      {/* Search */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Search by report or owner..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
          <DocumentTextIcon className="h-8 w-8 text-blue-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{reports.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Reports</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
          <CheckCircleIcon className="h-8 w-8 text-green-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{reports.filter(r => r.status === 'Submitted').length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Submitted</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
          <XCircleIcon className="h-8 w-8 text-yellow-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{reports.filter(r => r.status === 'Pending').length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
        </div>
      </div>
      {/* Reports Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reports & Submissions</h3>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Report</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Submitted Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{r.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{r.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.status === 'Submitted'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{r.dueDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{r.submittedDate || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{r.owner}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {r.doc ? (
                        <a href="#" className="text-blue-600 hover:underline flex items-center gap-1">
                          <DocumentTextIcon className="h-4 w-4 inline" /> View
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">No reports found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsSubmissions; 