import React, { useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import { directorFeatures } from './directorFeatures';

// Demo data for approval requests
const approvalRequests = [
  // Academic Approvals
  {
    id: 1,
    category: "Academic",
    type: "New Course Proposal",
    title: "Introduction to Quantum Computing",
    department: "Computer Science",
    requestedBy: "Dr. Sarah Johnson",
    amount: 0,
    status: "Pending",
    priority: "High",
    date: "2026-03-15",
    description: "Proposal for a new undergraduate course in Quantum Computing",
    attachments: ["Course_Proposal.pdf", "Syllabus_Draft.pdf"],
    comments: [
      { user: "Dr. Sarah Johnson", text: "Course aligned with industry demands", date: "2026-03-15" },
      { user: "Academic Committee", text: "Under review", date: "2026-03-16" }
    ]
  },
  {
    id: 2,
    category: "Academic",
    type: "Curriculum Revision",
    title: "AI Specialization Update",
    department: "Computer Science",
    requestedBy: "Dr. Michael Chen",
    amount: 0,
    status: "Pending",
    priority: "Medium",
    date: "2026-03-14",
    description: "Update to AI specialization curriculum to include latest advancements",
    attachments: ["Curriculum_Changes.pdf", "Industry_Feedback.pdf"],
    comments: [
      { user: "Dr. Michael Chen", text: "Updated based on industry requirements", date: "2026-03-14" }
    ]
  },
  // Faculty & HR Approvals
  {
    id: 3,
    category: "HR",
    type: "Faculty Hiring",
    title: "Senior Professor - Data Science",
    department: "Computer Science",
    requestedBy: "Dr. Emily Brown",
    amount: 150000,
    status: "Pending",
    priority: "High",
    date: "2026-03-13",
    description: "New faculty position for Data Science specialization",
    attachments: ["Job_Description.pdf", "Candidate_Profile.pdf"],
    comments: [
      { user: "HR Team", text: "Position requirements reviewed", date: "2026-03-13" }
    ]
  },
  // Financial Approvals
  {
    id: 4,
    category: "Finance",
    type: "Research Grant",
    title: "AI Research Project Funding",
    department: "Computer Science",
    requestedBy: "Dr. Robert Williams",
    amount: 250000,
    status: "Pending",
    priority: "High",
    date: "2026-03-12",
    description: "Research grant request for AI ethics project",
    attachments: ["Project_Proposal.pdf", "Budget_Breakdown.pdf"],
    comments: [
      { user: "Finance Team", text: "Budget review in progress", date: "2026-03-12" }
    ]
  },
  // Administrative Approvals
  {
    id: 5,
    category: "Admin",
    type: "Event Approval",
    title: "Tech Symposium 2026",
    department: "Computer Science",
    requestedBy: "Dr. Lisa Anderson",
    amount: 50000,
    status: "Pending",
    priority: "Medium",
    date: "2026-03-11",
    description: "Annual technical symposium with industry experts",
    attachments: ["Event_Plan.pdf", "Budget_Proposal.pdf"],
    comments: [
      { user: "Event Committee", text: "Venue and speakers confirmed", date: "2026-03-11" }
    ]
  },
  // Compliance Approvals
  {
    id: 6,
    category: "Compliance",
    type: "Accreditation Documentation",
    title: "ETEC Annual Report Submission",
    department: "Quality Assurance",
    requestedBy: "Dr. James Wilson",
    amount: 0,
    status: "Pending",
    priority: "High",
    date: "2026-03-10",
    description: "Final approval for ETEC accreditation documentation",
    attachments: ["ETEC_Report.pdf", "Supporting_Docs.pdf"],
    comments: [
      { user: "QA Team", text: "All required documents compiled", date: "2026-03-10" }
    ]
  }
];

export default function ApprovalCenter() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [comment, setComment] = useState("");
  const [requests, setRequests] = useState(approvalRequests);
  const user = JSON.parse(localStorage.getItem('rbac_current_user'));

  const categories = [
    { id: "All", label: "All Categories" },
    { id: "Academic", label: "Academic" },
    { id: "HR", label: "Faculty & HR" },
    { id: "Finance", label: "Financial" },
    { id: "Admin", label: "Administrative" },
    { id: "Compliance", label: "Compliance & Audit" }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "Escalated":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "Revision Requested":
      case "Revision":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const handleBulkAction = (action) => {
    // Handle bulk approve/reject
    console.log(`Bulk ${action} for:`, selectedRequests);
    setSelectedRequests([]);
  };

  const renderApprovalList = () => (
    <div className="space-y-4">
      {requests
        .filter(request => selectedCategory === "All" || request.category === selectedCategory)
        .filter(request => selectedStatus === "All" || request.status === selectedStatus)
        .filter(request => selectedPriority === "All" || request.priority === selectedPriority)
        .map((request) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                checked={selectedRequests.includes(request.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedRequests([...selectedRequests, request.id]);
                  } else {
                    setSelectedRequests(selectedRequests.filter(id => id !== request.id));
                  }
                }}
                className="mt-1"
              />
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => setSelectedRequest(request)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                    {request.status === "Revision Requested" ? "Revision" : request.status}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                    {request.priority}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {request.category} • {request.type}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {request.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {request.department} • Requested by {request.requestedBy}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                  {request.description}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {request.amount > 0 && (
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${request.amount.toLocaleString()}
                  </p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {new Date(request.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
    </div>
  );

  const renderApprovalDetails = () => {
    if (!selectedRequest) return null;

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                {selectedRequest.status === "Revision Requested" ? "Revision" : selectedRequest.status}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedRequest.priority)}`}>
                {selectedRequest.priority}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {selectedRequest.category} • {selectedRequest.type}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              {selectedRequest.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {selectedRequest.department} • Requested by {selectedRequest.requestedBy}
            </p>
          </div>
          <button
            onClick={() => setSelectedRequest(null)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
            <p className="text-gray-600 dark:text-gray-300">{selectedRequest.description}</p>
          </div>

          {selectedRequest.amount > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Amount</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${selectedRequest.amount.toLocaleString()}
              </p>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Attachments</h3>
            <div className="flex flex-wrap gap-2">
              {selectedRequest.attachments.map((file, index) => (
                <a
                  key={index}
                  href="#"
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  {file}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Comments</h3>
            <div className="space-y-4">
              {selectedRequest.comments.map((comment, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-gray-900 dark:text-white">{comment.user}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{comment.date}</p>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{comment.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Add Comment</h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              rows="3"
              placeholder="Add your comment here..."
            />
          </div>

          <div className="flex justify-end gap-4">
            <button 
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              onClick={() => {
                if (!comment.trim()) {
                  alert("Please add a comment explaining what needs to be revised");
                  return;
                }
                // Update status to 'Revision Requested' in local state
                setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, status: "Revision Requested" } : r));
                setComment("");
                setSelectedRequest(null);
              }}
            >
              Request Revision
            </button>
            <button 
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              onClick={() => {
                if (!comment.trim()) {
                  alert("Please add a comment explaining the rejection reason");
                  return;
                }
                // Update status to 'Rejected' in local state
                setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, status: "Rejected" } : r));
                setComment("");
                setSelectedRequest(null);
              }}
            >
              Reject
            </button>
            <button 
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              onClick={() => {
                // Update status to 'Approved' in local state
                setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, status: "Approved" } : r));
                setComment("");
                setSelectedRequest(null);
              }}
            >
              Approve
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      <div className="sticky top-0 h-screen z-30">
        <Sidebar features={directorFeatures} userLabel={user?.displayName || user?.role || "Director"} />
      </div>
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-4 overflow-x-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Approval Center</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Manage and process approval requests</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.label}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Escalated">Escalated</option>
              <option value="Revision Requested">Revision Requested</option>
            </select>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedRequests.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {selectedRequests.length} requests selected
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction("approve")}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Approve Selected
                </button>
                <button
                  onClick={() => handleBulkAction("reject")}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Reject Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="flex-1">
          {selectedRequest ? renderApprovalDetails() : renderApprovalList()}
        </div>
      </main>
    </div>
  );
} 