<template>
  <div>
    <h1 class="app-page-title">仪表盘</h1>
    <p class="app-page-desc">简历 → JD → 沟通 → 投递 → 看数据</p>

    <section v-if="today" class="app-panel">
      <h2 class="app-panel-title">今日</h2>
      <div class="dash-stats">
        <div>
          <p class="dash-num">{{ today.jobsDiscovered ?? 0 }}</p>
          <p class="dash-label">新岗位</p>
        </div>
        <div>
          <p class="dash-num">{{ today.greetingsSent ?? 0 }}</p>
          <p class="dash-label">打招呼</p>
        </div>
        <div>
          <p class="dash-num">{{ today.applicationsSent ?? 0 }}</p>
          <p class="dash-label">投递</p>
        </div>
        <div>
          <p class="dash-num">{{ today.replyRate ?? 0 }}%</p>
          <p class="dash-label">回复率</p>
        </div>
      </div>
      <p class="app-meta" style="margin-top: 0.75rem">
        <NuxtLink to="/stats">查看完整统计与周报 →</NuxtLink>
      </p>
    </section>

    <div class="app-tile-grid">
      <NuxtLink to="/resumes" class="app-tile">
        <h3>我的简历</h3>
        <p class="num">{{ resumeCount ?? '—' }}</p>
        <p class="hint">上传与管理 →</p>
      </NuxtLink>
      <NuxtLink to="/jobs" class="app-tile">
        <h3>我的岗位</h3>
        <p class="num">{{ jobCount ?? '—' }}</p>
        <p class="hint">粘贴 JD 分析 →</p>
      </NuxtLink>
      <NuxtLink to="/conversations" class="app-tile">
        <h3>沟通</h3>
        <p class="num">{{ convCount ?? '—' }}</p>
        <p class="hint">AI 推荐回复 →</p>
      </NuxtLink>
      <NuxtLink to="/applications" class="app-tile">
        <h3>投递看板</h3>
        <p class="num">{{ appCount ?? '—' }}</p>
        <p class="hint">状态推进 →</p>
      </NuxtLink>
      <NuxtLink to="/stats" class="app-tile">
        <h3>数据统计</h3>
        <p class="num">{{ funnelOffers ?? '—' }}</p>
        <p class="hint">漏斗 / 周报 →</p>
      </NuxtLink>
      <NuxtLink to="/settings" class="app-tile">
        <h3>策略设置</h3>
        <p class="num">{{ blCount ?? '—' }}</p>
        <p class="hint">模板 / 黑名单 →</p>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

const { apiFetch } = useApi()
const resumeCount = ref<number | null>(null)
const jobCount = ref<number | null>(null)
const convCount = ref<number | null>(null)
const appCount = ref<number | null>(null)
const funnelOffers = ref<number | null>(null)
const blCount = ref<number | null>(null)
const today = ref<{
  jobsDiscovered?: number
  greetingsSent?: number
  applicationsSent?: number
  replyRate?: number
} | null>(null)

onMounted(async () => {
  try {
    today.value = await apiFetch('/api/v1/stats/today')
  } catch {
    today.value = null
  }
  try {
    const resumes = await apiFetch<{ total?: number }>('/api/v1/resumes')
    resumeCount.value = resumes?.total ?? 0
  } catch {
    resumeCount.value = null
  }
  try {
    const jobs = await apiFetch<{ total?: number }>('/api/v1/jobs')
    jobCount.value = jobs?.total ?? 0
  } catch {
    jobCount.value = null
  }
  try {
    const conv = await apiFetch<{ total?: number }>('/api/v1/conversations')
    convCount.value = conv?.total ?? 0
  } catch {
    convCount.value = null
  }
  try {
    const apps = await apiFetch<{ total?: number }>('/api/v1/applications')
    appCount.value = apps?.total ?? 0
  } catch {
    appCount.value = null
  }
  try {
    const funnel = await apiFetch<{ totalOffers?: number }>('/api/v1/stats/funnel')
    funnelOffers.value = funnel?.totalOffers ?? 0
  } catch {
    funnelOffers.value = null
  }
  try {
    const bl = await apiFetch<{ items?: unknown[] }>('/api/v1/blacklist')
    blCount.value = bl?.items?.length ?? 0
  } catch {
    blCount.value = null
  }
})
</script>

<style scoped>
.dash-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  text-align: center;
}
.dash-num {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--ink-dai);
}
.dash-label {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  color: var(--ink-muted, #6b6560);
}
@media (max-width: 640px) {
  .dash-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
