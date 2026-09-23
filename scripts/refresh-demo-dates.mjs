/**
 * Refresh hardcoded demo/sample dates for a mid/late-Sep 2026 demo.
 * Skips historical financial period series and node_modules.
 *
 * Usage: node scripts/refresh-demo-dates.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "src");

const SKIP_FILES = new Set([
  // Historical issuer financial periods — keep as-is
  path.normalize("features/proposal-manager/data/companyIntelligenceSamplesData.json"),
  path.normalize("features/proposal-manager/data/competitiveIntelligenceSamples.js"),
  path.normalize("services/companyIntelligenceService.test.js"),
]);

const EXT = new Set([".js", ".jsx", ".ts", ".tsx", ".json"]);

function shouldSkip(rel) {
  const n = path.normalize(rel);
  if (SKIP_FILES.has(n)) return true;
  if (n.includes(`${path.sep}node_modules${path.sep}`)) return true;
  if (/\.test\.(js|jsx|ts|tsx)$/.test(n)) return true;
  return false;
}

/** Map calendar YYYY-MM-DD (and datetime prefixes) into demo-fresh windows. */
function remapYmd(y, m, d) {
  const yi = Number(y);
  const mi = Number(m);
  const di = Number(d);
  if (!Number.isFinite(yi) || !Number.isFinite(mi) || !Number.isFinite(di)) return null;

  let ny = yi;
  let nm = mi;
  let nd = di;

  if (yi <= 2025) {
    ny = 2026;
    // Spread older samples into Sep–Oct 2026
    nm = mi <= 6 ? 9 : 10;
  } else if (yi === 2026 && mi <= 8) {
    // Jan–Aug 2026 → Sep/Oct 2026
    if (mi <= 4) nm = 9;
    else if (mi <= 6) nm = 10;
    else nm = 9; // Jul–Aug → Sep
  }
  // Sep–Dec 2026 already fine

  // Clamp day for shorter months
  const dim = new Date(ny, nm, 0).getDate();
  nd = Math.min(nd, dim);
  return `${ny}-${String(nm).padStart(2, "0")}-${String(nd).padStart(2, "0")}`;
}

function transform(content, rel) {
  let out = content;
  let changes = 0;

  // ISO dates: 2024-09-15 or 2025-02-10T...
  // Trailing (?!\d) — NOT \b — because "T" in ISO datetimes is a word char and breaks \b.
  out = out.replace(/\b(20(?:2[0-5]|26))-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(?!\d)/g, (full, y, m, d) => {
    // Keep pure historical chart years already handled; for 2020-2023 full dates rare — still remap
    if (Number(y) >= 2020 && Number(y) <= 2023 && rel.includes("companyIntelligence")) return full;
    const next = remapYmd(y, m, d);
    if (!next || next === full) return full;
    changes += 1;
    return next;
  });

  // NOTE: Do NOT rematch YYYY-MM alone — it corrupts IDs like WW-2026-01 / #2025-084.

  return { out, changes };
}

function walk(dir, base = ROOT, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(base, full);
    if (shouldSkip(rel)) continue;
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, base, acc);
    else if (EXT.has(path.extname(name))) acc.push(full);
  }
  return acc;
}

const files = walk(ROOT);
let filesTouched = 0;
let totalChanges = 0;

for (const file of files) {
  const rel = path.relative(ROOT, file);
  const raw = fs.readFileSync(file, "utf8");
  const { out, changes } = transform(raw, rel);
  if (changes > 0 && out !== raw) {
    fs.writeFileSync(file, out, "utf8");
    filesTouched += 1;
    totalChanges += changes;
    console.log(`${changes}\t${rel}`);
  }
}

console.log(`\nDone. ${filesTouched} files, ${totalChanges} date replacements.`);
