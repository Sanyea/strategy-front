// @ts-ignore
/* eslint-disable */
import request from '@/api/modules/request.ts'

/** 新增权限资源 创建目录/菜单/按钮/接口资源 POST /rbac/permissions */
export async function create1(body: API.PermissionDTO, options?: { [key: string]: any }) {
  return request<API.RVoid>('/rbac/permissions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 修改权限资源 permissionCode 禁改、内置资源禁改，门面守卫 PUT /rbac/permissions/${param0} */
export async function update1(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.update1Params,
  body: API.PermissionDTO,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.RVoid>(`/rbac/permissions/${param0}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    params: { ...queryParams },
    data: body,
    ...(options || {})
  })
}

/** 删除权限资源 有角色绑定禁删，先解绑 DELETE /rbac/permissions/${param0} */
export async function delete1(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.delete1Params,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.RVoid>(`/rbac/permissions/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {})
  })
}

/** 权限启停 停用/启用对称：自动反查绑定角色 → 用户 evict，重登同步新快照 PUT /rbac/permissions/${param0}/status */
export async function updateStatus1(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.updateStatus1Params,
  body: API.StatusDTO,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.RVoid>(`/rbac/permissions/${param0}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    params: { ...queryParams },
    data: body,
    ...(options || {})
  })
}

/** 手动权限同步 dryRun=true 仅预览差异不写库；默认执行——新增 + 复活 + 残留停用 POST /rbac/permissions/sync */
export async function sync(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.syncParams,
  options?: { [key: string]: any }
) {
  return request<API.RSyncReport>('/rbac/permissions/sync', {
    method: 'POST',
    params: {
      ...params
    },
    ...(options || {})
  })
}

/** 权限资源树 目录/菜单/按钮/接口资源树（可选过滤；保留祖先链保证树完整） GET /rbac/permissions/tree */
export async function tree(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.treeParams,
  options?: { [key: string]: any }
) {
  return request<API.RListPermissionVO>('/rbac/permissions/tree', {
    method: 'GET',
    params: {
      ...params,
      query: undefined,
      ...params['query']
    },
    ...(options || {})
  })
}
