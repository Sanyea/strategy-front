/**
 * axios 请求封装
 *
 * - baseURL 从 VITE_API_BASE_URL 读取（见 .env.*），缺省 /api
 * - 请求自动携带 accessToken（Bearer）
 * - 响应返回后端统一信封 { code, message, data, timestamp }，校验业务码：
 *   code === 200 为成功；HTTP 200 但 code 非 200 抛 ApiError（业务失败）
 * - 401 时用 refreshToken 静默刷新一次并重试原请求（单飞去重，并发 401 共享同一刷新）；
 *   刷新失败则清空凭证
 * - 主动刷新：剩余有效期低于阈值时提前轮换双 Token，避免过期触发 401
 */
import axios from 'axios'
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ApiError, readApiErrorMessage } from '@/utils/error'

/** 后端统一信封成功码（SUCCESS(200, "操作成功")） */
const SUCCESS_CODE = 200

/** 凭证存储键 */
const TOKEN_KEY = 'strategy-front-token'

/** 会话失效事件：刷新失败清凭证后广播，由全局监听者（main.ts）清用户态、提示并回登入页 */
export const SESSION_EXPIRED_EVENT = 'auth:session-expired'
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
 * 保存凭证（登录 / 刷新成功后调用），并安排主动刷新
 * @param token 后端返回的 Token 数据
 */
export function setToken(token: TokenPayload): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token))
  scheduleTokenRefresh(token)
}

/** 清空凭证（登出 / 刷新失败时调用），并取消主动刷新定时器 */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  clearRefreshTimer()
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
    const config = error.config as InternalAxiosRequestConfig & {
      _retried?: boolean
      skipAuthRefresh?: boolean
    }
    const status = error.response?.status

    // 401 触发刷新；刷新请求自身（skipAuthRefresh）不得再进本分支，否则复用同一单飞 Promise 造成循环等待
    if (status === 401 && !config?._retried && !config?.skipAuthRefresh) {
      config._retried = true
      try {
        await refreshAccessToken()
        // 重试原请求：请求拦截器会重新注入刷新后的 accessToken
        return http.request(config)
      } catch (err) {
        // 刷新失败（refreshToken 失效或已轮换）：清凭证 + 广播会话失效（统一收尾由 main.ts 监听）
        handleRefreshFailure(err)
      }
    }

    return Promise.reject(error)
  },
)

/** 提前刷新阈值（秒）：accessToken 剩余有效期低于该值即主动轮换，避免过期触发 401 */
const PROACTIVE_THRESHOLD_S = 30

/** 单飞刷新中 Promise：并发 401 共享同一次刷新，防止一次性 refreshToken 被并发消耗 */
let refreshPromise: Promise<TokenPayload> | null = null
/** 主动刷新定时器 */
let refreshTimer: ReturnType<typeof setTimeout> | null = null

/** 取剩余有效期的提前刷新延迟（毫秒）；无有效信息返回 -1 */
function nextRefreshDelay(token: TokenPayload): number {
  if (typeof token.accessExpiresIn !== 'number') return -1
  return Math.max(0, (token.accessExpiresIn - PROACTIVE_THRESHOLD_S) * 1000)
}

/** 取消主动刷新定时器 */
function clearRefreshTimer(): void {
  if (refreshTimer !== null) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
}

/** 保存凭证后安排主动刷新：剩余有效期低于阈值时提前轮换双 Token */
function scheduleTokenRefresh(token: TokenPayload): void {
  clearRefreshTimer()
  const delay = nextRefreshDelay(token)
  if (delay < 0) return
  refreshTimer = setTimeout(() => {
    refreshAccessToken().catch(handleRefreshFailure)
  }, delay)
}

/**
 * 刷新双 Token（单飞）：并发调用共享同一次请求
 * @returns {Promise<TokenPayload>} 新凭证（已 setToken 并重新安排主动刷新）
 */
function refreshAccessToken(): Promise<TokenPayload> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

/**
 * 实际刷新：走生成接口 auth.refresh。
 * 刷新请求自身带 skipAuthRefresh 标记，401 时不触发二次刷新（防死锁）；
 * 经动态导入打破 request ↔ auth 的静态循环依赖
 */
async function doRefresh(): Promise<TokenPayload> {
  const token = getToken()
  if (!token?.refreshToken) throw new ApiError(401, '无可用 refreshToken')
  const { refresh } = await import('@/api/modules/auth/auth')
  // skipAuthRefresh：该刷新请求自身若返回 401，拦截器不再触发刷新（防复用单飞 Promise 死锁）
  const res = await refresh(
    { refreshToken: token.refreshToken, deviceId: getDeviceId() },
    { skipAuthRefresh: true },
  )
  const payload = res.data
  if (!payload?.accessToken) throw new ApiError(401, '刷新接口未返回新令牌')
  setToken(payload) // 内部重新安排主动刷新
  return payload
}

/**
 * 刷新失败统一出口：清空凭证并广播会话失效事件。
 * 并发 401 共享同一次单飞刷新，首个失败者广播，其余在凭证已清后跳过（幂等）。
 * @param err 刷新异常（用于提取后端 message 文案）
 */
function handleRefreshFailure(err: unknown): void {
  const hadToken = getToken() !== null
  clearToken()
  if (!hadToken) return
  window.dispatchEvent(
    new CustomEvent(SESSION_EXPIRED_EVENT, {
      detail: { message: readApiErrorMessage(err, '会话已失效，请重新登录') },
    }),
  )
}

// 模块初始化：恢复已保存凭证时同步安排主动刷新（刷新页面后继续预判）
const initToken = getToken()
if (initToken) scheduleTokenRefresh(initToken)

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
