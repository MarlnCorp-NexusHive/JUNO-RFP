import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendTarget = env.VITE_BACKEND_PROXY_TARGET || "http://127.0.0.1:3000";

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
      proxy: {
        "^/(generate-answer|structure-rfp-requirements|ask-with-context|company-intelligence-remote|generate-company-profile|generate-rfp-document|ask-with-file)$":
          {
            target: backendTarget,
            changeOrigin: true,
          },
      },
    },
    preview: {
      port: 4173,
      host: true,
    },
  };
});
