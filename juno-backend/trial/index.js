import fs from "fs";
import path from "path";
import { attachTrialContext, meterTrialAi } from "./authMiddleware.js";
import trialRoutes from "./trialRoutes.js";
import featureRoutes from "./featureRoutes.js";
import { getFeaturesStoragePath } from "./featureStore.js";
import { getTrialDataPath, loadTrialDb, migrateTrialDurationsOnBoot } from "./tenantStore.js";

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
  "/extract-qas",
  "/extract-structured-data",
  "/technical-solution/",
  "/grants/philanthropic/opportunities",
  "/grants/brief/",
];

function isMeteredPath(url = "") {
  const p = String(url).split("?")[0];
  return METERED_PATH_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix));
}

/** True if `dir` is under a mount listed in /proc/mounts (Linux / Render). */
function isPathOnMountedVolume(dir) {
  try {
    const mounts = fs.readFileSync("/proc/mounts", "utf8");
    const mountPoints = mounts
      .split("\n")
      .map((line) => line.split(/\s+/)[1])
      .filter(Boolean)
      .map((m) => {
        try {
          return decodeURIComponent(m.replace(/\\040/g, " "));
        } catch {
          return m;
        }
      })
      .sort((a, b) => b.length - a.length);
    const resolved = path.resolve(dir);
    for (const mp of mountPoints) {
      if (resolved === mp || resolved.startsWith(mp.endsWith("/") ? mp : `${mp}/`)) {
        // Root `/` and common ephemeral roots do not count as "persistent disk"
        if (mp === "/" || mp === "/opt" || mp.startsWith("/opt/render")) continue;
        return { mounted: true, mountPoint: mp };
      }
    }
    return { mounted: false, mountPoint: null };
  } catch {
    return { mounted: null, mountPoint: null };
  }
}

function probeTrialDataPath(dataPath) {
  const dir = path.dirname(dataPath);
  try {
    fs.mkdirSync(dir, { recursive: true });
    const probe = path.join(dir, ".juno-trial-write-probe");
    fs.writeFileSync(probe, new Date().toISOString(), "utf8");
    fs.unlinkSync(probe);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export function registerTrialSystem(app) {
  const dataPath = getTrialDataPath();
  const usingCustomPath = Boolean(
    String(process.env.TRIAL_DATA_PATH || process.env.JUNO_TRIAL_DATA_PATH || process.env.TRIAL_DATA_DIR || "").trim(),
  );
  const mountInfo = isPathOnMountedVolume(path.dirname(dataPath));
  const probe = probeTrialDataPath(dataPath);

  let persistenceLabel = "default — ephemeral on Render without matching disk mount";
  if (usingCustomPath && mountInfo.mounted === true) {
    persistenceLabel = `persistent disk at ${mountInfo.mountPoint}`;
  } else if (usingCustomPath && mountInfo.mounted === false) {
    persistenceLabel = "CUSTOM PATH BUT NOT ON A DISK MOUNT — signups will be wiped on restart";
  } else if (usingCustomPath && mountInfo.mounted == null) {
    persistenceLabel = "custom path (mount check unavailable)";
  }

  console.log(`[trial] data file: ${dataPath} (${persistenceLabel})`);
  if (probe.ok) {
    console.log("[trial] write probe: ok");
  } else {
    console.error("[trial] write probe FAILED:", probe.error);
  }

  try {
    const db = loadTrialDb();
    console.log(
      `[trial] loaded ${db.tenants?.length || 0} tenant(s), ${db.users?.length || 0} user(s) from disk`,
    );
  } catch (err) {
    console.warn("[trial] could not summarize DB:", err.message);
  }

  if (process.env.RENDER && usingCustomPath && mountInfo.mounted === false) {
    console.error(
      "[trial] TRIAL_DATA_PATH is set, but that folder is NOT on your Render Persistent Disk. " +
        "Open Disks and set Mount Path to exactly the parent of TRIAL_DATA_PATH " +
        `(e.g. mount /var/data with TRIAL_DATA_PATH=/var/data/trial-tenants.json). Current file: ${dataPath}`,
    );
  } else if (process.env.RENDER && !usingCustomPath) {
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
  app.use("/trial/features", featureRoutes);

  app.use((req, res, next) => {
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return next();
    if (!isMeteredPath(req.path || req.url)) return next();
    return meterTrialAi(req, res, next);
  });

  console.log(
    "Trial tenancy API: /trial/auth/login, /signup, /confirm, /resend-confirmation, /me, /logout, /change-password",
  );
  console.log(`Trial feature store: ${getFeaturesStoragePath()} (GET/PUT/DELETE /trial/features/:key)`);
}
