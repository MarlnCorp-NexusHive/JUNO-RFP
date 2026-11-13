/**
 * Build a single Netlify publish folder for junorfp.com:
 *   /           marketing site (website/)
 *   /workspace  HTML workspace demo
 *   /r          Vite SPA assets (base /r/ so they don't clash with website/assets)
 *
 * App routes (/login, /app/*, /rbac/*, …) are rewritten to /r/index.html in netlify.toml.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const websiteDir = path.join(root, "website");
const distDir = path.join(root, "dist");
const siteDir = path.join(root, "_site");
const spaDir = path.join(siteDir, "r");

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    ...opts,
  });
  if (res.status !== 0) {
    process.exit(res.status || 1);
  }
}

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, {
    recursive: true,
    filter: (from) => {
      const base = path.basename(from);
      if (base === "node_modules" || base === ".git") return false;
      return true;
    },
  });
}

console.log("[build-site] vite build with base /r/");
run("npx", ["vite", "build", "--base", "/r/"]);

if (!fs.existsSync(path.join(distDir, "index.html"))) {
  console.error("[build-site] dist/index.html missing after vite build");
  process.exit(1);
}

console.log("[build-site] assemble _site/");
rmrf(siteDir);
copyDir(websiteDir, siteDir);
// Prefer root netlify redirects/headers; drop nested site config from publish tree.
for (const extra of ["netlify.toml", "package.json", "README.md"]) {
  const p = path.join(siteDir, extra);
  if (fs.existsSync(p)) fs.rmSync(p, { force: true });
}
rmrf(path.join(siteDir, "netlify"));
rmrf(spaDir);
copyDir(distDir, spaDir);

// Same-origin API note is handled by VITE_API_URL at build time.
console.log("[build-site] ready:", siteDir);
