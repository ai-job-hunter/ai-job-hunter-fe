import { expect, test } from '@playwright/test'

/**
 * 简历 AI 打通：注册 → 上传 txt → 详情页分析（可降级）
 */
test.describe('简历：上传 + AI 分析', () => {
  const suffix = Date.now().toString(36)
  const username = `res_ai_${suffix}`
  const email = `${username}@example.com`
  const password = 'pass1234'

  test('上传 txt 后可打开详情并触发分析', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('用户名').fill(username)
    await page.getByLabel('邮箱').fill(email)
    await page.getByLabel('密码', { exact: true }).fill(password)
    await page.getByLabel('确认密码').fill(password)
    await page.getByRole('button', { name: '创建账号' }).click()
    await expect(page).toHaveURL(/\/$/, { timeout: 30_000 })

    await page.goto('/resumes')
    await expect(page.getByRole('heading', { name: '我的简历' })).toBeVisible()

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'cv.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('赵六\nJava Spring Boot MySQL\n4年后端经验\n', 'utf-8'),
    })
    await page.getByLabel('简历名称').fill(`E2E简历${suffix}`)
    await page.getByRole('button', { name: '开始上传' }).click()
    await expect(page.getByRole('link', { name: `E2E简历${suffix}` })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('link', { name: `E2E简历${suffix}` }).click()
    await expect(page.getByRole('heading', { name: `E2E简历${suffix}` })).toBeVisible()
    await expect(page.getByRole('button', { name: 'AI 分析简历' })).toBeVisible()

    await page.getByRole('button', { name: 'AI 分析简历' }).click()
    await expect(page.getByText('分析完成')).toBeVisible({ timeout: 90_000 })
    await expect(page.getByRole('heading', { name: '分析结果' })).toBeVisible()
  })
})
