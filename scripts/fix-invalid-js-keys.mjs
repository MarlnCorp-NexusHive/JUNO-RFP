/**
 * Fix invalid JS object keys created by phrase remaps (spaces in identifiers).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
const EXT = new Set([".js", ".jsx", ".ts", ".tsx"]);

const FIXES = [
  // Invalid property keys → camelCase
  ["contract revenueGrowth", "contractRevenueGrowth"],
  ["contract revenue:", "contractRevenue:"],
  ["contract revenue,", "contractRevenue,"],
  ["contract revenue }", "contractRevenue }"],
  ['"contract revenue"', '"contractRevenue"'],
  ["'contract revenue'", "'contractRevenue'"],
  ["qualified leadsConfirmed", "enrollmentsConfirmed"],
  ["qualified leads:", "qualifiedLeads:"],
  ["qualified leads,", "qualifiedLeads,"],
  ["qualified leads}", "qualifiedLeads}"],
  [".qualified leads", ".qualifiedLeads"],
  ['"qualified leads"', '"qualifiedLeads"'],
  ["'qualified leads'", "'qualifiedLeads'"],
  ["metrics.qualified leads", "metrics.qualifiedLeads"],
  ["status.qualified leads", "status.enrollments"],
  ["Cost per Bid:", "costPerBid:"],
  ["past performance:", "pastPerformance:"],
  // dataKey / access patterns
  ['dataKey="contract revenue"', 'dataKey="contractRevenue"'],
  ["dataKey='contract revenue'", "dataKey='contractRevenue'"],
  ['dataKey="qualified leads"', 'dataKey="qualifiedLeads"'],
  ["dataKey='qualified leads'", "dataKey='qualifiedLeads'"],
  // doubled words from remap
  ["contract revenue revenue", "contract revenue"],
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
