import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputDir: 'test-results/html' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['line'],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:4000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers and Electron */
  projects: [
    {
      name: 'electron',
      use: {
        ...devices['Desktop Chrome'],
        // Electron-specific configuration
        launchOptions: {
          executablePath: path.resolve(__dirname, 'node_modules/.bin/electron'),
          args: [
            path.resolve(__dirname, 'dist/main/main.js'),
            '--disable-dev-shm-usage',
            '--disable-extensions',
            '--no-sandbox',
          ],
        },
      },
    },
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'pnpm run build',
      timeout: 60 * 1000,
      reuseExistingServer: !process.env.CI,
    },
  ],

  /* Test timeout */
  timeout: 30 * 1000,
  expect: {
    timeout: 5 * 1000,
  },

  /* Output directories */
  outputDir: 'test-results/',
});
