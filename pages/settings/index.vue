<template>
  <div>
    <h1 class="app-page-title">策略设置</h1>
    <p class="app-page-desc">打招呼模板与黑名单（本地记录，不自动爬岗位）</p>
    <div v-if="error" class="app-alert app-alert-error" role="alert">{{ error }}</div>
    <div v-if="okMsg" class="app-alert app-alert-ok" role="status">{{ okMsg }}</div>

    <section class="app-panel">
      <h2 class="app-panel-title">打招呼模板</h2>
      <form class="app-form-stack" @submit.prevent="createTemplate">
        <div>
          <label class="app-label" for="tpl-name">名称</label>
          <input id="tpl-name" v-model="tplForm.name" class="app-input" required placeholder="如 友好版" />
        </div>
        <div>
          <label class="app-label" for="tpl-content">内容</label>
          <textarea
            id="tpl-content"
            v-model="tplForm.content"
            class="app-input"
            rows="3"
            required
            :placeholder="'支持占位：{{job_title}} {{company_name}}'"
            style="resize: vertical; font-family: inherit"
          />
        </div>
        <label class="app-check">
          <input v-model="tplForm.isDefault" type="checkbox" />
          设为默认
        </label>
        <button class="app-btn" type="submit" :disabled="busy">保存模板</button>
      </form>
      <ul v-if="templates.length" class="app-list" style="margin-top: 1rem">
        <li v-for="t in templates" :key="t.id" class="app-list-item">
          <div>
            <strong>{{ t.name }}</strong>
            <span v-if="t.isDefault" class="app-badge">默认</span>
            <p class="app-meta" style="white-space: pre-wrap">{{ t.content }}</p>
          </div>
          <button type="button" class="app-link-danger" @click="removeTemplate(t.id)">删除</button>
        </li>
      </ul>
    </section>

    <section class="app-panel">
      <h2 class="app-panel-title">黑名单</h2>
      <form class="app-form-stack" @submit.prevent="addBlacklist">
        <div class="app-field-grid">
          <div>
            <label class="app-label" for="bl-type">类型</label>
            <select id="bl-type" v-model="blForm.type" class="app-select">
              <option value="COMPANY">公司</option>
              <option value="KEYWORD">关键词</option>
              <option value="JOB_TITLE">职位名</option>
              <option value="HR">HR</option>
            </select>
          </div>
          <div>
            <label class="app-label" for="bl-value">屏蔽词</label>
            <input id="bl-value" v-model="blForm.value" class="app-input" required placeholder="如 XX科技" />
          </div>
        </div>
        <div>
          <label class="app-label" for="bl-reason">原因（可选）</label>
          <input id="bl-reason" v-model="blForm.reason" class="app-input" placeholder="加班多 / 不感兴趣" />
        </div>
        <button class="app-btn" type="submit" :disabled="busy">加入黑名单</button>
      </form>
      <ul v-if="blacklist.length" class="app-list" style="margin-top: 1rem">
        <li v-for="b in blacklist" :key="b.id" class="app-list-item">
          <div>
            <span class="app-badge">{{ typeLabel(b.type) }}</span>
            <strong style="margin-left: 0.35rem">{{ b.value }}</strong>
            <p v-if="b.reason" class="app-meta">{{ b.reason }}</p>
          </div>
          <button type="button" class="app-link-danger" @click="removeBlacklist(b.id)">删除</button>
        </li>
      </ul>
      <p v-else class="app-page-desc" style="margin-top: 1rem">还没有黑名单项。</p>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

type Template = { id: string; name: string; content?: string; isDefault?: boolean }
type BlackItem = { id: string; type?: string; value?: string; reason?: string }

const { apiFetch } = useApi()
const error = ref('')
const okMsg = ref('')
const busy = ref(false)
const templates = ref<Template[]>([])
const blacklist = ref<BlackItem[]>([])
const tplForm = reactive({ name: '', content: '', isDefault: false })
const blForm = reactive({ type: 'COMPANY', value: '', reason: '' })

const typeLabel = (t?: string) =>
  ({ COMPANY: '公司', KEYWORD: '关键词', JOB_TITLE: '职位', HR: 'HR' } as Record<string, string>)[t || ''] || t || '-'

const load = async () => {
  const tpl = await apiFetch<{ items?: Template[] }>('/api/v1/templates')
  templates.value = tpl?.items || []
  const bl = await apiFetch<{ items?: BlackItem[] }>('/api/v1/blacklist')
  blacklist.value = bl?.items || []
}

onMounted(async () => {
  try {
    await load()
  } catch (e: any) {
    error.value = e.message || '加载失败'
  }
})

const createTemplate = async () => {
  busy.value = true
  error.value = ''
  okMsg.value = ''
  try {
    await apiFetch('/api/v1/templates', {
      method: 'POST',
      body: { ...tplForm },
    })
    tplForm.name = ''
    tplForm.content = ''
    tplForm.isDefault = false
    await load()
    okMsg.value = '模板已保存'
  } catch (e: any) {
    error.value = e.message || '保存失败'
  } finally {
    busy.value = false
  }
}

const removeTemplate = async (id: string) => {
  error.value = ''
  try {
    await apiFetch(`/api/v1/templates/${id}`, { method: 'DELETE' })
    await load()
  } catch (e: any) {
    error.value = e.message || '删除失败'
  }
}

const addBlacklist = async () => {
  busy.value = true
  error.value = ''
  okMsg.value = ''
  try {
    await apiFetch('/api/v1/blacklist', {
      method: 'POST',
      body: { ...blForm },
    })
    blForm.value = ''
    blForm.reason = ''
    await load()
    okMsg.value = '已加入黑名单'
  } catch (e: any) {
    error.value = e.message || '添加失败'
  } finally {
    busy.value = false
  }
}

const removeBlacklist = async (id: string) => {
  error.value = ''
  try {
    await apiFetch(`/api/v1/blacklist/${id}`, { method: 'DELETE' })
    await load()
  } catch (e: any) {
    error.value = e.message || '删除失败'
  }
}
</script>
