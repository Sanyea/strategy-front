import type { Router, RouteRecordRaw } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { hasPermission } from '@/utils/permission'
import type { MenuNode } from '@/stores/modules/menu'

/** 动态路由注册：由后端 myMenuTree 菜单树构建受保护路由，登录后 addRoute。
 *  404 兜底必须在该模块动态路由全部 addRoute 完成之后再注册，否则会拦截动态路由。 */

/** 全部视图注册表：componentPath → lazy loader（key 形如 /src/views/dashboard/index.vue） */
const viewModules = import.meta.glob('/src/views/**/*.vue')

const CATCH_ALL_NAME = 'not-found'

/** 已注册的动态路由顶层 name（用于登出/重装时清理） */
let installedTopNames: string[] = []
let installedTopPaths: string[] = []
let catchAllInstalled = false
/** 本会话是否已尝试过装载动态路由（防空树/接口失败时守卫反复拉取死循环；登出时复位） */
let installAttempted = false

/** 已注册顶层 name 的临时去重集合 */
const usedNames = new Set<string>()

/**
 * 后端 componentPath → 视图 loader；未命中返回 undefined（调用方跳过该路由）
 * 兼容后端各种路径风格：@/views/dashboard/index.vue / dashboard/index / dashboard/index.vue / src/views/dashboard/index.vue
 * @param componentPath 组件路径
 */
