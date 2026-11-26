import { expect, test } from '@playwright/test'

/**
 * V2：MOCK 连接 → 导入 JD / 草稿复制 / 导入会话
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
    await expect(page.getByText(/^已导入岗位：/).first()).toBeVisible({ timeout: 10_000 })

    await page.getByLabel('动作').selectOption('DRAFT_GREET')
    await page.getByLabel('话术内容').fill('您好，我对贵司岗位很感兴趣，期待交流。')
    await page.getByRole('button', { name: '创建待确认任务' }).click()
    await expect(page.getByText('NEED_CONFIRM').first()).toBeVisible({ timeout: 15_000 })
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.getByRole('button', { name: '确认执行（mock）' }).first().click()
    await expect(page.getByText(/已复制到剪贴板|任务已完成/)).toBeVisible({ timeout: 15_000 })

    await page.getByLabel('动作').selectOption('IMPORT_CHAT')
    await page.getByLabel('HR 称呼（可选）').fill('E2E_HR')
    await page.getByLabel('聊天原文').fill('HR: 方便聊聊吗？\n我: 方便，请问技术栈？')
    await page.getByRole('button', { name: '创建待确认任务' }).click()
    await expect(page.getByText('NEED_CONFIRM').first()).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: '确认执行（mock）' }).first().click()
    await expect(page.getByText(/已导入会话/)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('link', { name: '查看已导入会话' }).first()).toBeVisible()
  })
})
