import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiMessageSquare, FiMail, FiPhone, FiAlertCircle, 
  FiClock, FiCalendar, FiCheckCircle, FiX,
  FiSend, FiPaperclip, FiSmile, FiZap
} from 'react-icons/fi';

const templates = [
  {
    id: 'missing_docs',
    name: 'Missing Documents Reminder',
    type: 'email',
    subject: 'Complete Your Application - Documents Required',
    body: 'Dear {name},\n\nWe noticed that some required documents are still pending for your application. Please upload them at your earliest convenience to avoid any delays in processing.\n\nRequired documents:\n- ID Proof\n- Academic Records\n- Address Proof\n\nBest regards,\nAdmissions Team',
    aiSuggestions: ['Best time to send: 10 AM', 'Personalize with program details', 'Include direct upload link']
  },
  {
    id: 'payment_reminder',
    name: 'Payment Reminder',
    type: 'whatsapp',
    body: 'Hi {name}! Just a friendly reminder that your application fee payment is pending. Complete it now to secure your spot! 🎓\n\nPayment Link: {payment_link}\n\nNeed help? Reply to this message!',
    aiSuggestions: ['Send during business hours', 'Include payment deadline', 'Offer payment assistance']
  },
  {
    id: 'interview_invite',
    name: 'Interview Invitation',
    type: 'email',
    subject: 'Interview Invitation - {program}',
    body: 'Dear {name},\n\nCongratulations! You have been shortlisted for an interview for the {program} program.\n\nDate: {interview_date}\nTime: {interview_time}\nMode: {interview_mode}\n\nPlease confirm your attendance by clicking the link below.\n\nBest regards,\nAdmissions Team',
    aiSuggestions: ['Schedule 3 days in advance', 'Include preparation tips', 'Send calendar invite']
  },
  {
    id: 'personalized_nudge',
    name: 'Personalized Follow-up',
    type: 'email',
    subject: 'Quick Check-in - {program} Application',
    body: 'Hi {name},\n\nI noticed you were interested in our {program} program. Do you have any questions I can help with? I\'d be happy to discuss:\n\n- Program details\n- Career opportunities\n- Admission process\n- Scholarship options\n\nBest regards,\n{admission_officer}',
    aiSuggestions: ['Use engagement history', 'Reference specific interests', 'Offer one-on-one call']
  }
];

const CommunicationTriggers = ({ leads, onClose }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('email');
  const [scheduledTime, setScheduledTime] = useState('');
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState(leads);

  const handleSend = () => {
    // Implement sending logic
    console.log('Sending message:', {
      template: selectedTemplate,
      customMessage,
      channel: selectedChannel,
      scheduledTime,
      leads: selectedLeads
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="px-8 pt-8 pb-6 sm:p-10 sm:pb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <FiMessageSquare className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                <h3 className="ml-2 text-lg font-medium text-gray-900 dark:text-white">
                  Communication Center
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            {/* Recipients */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Recipients ({selectedLeads.length})
              </label>
              <div className="mt-1 max-h-32 overflow-y-auto">
                {selectedLeads.map(lead => (
                  <div key={lead.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 mr-2">
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{lead.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{lead.contact.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedLeads(selectedLeads.filter(l => l.id !== lead.id))}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Communication Channel */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Communication Channel
              </label>
              <div className="mt-1 flex space-x-4">
                <button
                  onClick={() => setSelectedChannel('email')}
                  className={`flex items-center px-4 py-2 rounded-md ${
                    selectedChannel === 'email'
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <FiMail className="mr-2" />
                  Email
                </button>
                <button
                  onClick={() => setSelectedChannel('whatsapp')}
                  className={`flex items-center px-4 py-2 rounded-md ${
                    selectedChannel === 'whatsapp'
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <FiPhone className="mr-2" />
                  WhatsApp
                </button>
                <button
                  onClick={() => setSelectedChannel('sms')}
                  className={`flex items-center px-4 py-2 rounded-md ${
                    selectedChannel === 'sms'
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <FiMessageSquare className="mr-2" />
                  SMS
                </button>
              </div>
            </div>

            {/* Templates */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Message Template
              </label>
              <div className="mt-1 grid grid-cols-1 gap-2">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setCustomMessage(template.body);
                    }}
                    className={`flex items-start p-3 rounded-lg border ${
                      selectedTemplate?.id === template.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-500'
                    }`}
                  >
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900 dark:text-white">{template.name}</div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          {(() => {
                            let Icon;
                            if (template.type === 'email') Icon = FiMail;
                            else if (template.type === 'whatsapp') Icon = FiPhone;
                            else Icon = FiMessageSquare;
                            return <Icon className="mr-1" />;
                          })()}
                          {template.type}
                        </div>
                      </div>
                      {template.subject && (
                        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Subject: {template.subject}
                        </div>
                      )}
                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {template.body}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Message */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Message
              </label>
              <div className="mt-1">
                <textarea
                  rows={4}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Type your message here..."
                />
              </div>
            </div>

            {/* AI Suggestions */}
            {selectedTemplate && (
              <div className="mt-4">
                <button
                  onClick={() => setShowAISuggestions(!showAISuggestions)}
                  className="flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                >
                  <FiZap className="mr-1" />
                  {showAISuggestions ? 'Hide AI Suggestions' : 'Show AI Suggestions'}
                </button>
                {showAISuggestions && (
                  <div className="mt-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <div className="text-sm font-medium text-indigo-900 dark:text-indigo-200 mb-2">
                      AI-Powered Suggestions
                    </div>
                    <ul className="space-y-2">
                      {selectedTemplate.aiSuggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start text-sm text-indigo-700 dark:text-indigo-300">
                          <FiCheckCircle className="mt-0.5 mr-2 flex-shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Schedule */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Schedule
              </label>
              <div className="mt-1">
                <input
                  type="datetime-local"
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSend}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              <FiSend className="mr-2" />
              {scheduledTime ? 'Schedule' : 'Send Now'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CommunicationTriggers; 