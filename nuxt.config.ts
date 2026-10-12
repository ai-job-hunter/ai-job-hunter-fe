// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  ssr: false,

  app: {
    head: {
      title: 'AI Job Hunter',
      htmlAttrs: { lang: 'zh-CN' },
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Noto+Sans+SC:wght@400;500;600&family=Noto+Serif+SC:wght@600&family=Source+Serif+4:opsz,wght@8..60,600&display=swap',
        },
      ],
      meta: [
        { name: 'theme-color', content: '#243a42' },
        { name: 'description', content: 'AI Job Hunter · 智能求职助手' },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

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

