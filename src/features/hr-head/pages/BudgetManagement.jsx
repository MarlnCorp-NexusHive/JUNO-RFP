import React, { useState } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

const BudgetManagement = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const budgetStats = [
    {
      title: 'Total Budget',
      value: '$5,000,000',
      change: '+3.2%',
      trend: 'up',
      icon: CurrencyDollarIcon,
    },
    {
      title: 'Utilized Budget',
      value: '$3,200,000',
      change: '+1.5%',
      trend: 'up',
      icon: ChartBarIcon,
    },
    {
      title: 'Remaining Budget',
      value: '$1,800,000',
      change: '-2.1%',
      trend: 'down',
      icon: DocumentTextIcon,
    },
  ];

  const departmentBudgets = [
    {
      department: 'Engineering',
      allocated: '$1,200,000',
      spent: '$950,000',
      remaining: '$250,000',
      utilization: '79%',
    },
    {
      department: 'Marketing',
      allocated: '$800,000',
      spent: '$650,000',
      remaining: '$150,000',
      utilization: '81%',
    },
    {
      department: 'Sales',
      allocated: '$1,000,000',
      spent: '$750,000',
      remaining: '$250,000',
      utilization: '75%',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budget Management</h1>
        <div className="flex space-x-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="2026">2026</option>
            <option value="2026">2026</option>
            <option value="2026">2026</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Generate Report
          </button>
        </div>
      </div>

      {/* Budget Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {budgetStats.map((stat) => (
          <div key={stat.title} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${
                stat.trend === 'up' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <stat.icon className={`h-6 w-6 ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {stat.trend === 'up' ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
              )}
              <span className={`ml-2 text-sm font-medium ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
              <span className="ml-2 text-sm text-gray-500">vs last year</span>
            </div>
          </div>
        ))}
      </div>

      {/* Department Budgets */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Department Budgets</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Allocated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Remaining
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Utilization
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {departmentBudgets.map((budget) => (
                <tr key={budget.department}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {budget.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {budget.allocated}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {budget.spent}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {budget.remaining}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: budget.utilization }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-500">{budget.utilization}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Allocate Budget</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Distribute budget to departments</p>
        </button>
        <button className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Budget Requests</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Review department requests</p>
        </button>
        <button className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Forecast</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">View budget projections</p>
        </button>
        <button className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Export Data</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Download budget reports</p>
        </button>
      </div>
    </div>
  );
};

export default BudgetManagement; 