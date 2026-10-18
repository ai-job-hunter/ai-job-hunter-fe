<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-header-inner">
        <div class="flex items-center gap-4">
          <NuxtLink to="/" class="app-brand">
            <img src="/logo.svg" alt="" width="32" height="32" />
            <span>AI Job Hunter</span>
          </NuxtLink>
          <nav class="app-nav">
            <NuxtLink to="/">仪表盘</NuxtLink>
            <NuxtLink to="/resumes">简历</NuxtLink>
            <NuxtLink to="/jobs">岗位</NuxtLink>
            <NuxtLink to="/profile">我的</NuxtLink>
          </nav>
        </div>
        <div class="app-user">
          <span class="app-user-name">{{ username }}</span>
          <button type="button" class="app-link-danger" @click="handleLogout">退出</button>
        </div>
      </div>
    </header>
    <main class="app-main">
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

if (import.meta.client && !getToken()) {
  navigateTo('/login')
}
</script>
