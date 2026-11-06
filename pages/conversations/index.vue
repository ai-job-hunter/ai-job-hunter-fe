<template>
  <div>
    <h1 class="app-page-title">沟通</h1>
    <p class="app-page-desc">手动记录与 HR 的对话，用 AI 生成推荐回复（不自动连招聘网站）</p>

    <section class="app-panel">
      <h2 class="app-panel-title">新建对话</h2>
      <div v-if="error" class="app-alert app-alert-error mb-4" role="alert">{{ error }}</div>
      <form class="app-form-stack" @submit.prevent="create">
        <div class="app-field-grid">
          <div>
            <label class="app-label" for="conv-job">关联岗位</label>
            <select id="conv-job" v-model="form.jobId" class="app-select" style="min-width: 12rem">
              <option value="">不关联</option>
              <option v-for="j in jobs" :key="j.id" :value="j.id">
                {{ j.title }} · {{ j.companyName || '未知公司' }}
              </option>
            </select>
          </div>
          <div>
            <label class="app-label" for="conv-hr">HR 称呼</label>
            <input id="conv-hr" v-model="form.hrName" class="app-input" placeholder="如 李HR" />
          </div>
        </div>
        <div>
          <label class="app-label" for="conv-first">HR 首条消息（可选）</label>
          <textarea
            id="conv-first"
            v-model="form.firstHrMessage"
            class="app-input"
            rows="3"
            placeholder="从聊天窗口复制 HR 发来的话…"
            style="resize: vertical; min-height: 4rem; font-family: inherit"
          />
        </div>
        <div>
          <button class="app-btn" type="submit" :disabled="loading">
            {{ loading ? '创建中…' : '创建对话' }}
          </button>
        </div>
      </form>
    </section>

    <section class="app-panel">
      <h2 class="app-panel-title">对话列表</h2>
      <p v-if="items.length === 0" class="app-page-desc" style="margin: 0">还没有对话，上面新建一条开始吧。</p>
      <ul v-else class="app-list">
        <li v-for="item in items" :key="item.id" class="app-list-item">
          <div>
            <NuxtLink :to="`/conversations/${item.id}`">{{ item.hrName || 'HR' }}</NuxtLink>
            <p class="app-meta">
              <template v-if="item.job">{{ item.job.title }} · {{ item.job.companyName || '' }}</template>
              <template v-else>未关联岗位</template>
              · {{ statusLabel(item.status) }}
              <span v-if="item.unreadCount" class="app-badge">未读 {{ item.unreadCount }}</span>
            </p>
            <p v-if="item.lastMessage?.content" class="app-meta" style="margin-top: 0.25rem">
              {{ item.lastMessage.direction === 'INBOUND' ? 'HR：' : '我：' }}{{ item.lastMessage.content }}
            </p>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

type JobItem = { id: string; title: string; companyName?: string }
type ConvItem = {
  id: string
  hrName?: string
  status?: string
  unreadCount?: number
  lastMessage?: { content?: string; direction?: string }
  job?: { id: string; title: string; companyName?: string } | null
}

const { apiFetch } = useApi()
const items = ref<ConvItem[]>([])
const jobs = ref<JobItem[]>([])
const loading = ref(false)
const error = ref('')
const form = reactive({
  jobId: '',
  hrName: '',
  firstHrMessage: '',
})

const statusLabel = (s?: string) =>
  ({
    GREETING: '打招呼',
    CHATTING: '沟通中',
    WAITING: '等待回复',
    CLOSED: '已结束',
  } as Record<string, string>)[s || ''] || s || '-'

const load = async () => {
  const data = await apiFetch<{ items?: ConvItem[] }>('/api/v1/conversations')
  items.value = data?.items || []
}

onMounted(async () => {
  try {
    await load()
    const j = await apiFetch<{ items?: JobItem[] }>('/api/v1/jobs')
    jobs.value = j?.items || []
  } catch (e: any) {
    error.value = e.message || '加载失败'
  }
})

const create = async () => {
  loading.value = true
  error.value = ''
  try {
    const created = await apiFetch<ConvItem>('/api/v1/conversations', {
      method: 'POST',
      body: {
        jobId: form.jobId || undefined,
        hrName: form.hrName || undefined,
        firstHrMessage: form.firstHrMessage || undefined,
      },
    })
    form.hrName = ''
    form.firstHrMessage = ''
    form.jobId = ''
    await load()
    if (created?.id) {
      await navigateTo(`/conversations/${created.id}`)
    }
  } catch (e: any) {
    error.value = e.message || '创建失败'
  } finally {
    loading.value = false
  }
}
</script>
