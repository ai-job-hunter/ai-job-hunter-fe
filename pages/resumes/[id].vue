<template>
  <div>
    <NuxtLink to="/resumes" class="text-sm text-slate-500 hover:text-slate-800">← 返回列表</NuxtLink>
    <div v-if="error" class="mt-4 text-sm text-red-600" role="alert">{{ error }}</div>
    <div v-else-if="!resume" class="mt-6 text-slate-500 text-sm">加载中…</div>
    <div v-else class="mt-4 space-y-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-semibold text-slate-800">{{ resume.name }}</h2>
          <p class="text-sm text-slate-500 mt-1">
            {{ resume.type }} · {{ resume.status }}
            <span v-if="resume.isDefault" class="text-emerald-600 ml-2">默认</span>
          </p>
        </div>
      </div>

      <section class="bg-white border border-slate-100 rounded-lg p-6 shadow-sm">
        <h3 class="font-medium text-slate-800 mb-3">文件信息</h3>
        <pre class="text-xs text-slate-600 whitespace-pre-wrap">{{ JSON.stringify(resume.fileInfo || {}, null, 2) }}</pre>
      </section>

      <section class="bg-white border border-slate-100 rounded-lg p-6 shadow-sm">
        <h3 class="font-medium text-slate-800 mb-3">解析数据</h3>
        <pre class="text-xs text-slate-600 whitespace-pre-wrap max-h-96 overflow-auto">{{ JSON.stringify(resume.parsedData || {}, null, 2) }}</pre>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

type ResumeDetail = {
  id: string
  name: string
  type?: string
  status?: string
  isDefault?: boolean
  fileInfo?: Record<string, unknown>
  parsedData?: Record<string, unknown>
}

const route = useRoute()
const { apiFetch } = useApi()
const resume = ref<ResumeDetail | null>(null)
const error = ref('')

onMounted(async () => {
  try {
    resume.value = await apiFetch<ResumeDetail>(`/api/v1/resumes/${route.params.id}`)
  } catch (e: any) {
    error.value = e.message || '加载失败'
  }
})
</script>
