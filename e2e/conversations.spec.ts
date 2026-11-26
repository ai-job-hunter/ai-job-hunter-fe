import { expect, test } from '@playwright/test'

/**
 * 沟通 + 投递：新建对话 → 详情可见 → 看板页可打开
 */
test.describe('沟通与投递看板', () => {
  const suffix = Date.now().toString(36)
  const username = `chat_e2e_${suffix}`
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

  test('可创建对话并打开投递看板', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('用户名或邮箱').fill(email)
    await page.getByLabel('密码').fill(password)
    await page.getByRole('button', { name: '登录' }).click()
    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 })

    await page.goto('/conversations')
    await expect(page.getByRole('heading', { name: '沟通' })).toBeVisible()
    await page.getByLabel('HR 称呼').fill('E2E_HR')
    await page.getByLabel('HR 首条消息（可选）').fill('方便聊聊期望薪资吗？')
    await page.getByRole('button', { name: '创建对话' }).click()

    await expect(page.getByRole('heading', { name: 'E2E_HR' })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('button', { name: '生成推荐' })).toBeVisible()

    await page.goto('/applications')
    await expect(page.getByRole('heading', { name: '投递看板' })).toBeVisible()
    await expect(page.getByText('已投递').first()).toBeVisible()
    await expect(page.getByText('写下时间线备注')).toBeVisible()
  })
})
