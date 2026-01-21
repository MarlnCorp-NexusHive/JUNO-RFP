import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const filterCategories = [
  {
    id: 'program',
    label: 'Program / Department',
    type: 'multiSelect',
    options: [
      'Computer Science',
      'Business Administration',
      'Engineering',
      'Arts & Humanities',
      'Medical Sciences',
      'Law',
      'Design',
    ],
  },
  {
    id: 'geography',
    label: 'Geography',
    type: 'multiSelect',
    options: [
      'North America',
      'Europe',
      'Asia',
      'Africa',
      'Australia',
      'South America',
    ],
  },
  {
    id: 'date',
    label: 'Date Range',
    type: 'dateRange',
  },
  {
    id: 'source',
    label: 'Source',
    type: 'multiSelect',
    options: [
      'Website',
      'Social Media',
      'Referral',
      'Education Fair',
      'Agent',
      'Walk-in',
      'Email Campaign',
    ],
  },
  {
    id: 'officer',
    label: 'Admission Officer',
    type: 'multiSelect',
    options: [
      'Noura Al-Zahra',
      'Michael Chen',
      'Emma Wilson',
      'David Brown',
      'Lisa Patel',
    ],
  },
  {
    id: 'status',
    label: 'Status Stage',
    type: 'multiSelect',
    options: [
      'Inquiry',
      'Contacted',
      'Application Started',
      'Documents Submitted',
      'Verified',
      'Offer Sent',
      'Confirmed',
      'Withdrawn/Rejected',
    ],
  },
  {
    id: 'conversion',
    label: 'Conversion Score',
    type: 'multiSelect',
    options: ['High', 'Medium', 'Low'],
  },
];

export default function LeadFilters() {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [selectedFilters, setSelectedFilters] = useState({});

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleFilterChange = (categoryId, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [categoryId]: value
    }));
  };

  const clearFilters = () => {
    setSelectedFilters({});
  };

  const getActiveFilterCount = () => {
    return Object.values(selectedFilters).reduce((count, filters) => {
      return count + (Array.isArray(filters) ? filters.length : 0);
    }, 0);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-gray-900 dark:text-white">Filters</h3>
          {getActiveFilterCount() > 0 && (
            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-xs">
              {getActiveFilterCount()} active
            </span>
          )}
        </div>
        <button
          onClick={clearFilters}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Clear all
        </button>
      </div>

      <div className="p-4 space-y-4">
        {filterCategories.map((category) => (
          <div key={category.id} className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-4 last:pb-0">
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="font-medium text-gray-700 dark:text-gray-300">{category.label}</span>
              {expandedCategories[category.id] ? (
                <FiChevronUp className="text-gray-400" />
              ) : (
                <FiChevronDown className="text-gray-400" />
              )}
            </button>

            {expandedCategories[category.id] && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2"
              >
                {category.type === 'multiSelect' && (
                  <div className="grid grid-cols-2 gap-2">
                    {category.options.map((option) => (
                      <label
                        key={option}
                        className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFilters[category.id]?.includes(option) || false}
                          onChange={(e) => {
                            const current = selectedFilters[category.id] || [];
                            const newValue = e.target.checked
                              ? [...current, option]
                              : current.filter(item => item !== option);
                            handleFilterChange(category.id, newValue);
                          }}
                          className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {category.type === 'dateRange' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        From
                      </label>
                      <input
                        type="date"
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700"
                        value={selectedFilters[category.id]?.from || ''}
                        onChange={(e) => {
                          const current = selectedFilters[category.id] || {};
                          handleFilterChange(category.id, { ...current, from: e.target.value });
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        To
                      </label>
                      <input
                        type="date"
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700"
                        value={selectedFilters[category.id]?.to || ''}
                        onChange={(e) => {
                          const current = selectedFilters[category.id] || {};
                          handleFilterChange(category.id, { ...current, to: e.target.value });
                        }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Selected Filters Display */}
            {selectedFilters[category.id]?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {Array.isArray(selectedFilters[category.id]) ? (
                  selectedFilters[category.id].map((value) => (
                    <span
                      key={value}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200"
                    >
                      {value}
                      <button
                        onClick={() => {
                          const newValue = selectedFilters[category.id].filter(item => item !== value);
                          handleFilterChange(category.id, newValue);
                        }}
                        className="ml-1 hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        <FiX className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                    {selectedFilters[category.id].from} - {selectedFilters[category.id].to}
                    <button
                      onClick={() => handleFilterChange(category.id, null)}
                      className="ml-1 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      <FiX className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 