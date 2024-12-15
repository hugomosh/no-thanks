import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60000, // Overall test timeout
  expect: {
    timeout: 30000, // Default timeout for expect assertions
  },
  workers: 3,
  retries: 3,
  fullyParallel: true,
  use: {
    baseURL: "http://localhost:5173/no-thanks/",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 37000, // Default timeout for actions like click
    navigationTimeout: 35000, // Default timeout for navigations
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
  reporter: [
    ["html"], // Generates the HTML report
    ["list"], // Keeps console output
  ],
});
