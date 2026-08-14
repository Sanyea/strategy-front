// @ts-ignore
/* eslint-disable */
import request from '@/api/modules/request.ts'

/** 到期角色分页 即将/已过期绑定分页（end_time <= now + days；days 默认 7） GET /rbac/user-roles/expiring */
export async function expiring(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.expiringParams,
  options?: { [key: string]: any }
) {
  return request<API.RIBasePageUserRoleVO>('/rbac/user-roles/expiring', {
    method: 'GET',
    params: {
      ...params,
      query: undefined,
      ...params['query']
    },
    ...(options || {})
  })
}

/** 批量续期 按绑定行 ID 批量延长 end_time；权限不变化无需踢人 POST /rbac/user-roles/renew */
export async function renewBatch(body: API.UserRoleRenewDTO, options?: { [key: string]: any }) {
  return request<API.RInteger>('/rbac/user-roles/renew', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 用户角色列表 当前生效绑定，含角色编码/名称装配 GET /rbac/users/${param0}/roles */
export async function userRoles(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.userRolesParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.RListUserRoleVO>(`/rbac/users/${param0}/roles`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {})
  })
}

/** 覆盖用户角色 单用户覆盖多角色（解旧绑新；逐条 begin < end 校验；变更自动踢该用户） PUT /rbac/users/${param0}/roles */
export async function replace(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.replaceParams,
  body: API.UserRoleAssignDTO[],
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.RVoid>(`/rbac/users/${param0}/roles`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    params: { ...queryParams },
    data: body,
    ...(options || {})
  })
}

/** 解绑用户角色 解绑用户某角色（变更自动踢该用户） DELETE /rbac/users/${param0}/roles/${param1} */
export async function unbind(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.unbindParams,
  options?: { [key: string]: any }
) {
  const { id: param0, roleId: param1, ...queryParams } = params
  return request<API.RVoid>(`/rbac/users/${param0}/roles/${param1}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {})
  })
}

/** 单角色续期 改 end_time，权限不变化无需踢人 PUT /rbac/users/${param0}/roles/${param1}/renew */
export async function renew(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.renewParams,
  body: API.UserRoleRenewSingleDTO,
  options?: { [key: string]: any }
) {
  const { id: param0, roleId: param1, ...queryParams } = params
  return request<API.RVoid>(`/rbac/users/${param0}/roles/${param1}/renew`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    params: { ...queryParams },
    data: body,
    ...(options || {})
  })
}

/** 批量授角色 批量用户授同一角色（带 begin/end；变更自动踢受影响用户） POST /rbac/users/roles */
export async function assignBatch(
  body: API.UserRoleBatchAssignDTO,
  options?: { [key: string]: any }
) {
  return request<API.RVoid>('/rbac/users/roles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}
