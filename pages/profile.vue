<template>
  <div class="max-w-xl">
    <h1 class="app-page-title">我的资料</h1>
    <p class="app-page-desc">完善手机号与求职偏好，后续匹配会用到</p>

    <div v-if="error" class="app-alert app-alert-error mb-4" role="alert">{{ error }}</div>
    <div v-if="ok" class="app-alert app-alert-ok mb-4">已保存</div>

    <form class="app-panel app-form-stack" @submit.prevent="save">
      <div>
        <label class="app-label">用户名</label>
        <input class="app-input" :value="form.username" disabled />
      </div>
      <div>
        <label class="app-label">邮箱</label>
        <input class="app-input" :value="form.email" disabled />
      </div>
      <div>
        <label class="app-label" for="phone">手机</label>
        <input id="phone" v-model="form.phone" class="app-input" placeholder="可选" />
      </div>
      <div>
        <label class="app-label" for="keywords">求职关键词</label>
        <input
          id="keywords"
          v-model="keywordsText"
          class="app-input"
          placeholder="用逗号分隔，如 Java, 后端"
        />
      </div>
      <div>
        <label class="app-label" for="cities">意向城市</label>
        <input
          id="cities"
          v-model="citiesText"
          class="app-input"
          placeholder="用逗号分隔，如 北京, 上海"
        />
      </div>
      <div>
        <button class="app-btn" type="submit" :disabled="loading">
          {{ loading ? '保存中…' : '保存资料' }}
        </button>
      </div>
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
