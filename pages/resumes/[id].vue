<template>
  <div>
    <NuxtLink to="/resumes" class="app-back">← 返回简历列表</NuxtLink>
    <div v-if="error" class="app-alert app-alert-error" role="alert">{{ error }}</div>
    <div v-else-if="!resume" class="app-page-desc">加载中…</div>
    <template v-else>
      <h1 class="app-page-title">{{ resume.name }}</h1>
      <p class="app-page-desc">
        {{ typeLabel(resume.type) }} · {{ statusLabel(resume.status) }}
        <span v-if="resume.isDefault" class="app-badge">默认</span>
      </p>

      <section class="app-panel">
        <h2 class="app-panel-title">文件信息</h2>
        <dl class="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt class="app-label">原始文件名</dt>
            <dd class="m-0 text-[color:var(--ink-dai)]">{{ fileInfo.originalName || '-' }}</dd>
          </div>
          <div>
            <dt class="app-label">类型</dt>
            <dd class="m-0 text-[color:var(--ink-dai)]">{{ fileInfo.mimeType || '-' }}</dd>
          </div>
          <div>
            <dt class="app-label">大小</dt>
            <dd class="m-0 text-[color:var(--ink-dai)]">{{ formatSize(fileInfo.size) }}</dd>
          </div>
        </dl>
      </section>

      <section class="app-panel">
        <h2 class="app-panel-title">解析内容</h2>
        <p v-if="summary" class="text-sm leading-relaxed text-[color:var(--ink-dai)] mb-3 whitespace-pre-wrap">
          {{ summary }}
        </p>
        <p v-else-if="note" class="app-page-desc" style="margin: 0">{{ note }}</p>
        <details v-if="rawText" class="mt-3">
          <summary class="text-sm cursor-pointer text-[color:var(--ink-mist)]">查看全文</summary>
          <pre class="app-pre mt-2">{{ rawText }}</pre>
        </details>
        <pre v-else-if="!summary && !note" class="app-pre">{{ JSON.stringify(resume.parsedData || {}, null, 2) }}</pre>
      </section>
    </template>
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

const typeLabel = (t?: string) =>
  ({ GENERAL: '通用', TECHNICAL: '技术', MANAGEMENT: '管理', CUSTOM: '自定义' } as Record<string, string>)[t || ''] || t || '-'

const statusLabel = (s?: string) =>
  ({ UPLOADED: '已上传', PARSED: '已解析', ANALYZED: '已分析', FAILED: '失败' } as Record<string, string>)[s || ''] || s || '-'

const fileInfo = computed(() => (resume.value?.fileInfo || {}) as Record<string, any>)
const parsed = computed(() => (resume.value?.parsedData || {}) as Record<string, any>)
const summary = computed(() => (typeof parsed.value.summary === 'string' ? parsed.value.summary : ''))
const rawText = computed(() => (typeof parsed.value.rawText === 'string' ? parsed.value.rawText : ''))
const note = computed(() => (typeof parsed.value.note === 'string' ? parsed.value.note : ''))

const formatSize = (n: unknown) => {
  const num = typeof n === 'number' ? n : Number(n)
  if (!Number.isFinite(num)) return '-'
  if (num < 1024) return `${num} B`
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`
  return `${(num / 1024 / 1024).toFixed(2)} MB`
}

onMounted(async () => {
  try {
    resume.value = await apiFetch<ResumeDetail>(`/api/v1/resumes/${route.params.id}`)
  } catch (e: any) {
    error.value = e.message || '加载失败'
  }
})
</script>
