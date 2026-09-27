import { attachTrialContext, meterTrialAi } from "./authMiddleware.js";
import trialRoutes from "./trialRoutes.js";
import { getTrialDataPath, migrateTrialDurationsOnBoot } from "./tenantStore.js";

/** AI / generative routes that should count against trial quotas when a trial token is present. */
const METERED_PATH_PREFIXES = [
  "/generate-answer",
  "/generate-rfp-document",
  "/ask-with-file",
  "/ask-with-context",
  "/structure-rfp-requirements",
  "/company-intelligence-remote",
  "/competitive-intelligence-enrich",
  "/generate-company-profile",
  "/generate-work-document",
  "/generate-slide-deck",
  "/extract-dates",
  "/extract-structured-data",
  "/technical-solution/",
];

function isMeteredPath(url = "") {
  const path = String(url).split("?")[0];
  return METERED_PATH_PREFIXES.some((p) => path === p || path.startsWith(p));
}

export function registerTrialSystem(app) {
  const dataPath = getTrialDataPath();
  const usingPersistentHint =
    dataPath.includes("/var/data") ||
    Boolean(String(process.env.TRIAL_DATA_PATH || process.env.TRIAL_DATA_DIR || "").trim());
  console.log(`[trial] data file: ${dataPath}${usingPersistentHint ? " (custom/persistent path)" : " (default — ephemeral on Render Free)"}`);
  if (!usingPersistentHint && process.env.RENDER) {
    console.warn(
      "[trial] RENDER detected without TRIAL_DATA_PATH — trial signups will be lost on restart. Attach a Persistent Disk and set TRIAL_DATA_PATH=/var/data/trial-tenants.json",
    );
  }

  try {
    migrateTrialDurationsOnBoot();
  } catch (err) {
    console.warn("[trial] duration migration skipped:", err.message);
  }

  app.use(attachTrialContext);
  app.use("/trial/auth", trialRoutes);

  app.use((req, res, next) => {
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return next();
    if (!isMeteredPath(req.path || req.url)) return next();
    return meterTrialAi(req, res, next);
  });

  console.log(
    "Trial tenancy API: /trial/auth/login, /signup, /confirm, /resend-confirmation, /me, /logout, /change-password",
  );
}
