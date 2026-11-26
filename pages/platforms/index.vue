<template>
  <div>
    <h1 class="app-page-title">平台连接</h1>
    <p class="app-page-desc">
      V2 半自动骨架：先用 MOCK 走通「建连接 → 建任务 → 确认完成」。不会登录真实招聘站。
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
          <option value="SYNC_JOBS">同步岗位（mock）</option>
          <option value="DRAFT_GREET">草稿打招呼（mock）</option>
          <option value="FILL_REPLY">回填回复（mock）</option>
          <option value="MARK_APPLIED">标记已投递（mock）</option>
        </select>
      </div>
      <button
        type="button"
        class="app-btn"
        :disabled="busy === 'task' || !selectedConn"
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
  result?: { message?: string }
}

const { apiFetch } = useApi()
const connections = ref<Conn[]>([])
const tasks = ref<Task[]>([])
const selectedConn = ref('')
const action = ref('SYNC_JOBS')
const busy = ref('')
const error = ref('')
const ok = ref('')

const load = async () => {
  const [c, t] = await Promise.all([
    apiFetch<{ items?: Conn[] }>('/api/v1/platforms/connections'),
    apiFetch<{ items?: Task[] }>('/api/v1/platforms/tasks'),
  ])
  connections.value = c?.items || []
  tasks.value = t?.items || []
  if (!selectedConn.value && connections.value[0]) {
    selectedConn.value = connections.value[0].id
  }
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
    await apiFetch('/api/v1/platforms/tasks', {
      method: 'POST',
      body: {
        connectionId: selectedConn.value,
        action: action.value,
        mode: 'SEMI_AUTO',
      },
    })
    ok.value = '任务已创建，请确认'
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
    await apiFetch(`/api/v1/platforms/tasks/${id}/confirm`, { method: 'POST' })
    ok.value = 'mock 任务已完成'
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
