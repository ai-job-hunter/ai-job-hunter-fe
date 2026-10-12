/** 后端统一包装 */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp?: number
  traceId?: string
}

export interface LoginRequest {
  /** 用户名或邮箱 */
  account: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface AuthUser {
  id: string
  username: string
  email: string
  bossConnected?: boolean
}

export interface AuthData {
  token: string
  expiresIn: number
  user: AuthUser
}
