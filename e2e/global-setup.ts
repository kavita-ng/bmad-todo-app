import { execSync } from 'node:child_process'
import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'

// Absolute path: same value used in playwright.config.ts webServer env
export const E2E_DB_PATH = resolve(process.cwd(), 'backend', 'e2e-test.db')
const E2E_DB = `file:${E2E_DB_PATH}`

export default async function globalSetup() {
  // Wipe any leftover DB from a previous run before migrating
  try {
    await rm(E2E_DB_PATH)
  } catch {
    // File may not exist on first run — not an error
  }

  execSync('npm run db:migrate --workspace=backend', {
    cwd: process.cwd(),
    env: { ...process.env, DB_FILE_NAME: E2E_DB },
    stdio: 'inherit',
  })
}
