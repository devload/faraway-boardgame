import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 180_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5175',
    viewport: { width: 375, height: 812 },
    trace: 'off',
    video: 'off',
    screenshot: 'off',
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium-mobile-portrait',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 812 },
        deviceScaleFactor: 2,
        isMobile: false, // keep click events; iPhone SE-ish viewport
        hasTouch: true,
      },
    },
  ],
})
