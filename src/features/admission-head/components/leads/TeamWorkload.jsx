import React from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiClock, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';

// Demo data - Replace with actual API data
const teamMembers = [
  {
    id: 1,
    name: 'Noura Al-Zahra',
    role: 'Senior Counselor',
    avatar: 'NA',
    email: 'noura.zahra@example.com',
    phone: '+966 50 123 4567',
    workload: {
      total: 45,
      active: 32,
      pending: 8,
      completed: 5
    },
    performance: {
      conversionRate: '68%',
      responseTime: '2.5h',
      satisfaction: '4.8/5'
    },
    recentActivity: [
      { type: 'call', lead: 'Abdullah Al-Rashid', time: '2h ago' },
      { type: 'email', lead: 'Layla Al-Mansour', time: '3h ago' },
      { type: 'meeting', lead: 'Khalid Al-Sayed', time: '5h ago' }
    ]
  },
  {
    id: 2,
    name: 'Khalid Al-Sayed',
    role: 'Admission Officer',
    avatar: 'KA',
    email: 'khalid.sayed@example.com',
    phone: '+966 50 234 5678',
    workload: {
      total: 38,
      active: 25,
      pending: 10,
      completed: 3
    },
    performance: {
      conversionRate: '62%',
      responseTime: '3.2h',
      satisfaction: '4.6/5'
    },
    recentActivity: [
      { type: 'email', lead: 'Omar Al-Mutairi', time: '1h ago' },
      { type: 'call', lead: 'Aisha Al-Hassan', time: '4h ago' },
      { type: 'meeting', lead: 'Fatima Al-Rashid', time: '6h ago' }
    ]
  },
  // Add more team members as needed
];

const WorkloadCard = ({ member }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
  >
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-lg font-medium">
          {member.avatar}
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">{member.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{member.role}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
          <FiMail className="w-5 h-5" />
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
          <FiPhone className="w-5 h-5" />
        </button>
      </div>
    </div>

    {/* Workload Stats */}
    <div className="grid grid-cols-4 gap-4 mb-4">
      <div className="text-center">
        <div className="text-2xl font-semibold text-gray-900 dark:text-white">{member.workload.total}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-semibold text-green-600 dark:text-green-400">{member.workload.active}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Active</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">{member.workload.pending}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Pending</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{member.workload.completed}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
      </div>
    </div>

    {/* Performance Metrics */}
    <div className="grid grid-cols-3 gap-4 mb-4">
      <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="text-sm font-medium text-gray-900 dark:text-white">{member.performance.conversionRate}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Conversion</div>
      </div>
      <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="text-sm font-medium text-gray-900 dark:text-white">{member.performance.responseTime}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Response</div>
      </div>
      <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="text-sm font-medium text-gray-900 dark:text-white">{member.performance.satisfaction}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Satisfaction</div>
      </div>
    </div>

    {/* Recent Activity */}
    <div>
      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Recent Activity</h4>
      <div className="space-y-2">
        {member.recentActivity.map((activity, index) => (
          <div key={index} className="flex items-center text-sm">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
              activity.type === 'call' ? 'bg-blue-100 text-blue-600' :
              activity.type === 'email' ? 'bg-green-100 text-green-600' :
              'bg-purple-100 text-purple-600'
            }`}>
              {activity.type === 'call' ? <FiPhone className="w-4 h-4" /> :
               activity.type === 'email' ? <FiMail className="w-4 h-4" /> :
               <FiClock className="w-4 h-4" />}
            </div>
            <div className="flex-1">
              <div className="text-gray-900 dark:text-white">{activity.lead}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

export default function TeamWorkload() {
  return (
    <div className="space-y-10 p-6 md:p-10 text-base">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Team Workload</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Monitor team performance and workload distribution</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <FiTrendingUp className="mr-2" />
            Performance Report
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
            <FiAlertCircle className="mr-2" />
            Alerts
          </button>
        </div>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {teamMembers.map(member => (
          <WorkloadCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
} 