<template>
  <div>
    <h1 class="app-page-title">投递看板</h1>
    <p class="app-page-desc">记录已投递的岗位，拖状态条手动推进（面试 / Offer 等）</p>

    <div v-if="error" class="app-alert app-alert-error" role="alert">{{ error }}</div>
    <div v-else-if="!columns" class="app-page-desc">加载中…</div>
    <div v-else class="kanban">
      <section v-for="col in columns" :key="col.status" class="kanban-col">
        <header class="kanban-head">
          <h2>{{ col.title }}</h2>
          <span class="app-badge">{{ col.count }}</span>
        </header>
        <ul class="kanban-list">
          <li v-for="item in col.items" :key="item.id" class="kanban-card">
            <p class="kanban-title">{{ item.job?.title || '未知岗位' }}</p>
            <p class="app-meta">
              {{ item.job?.companyName || '' }}
              <template v-if="item.job?.city"> · {{ item.job.city }}</template>
            </p>
            <p v-if="item.resume" class="app-meta">简历：{{ item.resume.name }}</p>
            <p v-if="item.matchScore != null" class="app-meta">匹配 {{ item.matchScore }}</p>
            <label class="app-label" :for="`st-${item.id}`">推进状态</label>
            <select
              :id="`st-${item.id}`"
              class="app-select"
              :value="item.status"
              :disabled="busyId === item.id"
              @change="onStatus(item.id, ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </li>
          <li v-if="!col.items?.length" class="kanban-empty">空</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

type AppItem = {
  id: string
  status?: string
  matchScore?: number | null
  job?: { title?: string; companyName?: string; city?: string } | null
  resume?: { name?: string } | null
}

type Column = {
  status: string
  title: string
  count: number
  items: AppItem[]
}

const { apiFetch } = useApi()
const columns = ref<Column[] | null>(null)
const error = ref('')
const busyId = ref('')

const statusOptions = [
  { value: 'SUBMITTED', label: '已投递' },
  { value: 'VIEWED', label: '已查看' },
  { value: 'REPLIED', label: '有回复' },
  { value: 'INTERVIEWING', label: '面试中' },
  { value: 'OFFERED', label: 'Offer' },
  { value: 'REJECTED', label: '已拒绝' },
  { value: 'WITHDRAWN', label: '已撤回' },
]

const load = async () => {
  const data = await apiFetch<{ columns?: Column[] }>('/api/v1/applications/kanban')
  columns.value = data?.columns || []
}

onMounted(async () => {
  try {
    await load()
  } catch (e: any) {
    error.value = e.message || '加载失败'
  }
})

const onStatus = async (id: string, status: string) => {
  busyId.value = id
  error.value = ''
  try {
    await apiFetch(`/api/v1/applications/${id}/status`, {
      method: 'PUT',
      body: { status },
    })
    await load()
  } catch (e: any) {
    error.value = e.message || '更新失败'
  } finally {
    busyId.value = ''
  }
}
</script>

<style scoped>
.kanban {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(12.5rem, 1fr));
  gap: 0.75rem;
  align-items: start;
  overflow-x: auto;
}
.kanban-col {
  background: color-mix(in srgb, var(--ink-paper) 92%, var(--ink-dai));
  border-radius: 0.5rem;
  padding: 0.75rem;
  min-height: 12rem;
}
.kanban-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.kanban-head h2 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--ink-dai);
}
.kanban-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.kanban-card {
  background: var(--ink-paper, #fff);
  border-radius: 0.4rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid color-mix(in srgb, var(--ink-dai) 10%, transparent);
}
.kanban-title {
  margin: 0 0 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ink-dai);
}
.kanban-empty {
  font-size: 0.8rem;
  color: var(--ink-muted, #6b6560);
  padding: 0.5rem 0;
}
.kanban-card .app-select {
  width: 100%;
  margin-top: 0.35rem;
}
</style>
