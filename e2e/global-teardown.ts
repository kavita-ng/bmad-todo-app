import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'

export default async function globalTeardown() {
  try {
    await rm(resolve(process.cwd(), 'backend', 'e2e-test.db'))
  } catch {
    // db may not exist if tests never ran — not an error
  }
}
