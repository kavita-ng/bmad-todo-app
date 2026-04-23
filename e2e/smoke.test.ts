import { test, expect } from '@playwright/test'

test('smoke: create → status change → delete', async ({ page }) => {
  // Capture all outgoing requests to diagnose connectivity
  const outbound: string[] = []
  page.on('request', req => {
    if (!req.url().startsWith('http://localhost:5174')) {
      outbound.push(`${req.method()} ${req.url()}`)
    }
  })
  page.on('requestfailed', req => {
    outbound.push(`FAILED ${req.method()} ${req.url()} — ${req.failure()?.errorText}`)
  })
  page.on('console', msg => {
  console.log(`BROWSER LOG: ${msg.text()}`);
});

  await page.goto('/')

  // ── Create a todo ────────────────────────────────────────────────────────
  await page.getByLabel('New todo description').fill('E2E smoke test todo')
  await page.getByRole('button', { name: 'Add' }).click()

  // Scope all interactions to the specific todo row — avoids interference from
  // any other items that may be in the list
  const todoList = page.getByRole('list', { name: 'Todo list' })
  const todoRow = todoList.locator('li').filter({ hasText: 'E2E smoke test todo' })
  await expect(todoRow).toBeVisible()

  // Wait for the create mutation to settle (select enabled = real server ID)
  const statusSelect = todoRow.getByLabel('Change status')
  await expect(statusSelect).toBeEnabled()

  // ── Change status ────────────────────────────────────────────────────────
  await statusSelect.selectOption('ready')

  // Assert the StatusBadge updates (data-status attribute is set by StatusBadge.vue)
  await expect(todoRow.locator('[data-status="ready"]')).toBeVisible()

  // ── Delete the todo ──────────────────────────────────────────────────────
  await todoRow.getByRole('button', { name: 'Delete todo' }).click()
  await expect(todoRow).not.toBeVisible()

  console.log('API requests observed:', outbound)
})
