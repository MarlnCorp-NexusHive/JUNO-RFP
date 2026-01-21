import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiMail, FiPhone, FiUser, FiCalendar, FiTag, FiFile, FiMessageSquare, FiClock, FiTrendingUp, FiEdit2, FiTrash2, FiShare2 } from 'react-icons/fi';

const TimelineItem = ({ icon: Icon, title, description, time, status }) => (
  <div className="relative pl-8 pb-6 last:pb-0">
    <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
      <Icon className="w-4 h-4" />
    </div>
    <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 last:hidden" />
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          status === 'success' ? 'bg-green-100 text-green-800' :
          status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {time}
        </span>
      </div>
    </div>
  </div>
);

export default function LeadProfile({ lead, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showActions, setShowActions] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'documents', label: 'Documents' },
    { id: 'notes', label: 'Notes' },
  ];

  // Demo timeline data
  const timelineData = [
    {
      icon: FiMail,
      title: 'Initial Inquiry',
      description: 'Submitted inquiry form for Computer Science program',
      time: '2 days ago',
      status: 'success'
    },
    {
      icon: FiPhone,
      title: 'First Contact',
      description: 'Phone call with admission counselor',
      time: '1 day ago',
      status: 'success'
    },
    {
      icon: FiFile,
      title: 'Application Started',
      description: 'Began online application process',
      time: '12 hours ago',
      status: 'pending'
    },
    {
      icon: FiMessageSquare,
      title: 'Follow-up Email',
      description: 'Sent program details and requirements',
      time: '6 hours ago',
      status: 'success'
    }
  ];

  return (
    <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-xl font-medium">
              {lead.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{lead.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{lead.program}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <FiEdit2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Actions Dropdown */}
        {showActions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-4 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5"
          >
            <div className="py-1">
              <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                <FiEdit2 className="mr-3 h-4 w-4" />
                Edit Lead
              </button>
              <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                <FiShare2 className="mr-3 h-4 w-4" />
                Assign to Officer
              </button>
              <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                <FiTrash2 className="mr-3 h-4 w-4" />
                Delete Lead
              </button>
            </div>
          </motion.div>
        )}

        {/* Status Badge */}
        <div className="mt-4 flex items-center justify-between">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            lead.conversionScore === 'High' ? 'bg-green-100 text-green-800' :
            lead.conversionScore === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {lead.conversionScore} Conversion Score
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ID: #{lead.id.toString().padStart(6, '0')}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <FiMail className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">{lead.contact.email}</span>
                </div>
                <div className="flex items-center text-sm">
                  <FiPhone className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">{lead.contact.phone}</span>
                </div>
                <div className="flex items-center text-sm">
                  <FiUser className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">Assigned to: {lead.assignedTo}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {lead.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Documents */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Documents</h3>
              <div className="space-y-2">
                {lead.documents.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center">
                      <FiFile className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{doc}</span>
                    </div>
                    <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 text-sm">
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-4">
            {timelineData.map((item, index) => (
              <TimelineItem key={index} {...item} />
            ))}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <FiFile className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Application Form</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">PDF • 2.4 MB</p>
                </div>
              </div>
              <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 text-sm">
                Download
              </button>
            </div>
            {/* Add more document items */}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                {lead.assignedTo.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{lead.assignedTo}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Student showed strong interest in the program. Scheduled follow-up call for next week.
                  </p>
                </div>
              </div>
            </div>
            {/* Add more notes */}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-3">
          <button className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Send Message
          </button>
          <button className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Schedule Call
          </button>
        </div>
      </div>
    </div>
  );
} 