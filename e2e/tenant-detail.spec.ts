import { test, expect } from '@playwright/test'
import { login, AUTHCORE_URL } from './helpers'

const TENANT_ID = 'detail-tenant'

test.describe('Tenant Detail', () => {
  test.beforeEach(async ({ page }) => {
    // Create tenant via API
    await fetch(`${AUTHCORE_URL}/tenants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: TENANT_ID, domain: 'detail.example.com', issuer: 'https://detail.example.com', algorithm: 'RS256' }),
    })

    await login(page)
    await page.goto(`/tenants/${TENANT_ID}`)
  })

  test('shows tenant header with ID and metadata', async ({ page }) => {
    await expect(page.locator('.content h1')).toContainText(TENANT_ID)
    await expect(page.locator('text=detail.example.com')).toBeVisible()
    await expect(page.locator('text=RS256')).toBeVisible()
  })

  test('has tabs for Clients, Providers, Roles, Audit', async ({ page }) => {
    await expect(page.locator('.tab:has-text("Clients")')).toBeVisible()
    await expect(page.locator('.tab:has-text("Providers")')).toBeVisible()
    await expect(page.locator('.tab:has-text("Roles")')).toBeVisible()
    await expect(page.locator('.tab:has-text("Audit")')).toBeVisible()
  })

  test('Clients tab is active by default', async ({ page }) => {
    await expect(page.locator('.tab.active')).toContainText('Clients')
    await expect(page.locator('.content h2')).toContainText('OAuth Clients')
  })

  test('switch between tabs', async ({ page }) => {
    await page.click('.tab:has-text("Providers")')
    await expect(page.locator('.tab.active')).toContainText('Providers')
    await expect(page.locator('.content h2')).toContainText('Identity Providers')

    await page.click('.tab:has-text("Roles")')
    await expect(page.locator('.tab.active')).toContainText('Roles')
    await expect(page.locator('.content h2')).toContainText('Roles')

    await page.click('.tab:has-text("Audit")')
    await expect(page.locator('.tab.active')).toContainText('Audit')
    await expect(page.locator('.content h2')).toContainText('Audit Logs')
  })

  test('back button navigates to tenants list', async ({ page }) => {
    // Click the back link (← Tenants) in the content area
    await page.locator('.content .btn-link').first().click()
    await expect(page).toHaveURL('/tenants')
  })

  // --- Clients Tab ---

  test('create client and see secret warning', async ({ page }) => {
    await page.click('text=Create Client')
    await expect(page.locator('.modal h2')).toContainText('Create OAuth Client')

    await page.locator('.modal input').first().fill('Test App')
    await page.locator('.modal textarea').fill('https://app.example.com/callback')

    await page.click('.modal button[type="submit"]')

    await expect(page.locator('text=Test App')).toBeVisible({ timeout: 10000 })
  })

  test('delete client', async ({ page }) => {
    // Create via API
    const resp = await fetch(`${AUTHCORE_URL}/tenants/${TENANT_ID}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: 'Delete Me',
        client_type: 'public',
        redirect_uris: ['https://example.com/cb'],
        allowed_scopes: ['openid'],
        grant_types: ['authorization_code'],
      }),
    })
    const data = await resp.json()
    expect(data.data.client_id).toBeTruthy()

    await page.reload()
    await expect(page.locator('text=Delete Me')).toBeVisible()

    page.on('dialog', (d) => d.accept())
    await page.locator('tr:has-text("Delete Me")').locator('.btn-danger').click()

    await expect(page.locator('tr:has-text("Delete Me")')).not.toBeVisible({ timeout: 10000 })
  })

  // --- Providers Tab ---

  test('providers tab shows empty state', async ({ page }) => {
    await page.click('.tab:has-text("Providers")')
    await expect(page.locator('text=No identity providers')).toBeVisible()
  })

  // --- Roles Tab ---

  test('create role with permissions', async ({ page }) => {
    await page.click('.tab:has-text("Roles")')
    await page.click('text=Create Role')

    await page.locator('.modal input').first().fill('editor')
    await page.locator('.modal input').nth(1).fill('Can edit posts')
    await page.locator('.modal textarea').fill('posts:read\nposts:write')

    await page.click('.modal button[type="submit"]')

    await expect(page.locator('text=editor')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.tag:has-text("posts:read")')).toBeVisible()
    await expect(page.locator('.tag:has-text("posts:write")')).toBeVisible()
  })

  test('delete role', async ({ page }) => {
    // Create via API
    await fetch(`${AUTHCORE_URL}/tenants/${TENANT_ID}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'temp-role', permissions: ['*'] }),
    })

    await page.click('.tab:has-text("Roles")')
    await page.reload()
    await page.click('.tab:has-text("Roles")')

    await expect(page.locator('text=temp-role')).toBeVisible()

    page.once('dialog', (d) => d.accept())
    await page.locator('tr:has-text("temp-role")').locator('text=Delete').click()

    await expect(page.locator('tr:has-text("temp-role")')).not.toBeVisible({ timeout: 10000 })
  })

  // --- Audit Tab ---

  test('audit tab shows log viewer', async ({ page }) => {
    await page.click('.tab:has-text("Audit")')
    await expect(page.locator('.content h2')).toContainText('Audit Logs')
    await expect(page.locator('.filter-bar')).toBeVisible()
  })

  test('audit tab has filter inputs', async ({ page }) => {
    await page.click('.tab:has-text("Audit")')
    await expect(page.locator('.filter-bar input')).toHaveCount(2)
    await expect(page.locator('.filter-bar select')).toHaveCount(1)
    await expect(page.locator('.filter-bar >> text=Filter')).toBeVisible()
  })
})
