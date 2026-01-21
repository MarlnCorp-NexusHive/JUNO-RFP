import React from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiUsers, FiClock, FiBarChart2 } from 'react-icons/fi';

// Demo data - Replace with actual API data
const sourceData = [
  {
    id: 1,
    name: 'Website',
    totalLeads: 245,
    conversionRate: '32%',
    avgResponseTime: '2.5h',
    costPerLead: '$45',
    trend: 'up',
    trendValue: '12%',
    quality: 'high',
    recentLeads: [
      { name: 'Abdullah Al-Rashid', program: 'MBA', status: 'Qualified', time: '2h ago' },
      { name: 'Layla Al-Mansour', program: 'MS CS', status: 'Contacted', time: '3h ago' },
      { name: 'Khalid Al-Sayed', program: 'PhD', status: 'New', time: '5h ago' }
    ]
  },
  {
    id: 2,
    name: 'Social Media',
    totalLeads: 180,
    conversionRate: '28%',
    avgResponseTime: '3.2h',
    costPerLead: '$35',
    trend: 'up',
    trendValue: '8%',
    quality: 'medium',
    recentLeads: [
      { name: 'Omar Al-Mutairi', program: 'MBA', status: 'Qualified', time: '1h ago' },
      { name: 'Aisha Al-Hassan', program: 'MS DS', status: 'Contacted', time: '4h ago' },
      { name: 'Fatima Al-Rashid', program: 'PhD', status: 'New', time: '6h ago' }
    ]
  },
  {
    id: 3,
    name: 'Referrals',
    totalLeads: 120,
    conversionRate: '45%',
    avgResponseTime: '1.8h',
    costPerLead: '$25',
    trend: 'up',
    trendValue: '15%',
    quality: 'high',
    recentLeads: [
      { name: 'Noura Al-Zahra', program: 'MBA', status: 'Qualified', time: '2h ago' },
      { name: 'Yousef Al-Harbi', program: 'MS CS', status: 'Contacted', time: '3h ago' },
      { name: 'Maha Al-Shehri', program: 'PhD', status: 'New', time: '4h ago' }
    ]
  },
  {
    id: 4,
    name: 'Events',
    totalLeads: 85,
    conversionRate: '38%',
    avgResponseTime: '2.8h',
    costPerLead: '$65',
    trend: 'down',
    trendValue: '5%',
    quality: 'medium',
    recentLeads: [
      { name: 'Sami Al-Shammari', program: 'MBA', status: 'Qualified', time: '1h ago' },
      { name: 'Dina Al-Rashid', program: 'MS DS', status: 'Contacted', time: '2h ago' },
      { name: 'Tariq Al-Mansour', program: 'PhD', status: 'New', time: '3h ago' }
    ]
  }
];

const SourceCard = ({ source }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
  >
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="font-medium text-gray-900 dark:text-white">{source.name}</h3>
        <div className="flex items-center mt-1">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            source.quality === 'high' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
            source.quality === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {source.quality.charAt(0).toUpperCase() + source.quality.slice(1)} Quality
          </span>
          <span className={`ml-2 inline-flex items-center text-sm ${
            source.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {source.trend === 'up' ? <FiTrendingUp className="w-4 h-4 mr-1" /> : <FiTrendingDown className="w-4 h-4 mr-1" />}
            {source.trendValue}
          </span>
        </div>
      </div>
      <button className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
        <FiBarChart2 className="w-5 h-5" />
      </button>
    </div>

    {/* Key Metrics */}
    <div className="grid grid-cols-4 gap-4 mb-4">
      <div className="text-center">
        <div className="text-2xl font-semibold text-gray-900 dark:text-white">{source.totalLeads}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Total Leads</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-semibold text-green-600 dark:text-green-400">{source.conversionRate}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Conversion</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{source.avgResponseTime}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Response Time</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-semibold text-purple-600 dark:text-purple-400">{source.costPerLead}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Cost/Lead</div>
      </div>
    </div>

    {/* Recent Leads */}
    <div>
      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Recent Leads</h4>
      <div className="space-y-2">
        {source.recentLeads.map((lead, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div>
              <div className="text-gray-900 dark:text-white">{lead.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{lead.program}</div>
            </div>
            <div className="flex items-center">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                lead.status === 'Qualified' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                lead.status === 'Contacted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}>
                {lead.status}
              </span>
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{lead.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

export default function SourcePerformance() {
  return (
    <div className="space-y-10 p-6 md:p-10 text-base">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Source Performance</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track and analyze lead source effectiveness</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <FiDollarSign className="mr-2" />
            ROI Report
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
            <FiUsers className="mr-2" />
            Lead Quality
          </button>
        </div>
      </div>

      {/* Source Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {sourceData.map(source => (
          <SourceCard key={source.id} source={source} />
        ))}
      </div>
    </div>
  );
} 