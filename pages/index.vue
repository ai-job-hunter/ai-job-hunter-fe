<template>
  <div>
    <h2 class="text-2xl font-semibold text-slate-800 mb-6">仪表盘</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <NuxtLink
        to="/resumes"
        class="bg-white rounded-lg shadow-sm border border-slate-100 p-6 hover:border-slate-300 transition"
      >
        <h3 class="text-slate-500 text-sm">我的简历</h3>
        <p class="text-3xl font-bold text-slate-900 mt-2">{{ resumeCount ?? '-' }}</p>
        <p class="text-xs text-slate-400 mt-2">上传与管理简历 →</p>
      </NuxtLink>
      <div class="bg-white rounded-lg shadow-sm border border-slate-100 p-6 opacity-70">
        <h3 class="text-slate-500 text-sm">职位搜索</h3>
        <p class="text-3xl font-bold text-slate-900 mt-2">-</p>
        <p class="text-xs text-slate-400 mt-2">下一阶段开放</p>
      </div>
      <div class="bg-white rounded-lg shadow-sm border border-slate-100 p-6 opacity-70">
        <h3 class="text-slate-500 text-sm">已申请</h3>
        <p class="text-3xl font-bold text-slate-900 mt-2">-</p>
        <p class="text-xs text-slate-400 mt-2">下一阶段开放</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

const { apiFetch } = useApi()
const resumeCount = ref<number | null>(null)

onMounted(async () => {
  try {
    const data = await apiFetch<{ total?: number }>('/api/v1/resumes')
    resumeCount.value = data?.total ?? 0
  } catch {
    resumeCount.value = null
  }
})
</script>
