// @ts-ignore
/* eslint-disable */
import request from '@/api/modules/request.ts'

/** 新增角色 创建新角色 POST /rbac/roles */
export async function create(body: API.RoleDTO, options?: { [key: string]: any }) {
  return request<API.RVoid>('/rbac/roles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 角色详情 含当前生效权限码列表 GET /rbac/roles/${param0} */
export async function detail(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.detailParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.RRoleVO>(`/rbac/roles/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {})
  })
}

/** 修改角色 内置角色禁改 role_code，门面守卫 PUT /rbac/roles/${param0} */
export async function update(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.updateParams,
  body: API.RoleDTO,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.RVoid>(`/rbac/roles/${param0}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    params: { ...queryParams },
    data: body,
    ...(options || {})
  })
}

/** 删除角色 内置禁删、有关联用户禁删 DELETE /rbac/roles/${param0} */
export async function deleteUsingDelete(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteUsingDELETEParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.RVoid>(`/rbac/roles/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {})
  })
}

/** 角色启停 变更自动踢该角色下用户重登同步新快照；SUPER_ADMIN 禁停用 PUT /rbac/roles/${param0}/status */
export async function updateStatus(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.updateStatusParams,
  body: API.StatusDTO,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.RVoid>(`/rbac/roles/${param0}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    params: { ...queryParams },
    data: body,
    ...(options || {})
  })
}

/** 克隆角色 复制角色 + 全套权限绑定；role_code = 源 + _COPY_ + 序号 POST /rbac/roles/clone */
export async function clone(body: API.RoleCloneDTO, options?: { [key: string]: any }) {
  return request<API.RLong>('/rbac/roles/clone', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 角色导出 JSON 导出角色字段 + 权限码列表 GET /rbac/roles/export */
export async function exportUsingGet(options?: { [key: string]: any }) {
  return request<API.RListMapStringObject>('/rbac/roles/export', {
    method: 'GET',
    ...(options || {})
  })
}

/** 角色导入 按 role_code 匹配：已存在跳过 / overwrite 覆盖；未注册权限码忽略告警 POST /rbac/roles/import */
export async function importRoles(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.importRolesParams,
  body: string,
  options?: { [key: string]: any }
) {
  return request<API.RSyncReport>('/rbac/roles/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    params: {
      ...params
    },
    data: body,
    ...(options || {})
  })
}

/** 角色分页 管理面过滤：非 SUPER_ADMIN 仅本人创建 + 系统数据 GET /rbac/roles/page */
export async function page(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.pageParams,
  options?: { [key: string]: any }
) {
  return request<API.RIBasePageRoleVO>('/rbac/roles/page', {
    method: 'GET',
    params: {
      ...params,
      query: undefined,
      ...params['query']
    },
    ...(options || {})
  })
}
