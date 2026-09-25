import { defineConfig } from "playwright/test";

/**
 * Some corporate networks block `cdn.playwright.dev`, so `npx playwright install` can't fetch a
 * bundled browser. This drives Playwright through the system-installed Google Chrome instead.
 * No `playwright install` step needed — just `npm run test:e2e` once specs exist under `e2e/`.
 */
export default defineConfig({
  testDir: "./e2e",
  use: {
    channel: "chrome",
    baseURL: "http://localhost:5173",
  },
});
