/**
 * Align residual Saudi geo/phone demo data with United States.
 * Usage: node scripts/replace-saudi-geo-to-us.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXT = new Set([".js", ".jsx", ".ts", ".tsx", ".json"]);
const SKIP = new Set(["node_modules", "dist", ".git"]);

const REPLACEMENTS = [
  // Cities / regions (word-boundary-ish via string replace of common demo forms)
  ["Riyadh, United States", "Washington, D.C., United States"],
  ["الرياض، الولايات المتحدة", "واشنطن العاصمة، الولايات المتحدة"],
  ["in the heart of Riyadh", "in the heart of Washington, D.C."],
  ["في قلب الرياض", "في قلب واشنطن العاصمة"],
  ["the United States' Vision 2030 initiative", "America's economic growth initiatives"],
  ["رؤية الولايات المتحدة 2030", "مبادرات النمو الاقتصادي الأمريكية"],
  ["the Kingdom's economic transformation", "U.S. economic growth"],
  ["the Kingdom's ambitious economic goals", "America's ambitious economic goals"],
  ["التحول الاقتصادي للمملكة", "النمو الاقتصادي الأمريكي"],
  ["الأهداف الاقتصادية الطموحة للمملكة", "الأهداف الاقتصادية الطموحة لأمريكا"],
  ["Vision 2030 Initiative", "National Growth Initiative"],
  ["+966 11 520 0000", "+1 (202) 555-0100"],
  ["+966 50 ", "+1 (202) 555-"],
  ["+96650", "+1202555"],
  ['group: "18-24, Riyadh"', 'group: "18-24, Washington DC"'],
  ['group: "25-34, Jeddah"', 'group: "25-34, New York"'],
  ['group: "35-44, Dammam"', 'group: "35-44, Chicago"'],
  ["Dammam mobile users", "Chicago mobile users"],
  ["مستخدمي الدمام", "مستخدمي شيكاغو"],
  ["in Riyadh.", "in Washington DC."],
  ["في الرياض.", "في واشنطن."],
  ['region: \'Riyadh\'', "region: 'Washington DC'"],
  ['region: \'Jeddah\'', "region: 'New York'"],
  ['region: \'Dammam\'', "region: 'Chicago'"],
  ['geo: "Riyadh"', 'geo: "Washington DC"'],
  ['geo: "Jeddah"', 'geo: "New York"'],
  ['geo: "Dammam"', 'geo: "Chicago"'],
  ["state: 'Riyadh', city: 'Riyadh'", "state: 'Virginia', city: 'Arlington'"],
  ['location: \'Riyadh\'', "location: 'Washington DC'"],
  ['location: \'Jeddah\'', "location: 'New York'"],
  ['location: \'Dammam\'', "location: 'Chicago'"],
  ['location: "Riyadh"', 'location: "Washington DC"'],
  ['location: "Jeddah"', 'location: "New York"'],
  ['location: "Dammam"', 'location: "Chicago"'],
  ["leads from Riyadh", "leads from Washington DC"],
  ["inquiries from Jeddah", "inquiries from New York"],
  ["من الرياض", "من واشنطن"],
  ["من جدة", "من نيويورك"],
  ["Show me leads from Riyadh", "Show me leads from Washington DC"],
  ["Recent inquiries from Jeddah", "Recent inquiries from New York"],
  ["أظهر لي العملاء المحتملين من الرياض", "أظهر لي العملاء المحتملين من واشنطن"],
  ["الاستفسارات الحديثة من جدة", "الاستفسارات الحديثة من نيويورك"],
  ["Here are your leads from Riyadh", "Here are your leads from Washington DC"],
  ["Here are recent inquiries from Jeddah", "Here are recent inquiries from New York"],
  ["إليك عملاءك المحتملين من الرياض", "إليك عملاءك المحتملين من واشنطن"],
  ["إليك الاستفسارات الحديثة من جدة", "إليك الاستفسارات الحديثة من نيويورك"],
];

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (EXT.has(path.extname(name))) acc.push(full);
  }
  return acc;
}

let filesTouched = 0;
let total = 0;
for (const file of walk(path.join(ROOT, "src"))) {
  let raw = fs.readFileSync(file, "utf8");
  let out = raw;
  let changes = 0;
  for (const [from, to] of REPLACEMENTS) {
    if (!out.includes(from)) continue;
    const n = out.split(from).length - 1;
    out = out.split(from).join(to);
    changes += n;
  }
  if (out !== raw) {
    fs.writeFileSync(file, out, "utf8");
    filesTouched += 1;
    total += changes;
    console.log(`${changes}\t${path.relative(ROOT, file)}`);
  }
}
console.log(`\nDone. ${filesTouched} files, ~${total} replacements.`);
