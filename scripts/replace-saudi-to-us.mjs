/**
 * Replace Saudi Arabia → United States across demo copy (EN + AR).
 * Usage: node scripts/replace-saudi-to-us.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXT = new Set([".js", ".jsx", ".ts", ".tsx", ".json", ".md", ".html"]);
const SKIP_DIRS = new Set(["node_modules", "dist", ".git", "package-lock.json"]);

const REPLACEMENTS = [
  // Longer phrases first
  ["Kingdom of Saudi Arabia", "United States"],
  ["Saudi Arabia's", "the United States'"],
  ["Saudi Arabia and Middle East", "United States"],
  ["Saudi Arabian", "American"],
  ["Saudi Arabia", "United States"],
  ["Lead Saudi Arabia", "Lead United States"], // safety if any remain
  // Nationality shorthand in sample data
  ["nationality: 'Saudi'", "nationality: 'American'"],
  ['nationality: "Saudi"', 'nationality: "American"'],
  // Arabic
  ["المملكة العربية السعودية", "الولايات المتحدة"],
  ["من السعودية", "من الولايات المتحدة"],
  ["إلى السعودية", "إلى الولايات المتحدة"],
  ["العميل المحتمل السعودية", "العميل المحتمل من الولايات المتحدة"],
  ["القيم السعودية", "القيم الأمريكية"],
  ["السعودية:", "الولايات المتحدة:"],
  ['"Saudi Arabia": "السعودية"', '"United States": "الولايات المتحدة"'],
  ['pmText("Saudi Arabia", "السعودية")', 'pmText("United States", "الولايات المتحدة")'],
  ["السعودية", "الولايات المتحدة"], // remaining short form
];

function shouldSkip(rel) {
  const parts = rel.split(path.sep);
  if (parts.some((p) => SKIP_DIRS.has(p))) return true;
  if (rel.endsWith("package-lock.json")) return true;
  return false;
}

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(ROOT, full);
    if (shouldSkip(rel)) continue;
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (EXT.has(path.extname(name))) acc.push(full);
  }
  return acc;
}

let filesTouched = 0;
let total = 0;

for (const file of walk(ROOT)) {
  let raw = fs.readFileSync(file, "utf8");
  if (!/Saudi|السعود|المملكة العربية/.test(raw)) continue;
  let out = raw;
  let changes = 0;
  for (const [from, to] of REPLACEMENTS) {
    if (!out.includes(from)) continue;
    const parts = out.split(from);
    const n = parts.length - 1;
    if (n > 0) {
      out = parts.join(to);
      changes += n;
    }
  }
  if (out !== raw) {
    fs.writeFileSync(file, out, "utf8");
    filesTouched += 1;
    total += changes;
    console.log(`${changes}\t${path.relative(ROOT, file)}`);
  }
}

console.log(`\nDone. ${filesTouched} files, ~${total} replacements.`);
