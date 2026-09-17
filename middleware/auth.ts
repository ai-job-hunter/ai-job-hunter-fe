export default defineNuxtRouteMiddleware((to) => {
  const token = process.client ? localStorage.getItem('token') : null
  if (!token && to.path !== '/login' && to.path !== '/register') {
    return navigateTo('/login')
  }
})
