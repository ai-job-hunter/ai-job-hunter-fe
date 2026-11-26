<template>
  <div>
    <h1 class="app-page-title">平台连接</h1>
    <p class="app-page-desc">
      不建独立爬虫仓库：用 MOCK 连接 + 本机粘贴 JD，确认后写入岗位（source=IMPORT）。不会登录真实招聘站。
    </p>

    <div v-if="error" class="app-alert app-alert-error" role="alert">{{ error }}</div>
    <div v-if="ok" class="app-alert app-alert-ok">{{ ok }}</div>

    <section class="app-panel block">
      <h2 class="sec-title">连接</h2>
      <p class="app-meta">当前仅开放 MOCK（真实平台接入见方案文档）。</p>
      <button
        type="button"
        class="app-btn"
        :disabled="busy === 'conn'"
        @click="createMockConnection"
      >
        {{ busy === 'conn' ? '连接中…' : '创建 MOCK 连接' }}
      </button>
      <ul v-if="connections.length" class="list">
        <li v-for="c in connections" :key="c.id" class="list-item">
          <strong>{{ c.platform }}</strong>
          <span class="app-badge">{{ c.status }}</span>
          <span class="app-meta">{{ c.id }}</span>
        </li>
      </ul>
      <p v-else class="app-meta">还没有连接</p>
    </section>

    <section class="app-panel block">
      <h2 class="sec-title">任务</h2>
      <div class="row">
        <label class="app-label" for="conn-select">连接</label>
        <select id="conn-select" v-model="selectedConn" class="app-select" :disabled="!connections.length">
          <option value="">请选择</option>
          <option v-for="c in connections" :key="c.id" :value="c.id">
            {{ c.platform }} · {{ c.status }}
          </option>
        </select>
      </div>
      <div class="row">
        <label class="app-label" for="action-select">动作</label>
        <select id="action-select" v-model="action" class="app-select">
          <option value="SYNC_JOBS">导入岗位（粘贴 JD）</option>
          <option value="DRAFT_GREET">复制打招呼话术</option>
          <option value="FILL_REPLY">复制回复话术</option>
          <option value="MARK_APPLIED">标记已投递（写入看板）</option>
          <option value="IMPORT_CHAT">导入会话（粘贴聊天）</option>
        </select>
      </div>
      <template v-if="action === 'SYNC_JOBS'">
        <div class="row">
          <label class="app-label" for="job-title">岗位名（可选）</label>
          <input id="job-title" v-model="jobTitle" class="app-input" placeholder="如 Java 后端" />
        </div>
        <div class="row">
          <label class="app-label" for="job-company">公司（可选）</label>
          <input id="job-company" v-model="jobCompany" class="app-input" placeholder="公司名" />
        </div>
        <div class="row">
          <label class="app-label" for="job-jd">JD 原文</label>
          <textarea
            id="job-jd"
            v-model="jobJd"
            class="app-input"
            rows="5"
            required
            placeholder="从招聘 App 复制 JD 粘贴到这里"
          />
        </div>
      </template>
      <template v-else-if="action === 'DRAFT_GREET' || action === 'FILL_REPLY'">
        <div class="row">
          <label class="app-label" for="draft-text">话术内容</label>
          <textarea
            id="draft-text"
            v-model="draftText"
            class="app-input"
            rows="4"
            required
            placeholder="粘贴或编写要发到招聘 App 的话术，确认后自动复制"
          />
        </div>
      </template>
      <template v-else-if="action === 'MARK_APPLIED'">
        <div class="row">
          <label class="app-label" for="apply-job">岗位</label>
          <select id="apply-job" v-model="applyJobId" class="app-select" required>
            <option value="">请选择</option>
            <option v-for="j in jobs" :key="j.id" :value="j.id">
              {{ j.title || '未命名' }}{{ j.companyName ? ` · ${j.companyName}` : '' }}
            </option>
          </select>
        </div>
        <div class="row">
          <label class="app-label" for="apply-resume">简历</label>
          <select id="apply-resume" v-model="applyResumeId" class="app-select" required>
            <option value="">请选择</option>
            <option v-for="r in resumes" :key="r.id" :value="r.id">
              {{ r.name || r.fileName || r.id }}
            </option>
          </select>
        </div>
        <div class="row">
          <label class="app-label" for="apply-note">备注（可选）</label>
          <input id="apply-note" v-model="applyNote" class="app-input" placeholder="如：已在 App 投递" />
        </div>
        <p v-if="!jobs.length || !resumes.length" class="app-meta">
          需要先有岗位和简历，才能标记投递。
        </p>
      </template>
      <template v-else-if="action === 'IMPORT_CHAT'">
        <div class="row">
          <label class="app-label" for="chat-hr">HR 称呼（可选）</label>
          <input id="chat-hr" v-model="chatHrName" class="app-input" placeholder="如 张女士" />
        </div>
        <div class="row">
          <label class="app-label" for="chat-job">关联岗位（可选）</label>
          <select id="chat-job" v-model="chatJobId" class="app-select">
            <option value="">不关联</option>
            <option v-for="j in jobs" :key="j.id" :value="j.id">
              {{ j.title || '未命名' }}{{ j.companyName ? ` · ${j.companyName}` : '' }}
            </option>
          </select>
        </div>
        <div class="row">
          <label class="app-label" for="chat-text">聊天原文</label>
          <textarea
            id="chat-text"
            v-model="chatText"
            class="app-input"
            rows="6"
            required
            placeholder="每行一条。可写：&#10;HR: 您好，方便聊聊吗？&#10;我: 方便的，请问…
