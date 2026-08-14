// @ts-ignore
/* eslint-disable */
import request from '@/api/modules/request.ts'

/** 我的菜单树 目录/菜单树（前端渲染；目录/菜单/按钮按 perms 快照混合过滤） GET /rbac/my/menu-tree */
export async function myMenuTree(options?: { [key: string]: any }) {
  return request<API.RListPermissionVO>('/rbac/my/menu-tree', {
    method: 'GET',
    ...(options || {})
  })
}

/** 我的权限码集 合并多角色去重后的 JWT 快照；SUPER_ADMIN 返回通配 [*] GET /rbac/my/permissions */
export async function myPermissions(options?: { [key: string]: any }) {
  return request<API.RListString>('/rbac/my/permissions', {
    method: 'GET',
    ...(options || {})
  })
}
