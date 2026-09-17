<template>
  <div>
    <div v-if="error" class="bg-red-50 text-red-600 text-sm p-3 rounded mb-4">{{ error }}</div>
    <form @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">用户名</label>
        <input v-model="form.username" type="text" required
               class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">密码</label>
        <input v-model="form.password" type="password" required
               class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button type="submit" :disabled="loading"
              class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50">
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </form>
    <p class="mt-4 text-center text-sm text-gray-600">
      还没有账号？<NuxtLink to="/register" class="text-blue-600 hover:underline">注册</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { login } = useAuth()
const router = useRouter()

const form = reactive({ username: '', password: '' })
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    await login(form.username, form.password)
    router.push('/')
  } catch (e: any) {
    error.value = e.data?.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>
