import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('displays dashboard with stats', async ({ page }) => {
    await expect(page.locator('.content h1')).toContainText('Dashboard')
    await expect(page.locator('.stat-card')).toHaveCount(3)
  })

  test('shows server status as Healthy', async ({ page }) => {
    await expect(page.locator('text=Healthy')).toBeVisible({ timeout: 5000 })
  })

  test('shows tenant count', async ({ page }) => {
    await expect(page.locator('.stat-label:has-text("Tenants")')).toBeVisible()
  })

  test('navigate to tenants from dashboard', async ({ page }) => {
    await page.click('text=Manage Tenants')
    await expect(page).toHaveURL('/tenants')
    await expect(page.locator('.content h1')).toContainText('Tenants')
  })

  test('sidebar navigation works', async ({ page }) => {
    // Click Tenants in sidebar
    await page.click('.sidebar nav >> text=Tenants')
    await expect(page).toHaveURL('/tenants')

    // Click Dashboard in sidebar
    await page.click('.sidebar nav >> text=Dashboard')
    await expect(page).toHaveURL('/')
  })
})
