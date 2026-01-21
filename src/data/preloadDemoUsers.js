// preloadDemoUsers.js
export function preloadDemoUsers() {
  const key = 'rbac_users';
  const users = [
    // Superadmin
    { id: 1, username: "superadmin", password: "superadmin123", displayName: "Super Admin", team: null, role: "Super Admin", permissions: ["*"], createdAt: Date.now() },
    // Marketing Team
    { id: 2, username: "marketing_head", password: "marketing123", displayName: "Marketing Head", team: "Marketing Team", role: "Head", createdAt: Date.now() },
    { id: 3, username: "marketing_manager", password: "marketing123", displayName: "Marketing Manager", team: "Marketing Team", role: "Manager", createdAt: Date.now() },
    // Admission Team
    { id: 4, username: "admission_head", password: "admission123", displayName: "Admission Head", team: "Admission Team", role: "Head", createdAt: Date.now() },
    { id: 5, username: "admission_spoc", password: "admission123", displayName: "Admission SPOC", team: "Admission Team", role: "SPOC", createdAt: Date.now() },
    // HR & Payroll Team
    { id: 6, username: "hr_head", password: "hr123", displayName: "HR Head", team: "HR & PayRoll Team", role: "CFO/Head", createdAt: Date.now() },
    { id: 7, username: "hr_manager", password: "hr123", displayName: "HR Manager", team: "HR & PayRoll Team", role: "Manager", createdAt: Date.now() },
    // Admin Team
    { id: 8, username: "admin_head", password: "admin123", displayName: "Admin Head", team: "Admin Team", role: "Head", createdAt: Date.now() },
    { id: 9, username: "admin_manager", password: "admin123", displayName: "Admin Manager", team: "Admin Team", role: "Manager", createdAt: Date.now() },
    // IT & Support Team
    { id: 10, username: "it_head", password: "it123", displayName: "IT Head", team: "IT & Support Team", role: "Head", createdAt: Date.now() },
    // Director and Deans
    { id: 11, username: "director", password: "director123", displayName: "Director", team: "Director and Deans", role: "Director", createdAt: Date.now() },
    { id: 12, username: "dean", password: "dean123", displayName: "Dean", team: "Director and Deans", role: "Dean", createdAt: Date.now() },
    // HoD
    { id: 13, username: "hod", password: "hod123", displayName: "HoD", team: "HoD", role: "HoD", createdAt: Date.now() },
    // Teacher/Professor
    { id: 14, username: "senior_professor", password: "prof123", displayName: "Senior Professor", team: "Teacher/Professor", role: "SeniorProfessor", createdAt: Date.now() },
    { id: 15, username: "professor", password: "prof123", displayName: "Professor", team: "Teacher/Professor", role: "Professor", createdAt: Date.now() },
    // Students
    { id: 16, username: "student", password: "student123", displayName: "Student", team: "Students", role: "Students", createdAt: Date.now() },
    // Parents
    { id: 17, username: "parent", password: "parent123", displayName: "Parent", team: "Parents", role: "Parents", createdAt: Date.now() },
    // Exam Team
    { id: 18, username: "exam_head", password: "exam123", displayName: "Exam Head", team: "Exam Team", role: "Head", createdAt: Date.now() },
    // Library Team
    { id: 19, username: "library_head", password: "library123", displayName: "Library Head", team: "Library Team", role: "Head", createdAt: Date.now() },
    // Transport Team
    { id: 20, username: "transport_head", password: "transport123", displayName: "Transport Head", team: "Transport Team", role: "Head", createdAt: Date.now() },
  ];
  localStorage.setItem(key, JSON.stringify(users));
} 