<template>
  <div>
    <form class="auth-form" @submit.prevent="handleLogin">
      <div v-if="error" class="auth-error" role="alert">{{ error }}</div>
      <div>
        <label class="auth-label" for="login-account">用户名或邮箱</label>
        <input
          id="login-account"
          v-model="form.account"
          class="auth-input"
          type="text"
          required
          autocomplete="username"
          placeholder="用户名或邮箱"
        />
      </div>
      <div>
        <label class="auth-label" for="login-password">密码</label>
        <input
          id="login-password"
          v-model="form.password"
          class="auth-input"
          type="password"
          required
          autocomplete="current-password"
          placeholder="输入密码"
        />
      </div>
      <button class="auth-btn" type="submit" :disabled="loading">
        {{ loading ? '登录中…' : '登录' }}
      </button>
    </form>
    <p class="auth-foot">
      还没有账号？
      <NuxtLink to="/register">注册</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { login } = useAuth()
const router = useRouter()
const route = useRoute()

const form = reactive({ account: '', password: '' })
const loading = ref(false)
const error = ref('')

onMounted(() => {
  const q = route.query.email || route.query.account
  if (typeof q === 'string' && q) {
    form.account = q
  }
})

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    await login(form.account.trim(), form.password)
    router.push('/')
  } catch (e: any) {
    error.value = e.data?.message || e.statusMessage || e.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>
