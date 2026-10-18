<template>
  <div>
    <h1 class="app-page-title">我的岗位</h1>
    <p class="app-page-desc">粘贴 JD 原文入库，用 AI 分析、匹配与生成打招呼话术（不爬取招聘网站）</p>

    <section class="app-panel">
      <h2 class="app-panel-title">粘贴 JD</h2>
      <div v-if="error" class="app-alert app-alert-error mb-4" role="alert">{{ error }}</div>
      <form class="app-form-stack" @submit.prevent="create">
        <div class="app-field-grid">
          <div>
            <label class="app-label" for="job-title">岗位名称</label>
            <input id="job-title" v-model="form.title" class="app-input" placeholder="可选，默认同 JD 首行" />
          </div>
          <div>
            <label class="app-label" for="job-company">公司</label>
            <input id="job-company" v-model="form.companyName" class="app-input" placeholder="可选" />
          </div>
          <div>
            <label class="app-label" for="job-city">城市</label>
            <input id="job-city" v-model="form.city" class="app-input" placeholder="可选" />
          </div>
          <div>
            <label class="app-label" for="job-salary">薪资</label>
            <input id="job-salary" v-model="form.salaryText" class="app-input" placeholder="如 25k-40k" />
          </div>
        </div>
        <div>
          <label class="app-label" for="job-url">岗位链接</label>
          <input id="job-url" v-model="form.sourceUrl" class="app-input" placeholder="可选，仅存档不抓取" />
        </div>
        <div>
          <label class="app-label" for="job-jd">JD 原文</label>
          <textarea
            id="job-jd"
            v-model="form.rawDescription"
            class="app-input"
            rows="8"
            required
            placeholder="从 BOSS / 猎聘等复制岗位描述粘贴到这里…"
            style="resize: vertical; min-height: 10rem; font-family: inherit"
          />
        </div>
        <label class="app-check">
          <input v-model="form.analyze" type="checkbox" />
          创建后立即 AI 分析
        </label>
        <div>
          <button class="app-btn" type="submit" :disabled="loading">
            {{ loading ? '保存中…' : '保存岗位' }}
          </button>
        </div>
      </form>
    </section>

    <section class="app-panel">
      <h2 class="app-panel-title">已保存</h2>
      <p v-if="items.length === 0" class="app-page-desc" style="margin: 0">还没有岗位，粘贴一份 JD 开始吧。</p>
      <ul v-else class="app-list">
        <li v-for="item in items" :key="item.id" class="app-list-item">
          <div>
            <NuxtLink :to="`/jobs/${item.id}`">{{ item.title }}</NuxtLink>
            <p class="app-meta">
              {{ item.companyName || '未知公司' }}
              <template v-if="item.city"> · {{ item.city }}</template>
              <template v-if="item.salaryText"> · {{ item.salaryText }}</template>
              · {{ statusLabel(item.status) }}
              <span v-if="item.matchScore != null" class="app-badge">匹配 {{ item.matchScore }}</span>
            </p>
          </div>
          <button type="button" class="app-link-danger" @click="remove(item.id)">删除</button>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

type JobItem = {
  id: string
  title: string
  companyName?: string
  city?: string
  salaryText?: string
  status?: string
  matchScore?: number | null
}

const { apiFetch } = useApi()
const items = ref<JobItem[]>([])
const loading = ref(false)
const error = ref('')
const form = reactive({
  title: '',
  companyName: '',
  city: '',
  salaryText: '',
  sourceUrl: '',
  rawDescription: '',
  analyze: true,
})

const statusLabel = (s?: string) =>
  ({
    NEW: '新建',
    ANALYZED: '已分析',
    GREETED: '已生成话术',
    APPLIED: '已投递',
    BLACKLISTED: '黑名单',
  } as Record<string, string>)[s || ''] || s || '-'

const load = async () => {
  const data = await apiFetch<{ items?: JobItem[] }>('/api/v1/jobs')
  items.value = data?.items || []
}

const create = async () => {
  loading.value = true
  error.value = ''
  try {
    await apiFetch('/api/v1/jobs', {
      method: 'POST',
      body: {
        title: form.title || undefined,
        companyName: form.companyName || undefined,
        city: form.city || undefined,
        salaryText: form.salaryText || undefined,
        sourceUrl: form.sourceUrl || undefined,
        rawDescription: form.rawDescription,
        analyze: form.analyze,
      },
    })
    form.title = ''
    form.companyName = ''
    form.city = ''
    form.salaryText = ''
    form.sourceUrl = ''
    form.rawDescription = ''
    await load()
  } catch (e: any) {
    error.value = e.message || '创建失败'
  } finally {
    loading.value = false
  }
}

const remove = async (id: string) => {
  if (!confirm('确定删除这个岗位？')) return
  try {
    await apiFetch(`/api/v1/jobs/${id}`, { method: 'DELETE' })
    await load()
  } catch (e: any) {
    error.value = e.message || '删除失败'
  }
}

onMounted(async () => {
  try {
    await load()
  } catch (e: any) {
    error.value = e.message || '加载失败'
  }
})
</script>
