import { defineConfig, devices } from '@playwright/test'
import { resolve } from 'node:path'

// Absolute path removes all ambiguity about which directory './' resolves to
const E2E_DB_ABS = resolve(__dirname, 'backend', 'e2e-test.db')
const E2E_DB = `file:${E2E_DB_ABS}`
const E2E_API_PORT = 3000
const E2E_FRONTEND_PORT = 5174
const E2E_API_URL = `http://localhost:${E2E_API_PORT}`
const E2E_FRONTEND_URL = `http://localhost:${E2E_FRONTEND_PORT}`

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: E2E_FRONTEND_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  webServer: [
    {
      // Dedicated E2E backend — isolated DB and port, never reuses running dev servers
      command: 'npm run dev --workspace=backend',
      url: `${E2E_API_URL}/health`,
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        // Absolute path: avoids confusion between repo-root ./ and backend/ ./
        DB_FILE_NAME: E2E_DB,
        ALLOWED_ORIGIN: E2E_FRONTEND_URL,
        PORT: String(E2E_API_PORT),
      },
    },
    {
      // Dedicated E2E frontend on port 5174 — points at the E2E backend via .env.e2e
      command: 'npm run dev:e2e --workspace=frontend',
      url: E2E_FRONTEND_URL,
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        // Belt-and-suspenders: also set via process.env (highest priority in Vite)
        VITE_API_URL: E2E_API_URL,
      },
    },
  ],
})
