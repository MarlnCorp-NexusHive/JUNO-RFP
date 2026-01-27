import React, { useState } from 'react';
import {
  DocumentTextIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  DocumentArrowUpIcon
} from "@heroicons/react/24/outline";

// Mock data for document types
const documentTypes = [
  {
    id: 1,
    name: 'Nationality Proof',
    total: 150,
    verified: 120,
    pending: 30,
    expired: 5,
    missing: 10
  },
  {
    id: 2,
    name: 'Caste Certificates',
    total: 100,
    verified: 85,
    pending: 15,
    expired: 3,
    missing: 7
  },
  {
    id: 3,
    name: 'Professional Documents',
    total: 200,
    verified: 180,
    pending: 20,
    expired: 0,
    missing: 15
  },
  {
    id: 4,
    name: 'Transfer Certificates',
    total: 80,
    verified: 65,
    pending: 15,
    expired: 2,
    missing: 8
  }
];

// Mock data for pending documents
const pendingDocuments = [
  {
    id: 'DOC001',
    candidate: 'John Doe',
    documentType: 'Nationality Proof',
    status: 'Pending',
    uploadedDate: '2026-07-15',
    expiryDate: '2026-12-31',
    department: 'Engineering Team',
    priority: 'High'
  },
  {
    id: 'DOC002',
    candidate: 'Jane Smith',
    documentType: 'Caste Certificate',
    status: 'Expired',
    uploadedDate: '2026-06-20',
    expiryDate: '2026-07-01',
    department: 'Sales Team',
    priority: 'Critical'
  },
  {
    id: 'DOC003',
    candidate: 'Mike Johnson',
    documentType: 'Transfer Certificate',
    status: 'Missing',
    uploadedDate: null,
    expiryDate: null,
    department: 'Operations Team',
    priority: 'Medium'
  }
];

const DocumentCompliance = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by candidate name or document ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div className="flex gap-4">
          <select
            value={selectedDocumentType}
            onChange={(e) => setSelectedDocumentType(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Document Types</option>
            {documentTypes.map(type => (
              <option key={type.id} value={type.name}>{type.name}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
            <option value="missing">Missing</option>
          </select>
        </div>
      </div>

      {/* Document Type Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {documentTypes.map((type) => (
          <div key={type.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{type.name}</h3>
              <DocumentTextIcon className="h-6 w-6 text-blue-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{type.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Verified</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">{type.verified}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
                <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">{type.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Expired</span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">{type.expired}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Missing</span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">{type.missing}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Documents Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Documents</h3>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              <BellIcon className="h-5 w-5" />
              Send Reminders
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Document ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Candidate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Document Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Uploaded Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expiry Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {pendingDocuments.map((doc) => (
                  <tr key={doc.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{doc.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{doc.candidate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{doc.documentType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        doc.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : doc.status === 'Expired'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {doc.uploadedDate || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {doc.expiryDate || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{doc.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        doc.priority === 'Critical'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : doc.priority === 'High'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {doc.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                          <DocumentArrowUpIcon className="h-5 w-5" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300">
                          <ArrowPathIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentCompliance; 