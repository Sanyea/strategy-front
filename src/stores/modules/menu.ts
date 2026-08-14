import { defineStore } from 'pinia'
import { myMenuTree } from '@/api/modules/rbac/rbacQuery'
import { hasPermission } from '@/utils/permission'
import type { NavItem } from '@/layouts/AppSidebarNav.vue'

/** 菜单 Store：myMenuTree 原始树 + 前端按权限码二次过滤 → 嵌套导航项 */

/** 后端 icon 标识 → 侧边栏图标 key 映射；未知回落 menu */
const ICON_MAP: Record<string, NavItem['icon']> = {
  dashboard: 'dashboard',
  home: 'home',
  role: 'role',
  permission: 'permission',
  grant: 'grant',
  userrole: 'userrole',
  menu: 'menu',
}

/** 后端图标标识映射为侧边栏图标 key（未知回落 menu） */
function mapIcon(icon?: string | null): NavItem['icon'] {
  return (icon && ICON_MAP[icon]) || 'menu'
}

/** 菜单节点结构（PermissionVO 树，typings 中 children 为 any，此处收窄） */
export interface MenuNode {
  permissionName?: string
  title?: string
  routePath?: string
  componentPath?: string
  icon?: string | null
  permissionCode?: string
  isVisible?: 'NO' | 'YES' | null
  permissionType?: 'DIRECTORY' | 'MENU' | 'BUTTON' | 'INTERFACE'
  children?: MenuNode[] | null
}

/**
 * 由菜单树构建嵌套导航项（二次过滤）
 * @param nodes 原始菜单树
 * @param perms 当前用户权限码集合
 * @returns 嵌套 NavItem[]
 */
function buildNav(nodes: MenuNode[] | undefined | null, perms: string[]): NavItem[] {
  if (!nodes) return []
  const items: NavItem[] = []
  for (const node of nodes) {
    if (node.isVisible === 'NO') continue
    // 前端二次过滤：节点带权限码但用户无此码 → 剪枝（哨兵 * 视为全权限）
    if (node.permissionCode && !hasPermission(perms, node.permissionCode)) continue
    const children = node.children ? buildNav(node.children, perms) : []
    if (children.length) {
      // 有子级 → 目录/分组项（可展开）；即使带 routePath 也不作叶子链接
      items.push({ label: node.permissionName || '未命名', icon: mapIcon(node.icon), children })
    } else if (node.routePath && node.routePath !== '/') {
      // 叶子 → 链接项（首页根不纳入，回首页仅走登出）
      items.push({ label: node.permissionName || '未命名', icon: mapIcon(node.icon), to: node.routePath })
    }
  }
  return items
}

interface MenuState {
  /** 后端原始菜单树（面包屑层级链也消费此树） */
  tree: MenuNode[] | null
  navItems: NavItem[]
  isLoaded: boolean
}

export const useMenuStore = defineStore('menu', {
  state: (): MenuState => ({
    tree: null,
    navItems: [],
    isLoaded: false,
  }),
  actions: {
    /**
     * 拉取当前用户菜单树（原始结构，未过滤）
     * 成功置已加载标记；失败置空并抛出，由调用方 toast 提示，下次可重试
     */
    async fetchMenuTree(): Promise<void> {
      try {
        const res = await myMenuTree()
        this.tree = (res.data as MenuNode[] | undefined) ?? []
        this.isLoaded = true
      } catch (err) {
        this.tree = null
        this.navItems = []
        this.isLoaded = false
        throw err
      }
    },
    /**
     * 二次过滤：按当前用户权限码从树构建导航项
     * 由布局在 fetchMenuTree 与 fetchPermissions 都成功后调用
     * @param perms 当前用户权限码集合
     */
    applyPermissions(perms: string[]): void {
      this.navItems = buildNav(this.tree, perms)
    },
  },
})
