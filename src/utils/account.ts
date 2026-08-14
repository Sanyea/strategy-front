/** 本地持久化的当前登入用户信息（登入/注册成功时写入，供刷新后水合） */

export interface StoredUser {
  username: string
  nickname: string
  phone?: string
  email?: string
}

/** localStorage 存储键 */
const STORAGE_KEY = 'strategy-front-user'

/**
 * 读取本地用户信息
 * @returns {StoredUser | null} 无记录或解析失败时返回 null
 */
export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

/**
 * 写入本地用户信息
 * @param user 当前登入用户
 */
export function setStoredUser(user: StoredUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

/** 清除本地用户信息（登出时调用） */
export function clearStoredUser(): void {
  localStorage.removeItem(STORAGE_KEY)
}
