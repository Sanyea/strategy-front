import { defineStore } from 'pinia'
import { myPermissions } from '@/api/modules/rbac/rbacQuery'
import {
  clearStoredUser,
  getStoredUser,
  setStoredUser,
  type StoredUser,
} from '@/utils/account'

/** 用户 Store：当前登入用户信息 + 权限码集合（内存态，登入后拉取） */

interface UserState {
  user: StoredUser | null
  permissions: string[]
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    // 初始化即从 localStorage 水合，避免刷新丢身份
    user: getStoredUser(),
    permissions: [],
  }),
  actions: {
    /**
     * 设置当前登入用户（同步持久化）
     * @param user 用户信息
     */
    setUser(user: StoredUser): void {
      this.user = user
      setStoredUser(user)
    },
    /**
     * 拉取当前用户权限码集（合并多角色去重后的 JWT 快照）
     * 失败时静默留空（仅告警），不阻断页面
     */
    async fetchPermissions(): Promise<void> {
      try {
        const res = await myPermissions()
        this.permissions = res.data ?? []
      } catch (err) {
        this.permissions = []
        console.warn('fetchPermissions failed:', err)
      }
    },
    /** 清空用户态（登出时调用） */
    clear(): void {
      this.user = null
      this.permissions = []
      clearStoredUser()
    },
  },
})
