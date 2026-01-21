import React, { useState } from 'react';
import {
  ChartBarIcon,
  ChartPieIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

const ReportsAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const analyticsStats = [
    {
      title: 'Employee Turnover',
      value: '12%',
      change: '-2.5%',
      trend: 'down',
      icon: ChartBarIcon,
    },
    {
      title: 'Average Tenure',
      value: '3.5 years',
      change: '+0.3',
      trend: 'up',
      icon: ChartPieIcon,
    },
    {
      title: 'Training Completion',
      value: '87%',
      change: '+5.2%',
      trend: 'up',
      icon: DocumentTextIcon,
    },
  ];

  const departmentMetrics = [
    {
      department: 'Engineering',
      headcount: 150,
      turnover: '8%',
      avgSalary: '$85,000',
      satisfaction: '4.2/5',
    },
    {
      department: 'Marketing',
      headcount: 75,
      turnover: '15%',
      avgSalary: '$72,000',
      satisfaction: '3.9/5',
    },
    {
      department: 'Sales',
      headcount: 120,
      turnover: '18%',
      avgSalary: '$78,000',
      satisfaction: '4.0/5',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
        <div className="flex space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Export Report
          </button>
        </div>
      </div>

      {/* Analytics Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {analyticsStats.map((stat) => (
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
              <span className="ml-2 text-sm text-gray-500">vs last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Department Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Department Metrics</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Headcount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Turnover
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Avg. Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Satisfaction
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {departmentMetrics.map((metric) => (
                <tr key={metric.department}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {metric.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {metric.headcount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {metric.turnover}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {metric.avgSalary}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${(parseFloat(metric.satisfaction) / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-500">{metric.satisfaction}</span>
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
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Generate Report</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Create custom reports</p>
        </button>
        <button className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Trend Analysis</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">View historical trends</p>
        </button>
        <button className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Predictive Analytics</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Forecast future metrics</p>
        </button>
        <button className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Export Data</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Download analytics data</p>
        </button>
      </div>
    </div>
  );
};

export default ReportsAnalytics; 