// localStorageService.js
// Service for CRUD operations in localStorage for RBAC demo

const KEYS = {
  TEAMS: 'rbac_teams',
  ROLES: 'rbac_roles',
  TEMPLATES: 'rbac_templates',
  USERS: 'rbac_users',
  ASSIGNMENTS: 'rbac_assignments',
  AUDIT: 'rbac_audit',
};

function getItem(key) {
  return JSON.parse(localStorage.getItem(key) || '[]');
}

function setItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const localStorageService = {
  KEYS,
  getTeams: () => getItem(KEYS.TEAMS),
  setTeams: (teams) => setItem(KEYS.TEAMS, teams),
  getRoles: () => getItem(KEYS.ROLES),
  setRoles: (roles) => setItem(KEYS.ROLES, roles),
  getTemplates: () => getItem(KEYS.TEMPLATES),
  setTemplates: (templates) => setItem(KEYS.TEMPLATES, templates),
  getUsers: () => getItem(KEYS.USERS),
  setUsers: (users) => setItem(KEYS.USERS, users),
  getAssignments: () => getItem(KEYS.ASSIGNMENTS),
  setAssignments: (assignments) => setItem(KEYS.ASSIGNMENTS, assignments),
  getAudit: () => getItem(KEYS.AUDIT),
  setAudit: (audit) => setItem(KEYS.AUDIT, audit),
  clearAll: () => {
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  },
}; 