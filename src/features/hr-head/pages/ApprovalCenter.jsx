import React, { useState } from 'react';
import {
  UserPlusIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

const approvalRequests = [
  {
    id: 'HR-001',
    type: 'Leave Request',
    employee: 'Alice Johnson',
    department: 'HR',
    date: '2026-03-15',
    status: 'Pending',
    details: 'Annual leave for 5 days (2026-03-20 to 2026-03-24)',
    priority: 'Medium',
    icon: <UserPlusIcon className="h-6 w-6 text-blue-500" />,
  },
  {
    id: 'HR-002',
    type: 'Payroll Adjustment',
    employee: 'Bob Smith',
    department: 'Finance',
    date: '2026-03-14',
    status: 'Pending',
    details: 'Salary correction for March payroll',
    priority: 'High',
    icon: <CurrencyDollarIcon className="h-6 w-6 text-green-500" />,
  },
  {
    id: 'HR-003',
    type: 'Hiring Approval',
    employee: 'N/A',
    department: 'IT',
    date: '2026-03-13',
    status: 'Approved',
    details: 'Approval for new Software Engineer position',
    priority: 'High',
    icon: <UserPlusIcon className="h-6 w-6 text-purple-500" />,
  },
  {
    id: 'HR-004',
    type: 'Policy Update',
    employee: 'N/A',
    department: 'HR',
    date: '2026-03-12',
    status: 'Rejected',
    details: 'Update to remote work policy',
    priority: 'Low',
    icon: <DocumentTextIcon className="h-6 w-6 text-yellow-500" />,
  },
];

const statusOptions = ['All Status', 'Pending', 'Approved', 'Rejected'];
const typeOptions = ['All Types', 'Leave Request', 'Payroll Adjustment', 'Hiring Approval', 'Policy Update'];
const priorityOptions = ['All Priorities', 'High', 'Medium', 'Low'];

const ApprovalCenter = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All Status');
  const [type, setType] = useState('All Types');
  const [priority, setPriority] = useState('All Priorities');

  const filteredRequests = approvalRequests.filter((req) => {
    const matchesSearch =
      req.employee.toLowerCase().includes(search.toLowerCase()) ||
      req.type.toLowerCase().includes(search.toLowerCase()) ||
      req.details.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === 'All Status' || req.status === status;
    const matchesType = type === 'All Types' || req.type === type;
    const matchesPriority = priority === 'All Priorities' || req.priority === priority;
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Approval Center</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage and process HR approval requests</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search approvals..."
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
          >
            {typeOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
          >
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
          >
            {priorityOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-10">No approval requests found.</div>
        ) : (
          filteredRequests.map((req) => (
            <div key={req.id} className="flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-gray-800 rounded-xl shadow p-6 gap-4">
              <div className="flex items-center gap-4">
                {req.icon}
                <div>
                  <div className="flex gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      req.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      req.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>{req.status}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      req.priority === 'High' ? 'bg-red-100 text-red-800' :
                      req.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>{req.priority}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{req.type}</span>
                  </div>
                  <div className="font-bold text-lg text-gray-900 dark:text-white">{req.type} {req.employee !== 'N/A' && `- ${req.employee}`}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{req.details}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 min-w-[120px]">
                <div className="text-right text-gray-400 text-sm">{req.date}</div>
                {req.status === 'Pending' && (
                  <div className="flex gap-2">
                    <button className="px-4 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1 text-sm">
                      <CheckCircleIcon className="h-4 w-4" /> Approve
                    </button>
                    <button className="px-4 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1 text-sm">
                      <XCircleIcon className="h-4 w-4" /> Reject
                    </button>
                  </div>
                )}
                {req.status === 'Approved' && (
                  <span className="text-green-600 font-semibold">Approved</span>
                )}
                {req.status === 'Rejected' && (
                  <span className="text-red-600 font-semibold">Rejected</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ApprovalCenter; 