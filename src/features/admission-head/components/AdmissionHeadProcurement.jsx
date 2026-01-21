import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useLocalization } from "../../../hooks/useLocalization";
import { 
  FiShoppingCart, FiPlus, FiSearch, FiFilter, FiDownload, FiEdit2, FiTrash2,
  FiCheckCircle, FiXCircle, FiClock, FiDollarSign, FiPackage, FiTruck,
  FiTrendingUp, FiTrendingDown, FiBarChart2, FiFileText, FiUser, FiCalendar
} from 'react-icons/fi';

// Demo data
const purchaseRequests = [
  { id: 1, item: "Admission Forms Printing", category: "Printing", quantity: 5000, unitPrice: 0.5, total: 2500, requestedBy: "Noura Al-Zahra", date: "2026-11-15", status: "Pending", priority: "High" },
  { id: 2, item: "Document Scanner", category: "Equipment", quantity: 2, unitPrice: 1200, total: 2400, requestedBy: "Khalid Al-Sayed", date: "2026-11-14", status: "Approved", priority: "Medium" },
  { id: 3, item: "Interview Room Setup", category: "Furniture", quantity: 1, unitPrice: 8500, total: 8500, requestedBy: "Omar Al-Mutairi", date: "2026-11-13", status: "In Progress", priority: "High" },
  { id: 4, item: "Office Supplies", category: "Supplies", quantity: 50, unitPrice: 25, total: 1250, requestedBy: "Fatima Al-Rashid", date: "2026-11-12", status: "Completed", priority: "Low" },
];

const vendors = [
  { id: 1, name: "Print Services Co.", category: "Printing", rating: 4.6, totalOrders: 28, totalSpent: 45000, lastOrder: "2026-11-10", status: "Active" },
  { id: 2, name: "Office Equipment Inc.", category: "Equipment", rating: 4.4, totalOrders: 15, totalSpent: 32000, lastOrder: "2026-11-08", status: "Active" },
  { id: 3, name: "Furniture Solutions", category: "Furniture", rating: 4.7, totalOrders: 8, totalSpent: 67000, lastOrder: "2026-11-05", status: "Active" },
];

export default function AdmissionHeadProcurement() {
  const { t, ready, i18n } = useTranslation('admission');
  const [languageVersion, setLanguageVersion] = useState(0);
  const { isRTLMode } = useLocalization();
  const [activeTab, setActiveTab] = useState('requests');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    setLanguageVersion(prev => prev + 1);
  }, [i18n.language]);

  if (!ready) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const filteredRequests = purchaseRequests.filter(req => {
    const matchesSearch = req.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div 
      key={`${i18n.language}-${languageVersion}`}
      className={`flex min-h-screen bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 ${isRTLMode ? 'rtl' : 'ltr'}`}
    >
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-8 overflow-x-auto">
        {/* Header */}
        <header className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${isRTLMode ? 'flex-row-reverse' : ''}`}>
          <div className={`flex-1 min-w-0 ${isRTLMode ? 'text-right' : 'text-left'}`}>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('procurement.title') || 'Procurement'}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('procurement.subtitle') || 'Manage purchase requests and vendor relationships'}</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <FiPlus className="w-5 h-5" />
            <span>New Request</span>
          </button>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Total Requests</span>
              <FiShoppingCart className="text-blue-500 w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{purchaseRequests.length}</p>
            <p className="text-sm text-green-600 mt-1">+8% from last month</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Pending</span>
              <FiClock className="text-yellow-500 w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {purchaseRequests.filter(r => r.status === 'Pending').length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Awaiting approval</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Total Spent</span>
              <FiDollarSign className="text-green-500 w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${purchaseRequests.reduce((sum, r) => sum + r.total, 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">This month</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Vendors</span>
              <FiUser className="text-purple-500 w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{vendors.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active vendors</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'requests'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
                }`}
              >
                Purchase Requests
              </button>
              <button
                onClick={() => setActiveTab('vendors')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'vendors'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
                }`}
              >
                Vendors
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
                }`}
              >
                Analytics
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Purchase Requests Tab */}
            {activeTab === 'requests' && (
              <div>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search requests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                    <FiDownload className="w-5 h-5" />
                    <span>Export</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Item</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Category</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Quantity</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Total</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Requested By</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((request) => (
                        <tr key={request.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="py-3 px-4">{request.item}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-sm">
                              {request.category}
                            </span>
                          </td>
                          <td className="py-3 px-4">{request.quantity}</td>
                          <td className="py-3 px-4 font-medium">${request.total.toLocaleString()}</td>
                          <td className="py-3 px-4">{request.requestedBy}</td>
                          <td className="py-3 px-4">{request.date}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-sm ${
                              request.status === 'Pending' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                              request.status === 'Approved' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                              request.status === 'In Progress' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                              'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                <FiEdit2 className="w-4 h-4 text-blue-600" />
                              </button>
                              <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                <FiTrash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Vendors Tab */}
            {activeTab === 'vendors' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vendors.map((vendor) => (
                    <div key={vendor.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{vendor.name}</h3>
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-sm">
                          {vendor.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Category:</span>
                          <span className="text-gray-900 dark:text-white font-medium">{vendor.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Rating:</span>
                          <span className="text-gray-900 dark:text-white font-medium">{vendor.rating}/5.0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Orders:</span>
                          <span className="text-gray-900 dark:text-white font-medium">{vendor.totalOrders}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Spent:</span>
                          <span className="text-gray-900 dark:text-white font-medium">${vendor.totalSpent.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Last Order:</span>
                          <span className="text-gray-900 dark:text-white font-medium">{vendor.lastOrder}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                          View Details
                        </button>
                        <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-sm">
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Spending by Category</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Printing</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">$45,000</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Equipment</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">$32,000</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '32%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Furniture</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">$67,000</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '67%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Procurement Trends</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded">
                      <div className="flex items-center gap-3">
                        <FiTrendingUp className="text-green-500 w-5 h-5" />
                        <span className="text-gray-900 dark:text-white">This Month</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">+10%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded">
                      <div className="flex items-center gap-3">
                        <FiDollarSign className="text-blue-500 w-5 h-5" />
                        <span className="text-gray-900 dark:text-white">Average Order</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">$3,650</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
