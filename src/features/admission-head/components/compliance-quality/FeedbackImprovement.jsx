import React, { useState } from 'react';
import {
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from "@heroicons/react/24/outline";

// Mock data for feedback and improvement actions
const feedbacks = [
  {
    id: 'FB001',
    source: 'Candidate',
    date: '2026-07-10',
    feedback: 'The document upload process was confusing.',
    status: 'Addressed',
    action: 'Updated help text on upload page',
    owner: 'Noura Al-Zahra',
    improvementDate: '2026-07-12'
  },
  {
    id: 'FB002',
    source: 'Recruiter',
    date: '2026-07-08',
    feedback: 'Need more training on new policy changes.',
    status: 'In Progress',
    action: 'Scheduled policy training session',
    owner: 'Khalid Al-Sayed',
    improvementDate: null
  },
  {
    id: 'FB003',
    source: 'Client',
    date: '2026-07-05',
    feedback: 'Application status updates are not timely.',
    status: 'Pending',
    action: '',
    owner: '',
    improvementDate: null
  },
  {
    id: 'FB004',
    source: 'Auditor',
    date: '2026-06-30',
    feedback: 'Policy document not updated on website.',
    status: 'Addressed',
    action: 'Uploaded latest policy document',
    owner: 'Aisha Al-Hassan',
    improvementDate: '2026-07-02'
  }
];

const FeedbackImprovement = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = feedbacks.filter(f =>
    (statusFilter === 'All' || f.status === statusFilter) &&
    (f.feedback.toLowerCase().includes(search.toLowerCase()) || f.owner.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Feedback & Continuous Improvement</h2>
        <div className="flex gap-2">
          {['All', 'Addressed', 'In Progress', 'Pending'].map(status => (
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
          placeholder="Search by feedback or owner..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
          <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{feedbacks.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Feedback</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
          <CheckCircleIcon className="h-8 w-8 text-green-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{feedbacks.filter(f => f.status === 'Addressed').length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Addressed</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
          <ExclamationCircleIcon className="h-8 w-8 text-yellow-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{feedbacks.filter(f => f.status === 'Pending').length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
        </div>
      </div>
      {/* Feedback Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Feedback & Actions</h3>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Feedback</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Improvement Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Improvement Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map(f => (
                  <tr key={f.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{f.source}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{f.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{f.feedback}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        f.status === 'Addressed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : f.status === 'In Progress'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{f.action || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{f.owner || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{f.improvementDate || '-'}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">No feedback found.</td>
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

export default FeedbackImprovement; 