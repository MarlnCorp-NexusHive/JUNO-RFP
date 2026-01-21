import React, { useState } from 'react';
import { PaperAirplaneIcon, UserGroupIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const initialThreads = {
  Employees: [
    { sender: 'HR Head', message: 'Reminder: Submit your timesheets by Friday.' },
    { sender: 'Employee', message: 'Submitted mine today, thank you!' },
  ],
  Management: [
    { sender: 'HR Head', message: 'Quarterly HR report will be shared next week.' },
    { sender: 'Director', message: 'Looking forward to it.' },
  ],
  Payroll: [
    { sender: 'HR Head', message: 'Payroll adjustments for March are complete.' },
    { sender: 'Payroll', message: 'Confirmed, all processed.' },
  ],
};

const tabs = ['Employees', 'Management', 'Payroll'];

const CommunicationHub = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('Employees');
  const [threads, setThreads] = useState(initialThreads);

  const handleSend = () => {
    if (message.trim()) {
      setThreads((prev) => ({
        ...prev,
        [activeTab]: [...prev[activeTab], { sender: 'HR Head', message }],
      }));
      setMessage('');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Communication Hub</h1>
        <p className="text-gray-500 dark:text-gray-400">Centralized command center for HR internal and external communication.</p>
      </div>
      {/* Broadcast Messages */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        <h2 className="font-semibold text-lg mb-2 flex items-center gap-2"><PaperAirplaneIcon className="h-5 w-5" /> Broadcast Message</h2>
        <div className="flex flex-col md:flex-row gap-2">
          <input
            type="text"
            placeholder="Announcement subject..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
          />
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={() => setSubject('')}>
            Send
          </button>
        </div>
        <p className="text-xs text-gray-400">Push, email, and in-app notifications will be sent to selected group(s).</p>
      </div>
      {/* Internal Communication Threads */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><ChatBubbleLeftRightIcon className="h-5 w-5" /> Internal Communication</h2>
        <div className="flex gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1 rounded-lg font-medium ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="space-y-2 mb-4">
          {threads[activeTab].map((msg, idx) => (
            <div key={idx} className={`p-2 rounded ${msg.sender === 'HR Head' ? 'bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>
              <span className="font-semibold">[{msg.sender}]</span> {msg.message}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleSend}>
            Send
          </button>
        </div>
      </div>
      {/* Message Archives */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><UserGroupIcon className="h-5 w-5" /> Message Archives</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Subject</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Thread</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-4 py-2">2026-03-10</td>
                <td className="px-4 py-2">HR Policy Update</td>
                <td className="px-4 py-2">Employees</td>
              </tr>
              <tr>
                <td className="px-4 py-2">2026-03-08</td>
                <td className="px-4 py-2">Payroll Reminder</td>
                <td className="px-4 py-2">Payroll</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CommunicationHub; 