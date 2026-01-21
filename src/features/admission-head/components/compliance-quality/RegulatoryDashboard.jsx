import React, { useState } from 'react';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentCheckIcon,
  UserGroupIcon,
  GlobeAltIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";

// Mock data for compliance metrics
const complianceMetrics = {
  documentVerification: {
    total: 1500,
    verified: 1350,
    pending: 150,
    percentage: 90
  },
  complianceFlags: {
    total: 45,
    resolved: 30,
    pending: 15,
    critical: 5
  },
  policyViolations: {
    total: 12,
    resolved: 8,
    pending: 4,
    critical: 2
  },
  internationalCompliance: {
    total: 200,
    compliant: 180,
    pending: 20,
    percentage: 90
  }
};

// Mock data for regulatory bodies
const regulatoryBodies = [
  {
    name: 'NCAAA',
    status: 'Compliant',
    lastAudit: '2026-06-15',
    nextAudit: '2026-12-15',
    requirements: 25,
    met: 25
  },
  {
    name: 'NCAAA',
    status: 'Compliant',
    lastAudit: '2026-05-20',
    nextAudit: '2026-11-20',
    requirements: 30,
    met: 30
  },
  {
    name: 'MoE',
    status: 'In Progress',
    lastAudit: '2026-03-10',
    nextAudit: '2026-09-10',
    requirements: 40,
    met: 35
  },
  {
    name: 'State Govt',
    status: 'Compliant',
    lastAudit: '2026-04-05',
    nextAudit: '2026-10-05',
    requirements: 20,
    met: 20
  },
  {
    name: 'SEVIS',
    status: 'Compliant',
    lastAudit: '2026-06-01',
    nextAudit: '2026-12-01',
    requirements: 15,
    met: 15
  },
  {
    name: 'ETEC',
    status: 'Compliant',
    lastAudit: '2026-06-01',
    nextAudit: '2026-12-01',
    requirements: 15,
    met: 15
  }
];

// Mock data for pending verifications
const pendingVerifications = [
  {
    id: 'ADM3421',
    type: 'Income Certificate',
    status: 'Expired',
    daysLeft: -5,
    student: 'Abdullah Al-Rashid',
    department: 'Computer Science'
  },
  {
    id: 'ADM3422',
    type: 'Transfer Certificate',
    status: 'Missing',
    daysLeft: 0,
    student: 'Noura Al-Zahra',
    department: 'Business Administration'
  },
  {
    id: 'ADM3423',
    type: 'Caste Certificate',
    status: 'Pending',
    daysLeft: 2,
    student: 'Khalid Al-Sayed',
    department: 'Islamic Studies'
  }
];

const RegulatoryDashboard = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('current');

  return (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <div className="flex justify-end">
        <select
          value={selectedTimeframe}
          onChange={(e) => setSelectedTimeframe(e.target.value)}
          className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="current">Current Cycle</option>
          <option value="last">Last Cycle</option>
          <option value="yoy">Year over Year</option>
        </select>
      </div>

      {/* Compliance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Document Verification</h3>
            <DocumentCheckIcon className="h-6 w-6 text-blue-500" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {complianceMetrics.documentVerification.percentage}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {complianceMetrics.documentVerification.verified} of {complianceMetrics.documentVerification.total} verified
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-red-600 dark:text-red-400">
                {complianceMetrics.documentVerification.pending} pending
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Compliance Flags</h3>
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {complianceMetrics.complianceFlags.total}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {complianceMetrics.complianceFlags.resolved} resolved
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-red-600 dark:text-red-400">
                {complianceMetrics.complianceFlags.pending} pending
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Policy Violations</h3>
            <ShieldCheckIcon className="h-6 w-6 text-green-500" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {complianceMetrics.policyViolations.total}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {complianceMetrics.policyViolations.resolved} resolved
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-red-600 dark:text-red-400">
                {complianceMetrics.policyViolations.pending} pending
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">International Compliance</h3>
            <GlobeAltIcon className="h-6 w-6 text-purple-500" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {complianceMetrics.internationalCompliance.percentage}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {complianceMetrics.internationalCompliance.compliant} of {complianceMetrics.internationalCompliance.total} compliant
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-red-600 dark:text-red-400">
                {complianceMetrics.internationalCompliance.pending} pending
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Regulatory Bodies Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Regulatory Bodies Status</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Body</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Audit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Next Audit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Requirements</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {regulatoryBodies.map((body) => (
                  <tr key={body.name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{body.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        body.status === 'Compliant' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {body.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{body.lastAudit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{body.nextAudit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {body.met}/{body.requirements}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pending Verifications */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pending Verifications</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Days Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {pendingVerifications.map((verification) => (
                  <tr key={verification.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{verification.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{verification.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        verification.status === 'Expired'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : verification.status === 'Missing'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {verification.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{verification.student}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{verification.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`${
                        verification.daysLeft < 0
                          ? 'text-red-600 dark:text-red-400'
                          : verification.daysLeft === 0
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {verification.daysLeft < 0 ? `${Math.abs(verification.daysLeft)} days overdue` : `${verification.daysLeft} days left`}
                      </span>
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

export default RegulatoryDashboard; 