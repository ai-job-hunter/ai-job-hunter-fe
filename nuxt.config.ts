// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  ssr: false,

  runtimeConfig: {
    public: {
      // 构建时通过 --build-arg API_BASE 注入，生产环境前端发同源 /api/*
      apiBase: process.env.API_BASE || '',
    },
  },

  // 生产构建时 --build-arg NUXT_PUBLIC_API_BASE 注入到客户端 bundle
  nitro: {
    preset: 'static',
  },

  modules: ['@nuxtjs/tailwindcss'],

  compatibilityDate: '2024-11-01',
})
