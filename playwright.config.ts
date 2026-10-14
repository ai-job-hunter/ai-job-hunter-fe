import { defineConfig, devices } from '@playwright/test'

/**
 * 本地 E2E：需已启动
 * - 后端：ai-job-hunter-be（默认代理到 127.0.0.1:8080，可用 NUXT_DEV_PROXY_TARGET 覆盖）
 * - 前端：本配置可自启 `nuxt dev`，或设 PLAYWRIGHT_BASE_URL 指向已开的 FE
 *
 * 注意：本机 3000/8080 若被 pen-bloom 占用，请用：
 *   NUXT_DEV_PROXY_TARGET=http://127.0.0.1:8088 npm run dev -- --port 3010
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:3010 npm run test:e2e
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3010'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev -- --port 3010 --host 127.0.0.1',
        url: 'http://127.0.0.1:3010/login',
        reuseExistingServer: true,
        timeout: 120_000,
        env: {
          ...process.env,
          NUXT_DEV_PROXY_TARGET:
            process.env.NUXT_DEV_PROXY_TARGET || 'http://127.0.0.1:8088',
        },
      },
})
