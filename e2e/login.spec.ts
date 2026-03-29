import { test, expect } from '@playwright/test'
import { AUTHCORE_URL } from './helpers'

test.describe('Login Page', () => {
  test('shows login form on first visit', async ({ page }) => {
    await page.goto('/')
    // Should redirect to login since not authenticated
    await expect(page).toHaveURL('/login')
    await expect(page.locator('h1')).toContainText('AuthCore Admin')
    await expect(page.locator('#apiUrl')).toBeVisible()
    await expect(page.locator('#apiKey')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toContainText('Connect')
  })

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#apiUrl', AUTHCORE_URL)
    await page.fill('#apiKey', 'any-key')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/')
    await expect(page.locator('.content h1')).toContainText('Dashboard')
  })

  test('login with invalid server URL shows error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#apiUrl', 'http://localhost:1')
    await page.fill('#apiKey', 'any-key')
    await page.click('button[type="submit"]')

    await expect(page.locator('.error-msg')).toBeVisible()
    await expect(page.locator('.error-msg')).toContainText('Cannot connect')
  })

  test('login button shows loading state', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#apiUrl', AUTHCORE_URL)
    await page.fill('#apiKey', 'key')

    // Intercept to slow down the request
    await page.route('**/health', async (route) => {
      await new Promise((r) => setTimeout(r, 500))
      await route.continue()
    })

    await page.click('button[type="submit"]')
    await expect(page.locator('button[type="submit"]')).toContainText('Connecting...')
  })

  test('logout returns to login page', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('#apiUrl', AUTHCORE_URL)
    await page.fill('#apiKey', 'key')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/')

    // Logout
    await page.click('text=Logout')
    await expect(page).toHaveURL('/login')
  })

  test('already logged in user is redirected from login to dashboard', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('#apiUrl', AUTHCORE_URL)
    await page.fill('#apiKey', 'key')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/')

    // Visit login again — should redirect to dashboard
    await page.goto('/login')
    await expect(page).toHaveURL('/')
  })
})
