import React, { useState } from 'react';
import {
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";

// Mock data for risk management
const risks = [
  {
    id: 'RISK001',
    title: 'Document Verification Delay',
    category: 'Operational',
    severity: 'Medium',
    status: 'Active',
    mitigation: 'Automated verification system',
    owner: 'Noura Al-Zahra',
    dueDate: '2026-08-15'
  },
  {
    id: 'RISK002',
    title: 'Policy Non-Compliance',
    category: 'Compliance',
    severity: 'Medium',
    status: 'Mitigated',
    mitigation: 'Updated policy and staff training completed',
    owner: 'Aisha Al-Hassan',
    dueDate: '2026-07-20'
  },
  {
    id: 'RISK003',
    title: 'Data Privacy Breach',
    category: 'Compliance',
    severity: 'High',
    status: 'Mitigated',
    mitigation: 'Enhanced security protocols',
    owner: 'Khalid Al-Sayed',
    dueDate: '2026-08-30'
  },
  {
    id: 'RISK004',
    title: 'Staff Training Gap',
    category: 'Operational',
    severity: 'Low',
    status: 'Mitigated',
    mitigation: 'Training sessions scheduled',
    owner: 'Omar Al-Mutairi',
    dueDate: '2026-07-10'
  }
];

const RiskManagement = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = risks.filter(r =>
    (statusFilter === 'All' || r.status === statusFilter) &&
    (r.title.toLowerCase().includes(search.toLowerCase()) || r.owner.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Risk Management</h2>
        <div className="flex gap-2">
          {['All', 'Active', 'Mitigated'].map(status => (
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
          placeholder="Search by risk or owner..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{risks.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Risks</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
          <XCircleIcon className="h-8 w-8 text-yellow-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{risks.filter(r => r.status === 'Active').length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
          <CheckCircleIcon className="h-8 w-8 text-green-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{risks.filter(r => r.status === 'Mitigated').length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Mitigated</div>
        </div>
      </div>
      {/* Risks Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Risk Management Status</h3>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Severity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mitigation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{r.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{r.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.severity === 'Critical'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : r.severity === 'High'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                          : r.severity === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {r.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.status === 'Active'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{r.mitigation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{r.owner}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{r.dueDate}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">No risks found.</td>
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

export default RiskManagement; 