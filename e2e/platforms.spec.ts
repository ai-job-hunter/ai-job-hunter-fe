import { expect, test } from '@playwright/test'

/**
 * V2 阶段 A：MOCK 连接 → 建任务 → 确认完成
 */
test.describe('平台连接（MOCK）', () => {
  const suffix = Date.now().toString(36)
  const username = `plat_e2e_${suffix}`
  const email = `${username}@example.com`
  const password = 'pass1234'

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await page.goto('/register')
    await page.getByLabel('用户名').fill(username)
    await page.getByLabel('邮箱').fill(email)
    await page.getByLabel('密码', { exact: true }).fill(password)
    await page.getByLabel('确认密码').fill(password)
    await page.getByRole('button', { name: '创建账号' }).click()
    await expect(page).toHaveURL(/\/$/, { timeout: 30_000 })
    await page.close()
  })

  test('可走通 MOCK 半自动确认流', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('用户名或邮箱').fill(email)
    await page.getByLabel('密码').fill(password)
    await page.getByRole('button', { name: '登录' }).click()
    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 })

    await page.goto('/platforms')
    await expect(page.getByRole('heading', { name: '平台连接' })).toBeVisible()
    await page.getByRole('button', { name: '创建 MOCK 连接' }).click()
    await expect(page.getByText('MOCK 连接已就绪')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('CONNECTED').first()).toBeVisible()

    await page.getByLabel('岗位名（可选）').fill('E2E导入岗')
    await page.getByLabel('JD 原文').fill('负责 Vue / Java 开发，熟悉 Nuxt。')
    await page.getByRole('button', { name: '创建待确认任务' }).click()
    await expect(page.getByText('NEED_CONFIRM').first()).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: '确认执行（mock）' }).first().click()
    await expect(page.getByText('DONE').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/已导入岗位/)).toBeVisible({ timeout: 10_000 })
  })
})
