/**
 * Second-pass restore of admission identifiers mangled by broad replace.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
const EXT = new Set([".js", ".jsx", ".ts", ".tsx", ".json"]);

const FIXES = [
  ["recruitmentHeadFeatures", "admissionHeadFeatures"],
  ["recruitmentHead.", "admissionHead."],
  ["roles.recruitmentHead", "roles.admissionHead"],
  ["'recruitment-head'", "'admission-head'"],
  ['"recruitment-head"', '"admission-head"'],
  ["`recruitment-head`", "`admission-head`"],
  ["/rbac/recruitment-spoc", "/rbac/admission-spoc"],
  ["/rbac/recruitment-head", "/rbac/admission-head"],
  ["recruitment-head-dashboard", "admission-head-dashboard"],
  [".recruitment-header", ".admission-header"],
  ["'dashboard', 'recruitment', 'marketing'", "'dashboard', 'admission', 'marketing'"],
  // Keep intentional display "Recruitment" where it was already a good label —
  // only fix known broken identifier patterns above.
];

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "dist") continue;
      walk(full, acc);
    } else if (EXT.has(path.extname(name))) acc.push(full);
  }
  return acc;
}

let n = 0;
for (const file of walk(ROOT)) {
  let raw = fs.readFileSync(file, "utf8");
  let out = raw;
  for (const [from, to] of FIXES) {
    if (out.includes(from)) out = out.split(from).join(to);
  }
  if (out !== raw) {
    fs.writeFileSync(file, out, "utf8");
    n += 1;
    console.log(path.relative(ROOT, file));
  }
}
console.log(`\nFixed ${n} files.`);
