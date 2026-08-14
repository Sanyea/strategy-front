import { defineStore } from 'pinia'
import { myMenuTree } from '@/api/modules/rbac/rbacQuery'
import type { NavItem } from '@/layouts/AppSidebar.vue'

/** 菜单 Store：后端 myMenuTree → 侧边栏导航项（扁平列表） */

/** 后端 icon 标识 → AppSidebar 图标 key 映射；未知回落 menu */
const ICON_MAP: Record<string, NavItem['icon']> = {
  dashboard: 'dashboard',
  home: 'home',
  role: 'role',
  permission: 'permission',
  grant: 'grant',
  userrole: 'userrole',
  menu: 'menu',
}

/**
 * 后端图标标识映射为侧边栏图标 key
 * @param icon 后端图标字符串
 * @returns AppSidebar 图标 key（未知回落 menu）
 */
function mapIcon(icon?: string | null): NavItem['icon'] {
  return (icon && ICON_MAP[icon]) || 'menu'
}

/** 菜单节点结构（PermissionVO 树，typings 中 children 为 any，此处收窄） */
interface MenuNode {
  permissionName?: string
  routePath?: string
  icon?: string | null
  isVisible?: 'NO' | 'YES' | string | null
  children?: MenuNode[] | null
}

/** 拍平树：取可见且有 routePath 的节点，生成扁平导航项 */
function flattenMenu(nodes: MenuNode[] | undefined | null): NavItem[] {
  if (!nodes) return []
  const items: NavItem[] = []
  const walk = (list: MenuNode[]): void => {
    for (const node of list) {
      if (node.routePath && node.isVisible !== 'NO') {
        items.push({
          label: node.permissionName || '未命名',
          icon: mapIcon(node.icon),
          to: node.routePath,
        })
      }
      if (node.children) walk(node.children)
    }
  }
  walk(nodes)
  return items
}

interface MenuState {
  navItems: NavItem[]
  loaded: boolean
}

export const useMenuStore = defineStore('menu', {
  state: (): MenuState => ({
    navItems: [],
    loaded: false,
  }),
  actions: {
    /**
     * 拉取当前用户菜单树并拍平为导航项
     * 失败时置空导航并抛出，由调用方 toast 提示
     */
    async fetchMenuTree(): Promise<void> {
      try {
        const res = await myMenuTree()
        this.navItems = flattenMenu(res.data as MenuNode[] | undefined)
      } catch (err) {
        this.navItems = []
        throw err
      } finally {
        this.loaded = true
      }
    },
  },
})
