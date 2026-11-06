import { expect, test } from '@playwright/test'

test.describe('统计与设置', () => {
  const suffix = Date.now().toString(36)
  const username = `stat_e2e_${suffix}`
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

  test('仪表盘今日区 + 统计页 + 设置页可用', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('用户名或邮箱').fill(email)
    await page.getByLabel('密码').fill(password)
    await page.getByRole('button', { name: '登录' }).click()
    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 })

    await expect(page.getByRole('heading', { name: '今日' })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('回复率')).toBeVisible()

    await page.goto('/stats')
    await expect(page.getByRole('heading', { name: '数据统计' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '求职漏斗' })).toBeVisible()
    await expect(page.getByRole('button', { name: '生成 AI 周报' })).toBeVisible()

    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: '策略设置' })).toBeVisible()
    await page.getByLabel('名称').fill('E2E模板')
    await page.locator('#tpl-content').fill('您好，我对贵司岗位感兴趣')
    await page.getByRole('button', { name: '保存模板' }).click()
    await expect(page.getByText('E2E模板')).toBeVisible({ timeout: 15_000 })

    await page.getByLabel('屏蔽词').fill('不感兴趣公司E2E')
    await page.getByRole('button', { name: '加入黑名单' }).click()
    await expect(page.getByText('不感兴趣公司E2E')).toBeVisible({ timeout: 15_000 })
  })
})
