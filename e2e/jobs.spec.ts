import { expect, test } from '@playwright/test'

/**
 * 岗位前后端打通：注册登录 → 粘贴 JD → 列表可见 → 详情可分析/匹配/打招呼
 * 需本机 BE（NUXT_DEV_PROXY_TARGET）+ FE；CI 见 .github/workflows/ci.yml
 */
test.describe('岗位：粘贴 JD → 分析/匹配', () => {
  const suffix = Date.now().toString(36)
  const username = `job_e2e_${suffix}`
  const email = `${username}@example.com`
  const password = 'pass1234'
  const jobTitle = `E2E Java ${suffix}`

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

  test('粘贴 JD 后列表可见，详情可打开', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('用户名或邮箱').fill(email)
    await page.getByLabel('密码').fill(password)
    await page.getByRole('button', { name: '登录' }).click()
    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 })

    await page.goto('/jobs')
    await expect(page.getByRole('heading', { name: '我的岗位' })).toBeVisible()

    await page.getByLabel('岗位名称').fill(jobTitle)
    await page.getByLabel('公司').fill('E2E科技')
    await page.getByLabel('JD 原文').fill(
      '岗位职责：负责 Java 后端开发。\n任职要求：熟悉 Spring Boot、MySQL、Redis。',
    )
    // 创建后立即分析可能较慢，取消勾选加快页面断言；详情页再点分析
    const analyze = page.getByLabel('创建后立即 AI 分析')
    if (await analyze.isChecked()) {
      await analyze.uncheck()
    }
    await page.getByRole('button', { name: '保存岗位' }).click()

    await expect(page.getByRole('link', { name: jobTitle })).toBeVisible({ timeout: 30_000 })
    await page.getByRole('link', { name: jobTitle }).click()
    await expect(page.getByRole('heading', { name: jobTitle })).toBeVisible()
    await expect(page.getByRole('button', { name: 'AI 分析 JD' })).toBeVisible()
    await expect(page.getByRole('button', { name: '生成打招呼' })).toBeVisible()
  })
})