无前缀的行默认当作 HR 消息"
          />
        </div>
      </template>
      <button
        type="button"
        class="app-btn"
        :disabled="
          busy === 'task' ||
          !selectedConn ||
          (action === 'SYNC_JOBS' && !jobJd.trim()) ||
          ((action === 'DRAFT_GREET' || action === 'FILL_REPLY') && !draftText.trim()) ||
          (action === 'MARK_APPLIED' && (!applyJobId || !applyResumeId)) ||
          (action === 'IMPORT_CHAT' && !chatText.trim())
        "
        @click="createTask"
      >
        {{ busy === 'task' ? '创建中…' : '创建待确认任务' }}
      </button>

      <ul v-if="tasks.length" class="list">
        <li v-for="t in tasks" :key="t.id" class="list-item task">
          <div>
            <strong>{{ t.action }}</strong>
            <span class="app-badge">{{ t.status }}</span>
          </div>
          <p v-if="t.request?.hint" class="app-meta">{{ t.request.hint }}</p>
          <p v-if="t.result?.message" class="app-meta">{{ t.result.message }}</p>
          <NuxtLink
            v-if="t.result?.jobId && t.action !== 'MARK_APPLIED'"
            class="app-btn app-btn-ghost"
            :to="`/jobs/${t.result.jobId}`"
          >
            查看已导入岗位
          </NuxtLink>
          <NuxtLink
            v-if="t.result?.applicationId"
            class="app-btn app-btn-ghost"
            to="/applications"
          >
            查看投递看板
          </NuxtLink>
          <NuxtLink
            v-if="t.result?.conversationId"
            class="app-btn app-btn-ghost"
            :to="`/conversations/${t.result.conversationId}`"
          >
            查看已导入会话
          </NuxtLink>
          <button
            v-if="t.status === 'NEED_CONFIRM' || t.status === 'PENDING'"
            type="button"
            class="app-btn app-btn-ghost"
            :disabled="busy === t.id"
            @click="confirmTask(t.id)"
          >
            {{ busy === t.id ? '确认中…' : '确认执行（mock）' }}
          </button>
        </li>
      </ul>
      <p v-else class="app-meta">还没有任务</p>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

type Conn = { id: string; platform?: string; status?: string }
type Task = {
  id: string
  action?: string
  status?: string
  request?: { hint?: string }
  result?: {
    message?: string
    jobId?: string
    clipboardText?: string
    applicationId?: string
    conversationId?: string
  }
}
type JobOpt = { id: string; title?: string; companyName?: string }
type ResumeOpt = { id: string; name?: string; fileName?: string }

const { apiFetch } = useApi()
const connections = ref<Conn[]>([])
const tasks = ref<Task[]>([])
const jobs = ref<JobOpt[]>([])
const resumes = ref<ResumeOpt[]>([])
const selectedConn = ref('')
const action = ref('SYNC_JOBS')
const jobTitle = ref('')
const jobCompany = ref('')
const jobJd = ref('')
const draftText = ref('')
const applyJobId = ref('')
const applyResumeId = ref('')
const applyNote = ref('')
const chatHrName = ref('')
const chatJobId = ref('')
const chatText = ref('')
const busy = ref('')
const error = ref('')
const ok = ref('')

