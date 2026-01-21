import React, { useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "../features/director/components/Sidebar";
import { directorFeatures } from "../features/director/components/directorFeatures";

const settingsCategories = [
  {
    label: "Institutional Settings",
    options: [
      { label: "University Name", value: "University of Technology" },
      { label: "Address", value: "123 Education St, Tech City" },
      { label: "Contact Email", value: "contact@univ.edu" },
      { label: "Phone Number", value: "+1-234-567-8900" },
    ],
  },
  {
    label: "Academic Configuration",
    options: [
      { label: "Academic Year", value: "2026-2026" },
      { label: "Semester Start Date", value: "August 1, 2026" },
      { label: "Semester End Date", value: "December 15, 2026" },
      { label: "Grading System", value: "Percentage" },
    ],
  },
  {
    label: "Access Permissions",
    options: [
      { label: "Admin Access", value: "Enabled" },
      { label: "Faculty Access", value: "Enabled" },
      { label: "Student Access", value: "Enabled" },
      { label: "Guest Access", value: "Disabled" },
    ],
  },
  {
    label: "Notifications",
    options: [
      { label: "Email Notifications", value: "Enabled" },
      { label: "SMS Notifications", value: "Disabled" },
      { label: "Push Notifications", value: "Enabled" },
      { label: "Notification Frequency", value: "Daily" },
    ],
  },
  {
    label: "Data & Privacy",
    options: [
      { label: "Data Retention", value: "5 Years" },
      { label: "Backup Frequency", value: "Daily" },
      { label: "Privacy Policy", value: "Enabled" },
      { label: "GDPR Compliance", value: "Enabled" },
    ],
  },
];

export default function DirectorSettings() {
  const user = JSON.parse(localStorage.getItem('rbac_current_user'));
  const [activeCategory, setActiveCategory] = useState(settingsCategories[0].label);

  return (
    <div className="flex min-h-screen bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      <div className="sticky top-0 h-screen z-30">
        <Sidebar features={directorFeatures} userLabel={user?.displayName || user?.role || "Director"} />
      </div>
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-8 overflow-x-auto">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Configure your institutional settings and preferences.</p>
        </div>

        {/* Settings Categories */}
        <section className="mb-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {settingsCategories.map((category) => (
              <button
                key={category.label}
                onClick={() => setActiveCategory(category.label)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === category.label
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Active Category Content */}
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{activeCategory}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settingsCategories
                .find((cat) => cat.label === activeCategory)
                ?.options.map((option, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {option.label}
                    </label>
                    <input
                      type="text"
                      value={option.value}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-sm text-gray-900 dark:text-white"
                      readOnly
                    />
                  </div>
                ))}
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
} 