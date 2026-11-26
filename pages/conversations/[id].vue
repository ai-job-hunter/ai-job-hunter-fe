<template>
  <div>
    <NuxtLink to="/conversations" class="app-back">← 返回沟通列表</NuxtLink>
    <div v-if="error" class="app-alert app-alert-error" role="alert">{{ error }}</div>
    <div v-else-if="!detail" class="app-page-desc">加载中…</div>
    <template v-else>
      <h1 class="app-page-title">{{ detail.hrName || 'HR' }}</h1>
      <p class="app-page-desc">
        <template v-if="detail.job">
          {{ detail.job.title }} · {{ detail.job.companyName || '' }}
          <template v-if="detail.job.city"> · {{ detail.job.city }}</template>
        </template>
        <template v-else>未关联岗位</template>
        · {{ statusLabel(detail.status) }}
      </p>

      <section class="app-panel">
        <h2 class="app-panel-title">消息</h2>
        <div v-if="!detail.messages?.length" class="app-page-desc" style="margin: 0">还没有消息。</div>
        <ul v-else class="msg-list">
          <li
            v-for="m in detail.messages"
            :key="m.id"
            class="msg-bubble"
            :class="m.direction === 'OUTBOUND' ? 'is-me' : 'is-hr'"
          >
            <p class="msg-who">{{ m.direction === 'OUTBOUND' ? '我' : 'HR' }}</p>
            <p class="msg-body">{{ m.content }}</p>
            <p v-if="m.sentAt" class="msg-time">{{ formatTime(m.sentAt) }}</p>
          </li>
        </ul>
      </section>

      <section class="app-panel">
        <h2 class="app-panel-title">录入消息</h2>
        <form class="app-form-stack" @submit.prevent="sendManual">
          <div>
            <label class="app-label" for="msg-dir">方向</label>
            <select id="msg-dir" v-model="msgForm.direction" class="app-select">
              <option value="INBOUND">HR 来信</option>
              <option value="OUTBOUND">我发出</option>
            </select>
          </div>
          <div>
            <label class="app-label" for="msg-content">内容</label>
            <textarea
              id="msg-content"
              v-model="msgForm.content"
              class="app-input"
              rows="3"
              required
              placeholder="粘贴聊天内容…"
              style="resize: vertical; min-height: 4rem; font-family: inherit"
            />
          </div>
          <button class="app-btn" type="submit" :disabled="busy">
            {{ busy === 'msg' ? '发送中…' : '写入消息' }}
          </button>
        </form>
      </section>

      <section class="app-panel">
        <h2 class="app-panel-title">AI 推荐回复</h2>
        <button class="app-btn app-btn-ghost" type="button" :disabled="busy" @click="loadSuggestions">
          {{ busy === 'suggest' ? '生成中…' : '生成推荐' }}
        </button>
        <div v-if="okMsg" class="app-alert app-alert-ok mt-4">{{ okMsg }}</div>
        <ul v-if="suggestions.length" class="suggest-list">
          <li v-for="(s, i) in suggestions" :key="i" class="suggest-item">
            <p class="suggest-text">{{ s.content }}</p>
            <p class="app-meta">
              <template v-if="s.intent">意图 {{ s.intent }}</template>
              <template v-if="s.confidence != null"> · 置信 {{ s.confidence }}</template>
            </p>
            <div class="suggest-actions">
              <button class="app-btn app-btn-ghost" type="button" @click="copySuggestion(s.content)">
                复制
              </button>
              <button class="app-btn" type="button" :disabled="busy" @click="sendSuggestion(s.content)">
                采用并发送
              </button>
            </div>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

type Message = {
  id: string
  direction?: string
  content?: string
  sentAt?: string
}

type Detail = {
  id: string
  hrName?: string
  status?: string
  job?: { title?: string; companyName?: string; city?: string } | null
  messages?: Message[]
}

type Suggestion = { content?: string; confidence?: number; intent?: string }

const route = useRoute()
const { apiFetch } = useApi()
const detail = ref<Detail | null>(null)
const error = ref('')
const okMsg = ref('')
const busy = ref('')
const suggestions = ref<Suggestion[]>([])
const msgForm = reactive({ content: '', direction: 'INBOUND' })

const statusLabel = (s?: string) =>
  ({
    GREETING: '打招呼',
    CHATTING: '沟通中',
    WAITING: '等待回复',
    CLOSED: '已结束',
  } as Record<string, string>)[s || ''] || s || '-'

const formatTime = (t: string) => {
  try {
    return new Date(t).toLocaleString()
  } catch {
    return t
  }
}

const load = async () => {
  detail.value = await apiFetch<Detail>(`/api/v1/conversations/${route.params.id}`)
}

onMounted(async () => {
  try {
    await load()
  } catch (e: any) {
    error.value = e.message || '加载失败'
  }
})

const sendManual = async () => {
  busy.value = 'msg'
  error.value = ''
  okMsg.value = ''
  try {
    await apiFetch(`/api/v1/conversations/${route.params.id}/messages`, {
      method: 'POST',
      body: { content: msgForm.content, direction: msgForm.direction },
    })
    msgForm.content = ''
    await load()
    okMsg.value = '已写入'
  } catch (e: any) {
    error.value = e.message || '发送失败'
  } finally {
    busy.value = ''
  }
}

const loadSuggestions = async () => {
  busy.value = 'suggest'
  error.value = ''
  okMsg.value = ''
  try {
    const data = await apiFetch<{ suggestions?: Suggestion[] }>(
      `/api/v1/conversations/${route.params.id}/suggested-reply`,
    )
    suggestions.value = data?.suggestions || []
    if (!suggestions.value.length) okMsg.value = '暂无推荐'
  } catch (e: any) {
    error.value = e.message || '生成失败'
  } finally {
    busy.value = ''
  }
}

const sendSuggestion = async (content?: string) => {
  if (!content) return
  busy.value = 'send'
  error.value = ''
  okMsg.value = ''
  try {
    await apiFetch(`/api/v1/conversations/${route.params.id}/send-suggested-reply`, {
      method: 'POST',
      body: { content },
    })
    await load()
    okMsg.value = '推荐回复已发送（本地记录）'
  } catch (e: any) {
    error.value = e.message || '发送失败'
  } finally {
    busy.value = ''
  }
}

const copySuggestion = async (content?: string) => {
  if (!content) return
  error.value = ''
  try {
    await navigator.clipboard.writeText(content)
    okMsg.value = '已复制到剪贴板，可粘贴到招聘 App'
  } catch {
    okMsg.value = '复制失败，请手动选择文本'
  }
}
</script>

<style scoped>
.msg-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.msg-bubble {
  max-width: 85%;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--ink-paper) 88%, var(--ink-accent));
}
.msg-bubble.is-me {
  align-self: flex-end;
  background: color-mix(in srgb, var(--ink-accent) 18%, var(--ink-paper));
}
.msg-bubble.is-hr {
  align-self: flex-start;
}
.msg-who {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  color: var(--ink-muted, #6b6560);
}
.msg-body {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.5;
  color: var(--ink-dai);
}
.msg-time {
  margin: 0.35rem 0 0;
  font-size: 0.7rem;
  color: var(--ink-muted, #6b6560);
}
.suggest-list {
  list-style: none;
  margin: 1rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.suggest-item {
  padding: 0.75rem 0;
  border-top: 1px solid color-mix(in srgb, var(--ink-dai) 12%, transparent);
}
.suggest-text {
  margin: 0 0 0.5rem;
  white-space: pre-wrap;
  line-height: 1.5;
}
.suggest-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
</style>
