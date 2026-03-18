import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react()],
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    minify: "esbuild"
  },
  server: {
    port: 5173,
    host: true,
    strictPort: false
  },
  preview: {
    port: 3000,
    host: true
  }
})