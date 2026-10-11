// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  ssr: false,

  runtimeConfig: {
    public: {
      // 生产构建 API_BASE=（空）：浏览器打同源 /api/*，由 Nginx 反代
      // 本地也保持空：走下面 vite.proxy，避免跨域，后端无需 CORS
      apiBase: process.env.API_BASE || '',
    },
  },

  nitro: {
    preset: 'static',
  },

  // 本地 npm run dev：/api → 本机 Spring Boot（与生产 Nginx 同源思路一致）
  vite: {
    server: {
      proxy: {
        '/api': {
          target: process.env.NUXT_DEV_PROXY_TARGET || 'http://127.0.0.1:8080',
          changeOrigin: true,
        },
      },
    },
  },

  modules: ['@nuxtjs/tailwindcss'],

  compatibilityDate: '2024-11-01',
})

