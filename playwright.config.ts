import { defineConfig, devices } from '@playwright/test';
import { getEnvConfig } from './utils/environment';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

const envConfig = getEnvConfig();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  /* 'list' streams per-test pass/fail to stdout live (critical for CI logs);
     'html' still generates the uploaded report artifact. */
  reporter: [['list'], ['html']],
  /* Global timeout for all actions */
  timeout: 30000,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: envConfig.baseURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'smoke-chromium',
      testDir: './tests/smoke',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'smoke-firefox',
      testDir: './tests/smoke',
      use: { ...devices['Desktop Firefox'] },
    },

    // Mobile tests - iOS (slower emulation, increased timeouts)
    {
      name: 'smoke-iphone',
      testDir: './tests/smoke',
      timeout: 60000, // 60s per test for iOS
      use: {
        ...devices['iPhone 12'],
        navigationTimeout: 30000,
        actionTimeout: 10000,
      },
    },

    // Mobile tests - Android
    {
      name: 'smoke-android',
      testDir: './tests/smoke',
      timeout: 45000, // 45s per test for Android
      use: {
        ...devices['Pixel 5'],
        navigationTimeout: 25000,
        actionTimeout: 8000,
      },
    },

    // Regression tests (commented out until more tests added)
    // {
    //   name: 'regression-chromium',
    //   testDir: './tests/regression',
    //   use: { ...devices['Desktop Chrome'] },
    // },
  ],

  /* Run your local dev server before starting the tests (uncomment if using LOCAL environment) */
  // webServer: process.env.ENVIRONMENT === 'LOCAL' ? {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  // } : undefined,
});
