<template>
  <div class="min-h-screen flex flex-col bg-slate-50">
    <header class="bg-white border-b border-slate-200">
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div class="flex items-center gap-6">
          <NuxtLink to="/" class="font-semibold text-slate-900 tracking-tight">
            AI Job Hunter
          </NuxtLink>
          <nav class="hidden sm:flex items-center gap-4 text-sm">
            <NuxtLink
              to="/"
              class="text-slate-600 hover:text-slate-900"
              active-class="text-slate-900 font-medium"
            >
              仪表盘
            </NuxtLink>
            <NuxtLink
              to="/resumes"
              class="text-slate-600 hover:text-slate-900"
              active-class="text-slate-900 font-medium"
            >
              简历
            </NuxtLink>
            <NuxtLink
              to="/profile"
              class="text-slate-600 hover:text-slate-900"
              active-class="text-slate-900 font-medium"
            >
              我的
            </NuxtLink>
          </nav>
        </div>
        <div class="flex items-center gap-3 text-sm">
          <span class="text-slate-500">{{ username }}</span>
          <button
            type="button"
            class="text-red-600 hover:text-red-800"
            @click="handleLogout"
          >
            退出
          </button>
        </div>
      </div>
    </header>
    <main class="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { logout, getToken } = useAuth()
const username = ref('')

onMounted(() => {
  if (import.meta.client) {
    username.value = localStorage.getItem('username') || ''
  }
})

const handleLogout = () => logout()

// 兜底：无 token 时 middleware 也会拦，这里避免空壳闪烁
if (import.meta.client && !getToken()) {
  navigateTo('/login')
}
</script>
