import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000, // Overall test timeout
  expect: {
    timeout: 20000, // Default timeout for expect assertions
  },
  fullyParallel: true,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    actionTimeout: 15000, // Default timeout for actions like click
    navigationTimeout: 15000, // Default timeout for navigations
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
});
