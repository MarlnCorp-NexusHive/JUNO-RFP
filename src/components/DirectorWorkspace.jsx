import React from "react";
import { motion } from "framer-motion";
import Sidebar from "../features/director/components/Sidebar";
import { directorFeatures } from "../features/director/components/directorFeatures";

const quickLinks = [
  { label: "Dashboard", url: "/director/dashboard" },
  { label: "Analytics", url: "/director/analytics" },
  { label: "Reports", url: "/director/reports" },
  { label: "Settings", url: "/director/settings" },
];

const widgets = [
  { label: "Active Users", value: "1,234" },
  { label: "Total Revenue", value: "$45,678" },
  { label: "Pending Tasks", value: "12" },
  { label: "System Status", value: "Healthy" },
];

export default function DirectorWorkspace() {
  const user = JSON.parse(localStorage.getItem('rbac_current_user'));

  return (
    <div className="flex min-h-screen bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      <div className="sticky top-0 h-screen z-30">
        <Sidebar features={directorFeatures} userLabel={user?.displayName || user?.role || "Director"} />
      </div>
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-8 overflow-x-auto">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Workspace</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Your personalized workspace with quick access to important features.</p>
        </div>

        {/* Quick Links */}
        <section className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {quickLinks.map((link, i) => (
              <motion.a
                key={i}
                href={link.url}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
              >
                {link.label}
              </motion.a>
            ))}
          </div>
        </section>

        {/* Widgets */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Widgets</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {widgets.map((widget, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow"
              >
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">{widget.label}</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">{widget.value}</div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
