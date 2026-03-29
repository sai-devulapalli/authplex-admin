import { test, expect } from '@playwright/test'
import { login, AUTHCORE_URL } from './helpers'

test.describe('Tenants', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.click('.sidebar nav >> text=Tenants')
    await expect(page).toHaveURL('/tenants')
  })

  test('shows empty state when no tenants', async ({ page }) => {
    await expect(page.locator('.content h1')).toContainText('Tenants')
    await expect(page.locator('text=Create Tenant')).toBeVisible()
  })

  test('create tenant via modal', async ({ page }) => {
    await page.click('text=Create Tenant')

    // Modal should appear
    await expect(page.locator('.modal')).toBeVisible()
    await expect(page.locator('.modal h2')).toContainText('Create Tenant')

    // Fill form
    const inputs = page.locator('.modal input')
    await inputs.nth(0).fill('e2e-test-tenant')
    await inputs.nth(1).fill('e2e.example.com')
    await inputs.nth(2).fill('https://e2e.example.com')

    await page.click('.modal button[type="submit"]')

    // Wait for the table to show the new tenant (modal closes on success)
    await expect(page.locator('text=e2e-test-tenant')).toBeVisible({ timeout: 10000 })
  })

  test('create tenant with ES256 algorithm', async ({ page }) => {
    await page.click('text=Create Tenant')

    const inputs = page.locator('.modal input')
    await inputs.nth(0).fill('es256-tenant')
    await inputs.nth(1).fill('es256.example.com')
    await inputs.nth(2).fill('https://es256.example.com')
    await page.selectOption('.modal select', 'ES256')

    await page.click('.modal button[type="submit"]')

    await expect(page.locator('text=es256-tenant')).toBeVisible({ timeout: 10000 })
  })

  test('click tenant row navigates to detail', async ({ page }) => {
    // Create a tenant first via API
    await fetch(`${AUTHCORE_URL}/tenants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'nav-tenant', domain: 'nav.example.com', issuer: 'https://nav.example.com', algorithm: 'RS256' }),
    })

    await page.reload()
    await page.click('text=nav-tenant')

    await expect(page).toHaveURL('/tenants/nav-tenant')
  })

  test('delete tenant', async ({ page }) => {
    // Create via API
    await fetch(`${AUTHCORE_URL}/tenants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'delete-me', domain: 'del.example.com', issuer: 'https://del.example.com', algorithm: 'RS256' }),
    })

    await page.reload()
    await expect(page.locator('text=delete-me')).toBeVisible()

    page.on('dialog', (dialog) => dialog.accept())
    await page.locator('tr:has-text("delete-me")').locator('.btn-danger').click()

    await expect(page.locator('tr:has-text("delete-me")')).not.toBeVisible({ timeout: 10000 })
  })

  test('close modal with X button', async ({ page }) => {
    await page.click('text=Create Tenant')
    await expect(page.locator('.modal')).toBeVisible()

    await page.click('.modal-close')
    await expect(page.locator('.modal')).not.toBeVisible()
  })

  test('close modal by clicking overlay', async ({ page }) => {
    await page.click('text=Create Tenant')
    await expect(page.locator('.modal')).toBeVisible()

    await page.click('.modal-overlay', { position: { x: 10, y: 10 } })
    await expect(page.locator('.modal')).not.toBeVisible()
  })
})
