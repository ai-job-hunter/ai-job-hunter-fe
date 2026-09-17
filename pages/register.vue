<template>
  <div>
    <div v-if="error" class="bg-red-50 text-red-600 text-sm p-3 rounded mb-4">{{ error }}</div>
    <form @submit.prevent="handleRegister" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">用户名</label>
        <input v-model="form.username" type="text" required
               class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">邮箱</label>
        <input v-model="form.email" type="email" required
               class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">密码</label>
        <input v-model="form.password" type="password" required
               class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">确认密码</label>
        <input v-model="form.confirmPassword" type="password" required
               class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button type="submit" :disabled="loading"
              class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50">
        {{ loading ? '注册中...' : '注册' }}
      </button>
    </form>
    <p class="mt-4 text-center text-sm text-gray-600">
      已有账号？<NuxtLink to="/login" class="text-blue-600 hover:underline">登录</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { register } = useAuth()
const router = useRouter()

const form = reactive({ username: '', email: '', password: '', confirmPassword: '' })
const loading = ref(false)
const error = ref('')

const handleRegister = async () => {
  if (form.password !== form.confirmPassword) {
    error.value = '两次密码不一致'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await register(form.username, form.email, form.password)
    router.push('/login')
  } catch (e: any) {
    error.value = e.data?.message || '注册失败'
  } finally {
    loading.value = false
  }
}
</script>
