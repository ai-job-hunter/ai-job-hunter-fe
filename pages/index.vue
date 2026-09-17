<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 class="text-xl font-bold text-gray-900">AI Job Hunter</h1>
        <div>
          <span class="text-gray-600 text-sm mr-4">{{ username }}</span>
          <button @click="handleLogout" class="text-sm text-red-600 hover:text-red-800">退出</button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
      <h2 class="text-2xl font-semibold text-gray-800 mb-6">仪表盘</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-gray-500 text-sm">职位搜索</h3>
          <p class="text-3xl font-bold text-gray-900 mt-2">-</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-gray-500 text-sm">已申请</h3>
          <p class="text-3xl font-bold text-gray-900 mt-2">-</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-gray-500 text-sm">AI 分析</h3>
          <p class="text-3xl font-bold text-gray-900 mt-2">-</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

const { logout } = useAuth()
const username = process.client ? localStorage.getItem('username') || '' : ''

const handleLogout = () => logout()
</script>
