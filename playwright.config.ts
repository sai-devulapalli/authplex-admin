import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  webServer: [
    {
      command: 'AUTHPLEX_CORS_ORIGINS=http://localhost:5173 AUTHPLEX_HTTP_PORT=9091 ../authPlex/bin/authplex',
      port: 9091,
      timeout: 15000,
      reuseExistingServer: true,
    },
    {
      command: 'npm run dev -- --port 5173',
      port: 5173,
      timeout: 15000,
      reuseExistingServer: true,
    },
  ],
})
