import { type Page, expect } from '@playwright/test'

export const AUTHCORE_URL = 'http://localhost:9091'
export const API_KEY = 'test-key'

/**
 * Login to the admin UI by filling the login form.
 */
export async function login(page: Page) {
  await page.goto('/login')
  await page.fill('#apiUrl', AUTHCORE_URL)
  await page.fill('#apiKey', API_KEY)
  await page.click('button[type="submit"]')
  // Should redirect to dashboard
  await expect(page).toHaveURL('/')
  await expect(page.locator('.content h1')).toContainText('Dashboard')
}

/**
 * Create a tenant via the API directly (faster than UI for setup).
 */
export async function createTenantViaAPI(id: string, algorithm = 'RS256') {
  await fetch(`${AUTHCORE_URL}/tenants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, domain: `${id}.example.com`, issuer: `https://${id}.example.com`, algorithm }),
  })
}

/**
 * Create a tenant through the UI.
 */
export async function createTenantViaUI(page: Page, id: string) {
  await page.click('text=Create Tenant')
  await page.fill('input[placeholder=""]', id, { strict: false }).catch(() => {})
  // Fill the modal form fields in order
  const inputs = page.locator('.modal input')
  await inputs.nth(0).fill(id) // Tenant ID
  await inputs.nth(1).fill(`${id}.example.com`) // Domain
  await inputs.nth(2).fill(`https://${id}.example.com`) // Issuer URL
  await page.click('.modal button[type="submit"]')
}
