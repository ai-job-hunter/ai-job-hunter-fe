<template>
  <div>
    <h1 class="app-page-title">仪表盘</h1>
    <p class="app-page-desc">简历入库 → 粘贴 JD → AI 分析 / 匹配 / 打招呼</p>

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
      <div class="app-tile is-muted">
        <h3>已申请</h3>
        <p class="num">—</p>
        <p class="hint">后续开放</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

const { apiFetch } = useApi()
const resumeCount = ref<number | null>(null)
const jobCount = ref<number | null>(null)

onMounted(async () => {
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
})
</script>
