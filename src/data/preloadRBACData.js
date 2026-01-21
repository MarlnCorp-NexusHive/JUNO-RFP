// preloadRBACData.js
// Preloaded data for RBAC demo system

export const preloadTeams = [
  { name: 'Marketing Team', roles: ['Head', 'Manager', 'CityHead', 'FieldExecutive'] },
  { name: 'Admission Team', roles: ['Head', 'SPOC'] },
  { name: 'HR & Payroll Team', roles: ['CFO/Head', 'Manager', 'HRs'] },
  { name: 'Admin Team', roles: ['Head', 'Manager', 'Executive'] },
  { name: 'IT & Support Team', roles: ['Head', 'Manager', 'Executive'] },
  { name: 'Director and Deans', roles: ['Director', 'Dean'] },
  { name: 'HoD (Head of Department)', roles: ['HoD'] },
  { name: 'Teacher / Professor', roles: ['Senior Professor', 'Professor', 'External'] },
  { name: 'Students', roles: ['Students'] },
  { name: 'Parents', roles: ['Parents'] },
  { name: 'Exam Team', roles: ['Head', 'Executive'] },
  { name: 'Library Team', roles: ['Head', 'Executive'] },
  { name: 'Transport Team', roles: ['Head', 'Driver', 'Helper'] },
];

export const preloadRoleTemplates = [
  // Example: { id, team, role, version, name, scopes, createdAt, clonedFrom }
  { id: 1, team: 'Marketing Team', role: 'Manager', version: 1, name: 'Marketing Manager v1', scopes: ['read:leads', 'edit:campaigns'], createdAt: Date.now(), clonedFrom: null },
  { id: 2, team: 'Admission Team', role: 'SPOC', version: 1, name: 'Admission SPOC v1', scopes: ['read:students', 'manage:admissions'], createdAt: Date.now(), clonedFrom: null },
  // Add more as needed for demo
]; 