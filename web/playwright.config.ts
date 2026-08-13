import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  webServer: { command: "AUTH_SECRET=playwright-test-secret-at-least-32-characters E2E_BYPASS_AUTH=true NEXT_PUBLIC_DEMO_MODE=true npm run dev -- --hostname 127.0.0.1", url: "http://127.0.0.1:3000/ideas", reuseExistingServer: true, timeout: 120_000 },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
});
