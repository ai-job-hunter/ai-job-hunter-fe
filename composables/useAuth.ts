export const useAuth = () => {
  const config = useRuntimeConfig()

  const login = async (username: string, password: string) => {
    const res = await $fetch<{ token: string }>('/api/v1/auth/login', {
      baseURL: config.public.apiBase || undefined,
      method: 'POST',
      body: { username, password },
    })
    if (process.client) {
      localStorage.setItem('token', res.token)
      localStorage.setItem('username', username)
    }
    return res
  }

  const register = async (username: string, email: string, password: string) => {
    await $fetch('/api/v1/auth/register', {
      baseURL: config.public.apiBase || undefined,
      method: 'POST',
      body: { username, email, password },
    })
  }

  const logout = () => {
    if (process.client) {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
    }
    navigateTo('/login')
  }

  const getToken = () => {
    if (process.client) {
      return localStorage.getItem('token')
    }
    return null
  }

  return { login, register, logout, getToken }
}
