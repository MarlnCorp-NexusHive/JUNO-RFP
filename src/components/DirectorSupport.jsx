import React, { useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "../features/director/components/Sidebar";
import { directorFeatures } from "../features/director/components/directorFeatures";

const faqs = [
  { q: "How do I reset my password?", a: "Go to Settings > Security and click 'Reset Password'." },
  { q: "How to contact IT support?", a: "Email support@univ.edu or call extension 1234." },
  { q: "Where can I find compliance reports?", a: "Navigate to Audit & Compliance > Reports." },
];
const helpTopics = [
  { title: "User Management", desc: "Add, remove, or update user roles and permissions." },
  { title: "Data Security", desc: "Best practices for securing institutional data." },
  { title: "Compliance", desc: "Guidelines for NCAAA, ETEC, MoE, and SCFHS compliance." },
];

export default function DirectorSupport() {
  const user = JSON.parse(localStorage.getItem('rbac_current_user'));
  const [activeFaq, setActiveFaq] = useState(null);
  return (
    <div className="flex min-h-screen bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      <div className="sticky top-0 h-screen z-30">
        <Sidebar features={directorFeatures} userLabel={user?.displayName || user?.role || "Director"} />
      </div>
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-8 overflow-x-auto">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Help & Support</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Find answers to common questions or contact support.</p>
        </div>

        {/* Help Topics */}
        <section className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Help Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {helpTopics.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow flex flex-col gap-1"
              >
                <div className="font-semibold text-xs mb-1">{t.title}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">{t.desc}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">FAQs</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow mb-4">
            {faqs.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="mb-2"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full text-left font-semibold text-gray-900 dark:text-white py-2"
                >
                  {f.q}
                </button>
                {activeFaq === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-sm text-gray-600 dark:text-gray-300 px-2 pb-2"
                  >
                    {f.a}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Contact Support */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Contact Support</h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow flex flex-col gap-2"
          >
            <div className="text-xs text-gray-600 dark:text-gray-300">
              Email: <a href="mailto:support@univ.edu" className="text-blue-600 underline">support@univ.edu</a>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300">
              Phone: <a href="tel:1234" className="text-blue-600 underline">1234</a>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300">
              Live Chat: <span className="text-blue-600">(Coming Soon)</span>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
} 