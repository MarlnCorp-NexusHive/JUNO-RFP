import React, { useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiClock, FiUser } from 'react-icons/fi';

const ConflictResolutionPanel = () => {
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [resolution, setResolution] = useState({
    action: '',
    reason: '',
    notifyUsers: true
  });

  // Mock data - replace with actual API call
  const conflicts = [
    {
      id: 1,
      leadName: "Abdullah Al-Rashid",
      applicationId: "APP001",
      program: "B.Tech Computer Science",
      currentOwners: ["Noura Al-Zahra", "Khalid Al-Sayed"],
      lastInteraction: "2026-03-15",
      daysSinceLastInteraction: 5,
      conflictType: "Duplicate Entry",
      currentOwner: "Noura Al-Zahra",
      conflictingOwner: "Khalid Al-Sayed",
      conflictDate: "2026-06-10",
      resolution: "Pending"
    },
    {
      id: 2,
      leadName: "Mohammed Al-Saud",
      applicationId: "APP002",
      program: "MBA",
      currentOwner: "Noura Al-Zahra",
      lastInteraction: "2026-03-10",
      daysSinceLastInteraction: 10,
      conflictType: "Territory Overlap",
      conflictingOwner: "Layla Al-Mansour",
      conflictDate: "2026-06-09",
      resolution: "Resolved"
    },
    {
      id: 3,
      leadName: "Layla Al-Mansour",
      applicationId: "APP003",
      program: "B.Tech Mechanical",
      currentOwners: ["Noura Al-Zahra", "Khalid Al-Sayed"],
      lastInteraction: "2026-03-12",
      daysSinceLastInteraction: 8,
      conflictType: "Multiple Assignments",
      conflictDate: "2026-06-08",
      resolution: "Pending"
    },
    {
      id: 4,
      leadName: "Fatima Al-Rashid",
      applicationId: "APP004",
      program: "B.Tech Civil",
      currentOwner: "Aisha Al-Hassan",
      lastInteraction: "2026-03-08",
      daysSinceLastInteraction: 12,
      conflictType: "Duplicate Entry",
      conflictingOwner: "Omar Al-Mutairi",
      conflictDate: "2026-06-07",
      resolution: "Resolved"
    }
  ];

  const handleResolve = (conflictId) => {
    // Implement conflict resolution logic
    console.log('Resolving conflict:', {
      conflictId,
      resolution
    });
  };

  return (
    <div className="space-y-6">
      {/* Conflicts List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Lead Ownership Conflicts
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Resolve duplicate ownership and inactive lead issues
          </p>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {conflicts.map((conflict) => (
            <div key={conflict.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {conflict.conflictType === 'Duplicate Entry' ? (
                        <FiUser className="h-5 w-5 text-yellow-400" />
                      ) : (
                        <FiClock className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {conflict.leadName}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {conflict.applicationId} • {conflict.program}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2">
                    {conflict.conflictType === 'Duplicate Entry' ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Conflicting owners: {conflict.conflictingOwner}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        No follow-up for {conflict.daysSinceLastInteraction} days
                      </div>
                    )}
                  </div>

                  {selectedConflict === conflict.id && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Resolution Action
                        </label>
                        <select
                          value={resolution.action}
                          onChange={(e) => setResolution({ ...resolution, action: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          <option value="">Select action...</option>
                          {conflict.conflictType === 'Duplicate Entry' ? (
                            <>
                              <option value="assign_primary">Assign Primary Owner</option>
                              <option value="split_responsibility">Split Responsibility</option>
                            </>
                          ) : (
                            <>
                              <option value="reassign">Reassign Lead</option>
                              <option value="mark_inactive">Mark as Inactive</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Reason
                        </label>
                        <textarea
                          value={resolution.reason}
                          onChange={(e) => setResolution({ ...resolution, reason: e.target.value })}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="Enter reason for resolution..."
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={resolution.notifyUsers}
                          onChange={(e) => setResolution({ ...resolution, notifyUsers: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Notify affected counselors
                        </label>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => setSelectedConflict(null)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleResolve(conflict.id)}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <button
                    onClick={() => setSelectedConflict(selectedConflict === conflict.id ? null : conflict.id)}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    {selectedConflict === conflict.id ? 'Hide' : 'Resolve'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resolution Guidelines */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Resolution Guidelines
        </h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <FiAlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Duplicate Ownership
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                When multiple counselors are assigned to the same lead, assign a primary owner based on expertise and workload.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <FiClock className="h-5 w-5 text-red-400 mt-0.5" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Inactive Leads
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Leads with no follow-up for more than 7 days should be reassigned or marked as inactive.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConflictResolutionPanel; 