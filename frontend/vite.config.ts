import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Same target the Express BFF proxies to in production — see server/index.ts.
      "/api": {
        target: process.env.BACKEND_URL ?? "http://localhost:8081",
        changeOrigin: true,
      },
    },
  },
});
