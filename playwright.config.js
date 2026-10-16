const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    browserName: 'chromium',
    baseURL: process.env.SITE_BASE_URL || 'http://127.0.0.1:4173',
    headless: true
  }
});
