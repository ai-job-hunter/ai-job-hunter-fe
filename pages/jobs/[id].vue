<template>
  <div>
    <NuxtLink to="/jobs" class="app-back">← 返回岗位列表</NuxtLink>
    <div v-if="error" class="app-alert app-alert-error" role="alert">{{ error }}</div>
    <div v-else-if="!job" class="app-page-desc">加载中…</div>
    <template v-else>
      <h1 class="app-page-title">{{ job.title }}</h1>
      <p class="app-page-desc">
        {{ job.companyName || '未知公司' }}
        <template v-if="job.city"> · {{ job.city }}</template>
        <template v-if="job.salaryText"> · {{ job.salaryText }}</template>
        · {{ statusLabel(job.status) }}
      </p>

      <section class="app-panel">
        <h2 class="app-panel-title">操作</h2>
        <div class="flex flex-wrap gap-3 items-end">
          <button class="app-btn" type="button" :disabled="busy" @click="doAnalyze">
            {{ busy === 'analyze' ? '分析中…' : 'AI 分析 JD' }}
          </button>
          <div class="flex flex-wrap gap-2 items-end">
            <div>
              <label class="app-label" for="resume-pick">匹配简历</label>
              <select id="resume-pick" v-model="resumeId" class="app-select" style="min-width: 12rem">
                <option value="">选择简历</option>
                <option v-for="r in resumes" :key="r.id" :value="r.id">{{ r.name }}</option>
              </select>
            </div>
            <button class="app-btn app-btn-ghost" type="button" :disabled="busy || !resumeId" @click="doMatch">
              {{ busy === 'match' ? '匹配中…' : '计算匹配度' }}
            </button>
            <button class="app-btn app-btn-ghost" type="button" :disabled="busy" @click="doGreet">
              {{ busy === 'greet' ? '生成中…' : '生成打招呼' }}
            </button>
          </div>
        </div>
        <div v-if="okMsg" class="app-alert app-alert-ok mt-4">{{ okMsg }}</div>
      </section>

      <section v-if="matchResult" class="app-panel">
        <h2 class="app-panel-title">匹配结果</h2>
        <p class="text-[color:var(--ink-dai)] text-sm m-0">
          总分 <strong>{{ matchResult.overallScore }}</strong>
          · 建议 {{ matchResult.recommendation || '-' }}
        </p>
        <p v-if="matchResult.reason" class="app-meta">{{ matchResult.reason }}</p>
      </section>

      <section v-if="job.greetingText" class="app-panel">
        <h2 class="app-panel-title">打招呼话术</h2>
        <p class="text-sm leading-relaxed text-[color:var(--ink-dai)] whitespace-pre-wrap m-0">
          {{ job.greetingText }}
        </p>
        <button class="app-btn app-btn-ghost mt-3" type="button" @click="copyGreet">复制</button>
      </section>

      <section class="app-panel">
        <h2 class="app-panel-title">AI 分析</h2>
        <div v-if="skills.length" class="mb-3 flex flex-wrap gap-2">
          <span v-for="s in skills" :key="s" class="app-badge">{{ s }}</span>
        </div>
        <pre class="app-pre">{{ JSON.stringify(job.analysis || {}, null, 2) }}</pre>
      </section>

      <section class="app-panel">
        <h2 class="app-panel-title">JD 原文</h2>
        <pre class="app-pre">{{ job.rawDescription }}</pre>
        <p v-if="job.sourceUrl" class="app-meta mt-2">
          链接：
          <a :href="job.sourceUrl" target="_blank" rel="noopener" class="text-[color:var(--ink-accent)]">
            {{ job.sourceUrl }}
          </a>
        </p>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

type JobDetail = {
  id: string
  title: string
  companyName?: string
  city?: string
  salaryText?: string
  status?: string
  rawDescription?: string
  sourceUrl?: string
  greetingText?: string
  analysis?: Record<string, unknown>
  keywords?: string[]
}

type ResumeItem = { id: string; name: string }

const route = useRoute()
const { apiFetch } = useApi()
const job = ref<JobDetail | null>(null)
const resumes = ref<ResumeItem[]>([])
const resumeId = ref('')
const error = ref('')
const okMsg = ref('')
const busy = ref('')
const matchResult = ref<{ overallScore?: number; recommendation?: string; reason?: string } | null>(null)

const statusLabel = (s?: string) =>
  ({
    NEW: '新建',
    ANALYZED: '已分析',
    GREETED: '已生成话术',
    APPLIED: '已投递',
  } as Record<string, string>)[s || ''] || s || '-'

const skills = computed(() => {
  const a = job.value?.analysis || {}
  const list = (a.skills || a.mustHaveSkills || job.value?.keywords || []) as unknown
  return Array.isArray(list) ? list.map(String) : []
})

const load = async () => {
  job.value = await apiFetch<JobDetail>(`/api/v1/jobs/${route.params.id}`)
}

onMounted(async () => {
  try {
    await load()
    const data = await apiFetch<{ items?: ResumeItem[] }>('/api/v1/resumes')
    resumes.value = data?.items || []
    const def = resumes.value[0]
    if (def) resumeId.value = def.id
  } catch (e: any) {
    error.value = e.message || '加载失败'
  }
})

const doAnalyze = async () => {
  busy.value = 'analyze'
  error.value = ''
  okMsg.value = ''
  try {
    job.value = await apiFetch<JobDetail>(`/api/v1/jobs/${route.params.id}/analyze`, { method: 'POST', body: {} })
    okMsg.value = '分析完成'
  } catch (e: any) {
    error.value = e.message || '分析失败'
  } finally {
    busy.value = ''
  }
}

const doMatch = async () => {
  if (!resumeId.value) return
  busy.value = 'match'
  error.value = ''
  okMsg.value = ''
  try {
    matchResult.value = await apiFetch(`/api/v1/jobs/${route.params.id}/match?resumeId=${resumeId.value}`)
    okMsg.value = '匹配完成'
    await load()
  } catch (e: any) {
    error.value = e.message || '匹配失败'
  } finally {
    busy.value = ''
  }
}

const doGreet = async () => {
  busy.value = 'greet'
  error.value = ''
  okMsg.value = ''
  try {
    const data = await apiFetch<{ greetingText?: string }>(`/api/v1/jobs/${route.params.id}/greet`, {
      method: 'POST',
      body: { resumeId: resumeId.value || undefined, style: 'friendly' },
    })
    if (job.value) job.value.greetingText = data?.greetingText || job.value.greetingText
    await load()
    okMsg.value = '话术已生成'
  } catch (e: any) {
    error.value = e.message || '生成失败'
  } finally {
    busy.value = ''
  }
}

const copyGreet = async () => {
  if (!job.value?.greetingText) return
  try {
    await navigator.clipboard.writeText(job.value.greetingText)
    okMsg.value = '已复制到剪贴板'
  } catch {
    okMsg.value = '复制失败，请手动选择文本'
  }
}
</script>
