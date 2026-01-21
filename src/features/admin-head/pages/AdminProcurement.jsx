import React, { useState } from "react";
import { 
  FiShoppingCart, FiPlus, FiSearch, FiDownload, FiEdit2, FiTrash2,
  FiCheckCircle, FiClock, FiDollarSign, FiUser, FiTrendingUp, FiBarChart2
} from 'react-icons/fi';

// Demo data
const purchaseOrders = [
  { id: 1, poNumber: "PO-2026-001", vendor: "Tech Solutions Inc.", department: "IT", items: 5, total: 45000, date: "2026-11-15", status: "Pending", requestedBy: "IT Director" },
  { id: 2, poNumber: "PO-2026-002", vendor: "Office Supplies Co.", department: "HR", items: 12, total: 8500, date: "2026-11-14", status: "Approved", requestedBy: "HR Director" },
  { id: 3, poNumber: "PO-2026-003", vendor: "Facilities Management", department: "Operations", items: 3, total: 125000, date: "2026-11-13", status: "In Review", requestedBy: "Operations Manager" },
];

const vendors = [
  { id: 1, name: "Tech Solutions Inc.", category: "Software & IT", rating: 4.8, totalOrders: 125, totalSpent: 2450000, status: "Preferred" },
  { id: 2, name: "Office Supplies Co.", category: "Office Supplies", rating: 4.5, totalOrders: 89, totalSpent: 125000, status: "Active" },
  { id: 3, name: "Facilities Management", category: "Facilities", rating: 4.7, totalOrders: 45, totalSpent: 890000, status: "Preferred" },
];

export default function AdminProcurement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex min-h-screen bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-8 overflow-x-auto">
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Procurement Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage purchase orders, vendors, and procurement processes</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
              <FiDownload className="w-5 h-5" />
              <span>Export</span>
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <FiPlus className="w-5 h-5" />
              <span>New PO</span>
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Total Orders</span>
              <FiShoppingCart className="text-blue-500 w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{purchaseOrders.length}</p>
            <p className="text-sm text-green-600 mt-1">+12% from last month</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Pending</span>
              <FiClock className="text-yellow-500 w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {purchaseOrders.filter(po => po.status === 'Pending' || po.status === 'In Review').length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Requires attention</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Total Spent</span>
              <FiDollarSign className="text-green-500 w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${purchaseOrders.reduce((sum, po) => sum + po.total, 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">This month</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Active Vendors</span>
              <FiUser className="text-purple-500 w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{vendors.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Vendor network</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
                }`}
              >
                Purchase Orders
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
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Pending Approvals</h3>
                    <div className="space-y-3">
                      {purchaseOrders.filter(po => po.status === 'Pending' || po.status === 'In Review').map((po) => (
                        <div key={po.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{po.poNumber}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{po.vendor}</p>
                            </div>
                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded text-xs">
                              {po.status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-3">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">${po.total.toLocaleString()}</span>
                            <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                              Review
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Spending by Department</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">IT</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">$1,250,000</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Operations</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">$890,000</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '32%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Purchase Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search purchase orders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">PO Number</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Vendor</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Department</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Total</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseOrders.map((order) => (
                        <tr key={order.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="py-3 px-4 font-medium">{order.poNumber}</td>
                          <td className="py-3 px-4">{order.vendor}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-sm">
                              {order.department}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium">${order.total.toLocaleString()}</td>
                          <td className="py-3 px-4">{order.date}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-sm ${
                              order.status === 'Pending' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                              order.status === 'Approved' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                              'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button className="text-blue-600 hover:underline">View</button>
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
                        <span className={`px-2 py-1 rounded text-sm ${
                          vendor.status === 'Preferred' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                          'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        }`}>
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
          </div>
        </div>
      </main>
    </div>
  );
}
