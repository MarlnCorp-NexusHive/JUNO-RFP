#!/usr/bin/env node
/**
 * Provision a trial tenant + one user (logical multi-tenancy on shared Netlify/Render).
 *
 * Usage:
 *   node scripts/create-trial-tenant.mjs --company "Acme Corp" --email jane@acme.com --name "Jane Doe"
 *   node scripts/create-trial-tenant.mjs --company "Acme" --email jane@acme.com --password 'TempPass123!' --days 7
 *
 * Writes to the same trial DB file the API uses (see TRIAL_DATA_PATH / default juno-backend/data/trial-tenants.json).
 */
import crypto from "crypto";
import { createTrialTenant, dataFilePath, DEFAULT_TRIAL_DAYS } from "../trial/tenantStore.js";

function arg(name, fallback = "") {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

function flag(name) {
  return process.argv.includes(`--${name}`);
}

const company = arg("company");
const email = arg("email");
const name = arg("name", "");
const days = Number(arg("days", String(DEFAULT_TRIAL_DAYS))) || DEFAULT_TRIAL_DAYS;
const daily = Number(arg("daily", "80")) || 80;
const monthly = Number(arg("monthly", "800")) || 800;
let password = arg("password", "");

if (flag("help") || !company || !email) {
  console.log(`Create a JUNO trial tenant (1 company, 1 user).

Required:
  --company "Company Name"
  --email person@company.com

Optional:
  --name "Contact Name"
  --password "TempPass123!"   (auto-generated if omitted)
  --days ${DEFAULT_TRIAL_DAYS}
  --daily 80
  --monthly 800

Then send the printed URL + credentials to the trial user.
`);
  process.exit(company && email ? 0 : 1);
}

if (!password) {
  password = `Juno-${crypto.randomBytes(4).toString("hex")}!${crypto.randomInt(10, 99)}`;
}

try {
  const result = createTrialTenant({
    companyName: company,
    email,
    password,
    contactName: name,
    trialDays: days,
    aiDailyLimit: daily,
    aiMonthlyLimit: monthly,
  });

  const appUrl = process.env.JUNO_APP_URL || "https://your-netlify-app.netlify.app";

  console.log("\n✅ Trial tenant created\n");
  console.log(`  Company:     ${result.tenant.name}`);
  console.log(`  Tenant ID:   ${result.tenant.id}`);
  console.log(`  Trial ends:  ${result.tenant.trialEndsAt}`);
  console.log(`  AI limits:   ${result.tenant.aiDailyLimit}/day, ${result.tenant.aiMonthlyLimit}/month`);
  console.log(`  Store file:  ${dataFilePath()}`);
  console.log("\n——— Send to customer ———");
  console.log(`  URL:         ${appUrl}/login`);
  console.log(`  Email:       ${result.user.email}`);
  console.log(`  Password:    ${result.temporaryPassword}`);
  console.log("  (They sign in with these trial credentials; demo accounts stay separate.)\n");
} catch (err) {
  console.error(`\n❌ ${err.message}\n`);
  process.exit(1);
}
