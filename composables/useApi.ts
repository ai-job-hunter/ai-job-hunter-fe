import type { ApiResponse } from '~/types'

export const useApi = () => {
  const config = useRuntimeConfig()
  const { getToken, logout } = useAuth()

  const apiFetch = async <T>(path: string, opts: {
    method?: string
    body?: BodyInit | Record<string, unknown> | null
    formData?: FormData
  } = {}) => {
    const token = getToken()
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    let body: BodyInit | undefined
    if (opts.formData) {
      body = opts.formData
    } else if (opts.body != null) {
      headers['Content-Type'] = 'application/json'
      body = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body)
    }

    try {
      const res = await $fetch<ApiResponse<T>>(path, {
        baseURL: config.public.apiBase || undefined,
        method: (opts.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'DELETE',
        headers,
        body,
      })
      if (res.code !== 0) {
        throw new Error(res.message || '请求失败')
      }
      return res.data
    } catch (e: any) {
      const status = e?.statusCode ?? e?.status ?? e?.response?.status
      // 无 JWT / 过期 token：Spring 默认曾回 403；现统一 401。两者都清登录态
      if (status === 401 || status === 403) {
        logout()
      }
      const msg = e?.data?.message || e?.message || '请求失败'
      throw new Error(msg)
    }
  }

  return { apiFetch }
}
