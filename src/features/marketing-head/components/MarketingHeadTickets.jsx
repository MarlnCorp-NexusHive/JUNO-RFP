import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Demo data for tickets
const tickets = [
  {
    id: 1,
    title: 'Website Update Request',
    description: 'Need to update the pricing page with new product tiers',
    status: 'Open',
    priority: 'High',
    category: 'Website',
    assignedTo: 'Abdullah Al-Rashid',
    createdBy: 'Noura Al-Zahra',
    createdAt: '2026-02-15',
    lastUpdated: '2026-02-16',
    comments: [
      {
        id: 1,
        user: 'Noura Al-Zahra',
        text: 'Please update the pricing page with the new enterprise tier',
        timestamp: '2026-02-15 10:30 AM',
      },
      {
        id: 2,
        user: 'Abdullah Al-Rashid',
        text: 'I\'ll start working on this today',
        timestamp: '2026-02-15 11:45 AM',
      },
    ],
  },
  {
    id: 2,
    title: 'Social Media Campaign Approval',
    description: 'Need approval for Q2 social media campaign content',
    status: 'In Progress',
    priority: 'Medium',
    category: 'Social Media',
    assignedTo: 'Omar Al-Mutairi',
    createdBy: 'Layla Al-Mansour',
    createdAt: '2026-02-14',
    lastUpdated: '2026-02-16',
    comments: [
      {
        id: 1,
        user: 'Layla Al-Mansour',
        text: 'Please review the campaign content for Q2',
        timestamp: '2026-02-14 09:15 AM',
      },
    ],
  },
  {
    id: 3,
    title: 'Email Template Update',
    description: 'Update welcome email template with new branding',
    status: 'Closed',
    priority: 'Low',
    category: 'Email Marketing',
    assignedTo: 'Fatima Al-Rashid',
    createdBy: 'Khalid Al-Sayed',
    createdAt: '2026-02-13',
    lastUpdated: '2026-02-15',
    comments: [
      {
        id: 1,
        user: 'Khalid Al-Sayed',
        text: 'Please update the welcome email with new branding',
        timestamp: '2026-02-13 02:30 PM',
      },
      {
        id: 2,
        user: 'Fatima Al-Rashid',
        text: 'I\'ve updated the template with the new branding',
        timestamp: '2026-02-14 11:20 AM',
      },
      {
        id: 3,
        user: 'Khalid Al-Sayed',
        text: 'Looks great, thanks!',
        timestamp: '2026-02-15 09:45 AM',
      },
    ],
  },
];

// Demo data for ticket metrics
const ticketMetrics = [
  {
    id: 1,
    name: 'Total Tickets',
    value: '45',
    change: '+5%',
    trend: 'up',
  },
  {
    id: 2,
    name: 'Open Tickets',
    value: '12',
    change: '-2%',
    trend: 'down',
  },
  {
    id: 3,
    name: 'In Progress',
    value: '8',
    change: '+3%',
    trend: 'up',
  },
  {
    id: 4,
    name: 'Closed',
    value: '25',
    change: '+8%',
    trend: 'up',
  },
];

const MarketingHeadTickets = () => {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('All');
  const [newComment, setNewComment] = useState('');

  const handleViewDetails = (ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const handleAddComment = () => {
    if (newComment.trim() && selectedTicket) {
      const comment = {
        id: selectedTicket.comments.length + 1,
        user: 'Current User',
        text: newComment,
        timestamp: new Date().toLocaleString(),
      };
      selectedTicket.comments.push(comment);
      setNewComment('');
    }
  };

  const filteredTickets = filter === 'All' 
    ? tickets 
    : tickets.filter(ticket => ticket.status === filter);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Tickets</h1>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Create Ticket
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Export Tickets
          </button>
        </div>
      </div>

      {/* Ticket Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {ticketMetrics.map((metric) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">{metric.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
              </div>
              <span className={`text-sm font-medium ${
                metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">All Tickets</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{ticket.title}</div>
                        <div className="text-sm text-gray-500">{ticket.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{ticket.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      ticket.priority === 'High' 
                        ? 'bg-red-100 text-red-800'
                        : ticket.priority === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{ticket.assignedTo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      ticket.status === 'Open' 
                        ? 'bg-blue-100 text-blue-800'
                        : ticket.status === 'In Progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ticket.lastUpdated}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(ticket)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Details Modal */}
      {isModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedTicket.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{selectedTicket.description}</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-4">Ticket Information</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="text-sm font-medium text-gray-900">{selectedTicket.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Priority</p>
                      <p className="text-sm font-medium text-gray-900">{selectedTicket.priority}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="text-sm font-medium text-gray-900">{selectedTicket.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created By</p>
                      <p className="text-sm font-medium text-gray-900">{selectedTicket.createdBy}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-4">Assignment</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Assigned To</p>
                      <p className="text-sm font-medium text-gray-900">{selectedTicket.assignedTo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created At</p>
                      <p className="text-sm font-medium text-gray-900">{selectedTicket.createdAt}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="text-sm font-medium text-gray-900">{selectedTicket.lastUpdated}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-500 mb-4">Comments</h4>
                <div className="space-y-4">
                  {selectedTicket.comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{comment.user}</p>
                          <p className="text-sm text-gray-500">{comment.timestamp}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-900 mt-2">{comment.text}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                  <button
                    onClick={handleAddComment}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Comment
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingHeadTickets; 