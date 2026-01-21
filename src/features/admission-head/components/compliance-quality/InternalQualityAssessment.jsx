import React, { useState } from 'react';
import {
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";

// Mock data for quality assessments
const assessments = [
  {
    id: 'QA001',
    title: 'Quarterly Admission Process Audit',
    type: 'Process',
    date: '2026-06-15',
    status: 'Completed',
    score: 92,
    findings: 2,
    recommendations: 1,
    lead: 'Noura Al-Zahra',
    report: 'QA001_Report.pdf'
  },
  {
    id: 'QA002',
    title: 'Document Verification Self-Assessment',
    type: 'Document',
    date: '2026-07-01',
    status: 'In Progress',
    score: 78,
    findings: 4,
    recommendations: 3,
    lead: 'Khalid Al-Sayed',
    report: null
  },
  {
    id: 'QA003',
    title: 'Policy Compliance Check',
    type: 'Policy',
    date: '2026-07-10',
    status: 'Scheduled',
    score: null,
    findings: null,
    recommendations: null,
    lead: 'Aisha Al-Hassan',
    report: null
  },
  {
    id: 'QA004',
    title: 'Random Application Quality Review',
    type: 'Application',
    date: '2026-07-18',
    status: 'Completed',
    score: 88,
    findings: 1,
    recommendations: 0,
    lead: 'Omar Al-Mutairi',
    report: 'QA004_Report.pdf'
  }
];

const assessmentTypes = [
  { name: 'All', icon: ClipboardDocumentCheckIcon },
  { name: 'Process', icon: CalendarDaysIcon },
  { name: 'Document', icon: DocumentTextIcon },
  { name: 'Policy', icon: CheckCircleIcon },
  { name: 'Application', icon: ExclamationTriangleIcon }
];

const InternalQualityAssessment = () => {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');

  // Filtered assessments
  const filtered = assessments.filter(a =>
    (type === 'All' || a.type === type) &&
    (a.title.toLowerCase().includes(search.toLowerCase()) || a.lead.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Internal Quality Assessment</h2>
        <div className="flex gap-2">
          {assessmentTypes.map(({ name, icon: Icon }) => (
            <button
              key={name}
              onClick={() => setType(name)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border ${type === name ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}
            >
              <Icon className="h-5 w-5" /> {name}
            </button>
          ))}
        </div>
      </div>
      {/* Search */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Search by title or lead..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
          <ClipboardDocumentCheckIcon className="h-8 w-8 text-blue-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{assessments.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Assessments</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
          <CheckCircleIcon className="h-8 w-8 text-green-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{assessments.filter(a => a.status === 'Completed').length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
          <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{assessments.filter(a => a.status === 'In Progress').length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
          <CalendarDaysIcon className="h-8 w-8 text-purple-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{assessments.filter(a => a.status === 'Scheduled').length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Scheduled</div>
        </div>
      </div>
      {/* Assessments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Assessments</h3>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Findings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recommendations</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lead</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{a.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{a.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{a.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        a.status === 'Completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : a.status === 'In Progress'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{a.score !== null ? a.score + '%' : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{a.findings !== null ? a.findings : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{a.recommendations !== null ? a.recommendations : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{a.lead}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {a.report ? (
                        <a href={`#`} className="text-blue-600 hover:underline flex items-center gap-1">
                          <ArrowDownTrayIcon className="h-4 w-4 inline" /> Download
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">No assessments found.</td>
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

export default InternalQualityAssessment; 