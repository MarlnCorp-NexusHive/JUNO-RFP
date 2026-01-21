import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiZap, FiTrendingUp, FiTrendingDown, FiAlertCircle,
  FiClock, FiUsers, FiTarget, FiCheckCircle, FiX,
  FiBarChart2, FiPieChart, FiCalendar, FiMessageSquare
} from 'react-icons/fi';

const AIInsights = ({ insights, onClose, isModal = false }) => {
  const [activeTab, setActiveTab] = useState('conversion');

  const tabs = [
    { id: 'conversion', label: 'Conversion Predictions', icon: FiTrendingUp },
    { id: 'dropoff', label: 'Drop-off Risks', icon: FiTrendingDown },
    { id: 'workload', label: 'Workload Suggestions', icon: FiUsers },
    { id: 'engagement', label: 'Engagement Tips', icon: FiMessageSquare }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'conversion':
        return (
          <div className="space-y-4">
            {insights.conversionPredictions.map((prediction, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 mr-3">
                        {prediction.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{prediction.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {Math.round(prediction.probability * 100)}% likely to convert
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Key Factors:</div>
                      <ul className="mt-1 space-y-1">
                        {prediction.factors.map((factor, idx) => (
                          <li key={idx} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <FiCheckCircle className="mr-2 text-green-500" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      prediction.probability > 0.7
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : prediction.probability > 0.4
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {prediction.probability > 0.7 ? 'High' : prediction.probability > 0.4 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        );

      case 'dropoff':
        return (
          <div className="space-y-4">
            {insights.dropoffRisks.map((risk, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center text-red-600 dark:text-red-300 mr-3">
                        {risk.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{risk.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {risk.reason}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Recommended Actions:</div>
                      <ul className="mt-1 space-y-1">
                        <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <FiMessageSquare className="mr-2 text-indigo-500" />
                          Send personalized follow-up
                        </li>
                        <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <FiCalendar className="mr-2 text-indigo-500" />
                          Schedule a call
                        </li>
                        <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <FiTarget className="mr-2 text-indigo-500" />
                          Offer additional information
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      risk.risk === 'High'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : risk.risk === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {risk.risk} Risk
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        );

      case 'workload':
        return (
          <div className="space-y-4">
            {insights.workloadSuggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
              >
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-300 mr-3">
                    <FiUsers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {suggestion.officer}
                    </div>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {suggestion.suggestion}
                    </div>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Reason: {suggestion.reason}
                    </div>
                    <button className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50">
                      View Details
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        );

      case 'engagement':
        return (
          <div className="space-y-4">
            {insights.engagementRecommendations.map((recommendation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
              >
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 mr-3">
                    <FiMessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {recommendation.action}
                    </div>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Channel: {recommendation.channel}
                    </div>
                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Best Time: {recommendation.timing}
                    </div>
                    <button className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50">
                      Take Action
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const content = (
    <div className="space-y-10 p-6 md:p-10 text-base">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FiZap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <h2 className="ml-2 text-lg font-medium text-gray-900 dark:text-white">
            AI Insights
          </h2>
        </div>
        {isModal && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <FiX className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-4">
        {renderContent()}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
          </div>
          <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
            <div className="px-8 pt-8 pb-6 sm:p-10 sm:pb-8">
              {content}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return content;
};

export default AIInsights;
