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
        <h2 class="app-panel-title">AI 操作</h2>
        <div class="app-form-stack">
          <div>
            <label class="app-label" for="target-job">目标岗位（可选）</label>
            <input
              id="target-job"
              v-model="targetJob"
              class="app-input"
              placeholder="如：Java 后端工程师，或对照已保存岗位"
            />
          </div>
          <div>
            <label class="app-label" for="job-pick">对照已保存岗位</label>
            <select id="job-pick" v-model="targetJobId" class="app-select">
              <option value="">不选</option>
              <option v-for="j in jobs" :key="j.id" :value="j.id">
                {{ j.title }}{{ j.companyName ? ` · ${j.companyName}` : '' }}
              </option>
            </select>
          </div>
          <div class="flex flex-wrap gap-3">
            <button class="app-btn" type="button" :disabled="!!busy" @click="doAnalyze">
              {{ busy === 'analyze' ? '分析中…' : 'AI 分析简历' }}
            </button>
            <button class="app-btn app-btn-ghost" type="button" :disabled="!!busy" @click="doRewrite">
              {{ busy === 'rewrite' ? '重写中…' : '生成优化建议' }}
            </button>
          </div>
          <div v-if="okMsg" class="app-alert app-alert-ok">{{ okMsg }}</div>
        </div>
      </section>

      <section v-if="hasAnalysis" class="app-panel">
        <h2 class="app-panel-title">分析结果</h2>
        <p v-if="overallAssessment" class="text-sm leading-relaxed text-[color:var(--ink-dai)] mb-3">
          {{ overallAssessment }}
        </p>
        <p v-if="scoreOverall != null" class="app-meta mb-3">综合分 {{ scoreOverall }}</p>
        <div v-if="techSkills.length" class="mb-3 flex flex-wrap gap-2">
          <span v-for="s in techSkills" :key="s" class="app-badge">{{ s }}</span>
        </div>
        <pre class="app-pre">{{ JSON.stringify(resume.analysis || {}, null, 2) }}</pre>
      </section>

      <section v-if="rewriteResult" class="app-panel">
        <h2 class="app-panel-title">优化建议</h2>
        <p v-if="rewriteResult.summary" class="text-sm leading-relaxed text-[color:var(--ink-dai)] mb-3 whitespace-pre-wrap">
          {{ rewriteResult.summary }}
        </p>
        <div v-if="rewriteSkills.length" class="mb-3 flex flex-wrap gap-2">
          <span v-for="s in rewriteSkills" :key="s" class="app-badge">{{ s }}</span>
        </div>
        <pre class="app-pre">{{ JSON.stringify(rewriteResult, null, 2) }}</pre>
      </section>

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
  analysis?: Record<string, unknown>
}

type JobItem = { id: string; title: string; companyName?: string }

const route = useRoute()
const { apiFetch } = useApi()
const resume = ref<ResumeDetail | null>(null)
const jobs = ref<JobItem[]>([])
const targetJob = ref('')
const targetJobId = ref('')
const error = ref('')
const okMsg = ref('')
const busy = ref('')

const typeLabel = (t?: string) =>
  ({ GENERAL: '通用', TECHNICAL: '技术', MANAGEMENT: '管理', CUSTOM: '自定义' } as Record<string, string>)[t || ''] || t || '-'

const statusLabel = (s?: string) =>
  ({ UPLOADED: '已上传', PARSED: '已解析', ANALYZED: '已分析', FAILED: '失败' } as Record<string, string>)[s || ''] || s || '-'

const fileInfo = computed(() => (resume.value?.fileInfo || {}) as Record<string, any>)
const parsed = computed(() => (resume.value?.parsedData || {}) as Record<string, any>)
const summary = computed(() => (typeof parsed.value.summary === 'string' ? parsed.value.summary : ''))
const rawText = computed(() => (typeof parsed.value.rawText === 'string' ? parsed.value.rawText : ''))
const note = computed(() => (typeof parsed.value.note === 'string' ? parsed.value.note : ''))

const hasAnalysis = computed(() => {
  const a = resume.value?.analysis
  return !!(a && Object.keys(a).length > 0 && (a.overallAssessment || a.score || a.rewrite))
})

const overallAssessment = computed(() => {
  const v = resume.value?.analysis?.overallAssessment
  return typeof v === 'string' ? v : ''
})

const scoreOverall = computed(() => {
  const score = resume.value?.analysis?.score as { overall?: number } | undefined
  return score?.overall ?? null
})

const techSkills = computed(() => {
  const sa = resume.value?.analysis?.skillAnalysis as { technicalSkills?: unknown } | undefined
  const list = sa?.technicalSkills
  return Array.isArray(list) ? list.map(String) : []
})

const rewriteResult = computed(() => {
  const r = resume.value?.analysis?.rewrite
  return r && typeof r === 'object' ? (r as Record<string, any>) : null
})

const rewriteSkills = computed(() => {
  const list = rewriteResult.value?.skills
  return Array.isArray(list) ? list.map(String) : []
})

const formatSize = (n: unknown) => {
  const num = typeof n === 'number' ? n : Number(n)
  if (!Number.isFinite(num)) return '-'
  if (num < 1024) return `${num} B`
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`
  return `${(num / 1024 / 1024).toFixed(2)} MB`
}

const load = async () => {
  resume.value = await apiFetch<ResumeDetail>(`/api/v1/resumes/${route.params.id}`)
}

onMounted(async () => {
  try {
    await load()
    const data = await apiFetch<{ items?: JobItem[] }>('/api/v1/jobs')
    jobs.value = data?.items || []
  } catch (e: any) {
    error.value = e.message || '加载失败'
  }
})

const doAnalyze = async () => {
  busy.value = 'analyze'
  error.value = ''
  okMsg.value = ''
  try {
    resume.value = await apiFetch<ResumeDetail>(`/api/v1/resumes/${route.params.id}/analyze`, {
      method: 'POST',
      body: {
        targetJobId: targetJobId.value || undefined,
        targetJob: targetJob.value || undefined,
      },
    })
    okMsg.value = '分析完成'
  } catch (e: any) {
    error.value = e.message || '分析失败'
  } finally {
    busy.value = ''
  }
}

const doRewrite = async () => {
  busy.value = 'rewrite'
  error.value = ''
  okMsg.value = ''
  try {
    resume.value = await apiFetch<ResumeDetail>(`/api/v1/resumes/${route.params.id}/rewrite`, {
      method: 'POST',
      body: {
        targetJobId: targetJobId.value || undefined,
        specialRequirements: targetJob.value ? `目标岗位：${targetJob.value}` : undefined,
        tone: 'professional',
      },
    })
    okMsg.value = '优化建议已生成'
  } catch (e: any) {
    error.value = e.message || '重写失败'
  } finally {
    busy.value = ''
  }
}
</script>
