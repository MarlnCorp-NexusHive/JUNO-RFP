/**
 * Undo accidental admission → recruitment path/namespace remaps.
 * Usage: node scripts/fix-admission-paths.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
const EXT = new Set([".js", ".jsx", ".ts", ".tsx", ".json"]);

const FIXES = [
  ["recruitment-head", "admission-head"],
  ["ai-enhanced/recruitment-head", "ai-enhanced/admission-head"],
  ["useTranslation('recruitment'", "useTranslation('admission'"],
  ['useTranslation("recruitment"', 'useTranslation("admission"'],
  ["useTranslation(['recruitment'", "useTranslation(['admission'"],
  ['useTranslation(["recruitment"', 'useTranslation(["admission"'],
  ["namespaces: ['recruitment'", "namespaces: ['admission'"],
  ["recruitmentCycle", "admissionCycle"],
  ["recruitmentCycles", "admissionCycles"],
  ["recruitmentFunnel", "admissionFunnel"],
  ["recruitmentFee", "admissionFee"],
  ["locales/ar/recruitment", "locales/ar/admission"],
  ["locales/en/recruitment", "locales/en/admission"],
  ["/rbac/recruitment-head", "/rbac/admission-head"],
  ["'recruitment', 'common'", "'admission', 'common'"],
  ['"recruitment", "common"', '"admission", "common"'],
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
