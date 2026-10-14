<template>
  <div>
    <form class="auth-form" @submit.prevent="handleRegister">
      <div v-if="error" class="auth-error" role="alert">{{ error }}</div>
      <div>
        <label class="auth-label" for="reg-username">用户名</label>
        <input
          id="reg-username"
          v-model="form.username"
          class="auth-input"
          type="text"
          required
          autocomplete="nickname"
          placeholder="怎么称呼你"
        />
      </div>
      <div>
        <label class="auth-label" for="reg-email">邮箱</label>
        <input
          id="reg-email"
          v-model="form.email"
          class="auth-input"
          type="email"
          required
          autocomplete="email"
          placeholder="name@example.com"
        />
      </div>
      <div>
        <label class="auth-label" for="reg-password">密码</label>
        <input
          id="reg-password"
          v-model="form.password"
          class="auth-input"
          type="password"
          required
          autocomplete="new-password"
          placeholder="至少 6 位"
        />
      </div>
      <div>
        <label class="auth-label" for="reg-confirm">确认密码</label>
        <input
          id="reg-confirm"
          v-model="form.confirmPassword"
          class="auth-input"
          type="password"
          required
          autocomplete="new-password"
          placeholder="再输入一次"
        />
      </div>
      <button class="auth-btn" type="submit" :disabled="loading">
        {{ loading ? '注册中…' : '创建账号' }}
      </button>
    </form>
    <p class="auth-foot">
      已有账号？
      <NuxtLink to="/login">登录</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { register, login, getToken } = useAuth()
const router = useRouter()

const form = reactive({ username: '', email: '', password: '', confirmPassword: '' })
const loading = ref(false)
const error = ref('')

const handleRegister = async () => {
  if (form.password !== form.confirmPassword) {
    error.value = '两次密码不一致'
    return
  }
  if (form.password.length < 6) {
    error.value = '密码至少 6 位'
    return
  }
  loading.value = true
  error.value = ''
  const email = form.email.trim()
  const username = form.username.trim()
  let registered = false
  try {
    await register(username, email, form.password)
    registered = true
    await login(email, form.password)
    if (!getToken()) {
      throw new Error('登录成功但未保存 token，请手动登录')
    }
    await router.push('/')
  } catch (e: any) {
    const msg = e.data?.message || e.statusMessage || e.message || '注册失败'
    error.value = msg
    // 注册已成功、自动登录失败 → 去登录页预填邮箱，避免卡在注册页误以为没账号
    if (registered) {
      await navigateTo({
        path: '/login',
        query: { email, registered: '1', tip: '账号已创建，请登录' },
      })
    }
  } finally {
    loading.value = false
  }
}
</script>
