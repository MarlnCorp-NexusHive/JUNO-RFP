import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  registerTrialSignup,
  confirmTrialEmail,
  reissueEmailConfirmation,
  findUserByEmail,
  verifyPassword,
} from "../trial/tenantStore.js";
import { buildTrialConfirmUrl } from "../trial/emailService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "..", "data", "trial-tenants.json");
const results = [];

function assert(name, cond, detail = "") {
  results.push({ name, ok: !!cond, detail });
  console.log(`${cond ? "PASS" : "FAIL"} - ${name}${detail ? ` | ${detail}` : ""}`);
}

function readDb() {
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function writeDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

const stamp = Date.now();
const email = `smoke72h_${stamp}@marlncorp.ai`;
const password = "SmokeTest72h!";

const s1 = registerTrialSignup({
  contactName: "Smoke Tester",
  email,
  password,
  companyName: `Smoke Co ${stamp}`,
});
const h1 = (Date.parse(s1.confirmExpiresAt) - Date.now()) / 3600000;
assert("signup confirmExpiresAt ~72h", h1 > 71.5 && h1 < 72.5, `${h1.toFixed(3)}h`);
assert("signup token present", typeof s1.confirmToken === "string" && s1.confirmToken.length > 20);

const c1 = confirmTrialEmail(s1.confirmToken);
assert("confirm succeeds", Boolean(c1?.user), `verified=${c1?.user?.emailVerified}`);

const reuse = confirmTrialEmail(s1.confirmToken);
assert(
  "reuse is idempotent alreadyConfirmed",
  reuse?.alreadyConfirmed === true,
  `alreadyConfirmed=${reuse?.alreadyConfirmed}`,
);

const user = findUserByEmail(email);
assert("user verified after confirm", Boolean(user?.emailVerified), `verified=${user?.emailVerified}`);
assert(
  "password verifies",
  verifyPassword(password, user.passwordSalt, user.passwordHash) === true,
);

const email2 = `smoke72h_exp_${stamp}@marlncorp.ai`;
const s2 = registerTrialSignup({
  contactName: "Expire Tester",
  email: email2,
  password,
  companyName: `Expire Co ${stamp}`,
});
const db = readDb();
const rec = (db.emailTokens || []).find((t) => t.token === s2.confirmToken);
assert("token in db", Boolean(rec));
if (rec) {
  rec.expiresAt = new Date(Date.now() - 1000).toISOString();
  writeDb(db);
}
let expCode = null;
try {
  confirmTrialEmail(s2.confirmToken);
} catch (e) {
  expCode = e.code;
}
assert("expired token => token_expired", expCode === "token_expired", String(expCode));

const r = reissueEmailConfirmation({ email: email2, password });
const h2 = (Date.parse(r.confirmExpiresAt) - Date.now()) / 3600000;
assert("resend confirmExpiresAt ~72h", h2 > 71.5 && h2 < 72.5, `${h2.toFixed(3)}h`);
const c2 = confirmTrialEmail(r.confirmToken);
assert("confirm after resend", Boolean(c2?.user), `verified=${c2?.user?.emailVerified}`);

const storeSrc = fs.readFileSync(path.resolve(__dirname, "..", "trial", "tenantStore.js"), "utf8");
const emailSrc = fs.readFileSync(path.resolve(__dirname, "..", "trial", "emailService.js"), "utf8");
assert("CONFIRM_TOKEN_TTL_MS is 72h", /CONFIRM_TOKEN_TTL_MS = 72 \* 60 \* 60 \* 1000/.test(storeSrc));
assert("email template says 72 hours", emailSrc.includes("expires in 72 hours"));
assert("email template no longer says 24 hours", !emailSrc.includes("expires in 24 hours"));
assert("buildTrialConfirmUrl works", buildTrialConfirmUrl("abc").includes("trialConfirm=abc"));

const failed = results.filter((x) => !x.ok);
console.log(`\nSummary: ${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log(failed);
  process.exit(1);
}
