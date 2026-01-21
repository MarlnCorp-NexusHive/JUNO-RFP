import React from 'react';
import { Link } from 'react-router-dom';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentCheckIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div className="flex items-center">
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  </div>
);

const QuickAccessCard = ({ title, description, icon: Icon, path, color }) => (
  <Link to={path} className="block">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </div>
  </Link>
);

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HR Head Dashboard</h1>
        <div className="flex space-x-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Generate Report
          </button>
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            Export Data
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value="1,234"
          icon={UserGroupIcon}
          color="bg-blue-500"
        />
        <StatCard
          title="Monthly Payroll"
          value="$2.5M"
          icon={CurrencyDollarIcon}
          color="bg-green-500"
        />
        <StatCard
          title="Pending Approvals"
          value="23"
          icon={DocumentCheckIcon}
          color="bg-yellow-500"
        />
        <StatCard
          title="Training Hours"
          value="1,567"
          icon={AcademicCapIcon}
          color="bg-purple-500"
        />
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuickAccessCard
          title="Payroll Overview"
          description="View and manage employee compensation"
          icon={CurrencyDollarIcon}
          path="/rbac/hr-head/payroll"
          color="bg-green-500"
        />
        <QuickAccessCard
          title="Budget Management"
          description="Track and manage department budgets"
          icon={ChartBarIcon}
          path="/rbac/hr-head/budget"
          color="bg-blue-500"
        />
        <QuickAccessCard
          title="Reports & Analytics"
          description="Access detailed HR metrics and reports"
          icon={ChartBarIcon}
          path="/rbac/hr-head/reports"
          color="bg-purple-500"
        />
        <QuickAccessCard
          title="Approval Center"
          description="Review and approve pending requests"
          icon={DocumentCheckIcon}
          path="/rbac/hr-head/approvals"
          color="bg-yellow-500"
        />
        <QuickAccessCard
          title="Training & Development"
          description="Manage employee training programs"
          icon={AcademicCapIcon}
          path="/rbac/hr-head/training"
          color="bg-indigo-500"
        />
        <QuickAccessCard
          title="Compliance & Quality"
          description="Monitor HR compliance and quality metrics"
          icon={DocumentCheckIcon}
          path="/rbac/hr-head/compliance"
          color="bg-red-500"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <ClockIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  New employee onboarding completed
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  2 hours ago
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 