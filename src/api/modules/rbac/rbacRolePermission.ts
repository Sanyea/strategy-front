// @ts-ignore
/* eslint-disable */
import request from '@/api/modules/request.ts'

/** 角色权限集 角色当前权限集（完整资源信息列表） GET /rbac/roles/${param0}/permissions */
export async function permissions(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.permissionsParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.RListPermissionVO>(`/rbac/roles/${param0}/permissions`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {})
  })
}

/** 覆盖角色权限 勾选 UI 全量替换；变更自动踢该角色下用户 PUT /rbac/roles/${param0}/permissions */
export async function replace1(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.replace1Params,
  body: API.RolePermissionAssignDTO,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.RVoid>(`/rbac/roles/${param0}/permissions`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    params: { ...queryParams },
    data: body,
    ...(options || {})
  })
}

/** 增量绑定权限 INSERT IGNORE 静默去重；变更自动踢该角色下用户 POST /rbac/roles/${param0}/permissions */
export async function grant(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.grantParams,
  body: API.RolePermissionAssignDTO,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.RVoid>(`/rbac/roles/${param0}/permissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    params: { ...queryParams },
    data: body,
    ...(options || {})
  })
}

/** 批量回收权限 逐条回收；变更自动踢该角色下用户 DELETE /rbac/roles/${param0}/permissions */
export async function revoke(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.revokeParams,
  body: API.RolePermissionAssignDTO,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.RVoid>(`/rbac/roles/${param0}/permissions`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    params: { ...queryParams },
    data: body,
    ...(options || {})
  })
}
