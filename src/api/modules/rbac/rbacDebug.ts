// @ts-ignore
/* eslint-disable */
import request from '@/api/modules/request.ts'

/** 批量踢用户 按角色批量踢：?mode=sync 同步 / ?mode=async 异步返回 taskId 后台执行 POST /rbac/evict-batch */
export async function evictBatch(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.evictBatchParams,
  options?: { [key: string]: any }
) {
  return request<API.REvictTaskVO>('/rbac/evict-batch', {
    method: 'POST',
    params: {
      // mode has a default value: async
      mode: 'async',
      ...params
    },
    ...(options || {})
  })
}

/** 批量踢任务进度 异步批量踢任务进度查询 GET /rbac/evict/tasks/${param0} */
export async function task(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.taskParams,
  options?: { [key: string]: any }
) {
  const { taskId: param0, ...queryParams } = params
  return request<API.REvictTaskVO>(`/rbac/evict/tasks/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {})
  })
}

/** 校验用户权限 指定用户校验权限（排查） GET /rbac/users/${param0}/check */
export async function check(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.checkParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.RBoolean>(`/rbac/users/${param0}/check`, {
    method: 'GET',
    params: {
      ...queryParams
    },
    ...(options || {})
  })
}

/** 用户生效权限 合并多角色去重、过滤禁用/过期（实时联表排查） GET /rbac/users/${param0}/effective-permissions */
export async function effective(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.effectiveParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.RSetString>(`/rbac/users/${param0}/effective-permissions`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {})
  })
}

/** 踢单用户 写 jti 黑名单，人工兜底 POST /rbac/users/${param0}/evict */
export async function evictUser(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.evictUserParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.RInteger>(`/rbac/users/${param0}/evict`, {
    method: 'POST',
    params: { ...queryParams },
    ...(options || {})
  })
}
