import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // GitHub-hosted runners have 2 vCPUs; the target is a shared public demo server.
  workers: isCI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }], ...(isCI ? [['github'] as const] : [])],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://demowebshop.tricentis.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
});
