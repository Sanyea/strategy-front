import { defineStore } from 'pinia'
import { myMenuTree } from '@/api/modules/rbac/rbacQuery'
import type { NavItem } from '@/layouts/AppSidebar.vue'

/** 菜单 Store：后端 myMenuTree → 侧边栏导航项（扁平列表）+ 原始树（面包屑层级） */

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

/** 菜单节点结构（PermissionVO 树，typings 中 children 为 any，此处收窄；导出供面包屑复用） */
export interface MenuNode {
  permissionName?: string
  routePath?: string
  icon?: string | null
  isVisible?: 'NO' | 'YES' | null
  children?: MenuNode[] | null
}

/** 拍平树：取可见且有 routePath 的节点，生成扁平导航项；排除首页根路径（回首页仅走登出） */
function flattenMenu(nodes: MenuNode[] | undefined | null): NavItem[] {
  if (!nodes) return []
  const items: NavItem[] = []
  const walk = (list: MenuNode[]): void => {
    for (const node of list) {
      if (node.routePath && node.routePath !== '/' && node.isVisible !== 'NO') {
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
  /** 后端原始菜单树（拍平前的层级结构，供面包屑构建层级链） */
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
     * 拉取当前用户菜单树：保留原始树供面包屑层级，并拍平为侧边栏导航项
     * 成功才置已加载标记；失败时置空导航并抛出，由调用方 toast 提示，下次可重试
     */
    async fetchMenuTree(): Promise<void> {
      try {
        const res = await myMenuTree()
        const tree = res.data as MenuNode[] | undefined
        this.tree = tree ?? []
        this.navItems = flattenMenu(tree)
        this.isLoaded = true
      } catch (err) {
        this.tree = null
        this.navItems = []
        this.isLoaded = false
        throw err
      }
    },
  },
})
