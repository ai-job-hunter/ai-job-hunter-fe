import { expect, test } from '@playwright/test'

/**
 * 资料页：改手机偏好 + 改密码表单可见并可提交错误旧密提示
 */
test.describe('我的资料', () => {
  const suffix = Date.now().toString(36)
  const username = `prof_e2e_${suffix}`
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

  test('资料页可改偏好，改密码区可见', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('用户名或邮箱').fill(email)
    await page.getByLabel('密码').fill(password)
    await page.getByRole('button', { name: '登录' }).click()
    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 })

    await page.goto('/profile')
    await expect(page.getByRole('heading', { name: '我的资料' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '修改密码' })).toBeVisible()

    await page.getByLabel('手机').fill('13900001111')
    await page.getByRole('button', { name: '保存资料' }).click()
    await expect(page.getByText('已保存')).toBeVisible({ timeout: 15_000 })

    await page.getByLabel('当前密码').fill('wrong-password')
    await page.getByLabel('新密码', { exact: true }).fill('pass9999')
    await page.getByLabel('确认新密码').fill('pass9999')
    await page.getByRole('button', { name: '更新密码' }).click()
    await expect(page.getByRole('alert')).toContainText(/当前密码不正确|不正确/, { timeout: 15_000 })
  })
})
