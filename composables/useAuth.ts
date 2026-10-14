import type { ApiResponse, AuthData } from '~/types'

function apiErrorMessage(e: unknown, fallback: string): string {
  const anyErr = e as {
    data?: { message?: string; code?: number }
    statusMessage?: string
    message?: string
  }
  return anyErr?.data?.message || anyErr?.statusMessage || anyErr?.message || fallback
}

export const useAuth = () => {
  const config = useRuntimeConfig()

  /** account：用户名或邮箱均可 */
  const login = async (account: string, password: string) => {
    let res: ApiResponse<AuthData>
    try {
      res = await $fetch<ApiResponse<AuthData>>('/api/v1/auth/login', {
        baseURL: config.public.apiBase || undefined,
        method: 'POST',
        // account 为主；email 兼容旧后端
        body: { account, email: account, password },
      })
    } catch (e) {
      throw new Error(apiErrorMessage(e, '登录失败'))
    }
    if (res.code !== 0 || !res.data?.token) {
      throw new Error(res.message || '登录失败')
    }
    if (import.meta.client) {
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('username', res.data.user?.username || '')
      localStorage.setItem('email', res.data.user?.email || '')
    }
    return res.data
  }

  const register = async (username: string, email: string, password: string) => {
    let res: ApiResponse<unknown>
    try {
      res = await $fetch<ApiResponse<unknown>>('/api/v1/auth/register', {
        baseURL: config.public.apiBase || undefined,
        method: 'POST',
        body: { username, email, password },
      })
    } catch (e) {
      throw new Error(apiErrorMessage(e, '注册失败'))
    }
    if (res.code !== 0) {
      throw new Error(res.message || '注册失败')
    }
  }

  const logout = () => {
    if (import.meta.client) {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      localStorage.removeItem('email')
    }
    navigateTo('/login')
  }

  const getToken = () => {
    if (import.meta.client) {
      return localStorage.getItem('token')
    }
    return null
  }

  return { login, register, logout, getToken }
}
