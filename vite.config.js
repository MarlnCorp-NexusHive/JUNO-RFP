import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendTarget = env.VITE_BACKEND_PROXY_TARGET || "http://127.0.0.1:3000";

  /** Long timeouts: styled export + AI doc generation can exceed default proxy limits. */
  const prox = (extra = {}) => ({
    target: backendTarget,
    changeOrigin: true,
    timeout: 600_000,
    proxyTimeout: 600_000,
    ...extra,
  });

  /** Shared between dev server and `vite preview` so API routes are never404 from the static host. */
  const apiProxy = {
    "/rfp-collab": prox(),
    // Prefix rules (reliable); regex bundle below is kept for other routes.
    "/extract-structured-data": prox(),
    "/get-tables": prox(),
    "/workspace-document": prox(),
    "/export-document": prox(),
    "^/(generate-answer|structure-rfp-requirements|ask-with-context|company-intelligence-remote|generate-company-profile|generate-rfp-document|ask-with-file|extract-dates)$":
      prox(),
  };

  return {
    base: "/",
    plugins: [react()],
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: false,
      minify: "esbuild",
    },
    server: {
      port: 5173,
      host: true,
      strictPort: false,
      proxy: apiProxy,
    },
    preview: {
      port: 4173,
      host: true,
      proxy: apiProxy,
    },
  };
});
