<template>
  <div>
    <h1 class="app-page-title">投递看板</h1>
    <p class="app-page-desc">记录已投递的岗位，推进状态，并写下时间线备注</p>

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

            <div v-if="item.timeline?.length" class="timeline" :aria-label="`${item.job?.title || '岗位'}时间线`">
              <p
                v-for="ev in item.timeline.slice(-3)"
                :key="ev.id || `${ev.eventType}-${ev.occurredAt}`"
                class="timeline-row"
              >
                <span class="timeline-title">{{ ev.title || ev.eventType }}</span>
                <span v-if="ev.description" class="timeline-desc">{{ ev.description }}</span>
              </p>
            </div>
            <p v-else-if="item.applyNote" class="app-meta">备注：{{ item.applyNote }}</p>

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

            <label class="app-label" :for="`note-${item.id}`">添加备注</label>
            <textarea
              :id="`note-${item.id}`"
              v-model="draftNotes[item.id]"
              class="app-input note-box"
              rows="2"
              maxlength="2000"
              placeholder="例如：一面约周五下午"
              :disabled="busyId === item.id"
            />
            <button
              type="button"
              class="app-btn app-btn-ghost note-btn"
              :disabled="busyId === item.id || !(draftNotes[item.id] || '').trim()"
              @click="onAddNote(item.id)"
            >
              保存备注
            </button>
          </li>
          <li v-if="!col.items?.length" class="kanban-empty">空</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

type TimelineEvent = {
  id?: string
  eventType?: string
  title?: string
  description?: string | null
  occurredAt?: string
}

type AppItem = {
  id: string
  status?: string
  matchScore?: number | null
  applyNote?: string | null
  timeline?: TimelineEvent[]
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
const draftNotes = reactive<Record<string, string>>({})

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
    const note = (draftNotes[id] || '').trim()
    await apiFetch(`/api/v1/applications/${id}/status`, {
      method: 'PUT',
      body: note ? { status, note } : { status },
    })
    if (note) draftNotes[id] = ''
    await load()
  } catch (e: any) {
    error.value = e.message || '更新失败'
  } finally {
    busyId.value = ''
  }
}

const onAddNote = async (id: string) => {
  const note = (draftNotes[id] || '').trim()
  if (!note) return
  busyId.value = id
  error.value = ''
  try {
    await apiFetch(`/api/v1/applications/${id}/notes`, {
      method: 'POST',
      body: { note },
    })
    draftNotes[id] = ''
    await load()
  } catch (e: any) {
    error.value = e.message || '备注失败'
  } finally {
    busyId.value = ''
  }
}
</script>

<style scoped>
.kanban {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
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
.kanban-card .app-select,
.kanban-card .note-box {
  width: 100%;
  margin-top: 0.35rem;
}
.timeline {
  margin: 0.4rem 0 0.2rem;
  padding: 0.35rem 0.45rem;
  border-radius: 0.35rem;
  background: color-mix(in srgb, var(--ink-dai) 6%, transparent);
}
.timeline-row {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  color: var(--ink-dai);
  line-height: 1.35;
}
.timeline-row:last-child {
  margin-bottom: 0;
}
.timeline-title {
  font-weight: 600;
}
.timeline-desc {
  display: block;
  color: var(--ink-muted, #6b6560);
  margin-top: 0.1rem;
}
.note-btn {
  margin-top: 0.4rem;
  width: 100%;
}
</style>
