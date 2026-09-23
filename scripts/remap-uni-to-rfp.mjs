/**
 * Remap leftover Saudi / university / MBA demo copy → RFP terms.
 * Skips financial sample JSON and avoids mangling import/component paths.
 *
 * Usage: node scripts/remap-uni-to-rfp.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
const EXT = new Set([".js", ".jsx", ".ts", ".tsx", ".json"]);
const SKIP_FILES = new Set([
  "companyIntelligenceSamplesData.json",
  "competitiveIntelligenceSamples.js",
  "companyIntelligenceService.test.js",
]);
const SKIP_DIRS = new Set(["node_modules", "dist", "Features Doc"]);

/** Longer phrases first */
const REPLACEMENTS = [
  // --- Saudi / geo / regulators ---
  ["Kingdom of Saudi Arabia", "United States"],
  ["Saudi Arabia", "United States"],
  ["Saudi Arabian", "American"],
  ["Vision 2030 Initiative", "National Growth Initiative"],
  ["Vision 2030", "National Growth"],
  ["مبادرة رؤية 2030", "مبادرة النمو الوطني"],
  ["رؤية 2030", "النمو الوطني"],
  ["NCAAA Prep", "CMMC Prep"],
  ["NCAAA Report Due", "FAR/CMMC Review Due"],
  ["NCAAA due", "GSA Schedule renewal due"],
  ["NCAAA", "CMMC"],
  ["ETEC Annual Report Submission", "CMMC Evidence Package"],
  ["ETEC", "FAR"],
  ["SCFHS annual renewal", "CMMC Level 2 renewal"],
  ["SCFHS", "NIST"],
  ["MoE", "GSA"],
  ["Guidelines for FAR, DFARS, CMMC, and NIST", "Guidelines for FAR, DFARS, CMMC, and NIST"],
  ["Guidelines for NCAAA, ETEC, MoE, and SCFHS", "Guidelines for FAR, DFARS, CMMC, and NIST"],

  // --- MBA / degrees ---
  ["MBA Campaign", "Weekly RFP Pipelines"],
  ["MBA campaign", "Weekly RFP pipeline"],
  ["MBA_Brochure_v2.pdf", "RFP_Overview_v2.pdf"],
  ["MBA Brochure.pdf", "RFP_Overview.pdf"],
  ["Interested in MBA program", "Interested in RFP support"],
  ["Interested in MBA", "Interested in RFP"],
  ["MBA Email Blast", "RFP Email Blast"],
  ["MBA FinTech", "RFP FinTech"],
  ["MBA Finance", "RFP Finance"],
  ["MBA in HR", "RFP — HR Services"],
  ["MBA-HR", "RFP-HR"],
  ["MBA201", "RFP201"],
  ["B.Tech Computer Science", "Cloud Migration RFP"],
  ["B.Tech in AI & ML", "IT Modernization BPA"],
  ["B.Tech Mechanical", "Facilities Maintenance RFP"],
  ["B.Tech Civil", "Civil Engineering A&E"],
  ["B.Tech CS", "Cloud Migration RFP"],
  ["B.Tech", "IT Services BPA"],
  ["BSc Aviation", "Aviation Logistics IDIQ"],
  ["BSc AI", "Federal AI RFP"],
  ["BSc EEE", "Energy Grid RFP"],
  ["BSc CS", "IT Services RFP"],
  ["New BSc AI Program", "New AI Capture Pursuit"],
  ["M.Sc Data Science", "Data Analytics Task Order"],
  ["M.Tech", "Technical Services TO"],
  ["Computer Science Program at Our University", "GSA IT Schedule Opportunity"],
  ["Computer Science", "Federal IT"],
  ["Business Admin", "Professional Services"],
  ["Medical Sciences", "Healthcare IT"],
  ["Engineering program", "Engineering RFP"],
  ["Engineering Program", "Engineering RFP"],

  // --- Campus / university events ---
  ["Open Day Reminder", "Industry Day Reminder"],
  ['"Open Day"', '"Industry Day"'],
  ["Open Day", "Industry Day"],
  ["Open House", "Industry Day"],
  ["Campus Event", "Industry Day"],
  ["campus event", "industry day"],
  ["campus visit", "site visit"],
  ["Campus Visit", "Site Visit"],
  ["campus tour", "capability briefing"],
  ["Campus Tour", "Capability Briefing"],
  ["virtual campus tour", "virtual industry day"],
  ["Main Campus", "HQ"],
  ["campus life", "past performance"],
  ["Campus expansion", "Capture capacity expansion"],
  ["Campus Event", "Industry Day"],

  // --- University / student / faculty ---
  ["Empowering Universities", "Empowering Capture Teams"],
  ["university operations", "RFP and proposal operations"],
  ["your university's nerve center", "your capture command center"],
  ["your university", "your capture organization"],
  ["University Name", "Company Name"],
  ["University of Technology", "MARLN Corporation"],
  ["University Data", "Capture Portfolio Data"],
  ["university admissions", "proposal compliance"],
  ["university performance", "capture portfolio performance"],
  ["a university", "an RFP organization"],
  ["University focus", "Market focus"],
  ["Higher education marketing", "Federal capture marketing"],
  ["Student Management", "Opportunity Pipeline"],
  ["Student Enrollment", "Pipeline Opportunities"],
  ["student enrollment", "pipeline opportunities"],
  ["Student Name", "Candidate Name"],
  ["Student Satisfaction", "Client Satisfaction"],
  ["Student Outcomes", "Win Outcomes"],
  ["Student Demographics", "Lead Demographics"],
  ["Student Evaluation", "Proposal Review"],
  ["Student Access", "Contributor Access"],
  ["Student Services", "Client Services"],
  ["Student Registration", "Opportunity Intake"],
  ["Student ID", "Opportunity ID"],
  ["Cost per Student", "Cost per Bid"],
  ["perStudent", "perBid"],
  ["Faculty Hiring Plan", "Capture Team Hiring Plan"],
  ["Faculty Hiring", "Capture Hiring"],
  ["Faculty Access", "Capture Team Access"],
  ["Faculty Management", "Team Management"],
  ["Faculty Performance", "Team Performance"],
  ["Faculty Collaboration", "Proposal Collaboration"],
  ["Faculty & HR", "Team & HR"],
  ["New faculty position", "New capture hire"],
  ["Student-Faculty Ratio", "Capture-to-Writer Ratio"],
  ["Publications/Faculty", "Proposals/Team"],
  ["Academic Year", "Fiscal Year"],
  ["academic year", "fiscal year"],
  ["Current academic year", "Current fiscal year"],
  ["Academic Records", "Past Performance Docs"],
  ["Academic Metrics", "Pipeline Metrics"],
  ["Academic Performance", "Proposal Quality"],
  ["Academic Processes", "Proposal Processes"],
  ["next semester", "next quarter"],
  ["Semester Start Date", "Fiscal Period Start"],
  ["Semester End Date", "Fiscal Period End"],
  ["Semester", "Fiscal Period"],
  ["Graduation Rate", "Win Rate"],
  ["Graduation Ceremony", "Award Ceremony"],
  ["All Colleges", "All Divisions"],
  ["All Admission Cycles", "All Capture Cycles"],
  ["Admission Cycles", "Capture Cycles"],
  ["admission cycle", "capture cycle"],
  ["Admission Forms Printing", "Proposal Binders Printing"],
  ["Admissions Team", "Capture Team"],

  // --- Counselor / scholarship ---
  ["Senior Counselor", "Senior Capture Lead"],
  ["Assigned Counselor", "Assigned Capture Lead"],
  ["All Counselors", "All Capture Leads"],
  ["Notify affected counselors", "Notify affected owners"],
  ["Counselor Performance", "Capture Owner Performance"],
  ["counselors need follow-up", "owners need follow-up"],
  ["inactive by counselor", "inactive by capture lead"],
  ["marked inactive by counselor", "marked inactive by capture lead"],
  ["Approved for scholarship", "Approved for bid team"],
  ["Scholarship Info", "Capability Brief"],
  ["Scholarship Interview", "Oral Presentation Prep"],
  ["Scholarship Courses", "Bonus Positions"],
  ["Scholarship", "Incentive"],
  ["scholarship opportunities", "past performance highlights"],
  ["Highlight scholarship opportunities", "Highlight past performance"],
  ["Parents of prospective students", "Agency program offices"],
  ["current students", "current clients"],
  ["prospective students", "qualified prospects"],
  ["enrollments", "qualified leads"],
  ["Enrollment Trends", "Pipeline Trends"],
  ["Enrollment Forecasting", "Pipeline Forecasting"],
  ["Enrollment growth", "Pipeline growth"],
  ["Enrollment", "Pipeline"],
  ["tuition", "contract revenue"],
  ["Tuition", "Contract Revenue"],
  ["@university.edu", "@marln.com"],
  ["support@univ.edu", "support@marln.com"],

  // Arabic common university terms (display)
  ["الجامعة", "المؤسسة"],
  ["طالب", "مرشح"],
  ["الطلاب", "المرشحون"],
  ["أعضاء هيئة التدريس", "فريق العروض"],
  ["الرسوم الدراسية", "إيرادات العقود"],
  ["المنح", "الحوافز"],
  ["الحرم الجامعي", "المقر"],
  ["حملة الماجستير في إدارة الأعمال", "خطوط أنابيب طلبات العروض الأسبوعية"],
  ["ماجستير إدارة الأعمال", "طلبات العروض"],
];

