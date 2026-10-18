<template>
  <div>
    <h1 class="app-page-title">我的简历</h1>
    <p class="app-page-desc">上传 PDF / TXT / Word，管理默认简历与解析结果</p>

    <section class="app-panel">
      <h2 class="app-panel-title">上传新简历</h2>
      <div v-if="error" class="app-alert app-alert-error mb-4" role="alert">{{ error }}</div>

      <form class="app-form-stack" @submit.prevent="upload">
        <label
          class="app-drop"
          :class="{ 'is-drag': dragging }"
          @dragenter.prevent="dragging = true"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="onDrop"
        >
          <input type="file" accept=".pdf,.txt,.doc,.docx" @change="onFile" />
          <span class="app-drop-title">{{ file ? '已选择文件' : '拖拽文件到这里，或点击选择' }}</span>
          <span class="app-drop-hint">支持 pdf / txt / doc / docx，最大 10MB</span>
          <span v-if="file" class="app-drop-file">{{ file.name }}</span>
        </label>

        <div class="app-field-grid">
          <div>
            <label class="app-label" for="resume-name">简历名称</label>
            <input
              id="resume-name"
              v-model="form.name"
              class="app-input"
              required
              placeholder="例如：技术简历 V1"
            />
          </div>
          <div>
            <label class="app-label" for="resume-type">类型</label>
            <select id="resume-type" v-model="form.type" class="app-select">
              <option value="GENERAL">通用</option>
              <option value="TECHNICAL">技术</option>
              <option value="MANAGEMENT">管理</option>
              <option value="CUSTOM">自定义</option>
            </select>
          </div>
        </div>

        <label class="app-check">
          <input v-model="form.isDefault" type="checkbox" />
          设为默认简历
        </label>

        <div>
          <button class="app-btn" type="submit" :disabled="loading || !file">
            {{ loading ? '上传中…' : '开始上传' }}
          </button>
        </div>
      </form>
    </section>

    <section class="app-panel">
      <h2 class="app-panel-title">已上传</h2>
      <p v-if="items.length === 0" class="app-page-desc" style="margin: 0">
        还没有简历，上传一份开始吧。
      </p>
      <ul v-else class="app-list">
        <li v-for="item in items" :key="item.id" class="app-list-item">
          <div>
            <NuxtLink :to="`/resumes/${item.id}`">{{ item.name }}</NuxtLink>
            <p class="app-meta">
              {{ typeLabel(item.type) }} · {{ statusLabel(item.status) }}
              <span v-if="item.isDefault" class="app-badge">默认</span>
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

type ResumeItem = {
  id: string
  name: string
  type?: string
  status?: string
  isDefault?: boolean
}

const { apiFetch } = useApi()
const items = ref<ResumeItem[]>([])
const file = ref<File | null>(null)
const form = reactive({ name: '', type: 'TECHNICAL', isDefault: true })
const loading = ref(false)
const error = ref('')
const dragging = ref(false)

const typeLabel = (t?: string) =>
  ({ GENERAL: '通用', TECHNICAL: '技术', MANAGEMENT: '管理', CUSTOM: '自定义' } as Record<string, string>)[t || ''] || t || '-'

const statusLabel = (s?: string) =>
  ({ UPLOADED: '已上传', PARSED: '已解析', ANALYZED: '已分析', FAILED: '失败' } as Record<string, string>)[s || ''] || s || '-'

const pickFile = (f: File | null | undefined) => {
  if (!f) return
  file.value = f
  if (!form.name) {
    form.name = f.name.replace(/\.[^.]+$/, '')
  }
}

const onFile = (e: Event) => {
  const input = e.target as HTMLInputElement
  pickFile(input.files?.[0])
}

const onDrop = (e: DragEvent) => {
  dragging.value = false
  pickFile(e.dataTransfer?.files?.[0])
}

const load = async () => {
  const data = await apiFetch<{ items?: ResumeItem[] }>('/api/v1/resumes')
  items.value = data?.items || []
}

const upload = async () => {
  if (!file.value) return
  loading.value = true
  error.value = ''
  try {
    const fd = new FormData()
    fd.append('file', file.value)
    fd.append('name', form.name)
    fd.append('type', form.type)
    fd.append('isDefault', String(form.isDefault))
    await apiFetch('/api/v1/resumes/upload', { method: 'POST', formData: fd })
    form.name = ''
    file.value = null
    await load()
  } catch (e: any) {
    error.value = e.message || '上传失败'
  } finally {
    loading.value = false
  }
}

const remove = async (id: string) => {
  if (!confirm('确定删除这份简历？')) return
  try {
    await apiFetch(`/api/v1/resumes/${id}`, { method: 'DELETE' })
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
