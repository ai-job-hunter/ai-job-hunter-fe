<template>
  <div>
    <div class="flex items-center justify-between mb-6 gap-4">
      <h2 class="text-2xl font-semibold text-slate-800">我的简历</h2>
    </div>

    <form
      class="bg-white border border-slate-100 rounded-lg p-6 shadow-sm mb-8 space-y-4"
      @submit.prevent="upload"
    >
      <h3 class="font-medium text-slate-800">上传简历</h3>
      <div v-if="error" class="text-sm text-red-600" role="alert">{{ error }}</div>
      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label class="block text-sm text-slate-600 mb-1">名称</label>
          <input v-model="form.name" required class="w-full border rounded px-3 py-2" placeholder="技术简历V1" />
        </div>
        <div>
          <label class="block text-sm text-slate-600 mb-1">类型</label>
          <select v-model="form.type" class="w-full border rounded px-3 py-2">
            <option value="GENERAL">通用</option>
            <option value="TECHNICAL">技术</option>
            <option value="MANAGEMENT">管理</option>
            <option value="CUSTOM">自定义</option>
          </select>
        </div>
      </div>
      <div>
        <label class="block text-sm text-slate-600 mb-1">文件（pdf / txt / doc / docx，≤10MB）</label>
        <input type="file" accept=".pdf,.txt,.doc,.docx" required @change="onFile" />
      </div>
      <label class="inline-flex items-center gap-2 text-sm text-slate-600">
        <input v-model="form.isDefault" type="checkbox" />
        设为默认简历
      </label>
      <button
        type="submit"
        class="bg-slate-900 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
        :disabled="loading || !file"
      >
        {{ loading ? '上传中…' : '上传' }}
      </button>
    </form>

    <div v-if="items.length === 0" class="text-slate-500 text-sm">还没有简历，先上传一份吧。</div>
    <ul class="space-y-3">
      <li
        v-for="item in items"
        :key="item.id"
        class="bg-white border border-slate-100 rounded-lg p-4 shadow-sm flex items-center justify-between gap-4"
      >
        <div>
          <NuxtLink :to="`/resumes/${item.id}`" class="font-medium text-slate-900 hover:underline">
            {{ item.name }}
          </NuxtLink>
          <p class="text-xs text-slate-500 mt-1">
            {{ item.type }} · {{ item.status }}
            <span v-if="item.isDefault" class="ml-2 text-emerald-600">默认</span>
          </p>
        </div>
        <button type="button" class="text-sm text-red-600" @click="remove(item.id)">删除</button>
      </li>
    </ul>
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

const load = async () => {
  const data = await apiFetch<{ items?: ResumeItem[] }>('/api/v1/resumes')
  items.value = data?.items || []
}

const onFile = (e: Event) => {
  const input = e.target as HTMLInputElement
  file.value = input.files?.[0] || null
  if (file.value && !form.name) {
    form.name = file.value.name.replace(/\.[^.]+$/, '')
  }
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
