import { expect, test } from '@playwright/test'

/**
 * AUTH E2E（Playwright）
 * 覆盖：注册后应自动登录进首页；失败时不应「登不上」。
 */
test.describe('认证：注册 → 自动登录 / 手动登录', () => {
  const suffix = Date.now().toString(36)
  const username = `e2e_${suffix}`
  const email = `${username}@example.com`
  const password = 'pass1234'

  test('注册成功后自动登录进入首页（不应停在登录页）', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByLabel('用户名')).toBeVisible()

    await page.getByLabel('用户名').fill(username)
    await page.getByLabel('邮箱').fill(email)
    await page.getByLabel('密码', { exact: true }).fill(password)
    await page.getByLabel('确认密码').fill(password)
    await page.getByRole('button', { name: '创建账号' }).click()

    // 成功：进首页仪表盘；失败：不应无提示地回到登录且登不上
    await expect(page).toHaveURL(/\/$/, { timeout: 30_000 })
    await expect(page.getByRole('heading', { name: '仪表盘' })).toBeVisible()
    await expect(page.getByText(username)).toBeVisible()

    const token = await page.evaluate(() => localStorage.getItem('token'))
    expect(token).toBeTruthy()
  })

  test('已注册用户可用邮箱登录', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('用户名或邮箱').fill(email)
    await page.getByLabel('密码').fill(password)
    await page.getByRole('button', { name: '登录' }).click()

    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 })
    await expect(page.getByRole('heading', { name: '仪表盘' })).toBeVisible()
  })

  test('已注册用户可用用户名登录', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('用户名或邮箱').fill(username)
    await page.getByLabel('密码').fill(password)
    await page.getByRole('button', { name: '登录' }).click()

    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 })
    await expect(page.getByRole('heading', { name: '仪表盘' })).toBeVisible()
  })

  test('错误密码应提示失败且留在登录页', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('用户名或邮箱').fill(email)
    await page.getByLabel('密码').fill('wrong-password')
    await page.getByRole('button', { name: '登录' }).click()

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 15_000 })
    await expect(page).toHaveURL(/\/login/)
  })
})
