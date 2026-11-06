<template>
  <div>
    <h1 class="app-page-title">数据统计</h1>
    <p class="app-page-desc">从岗位、沟通、投递实时汇总（不连招聘网站）</p>

    <div v-if="error" class="app-alert app-alert-error" role="alert">{{ error }}</div>

    <section class="app-panel">
      <h2 class="app-panel-title">今日概览</h2>
      <div v-if="!today" class="app-page-desc" style="margin: 0">加载中…</div>
      <div v-else class="stat-grid">
        <div class="stat-cell">
          <p class="stat-num">{{ today.jobsDiscovered }}</p>
          <p class="stat-label">新岗位</p>
        </div>
        <div class="stat-cell">
          <p class="stat-num">{{ today.greetingsSent }}</p>
          <p class="stat-label">打招呼</p>
        </div>
        <div class="stat-cell">
          <p class="stat-num">{{ today.applicationsSent }}</p>
          <p class="stat-label">投递</p>
        </div>
        <div class="stat-cell">
          <p class="stat-num">{{ today.replyRate }}%</p>
          <p class="stat-label">回复率</p>
        </div>
      </div>
    </section>

    <section class="app-panel">
      <h2 class="app-panel-title">求职漏斗</h2>
      <ul v-if="funnel?.funnel?.length" class="funnel-list">
        <li v-for="s in funnel.funnel" :key="s.stage" class="funnel-row">
          <span class="funnel-name">{{ s.stage }}</span>
          <div class="funnel-bar-wrap">
            <div class="funnel-bar" :style="{ width: Math.max(s.percentage || 0, 2) + '%' }" />
          </div>
          <span class="funnel-count">{{ s.count }} · {{ s.percentage }}%</span>
        </li>
      </ul>
      <p v-else class="app-page-desc" style="margin: 0">暂无数据，先去粘贴岗位或标记投递。</p>
    </section>

    <section class="app-panel">
      <div class="flex flex-wrap gap-3 items-center justify-between">
        <h2 class="app-panel-title" style="margin: 0">近 {{ trendDays }} 天趋势</h2>
        <select v-model="period" class="app-select" @change="loadTrend">
          <option value="week">近 7 天</option>
          <option value="month">近 30 天</option>
          <option value="quarter">近 90 天</option>
        </select>
      </div>
      <div v-if="trend?.dataPoints?.length" class="trend-table-wrap">
        <table class="trend-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>岗位</th>
              <th>打招呼</th>
              <th>投递</th>
              <th>回复率</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in trend.dataPoints" :key="p.date">
              <td>{{ p.date }}</td>
              <td>{{ p.jobsDiscovered }}</td>
              <td>{{ p.greetingsSent }}</td>
              <td>{{ p.applicationsSent }}</td>
              <td>{{ p.replyRate }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="app-panel">
      <h2 class="app-panel-title">本周周报</h2>
      <button class="app-btn" type="button" :disabled="busy" @click="genReport">
        {{ busy ? '生成中…' : '生成 AI 周报' }}
      </button>
      <div v-if="report" class="report-box">
        <h3>{{ report.title || '本周求职复盘' }}</h3>
        <p class="app-meta">
          {{ report.weekStartDate }} ~ {{ report.weekEndDate }}
        </p>
        <pre class="app-pre">{{ report.content }}</pre>
        <ul v-if="report.nextWeekSuggestions?.length" class="suggest-ul">
          <li v-for="(s, i) in report.nextWeekSuggestions" :key="i">{{ s }}</li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

type Today = {
  jobsDiscovered?: number
  greetingsSent?: number
  applicationsSent?: number
  replyRate?: number
}
type FunnelStage = { stage: string; count: number; percentage: number }
type Funnel = { funnel?: FunnelStage[] }
type TrendPoint = {
  date: string
  jobsDiscovered?: number
  greetingsSent?: number
  applicationsSent?: number
  replyRate?: number
}
type Trend = { dataPoints?: TrendPoint[]; period?: string }
type Report = {
  title?: string
  content?: string
  weekStartDate?: string
  weekEndDate?: string
  nextWeekSuggestions?: string[]
}

const { apiFetch } = useApi()
const error = ref('')
const busy = ref(false)
const today = ref<Today | null>(null)
const funnel = ref<Funnel | null>(null)
const trend = ref<Trend | null>(null)
const report = ref<Report | null>(null)
const period = ref('week')

const trendDays = computed(() =>
  period.value === 'month' ? 30 : period.value === 'quarter' ? 90 : 7,
)

const loadTrend = async () => {
  trend.value = await apiFetch<Trend>(`/api/v1/stats/trend?period=${period.value}`)
}

onMounted(async () => {
  try {
    today.value = await apiFetch<Today>('/api/v1/stats/today')
    funnel.value = await apiFetch<Funnel>('/api/v1/stats/funnel')
    await loadTrend()
  } catch (e: any) {
    error.value = e.message || '加载失败'
  }
})

const genReport = async () => {
  busy.value = true
  error.value = ''
  try {
    report.value = await apiFetch<Report>('/api/v1/stats/weekly-report', {
      method: 'POST',
      body: {},
    })
  } catch (e: any) {
    error.value = e.message || '生成失败'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
  gap: 0.75rem;
}
.stat-cell {
  text-align: center;
  padding: 0.75rem 0.5rem;
  border-radius: 0.4rem;
  background: color-mix(in srgb, var(--ink-paper) 90%, var(--ink-dai));
}
.stat-num {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ink-dai);
}
.stat-label {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: var(--ink-muted, #6b6560);
}
.funnel-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}
.funnel-row {
  display: grid;
  grid-template-columns: 5.5rem 1fr auto;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.85rem;
}
.funnel-name {
  color: var(--ink-dai);
}
.funnel-bar-wrap {
  height: 0.55rem;
  background: color-mix(in srgb, var(--ink-dai) 10%, transparent);
  border-radius: 999px;
  overflow: hidden;
}
.funnel-bar {
  height: 100%;
  background: var(--ink-accent, #3d6b5a);
  border-radius: 999px;
}
.funnel-count {
  color: var(--ink-muted, #6b6560);
  white-space: nowrap;
}
.trend-table-wrap {
  overflow-x: auto;
  margin-top: 0.75rem;
}
.trend-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.trend-table th,
.trend-table td {
  text-align: left;
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid color-mix(in srgb, var(--ink-dai) 12%, transparent);
}
.report-box {
  margin-top: 1rem;
}
.report-box h3 {
  margin: 0 0 0.35rem;
  font-size: 1.05rem;
}
.suggest-ul {
  margin: 0.75rem 0 0;
  padding-left: 1.25rem;
}
</style>