function resolveView(componentPath?: string | null): RouteRecordRaw['component'] | undefined {
  if (!componentPath) return undefined
  const seg = componentPath
    .trim()
    .replace(/\\/g, '/')
    .replace(/^@\//, '') // 剥 @/ 别名前缀
    .replace(/^\/+/, '')
    .replace(/^src\//, '')
    .replace(/^views\//, '')
    .replace(/\.vue$/, '')
  const base = `/src/views/${seg}`
  const loader = viewModules[`${base}.vue`] || viewModules[`${base}/index.vue`]
  return loader as RouteRecordRaw['component'] | undefined
}

/**
 * 节点是否对当前用户可见：带权限码则按 perms 二次过滤（哨兵 * 视为全权限）
 * @param node 菜单节点
 * @param perms 当前用户权限码集合
 */
function allowed(node: MenuNode, perms: string[]): boolean {
  return !node.permissionCode || hasPermission(perms, node.permissionCode)
}

/** 由 permissionCode / routePath 生成唯一路由 name（安全字符，去重加后缀） */
function uniqueName(node: MenuNode): string {
  let base = node.permissionCode || node.routePath || 'dynamic-route'
  base = base.replace(/[^a-zA-Z0-9:_-]/g, '-')
  let name = base
  let i = 2
  while (usedNames.has(name)) name = `${base}-${i++}`
  usedNames.add(name)
  return name
}

/** 绝对化路径：带 / 用原值，否则拼到 prefix 前缀下 */
function absPath(routePath: string | undefined, prefix: string): string {
  if (!routePath) return prefix || ''
  const p = routePath.trim()
  if (p.startsWith('/')) return p.replace(/\/+$/, '')
  return `${prefix}/${p}`.replace(/\/{2,}/g, '/').replace(/\/+$/, '')
}

/**
 * 收集某目录节点下全部叶子菜单为路由记录（深层目录拍平，叶子用绝对 path 渲染于顶层布局 RouterView）
 * @param node 目录节点
 * @param prefix 祖先路径前缀
 * @param perms 当前用户权限码集合（二次过滤）
 * @param acc 收集容器
 */
function collectLeaves(node: MenuNode, prefix: string, perms: string[], acc: RouteRecordRaw[]): void {
  for (const child of node.children ?? []) {
    if (!child || child.isVisible === 'NO') continue
    // 二次权限过滤：节点带权限码但用户无此码 → 剪枝（含子树）
    if (!allowed(child, perms)) continue
    const childAbs = absPath(child.routePath, prefix)
    const hasChildren = !!child.children?.length
    if (child.permissionType === 'DIRECTORY' || hasChildren) {
      collectLeaves(child, childAbs, perms, acc)
    } else {
      // 叶子菜单：componentPath 未注册到前端则跳过，侧边栏点击落 404
      const loader = resolveView(child.componentPath)
      if (!loader || !childAbs) continue
      acc.push({
        path: childAbs,
        name: uniqueName(child),
        component: loader,
        meta: { title: child.title || child.permissionName, requiresAuth: true },
      })
    }
  }
}

/**
 * 由菜单树构建动态路由（顶层：目录→DefaultLayout 容器；菜单→DefaultLayout 包单页）
 * @param nodes 后端菜单树
 * @param perms 当前用户权限码集合（二次过滤）
 * @returns 顶层路由记录（children 内联）
 */
function buildTopRoutes(nodes: MenuNode[] | null | undefined, perms: string[]): RouteRecordRaw[] {
  if (!nodes) return []
  const routes: RouteRecordRaw[] = []
  for (const node of nodes) {
    if (!node || node.isVisible === 'NO') continue
    // 二次权限过滤：顶层节点无权限 → 整棵剪枝
    if (!allowed(node, perms)) continue
    const nodeAbs = absPath(node.routePath, '')
    if (!nodeAbs) continue // 顶层节点无路径，无法挂锚点
    const hasChildren = !!node.children?.length

    if (node.permissionType === 'DIRECTORY' || hasChildren) {
      const leaves: RouteRecordRaw[] = []
      collectLeaves(node, nodeAbs, perms, leaves)
      if (!leaves.length) continue
      routes.push({
        path: nodeAbs,
        name: uniqueName(node),
        component: DefaultLayout,
        redirect: leaves[0].path, // 目录默认落到第一个叶子
        meta: { title: node.title || node.permissionName, requiresAuth: true },
        children: leaves,
      })
    } else {
      const loader = resolveView(node.componentPath)
      if (!loader) continue
      routes.push({
        path: nodeAbs,
        name: uniqueName(node),
        component: DefaultLayout,
        meta: { title: node.title || node.permissionName, requiresAuth: true },
        children: [
          {
            path: '',
            name: uniqueName(node),
            component: loader,
            meta: { title: node.title || node.permissionName, requiresAuth: true },
          },
        ],
      })
    }
  }
  return routes
}

/** 是否已装入动态路由（供守卫判断是否需要拉菜单装载） */
export function hasDynamicRoutes(): boolean {
  return installedTopNames.length > 0
}

/** 公共 404 兜底是否已注册（供守卫判断是否需要注册/避免死循环） */
export function hasCatchAll(): boolean {
  return catchAllInstalled
}

/** 是否需要（重新）装载动态路由：本会话未尝试过装载且当前未装 */
export function shouldLoadDynamicRoutes(): boolean {
  return !installAttempted && installedTopNames.length === 0
}

/** 标记本会话已尝试过装载（接口失败时由守卫调用，防空拉死循环） */
export function markDynamicInstallAttempted(): void {
  installAttempted = true
}

/** 404 兜底路由名（供守卫判断目标是否仅命中兜底） */
export function catchAllRouteName(): string {
  return CATCH_ALL_NAME
}

/**
 * 登入后的默认落点：优先 /dashboard（若已注册），否则回落到首条动态路由；未装返回 null
 * @param router 路由实例
 */
export function firstDynamicPath(router: Router): string | null {
  if (installedTopPaths.length === 0) return null
  const resolved = router.resolve('/dashboard')
  const isReal = !(resolved.matched.length === 1 && resolved.matched[0].name === CATCH_ALL_NAME)
  return isReal ? '/dashboard' : installedTopPaths[0] || null
}

/** 注册公共 404 兜底（幂等；仅在动态路由之后或未登入兜底时调用） */
export function ensureCatchAll(router: Router): void {
  if (catchAllInstalled) return
  router.addRoute({
    path: '/:pathMatch(.*)*',
    name: CATCH_ALL_NAME,
    component: () => import('@/views/error/index.vue'),
    meta: { title: '页面未找到' },
  })
  catchAllInstalled = true
}

/**
 * 装入动态路由：先清旧动态路由，再按权限码二次过滤构建并 addRoute 全部动态记录，最后注册 404。
 * @param router 路由实例
 * @param tree 后端菜单树
 * @param perms 当前用户权限码集合（二次过滤目录/菜单，与侧边栏一致）
 */
export function installDynamicRoutes(
  router: Router,
  tree: MenuNode[] | null | undefined,
  perms: string[],
): void {
  // 清旧动态路由（404 保留）
  for (const name of installedTopNames) {
    if (router.hasRoute(name)) router.removeRoute(name)
  }
  installedTopNames = []
  installedTopPaths = []
  usedNames.clear()
  installAttempted = true

  const records = buildTopRoutes(tree ?? [], perms)
  for (const record of records) {
    const name = record.name as string
    installedTopNames.push(name)
    installedTopPaths.push(record.path as string)
    router.addRoute(record)
  }

  // 404 必须在动态路由全部 addRoute 完成之后再注册，否则会拦截动态路由
  ensureCatchAll(router)
}

/** 卸载动态路由（登出时调用，防跨账号残留）；公共 404 保留，复位装载尝试标记供下次登入重装 */
export function uninstallDynamicRoutes(router: Router): void {
  for (const name of installedTopNames) {
    if (router.hasRoute(name)) router.removeRoute(name)
  }
  installedTopNames = []
  installedTopPaths = []
  usedNames.clear()
  installAttempted = false
}
