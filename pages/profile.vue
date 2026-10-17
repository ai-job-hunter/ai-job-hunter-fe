<template>
  <div class="max-w-xl">
    <h2 class="text-2xl font-semibold text-slate-800 mb-6">我的资料</h2>
    <div v-if="error" class="mb-4 text-sm text-red-600" role="alert">{{ error }}</div>
    <div v-if="ok" class="mb-4 text-sm text-emerald-700">已保存</div>
    <form class="space-y-4 bg-white border border-slate-100 rounded-lg p-6 shadow-sm" @submit.prevent="save">
      <div>
        <label class="block text-sm text-slate-600 mb-1">用户名</label>
        <input class="w-full border rounded px-3 py-2 bg-slate-50" :value="form.username" disabled />
      </div>
      <div>
        <label class="block text-sm text-slate-600 mb-1">邮箱</label>
        <input class="w-full border rounded px-3 py-2 bg-slate-50" :value="form.email" disabled />
      </div>
      <div>
        <label class="block text-sm text-slate-600 mb-1">手机</label>
        <input v-model="form.phone" class="w-full border rounded px-3 py-2" placeholder="可选" />
      </div>
      <div>
        <label class="block text-sm text-slate-600 mb-1">求职关键词（逗号分隔）</label>
        <input v-model="keywordsText" class="w-full border rounded px-3 py-2" placeholder="Java, 后端" />
      </div>
      <div>
        <label class="block text-sm text-slate-600 mb-1">意向城市（逗号分隔）</label>
        <input v-model="citiesText" class="w-full border rounded px-3 py-2" placeholder="北京, 上海" />
      </div>
      <button
        type="submit"
        class="bg-slate-900 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
        :disabled="loading"
      >
        {{ loading ? '保存中…' : '保存' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

type Profile = {
  username?: string
  email?: string
  phone?: string
  preferences?: { keywords?: string[]; cities?: string[] }
}

const { apiFetch } = useApi()
const form = reactive({ username: '', email: '', phone: '' })
const keywordsText = ref('')
const citiesText = ref('')
const loading = ref(false)
const error = ref('')
const ok = ref(false)

onMounted(async () => {
  try {
    const me = await apiFetch<Profile>('/api/v1/users/me')
    form.username = me?.username || ''
    form.email = me?.email || ''
    form.phone = me?.phone || ''
    keywordsText.value = (me?.preferences?.keywords || []).join(', ')
    citiesText.value = (me?.preferences?.cities || []).join(', ')
  } catch (e: any) {
    error.value = e.message || '加载失败'
  }
})

const splitCsv = (s: string) =>
  s.split(/[,，]/).map(x => x.trim()).filter(Boolean)

const save = async () => {
  loading.value = true
  error.value = ''
  ok.value = false
  try {
    await apiFetch('/api/v1/users/me', {
      method: 'PUT',
      body: {
        phone: form.phone,
        preferences: {
          keywords: splitCsv(keywordsText.value),
          cities: splitCsv(citiesText.value),
        },
      },
    })
    ok.value = true
  } catch (e: any) {
    error.value = e.message || '保存失败'
  } finally {
    loading.value = false
  }
}
</script>
