/**
 * axios 请求封装
 *
 * - baseURL 从 VITE_API_BASE_URL 读取（见 .env.*），缺省 /api
 * - 请求自动携带 accessToken（Bearer）
 * - 响应返回后端统一信封 { code, message, data, timestamp }，校验业务码：
 *   code === 200 为成功；HTTP 200 但 code 非 200 抛 ApiError（业务失败）
 * - 401 时用 refreshToken 静默刷新一次并重试原请求，刷新失败则清空凭证
 */
import axios from 'axios'
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ApiError } from '@/utils/error'

/** 后端统一信封成功码（SUCCESS(200, "操作成功")） */
const SUCCESS_CODE = 200

/** 凭证存储键 */
const TOKEN_KEY = 'strategy-front-token'
/** 设备 ID 存储键（后端按设备绑定会话） */
const DEVICE_ID_KEY = 'strategy-front-device-id'

/** 后端返回的双 Token 结构（与 src/api/typings.d.ts 的 TokenVO 对应） */
interface TokenPayload {
  accessToken?: string
  refreshToken?: string
  accessExpiresIn?: number
}

/**
 * 读取本地凭证
 * @returns {TokenPayload | null} 无凭证时返回 null
 */
export function getToken(): TokenPayload | null {
  const raw = localStorage.getItem(TOKEN_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as TokenPayload
  } catch {
    return null
  }
}

/**
 * 保存凭证
 * @param token 后端返回的 Token 数据
 */
export function setToken(token: TokenPayload): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token))
}

/** 清空凭证（登出 / 刷新失败时调用） */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * 获取设备唯一 ID
 * 首次调用生成 UUID 并持久化，之后复用，保证与后端会话行一致
 * @returns {string} 设备 ID
 */
export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }
  return deviceId
}

/** axios 实例（内部使用，业务代码请用下方导出的 request） */
const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
})

// 请求拦截：注入鉴权头
http.interceptors.request.use((config) => {
  const token = getToken()
  if (token?.accessToken) {
    config.headers.Authorization = `Bearer ${token.accessToken}`
  }
  return config
})

// 响应拦截：业务码校验 + 解包信封 + 401 静默刷新重试
http.interceptors.response.use(
  (response: AxiosResponse) => {
    const body = response.data as { code?: number; message?: string } | undefined
    // HTTP 200 但信封 code 非成功 → 业务失败，抛 ApiError（携带 code / message）
    if (body && typeof body.code === 'number' && body.code !== SUCCESS_CODE) {
      return Promise.reject(new ApiError(body.code, body.message ?? '请求失败'))
    }
    return response.data
  },
  async (error) => {
    const config = error.config as InternalAxiosRequestConfig & { _retried?: boolean }
    const status = error.response?.status

    if (status === 401 && !config?._retried) {
      const token = getToken()
      if (token?.refreshToken) {
        config._retried = true
        try {
          const refreshed = await refreshToken(token.refreshToken)
          setToken(refreshed)
          config.headers.Authorization = `Bearer ${refreshed.accessToken}`
          return http.request(config)
        } catch {
          // 刷新失败（refreshToken 失效或已轮换），清空凭证，交由调用方跳转登录
          clearToken()
        }
      } else {
        clearToken()
      }
    }

    return Promise.reject(error)
  },
)

/**
 * 刷新双 Token（绕过本实例拦截器，避免递归）
 * @param refreshToken 一次性刷新令牌
 * @returns {Promise<TokenPayload>} 新凭证
 */
async function refreshToken(refreshToken: string): Promise<TokenPayload> {
  const res = await axios.post(
    `${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/refresh`,
    { refreshToken, deviceId: getDeviceId() },
  )
  return res.data?.data as TokenPayload
}

/**
 * 通用请求方法（与 @umijs/openapi 生成的接口签名一致）
 * @param url 接口路径
 * @param options axios 配置（method / headers / data / params 等）
 * @returns {Promise<T>} 后端响应信封（{ code, message, data, timestamp }）
 */
export async function request<T>(url: string, options: Record<string, unknown> = {}): Promise<T> {
  const body = await http.request({ url, ...options })
  return body as T
}

// @umijs/openapi 生成代码使用默认导入，故同时导出默认引用
export default request
