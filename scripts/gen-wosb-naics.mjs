import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(
  "C:/Users/mahar/.cursor/projects/e-Marln-Corp-Projects-JUNO-RFP/agent-tools/6ebe320e-60c3-431e-ae1b-f931d422eebf.txt"
);
const dest = path.join(
  __dirname,
  "../src/features/proposal-manager/data/wosbEligibleNaics.js"
);

const text = fs.readFileSync(src, "utf8");
const rows = [];
for (const line of text.split(/\r?\n/)) {
  const m = line.match(/^\|\s*(\d{6})\s*\|\s*(.+?)\s*\|\s*(EDWOSB|WOSB)\s*\|$/);
  if (m) rows.push({ code: m[1], title: m[2].trim(), setAside: m[3] });
}

if (rows.length < 500) {
  console.error("Expected 700+ rows, got", rows.length);
  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
const body = JSON.stringify(rows, null, 2);
const out = `/** SBA Eligible NAICS for WOSB / EDWOSB Federal Contracting Program (static snapshot). */
export const WOSB_NAICS_SOURCE_URL =
  "https://www.sba.gov/document/support-eligible-naics-women-owned-small-business-federal-contracting-program";
export const WOSB_NAICS_EFFECTIVE_DATE = "2022-10-01";

/** @type {{ code: string, title: string, setAside: "WOSB" | "EDWOSB" }[]} */
export const WOSB_ELIGIBLE_NAICS = ${body};
`;
fs.writeFileSync(dest, out);
console.log("Wrote", rows.length, "rows to", dest);
console.log(
  "WOSB",
  rows.filter((r) => r.setAside === "WOSB").length,
  "EDWOSB",
  rows.filter((r) => r.setAside === "EDWOSB").length
);