// Property/key renames that break code — exclude from blind replace of studentName
const UNSAFE = new Set(["studentName"]);

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name) || SKIP_FILES.has(name)) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (EXT.has(path.extname(name))) acc.push(full);
  }
  return acc;
}

function safeReplace(content) {
  let out = content;
  let changes = 0;
  for (const [from, to] of REPLACEMENTS) {
    if (UNSAFE.has(from)) continue;
    if (!out.includes(from)) continue;
    // Don't replace inside import paths for Admission* components when from is too generic
    const n = out.split(from).length - 1;
    out = out.split(from).join(to);
    changes += n;
  }
  // Whole-word MBA left
  out = out.replace(/\bMBA\b/g, () => {
    changes += 1;
    return "RFP";
  });
  return { out, changes };
}

let filesTouched = 0;
let total = 0;
for (const file of walk(ROOT)) {
  const raw = fs.readFileSync(file, "utf8");
  // Skip if nothing interesting
  if (!/Saudi|MBA|NCAAA|ETEC|SCFHS|university|University|campus|Campus|student|Student|faculty|Faculty|tuition|Tuition|semester|Semester|scholarship|Scholarship|counselor|Counselor|Open Day|Open House|B\.Tech|BSc |ماجستير|الجامعة|Vision 2030|enrollment|Enrollment/i.test(raw)) {
    continue;
  }
  const { out, changes } = safeReplace(raw);
  if (out !== raw && changes > 0) {
    fs.writeFileSync(file, out, "utf8");
    filesTouched += 1;
    total += changes;
    console.log(`${changes}\t${path.relative(ROOT, file)}`);
  }
}
console.log(`\nDone. ${filesTouched} files, ~${total} replacements.`);