const load = async () => {
  const [c, t, j, r] = await Promise.all([
    apiFetch<{ items?: Conn[] }>('/api/v1/platforms/connections'),
    apiFetch<{ items?: Task[] }>('/api/v1/platforms/tasks'),
    apiFetch<{ items?: JobOpt[] }>('/api/v1/jobs'),
    apiFetch<{ items?: ResumeOpt[] }>('/api/v1/resumes'),
  ])
  connections.value = c?.items || []
  tasks.value = t?.items || []
  jobs.value = j?.items || []
  resumes.value = r?.items || []
  if (!selectedConn.value && connections.value[0]) {
    selectedConn.value = connections.value[0].id
  }
  if (!applyJobId.value && jobs.value[0]) applyJobId.value = jobs.value[0].id
  if (!applyResumeId.value && resumes.value[0]) applyResumeId.value = resumes.value[0].id
}

onMounted(async () => {
  try {
    await load()
  } catch (e: any) {
    error.value = e.message || '加载失败'
  }
})

const createMockConnection = async () => {
  busy.value = 'conn'
  error.value = ''
  ok.value = ''
  try {
    const data = await apiFetch<Conn>('/api/v1/platforms/connections', {
      method: 'POST',
      body: { platform: 'MOCK' },
    })
    ok.value = 'MOCK 连接已就绪'
    await load()
    if (data?.id) selectedConn.value = data.id
  } catch (e: any) {
    error.value = e.message || '连接失败'
  } finally {
    busy.value = ''
  }
}

const createTask = async () => {
  if (!selectedConn.value) return
  busy.value = 'task'
  error.value = ''
  ok.value = ''
  try {
    const body: Record<string, string> = {
      connectionId: selectedConn.value,
      action: action.value,
      mode: 'SEMI_AUTO',
    }
    if (action.value === 'SYNC_JOBS') {
      body.rawDescription = jobJd.value.trim()
      if (jobTitle.value.trim()) body.title = jobTitle.value.trim()
      if (jobCompany.value.trim()) body.companyName = jobCompany.value.trim()
    }
    if (action.value === 'DRAFT_GREET' || action.value === 'FILL_REPLY') {
      body.draftText = draftText.value.trim()
    }
    if (action.value === 'MARK_APPLIED') {
      body.jobId = applyJobId.value
      body.resumeId = applyResumeId.value
      if (applyNote.value.trim()) body.applyNote = applyNote.value.trim()
    }
    if (action.value === 'IMPORT_CHAT') {
      body.chatText = chatText.value.trim()
      if (chatHrName.value.trim()) body.hrName = chatHrName.value.trim()
      if (chatJobId.value) body.jobId = chatJobId.value
    }
    await apiFetch('/api/v1/platforms/tasks', {
      method: 'POST',
      body,
    })
    ok.value = '任务已创建，请确认'
    if (action.value === 'SYNC_JOBS') jobJd.value = ''
    if (action.value === 'DRAFT_GREET' || action.value === 'FILL_REPLY') draftText.value = ''
    if (action.value === 'MARK_APPLIED') applyNote.value = ''
    if (action.value === 'IMPORT_CHAT') chatText.value = ''
    await load()
  } catch (e: any) {
    error.value = e.message || '创建任务失败'
  } finally {
    busy.value = ''
  }
}

const confirmTask = async (id: string) => {
  busy.value = id
  error.value = ''
  ok.value = ''
  try {
    const data = await apiFetch<{
      result?: { message?: string; clipboardText?: string; jobId?: string }
    }>(`/api/v1/platforms/tasks/${id}/confirm`, { method: 'POST' })
    const clip = data?.result?.clipboardText?.trim()
    if (clip && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(clip)
        ok.value = '已复制到剪贴板，可粘贴到招聘 App'
      } catch {
        ok.value = data?.result?.message || '任务已完成（复制失败，请手动复制）'
      }
    } else {
      ok.value = data?.result?.message || '任务已完成'
    }
    await load()
  } catch (e: any) {
    error.value = e.message || '确认失败'
  } finally {
    busy.value = ''
  }
}
</script>

<style scoped>
.block {
  margin-bottom: 1rem;
}
.sec-title {
  margin: 0 0 0.35rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--ink-dai);
}
.row {
  margin: 0.5rem 0;
}
.list {
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.list-item {
  padding: 0.6rem 0.75rem;
  border-radius: 0.4rem;
  border: 1px solid color-mix(in srgb, var(--ink-dai) 12%, transparent);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
.list-item.task {
  flex-direction: column;
  align-items: flex-start;
}
.app-select {
  width: 100%;
  margin-top: 0.25rem;
}
</style>
