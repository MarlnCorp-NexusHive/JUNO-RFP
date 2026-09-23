/**
 * Replace MBA demo terms with RFP-relevant terms across src.
 * Skips financial sample JSON (false-positive "mba" in words like Embassy/Mumbai).
 *
 * Usage: node scripts/replace-mba-to-rfp.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
const EXT = new Set([".js", ".jsx", ".ts", ".tsx", ".json"]);
const SKIP_FILES = new Set([
  "companyIntelligenceSamplesData.json",
  "competitiveIntelligenceSamples.js",
]);

/** Ordered: longer / more specific first */
const REPLACEMENTS = [
  // Exact phrases
  ["MBA Campaign", "Weekly RFP Pipelines"],
  ["MBA campaign", "Weekly RFP pipeline"],
  ["MBA_Brochure_v2.pdf", "RFP_Overview_v2.pdf"],
  ["MBA Brochure.pdf", "RFP_Overview.pdf"],
  ["MBA Brochure", "RFP Overview"],
  ["Interested in MBA program", "Interested in RFP support"],
  ["discuss the MBA program", "discuss the RFP opportunity"],
  ["Our MBA Program", "Our RFP Services"],
  ["at Our MBA Program", "with Our RFP Services"],
  ["MBA Email Blast", "RFP Email Blast"],
  ["MBA email blast", "RFP email blast"],
  ["MBA FinTech", "RFP FinTech"],
  ["MBA Finance", "RFP Finance"],
  ["MBA in HR", "RFP — HR Services"],
  ["MBA-HR", "RFP-HR"],
  ["MBA201", "RFP201"],
  ["Interested in MBA", "Interested in RFP"],
  ["MBA leads", "RFP leads"],
  ["Clients MBA", "RFP leads"], // safety
  ["program: 'MBA'", "program: 'RFP'"],
  ['program: "MBA"', 'program: "RFP"'],
  ["program: \"MBA\"", 'program: "RFP"'],
  ["program: 'MBA'", "program: 'RFP'"],
  // Locale display values
  ['"mbaCampaign": "MBA Campaign"', '"mbaCampaign": "Weekly RFP Pipelines"'],
  ['"mbaCampaignKickoff": "MBA campaign kickoff meeting at 3pm."', '"mbaCampaignKickoff": "Weekly RFP pipeline kickoff meeting at 3pm."'],
  ['"mbaEmailBlast": "MBA Email Blast"', '"mbaEmailBlast": "RFP Email Blast"'],
  ['"interestedInMbaProgram": "Interested in MBA program"', '"interestedInMbaProgram": "Interested in RFP support"'],
  ['"mbaLeads": "MBA leads showing 45% higher engagement"', '"mbaLeads": "RFP leads showing 45% higher engagement"'],
  ['"mba": "MBA"', '"mba": "RFP"'],
  // Arabic
  ["حملة الماجستير في إدارة الأعمال", "خطوط أنابيب طلبات العروض الأسبوعية"],
  ["حملة ماجستير إدارة الأعمال", "خطوط أنابيب طلبات العروض الأسبوعية"],
  ["اجتماع انطلاق حملة الماجستير في إدارة الأعمال الساعة 3 مساءً.", "اجتماع انطلاق خطوط أنابيب طلبات العروض الأسبوعية الساعة 3 مساءً."],
  ["انفجار بريد الماجستير في إدارة الأعمال", "دفعة بريد طلبات العروض"],
  ["مهتم ببرنامج ماجستير إدارة الأعمال", "مهتم بدعم طلبات العروض"],
  ["لمناقشة برنامج ماجستير إدارة الأعمال", "لمناقشة فرصة طلب العروض"],
  ["دفعة بريدية لبرنامج ماجستير إدارة الأعمال", "دفعة بريدية لطلبات العروض"],
  ["افتح مستقبلك مع برنامج ماجستير إدارة الأعمال", "افتح مستقبلك مع خدمات طلبات العروض"],
  ["عملاء MBA يظهرون تفاعلاً أعلى بنسبة 45%", "عملاء طلبات العروض يظهرون تفاعلاً أعلى بنسبة 45%"],
  ["ماجستير إدارة الأعمال", "طلبات العروض"],
  // Generic remaining whole-word MBA (after phrases handled)
];

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (SKIP_FILES.has(name)) continue;
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "dist") continue;
      walk(full, acc);
    } else if (EXT.has(path.extname(name))) {
      acc.push(full);
    }
  }
  return acc;
}

function replaceWholeWordMba(content) {
  // Only standalone MBA / mba tokens (not inside Mumbai, Embassy, etc.)
  let changes = 0;
  let out = content.replace(/\bMBA\b/g, () => {
    changes += 1;
    return "RFP";
  });
  // Avoid replacing arabic or keys; only lowercase mba as program token in strings
  out = out.replace(/(['"])mba\1/g, (m) => {
    changes += 1;
    return m[0] + "rfp" + m[0];
  });
  return { out, changes };
}

let filesTouched = 0;
let total = 0;

for (const file of walk(ROOT)) {
  let raw = fs.readFileSync(file, "utf8");
  if (!/MBA|mba|ماجستير إدارة الأعمال|حملة الماجستير/.test(raw)) continue;

  let out = raw;
  let changes = 0;

  for (const [from, to] of REPLACEMENTS) {
    if (!out.includes(from)) continue;
    const n = out.split(from).length - 1;
    out = out.split(from).join(to);
    changes += n;
  }

  const word = replaceWholeWordMba(out);
  out = word.out;
  changes += word.changes;

  if (out !== raw) {
    fs.writeFileSync(file, out, "utf8");
    filesTouched += 1;
    total += changes;
    console.log(`${changes}\t${path.relative(ROOT, file)}`);
  }
}

console.log(`\nDone. ${filesTouched} files, ~${total} replacements.`);
