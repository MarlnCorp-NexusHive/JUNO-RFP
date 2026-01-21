import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const SeatMonitoring = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedCycle, setSelectedCycle] = useState('2026-2026');

  // Mock data for courses
  const courses = [
    {
      id: 1,
      name: 'B.Tech in AI & ML',
      code: 'BTECH-AIML',
      department: 'Computer Science',
      totalSeats: 120,
      confirmedAdmissions: 94,
      pendingApplications: 18,
      openSeats: 8,
      admissionCycle: '2026-2026',
    },
    {
      id: 2,
      name: 'MBA in HR',
      code: 'MBA-HR',
      department: 'Human Resources',
      totalSeats: 60,
      confirmedAdmissions: 45,
      pendingApplications: 10,
      openSeats: 5,
      admissionCycle: '2026-2026',
    },
    {
      id: 3,
      name: 'BSc Aviation',
      code: 'BSC-AVI',
      department: 'Aviation',
      totalSeats: 40,
      confirmedAdmissions: 35,
      pendingApplications: 3,
      openSeats: 2,
      admissionCycle: '2026-2026',
    },
  ];

  // Mock data for departments
  const departments = [
    'All Departments',
    'Computer Science',
    'Human Resources',
    'Aviation',
    'Mechanical',
    'Electrical',
  ];

  // Mock data for admission cycles
  const admissionCycles = [
    '2026-2026',
    '2026-2026',
    '2026-2027',
  ];

  const filteredCourses = courses.filter(course => 
    (selectedDepartment === 'all' || course.department === selectedDepartment) &&
    course.admissionCycle === selectedCycle
  );

  // Prepare data for the bar chart
  const barChartData = {
    labels: filteredCourses.map(course => course.name),
    datasets: [
      {
        label: 'Confirmed Admissions',
        data: filteredCourses.map(course => course.confirmedAdmissions),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
      {
        label: 'Pending Applications',
        data: filteredCourses.map(course => course.pendingApplications),
        backgroundColor: 'rgba(234, 179, 8, 0.5)',
        borderColor: 'rgb(234, 179, 8)',
        borderWidth: 1,
      },
      {
        label: 'Open Seats',
        data: filteredCourses.map(course => course.openSeats),
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Course-wise Seat Distribution',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Seats',
        },
      },
    },
  };

  // Calculate total statistics
  const totalStats = filteredCourses.reduce(
    (acc, course) => ({
      totalSeats: acc.totalSeats + course.totalSeats,
      confirmedAdmissions: acc.confirmedAdmissions + course.confirmedAdmissions,
      pendingApplications: acc.pendingApplications + course.pendingApplications,
      openSeats: acc.openSeats + course.openSeats,
    }),
    { totalSeats: 0, confirmedAdmissions: 0, pendingApplications: 0, openSeats: 0 }
  );

  // Prepare data for the pie chart
  const pieChartData = {
    labels: ['Confirmed', 'Pending', 'Open'],
    datasets: [
      {
        data: [
          totalStats.confirmedAdmissions,
          totalStats.pendingApplications,
          totalStats.openSeats,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.5)',
          'rgba(234, 179, 8, 0.5)',
          'rgba(239, 68, 68, 0.5)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(234, 179, 8)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {departments.map(dept => (
                <option key={dept} value={dept === 'All Departments' ? 'all' : dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Admission Cycle</label>
            <select
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {admissionCycles.map(cycle => (
                <option key={cycle} value={cycle}>{cycle}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Seats</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{totalStats.totalSeats}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Confirmed Admissions</h3>
          <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">{totalStats.confirmedAdmissions}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pending Applications</h3>
          <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400">{totalStats.pendingApplications}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Open Seats</h3>
          <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">{totalStats.openSeats}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <Bar data={barChartData} options={barChartOptions} />
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <Pie data={pieChartData} />
        </div>
      </div>

      {/* Course-wise Details */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Seats</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Confirmed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pending</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Open</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fill Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCourses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{course.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{course.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {course.totalSeats}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {course.confirmedAdmissions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {course.pendingApplications}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {course.openSeats}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {((course.confirmedAdmissions / course.totalSeats) * 100).toFixed(1)}%
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 mt-1">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${(course.confirmedAdmissions / course.totalSeats) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SeatMonitoring; 